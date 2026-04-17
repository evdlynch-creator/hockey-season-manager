import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import type { Team, TeamMember, Season, Practice, Game } from '../types'

export interface OrphanTeamCandidate {
  team: Team
  seasonCount: number
  practiceCount: number
  gameCount: number
  lastActivity: string | null
  isEmpty: boolean
  /** How we know this user has a claim on the team. */
  evidence: 'owner_email_match' | 'legacy_team_userid' | 'already_owned_empty'
}

interface AuthorizationContext {
  userId: string
  email: string
}

function normalizeEmail(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase()
}

/**
 * Server-side-style authorization check for ownership-changing actions.
 * Re-fetches evidence at call time (i.e. *not* trusting client state) and
 * accepts the user as entitled to the team only when ONE of:
 *   (a) an owner teamMembers row exists with email == current user's email
 *       (proof of email ownership, even if userId has drifted), OR
 *   (b) teams.userId == current user.id (legacy ownership pointer for
 *       teams created before the multi-coach refactor).
 *
 * Returns the authorizing evidence string or throws.
 */
async function assertAuthorizedForTeam(
  teamId: string,
  ctx: AuthorizationContext,
): Promise<'owner_email_match' | 'legacy_team_userid'> {
  const myEmail = normalizeEmail(ctx.email)

  if (myEmail) {
    const ownerRows = (await blink.db.teamMembers.list({
      where: { teamId, role: 'owner', email: myEmail },
      limit: 1,
    })) as TeamMember[]
    if (ownerRows.length > 0) return 'owner_email_match'
  }

  const teams = (await blink.db.teams.list({
    where: { id: teamId },
    limit: 1,
  })) as Team[]
  if (teams.length === 1 && teams[0].userId === ctx.userId) {
    return 'legacy_team_userid'
  }

  throw new Error('Not authorized to modify this team')
}

/**
 * Lists orphan teams the current user can prove ownership of. We do NOT
 * list every team the SDK can see — only teams that are tied to this
 * user's email or legacy user.id and that the user has no active
 * membership for.
 */
export function useOrphanTeams() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['orphanTeams', user?.id],
    queryFn: async (): Promise<OrphanTeamCandidate[]> => {
      if (!user) return []
      const myEmail = normalizeEmail(user.email)

      // Evidence A: I am the owner of these teams by email.
      const ownerRowsByEmail = myEmail
        ? ((await blink.db.teamMembers.list({
            where: { email: myEmail, role: 'owner' },
          })) as TeamMember[])
        : []

      // Evidence B: legacy teams where teams.userId == my id.
      const legacyTeams = (await blink.db.teams.list({
        where: { userId: user.id },
      })) as Team[]

      // What I currently belong to (so I can exclude non-orphans).
      const myMemberships = (await blink.db.teamMembers.list({
        where: myEmail
          ? { OR: [{ userId: user.id }, { email: myEmail }] }
          : { userId: user.id },
      })) as TeamMember[]
      const knownTeamIds = new Set(
        myMemberships.filter((m) => m.userId === user.id).map((m) => m.teamId),
      )

      const evidenceMap = new Map<string, OrphanTeamCandidate['evidence']>()
      for (const row of ownerRowsByEmail) {
        if (!knownTeamIds.has(row.teamId)) {
          evidenceMap.set(row.teamId, 'owner_email_match')
        }
      }
      for (const t of legacyTeams) {
        if (!knownTeamIds.has(t.id) && !evidenceMap.has(t.id)) {
          evidenceMap.set(t.id, 'legacy_team_userid')
        }
      }
      // Also surface teams I already own — but only if they may be empty
      // duplicates from past identity-drift incidents. We tag them as
      // 'already_owned_empty' so the UI offers Delete (no Claim) and we
      // verify emptiness when computing counts below.
      for (const teamId of knownTeamIds) {
        if (!evidenceMap.has(teamId)) {
          evidenceMap.set(teamId, 'already_owned_empty')
        }
      }
      if (evidenceMap.size === 0) return []

      // Hydrate team rows (legacyTeams already loaded; fetch the rest).
      const legacyById = new Map(legacyTeams.map((t) => [t.id, t]))
      const teamsToFetch = Array.from(evidenceMap.keys()).filter((id) => !legacyById.has(id))
      const fetched = await Promise.all(
        teamsToFetch.map(async (id) => {
          const rows = (await blink.db.teams.list({ where: { id }, limit: 1 })) as Team[]
          return rows[0] ?? null
        }),
      )
      const teamById = new Map<string, Team>(legacyById)
      for (const t of fetched) {
        if (t) teamById.set(t.id, t)
      }

      const enrichedAll = await Promise.all(
        Array.from(evidenceMap.entries())
          .map(([teamId, evidence]) => ({ teamId, evidence }))
          .filter(({ teamId }) => teamById.has(teamId))
          .map(async ({ teamId, evidence }) => {
            const team = teamById.get(teamId)!
            const seasons = (await blink.db.seasons.list({
              where: { teamId },
            })) as Season[]

            let practiceCount = 0
            let gameCount = 0
            let lastActivity: string | null = team.createdAt ?? null

            const counts = await Promise.all(
              seasons.map(async (s) => {
                const [practices, games] = await Promise.all([
                  blink.db.practices.list({ where: { seasonId: s.id } }) as Promise<Practice[]>,
                  blink.db.games.list({ where: { seasonId: s.id } }) as Promise<Game[]>,
                ])
                return { practices, games, season: s }
              }),
            )
            for (const c of counts) {
              practiceCount += c.practices.length
              gameCount += c.games.length
              for (const p of c.practices) {
                if (!lastActivity || p.createdAt > lastActivity) lastActivity = p.createdAt
              }
              for (const g of c.games) {
                if (!lastActivity || g.createdAt > lastActivity) lastActivity = g.createdAt
              }
              if (!lastActivity || c.season.createdAt > lastActivity) {
                lastActivity = c.season.createdAt
              }
            }

            return {
              team,
              seasonCount: seasons.length,
              practiceCount,
              gameCount,
              lastActivity,
              isEmpty:
                seasons.length === 0 ||
                (seasons.length === 1 && practiceCount === 0 && gameCount === 0),
              evidence,
            } as OrphanTeamCandidate
          }),
      )

      // Already-owned teams are only relevant in recovery as cleanup
      // candidates — drop the ones that have actual data.
      return enrichedAll.filter(
        (c) => c.evidence !== 'already_owned_empty' || c.isEmpty,
      )
    },
    enabled: !!user,
  })
}

