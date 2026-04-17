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
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * Lists every team the SDK can see that the current user has no membership
 * for. Used by the no-team recovery screen to surface orphaned teams the
 * user might want to claim (e.g. teams whose owner row points at a stale
 * session identity that doesn't match the current user.id, OR teams whose
 * owner row never got created at all).
 *
 * For each candidate we also include season/practice/game counts so the
 * user can identify their team and so the screen can offer a "delete this
 * empty team" action when nothing was ever entered.
 */
export function useOrphanTeams() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['orphanTeams', user?.id],
    queryFn: async (): Promise<OrphanTeamCandidate[]> => {
      if (!user) return []
      const myEmail = normalizeEmail(user.email ?? '')

      const [allTeams, myMemberships] = await Promise.all([
        blink.db.teams.list({}) as Promise<Team[]>,
        blink.db.teamMembers.list({
          where: myEmail
            ? { OR: [{ userId: user.id }, { email: myEmail }] }
            : { userId: user.id },
        }) as Promise<TeamMember[]>,
      ])
      const knownTeamIds = new Set(myMemberships.map((m) => m.teamId))

      const orphans = allTeams.filter((t) => !knownTeamIds.has(t.id))
      if (orphans.length === 0) return []

      const enriched = await Promise.all(
        orphans.map(async (team) => {
          const seasons = (await blink.db.seasons.list({
            where: { teamId: team.id },
          })) as Season[]

          let practiceCount = 0
          let gameCount = 0
          let lastActivity: string | null = team.createdAt ?? null

          if (seasons.length > 0) {
            const counts = await Promise.all(
              seasons.map(async (s) => {
                const [practices, games] = await Promise.all([
                  blink.db.practices.list({ where: { seasonId: s.id } }) as Promise<Practice[]>,
                  blink.db.games.list({ where: { seasonId: s.id } }) as Promise<Game[]>,
                ])
                return { practices, games }
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
            }
            for (const s of seasons) {
              if (!lastActivity || s.createdAt > lastActivity) lastActivity = s.createdAt
            }
          }

          return {
            team,
            seasonCount: seasons.length,
            practiceCount,
            gameCount,
            lastActivity,
            isEmpty: seasons.length === 0 || (practiceCount === 0 && gameCount === 0),
          }
        }),
      )

      return enriched
    },
    enabled: !!user,
  })
}

/**
 * Re-attaches the current user as the owner of an orphan team.
 *  - If an owner membership row already exists, its userId is updated.
 *  - Otherwise a deterministic `tm_owner_${teamId}` row is created.
 *  - The team's own `userId` field is also updated so legacy queries
 *    (`teams.list({ where: { userId } })`) continue to work.
 */
export function useClaimTeam() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error('Not signed in')
      const myEmail = normalizeEmail(user.email ?? '')
      const now = new Date().toISOString()

      const ownerRows = (await blink.db.teamMembers.list({
        where: { teamId, role: 'owner' },
        limit: 1,
      })) as TeamMember[]

      if (ownerRows.length > 0) {
        await blink.db.teamMembers.update(ownerRows[0].id, {
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
 * Deletes a team that has no real data. Used by the recovery screen to
 * clean up duplicate empty teams created during past identity-drift
 * incidents. Refuses to delete a team that has any practice or game.
 */
export function useDeleteEmptyTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (teamId: string) => {
      const seasons = (await blink.db.seasons.list({
        where: { teamId },
      })) as Season[]

      for (const s of seasons) {
        const [practices, games] = await Promise.all([
          blink.db.practices.list({ where: { seasonId: s.id } }) as Promise<Practice[]>,
          blink.db.games.list({ where: { seasonId: s.id } }) as Promise<Game[]>,
        ])
        if (practices.length > 0 || games.length > 0) {
          throw new Error("This team isn't empty — refusing to delete")
        }
      }

      // Cascade: seasons → memberships → team.
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