/**
 * Re-attaches the current user as the owner of an orphan team. Re-verifies
 * authorization (owner-email match OR legacy teams.userId match) at call
 * time before mutating.
 */
export function useClaimTeam() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error('Not signed in')
      const myEmail = normalizeEmail(user.email)
      await assertAuthorizedForTeam(teamId, { userId: user.id, email: myEmail })

      const now = new Date().toISOString()

      const ownerRows = (await blink.db.teamMembers.list({
        where: { teamId, role: 'owner' },
      })) as TeamMember[]

      // Prefer the email-matched owner row (the one our authorization
      // evidence pointed at). Fall back to the deterministic owner id,
      // then to the first row only as a last resort. This avoids
      // accidentally rewriting the wrong row when malformed data has
      // multiple owner rows for a single team.
      const target =
        ownerRows.find((r) => normalizeEmail(r.email) === myEmail) ??
        ownerRows.find((r) => r.id === `tm_owner_${teamId}`) ??
        ownerRows[0] ??
        null

      if (target) {
        await blink.db.teamMembers.update(target.id, {
          userId: user.id,
          email: myEmail,
          status: 'active',
          updatedAt: now,
        })
      } else {
        const ownerId = `tm_owner_${teamId}`
        try {
          await blink.db.teamMembers.create({
            id: ownerId,
            teamId,
            userId: user.id,
            email: myEmail,
            role: 'owner',
            status: 'active',
            invitedBy: null,
            invitedByName: null,
            createdAt: now,
            updatedAt: now,
          })
        } catch (err) {
          console.warn('[claimTeam] owner create lost race for', teamId, err)
        }
      }

      try {
        await blink.db.teams.update(teamId, { userId: user.id })
      } catch (err) {
        console.warn('[claimTeam] could not update teams.userId for', teamId, err)
      }

      return teamId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['myTeams'] })
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] })
      queryClient.invalidateQueries({ queryKey: ['orphanTeams'] })
    },
  })
}

/**
 * Deletes a team that has no real data. Re-verifies ownership and
 * emptiness at call time. Refuses to delete a team with any practice
 * or game.
 */
export function useDeleteEmptyTeam() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error('Not signed in')
      const myEmail = normalizeEmail(user.email)
      await assertAuthorizedForTeam(teamId, { userId: user.id, email: myEmail })

      const seasons = (await blink.db.seasons.list({
        where: { teamId },
      })) as Season[]

      // "Empty" = zero seasons, OR exactly one season with no practices
      // and no games (the incident-created empty-default-season case).
      // Anything beyond that is treated as meaningful and refused.
      let allowDelete = seasons.length === 0
      if (!allowDelete && seasons.length === 1) {
        const s = seasons[0]
        const [practices, games] = await Promise.all([
          blink.db.practices.list({ where: { seasonId: s.id } }) as Promise<Practice[]>,
          blink.db.games.list({ where: { seasonId: s.id } }) as Promise<Game[]>,
        ])
        allowDelete = practices.length === 0 && games.length === 0
      }
      if (!allowDelete) {
        throw new Error("This team isn't empty — refusing to delete")
      }

      await Promise.all(seasons.map((s) => blink.db.seasons.delete(s.id)))
      const members = (await blink.db.teamMembers.list({
        where: { teamId },
      })) as TeamMember[]
      await Promise.all(members.map((m) => blink.db.teamMembers.delete(m.id)))
      await blink.db.teams.delete(teamId)
      return teamId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['myTeams'] })
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] })
      queryClient.invalidateQueries({ queryKey: ['orphanTeams'] })
    },
  })
}
