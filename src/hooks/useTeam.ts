import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { BlinkUser } from '@blinkdotnew/sdk'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { useActiveTeamId } from './usePreferences'
import type { Team, Season, TeamMember } from '../types'

interface SeasonStateRaw {
  activeSeasonId: string | null
  archivedSeasonIds: string[]
}

function readSeasonState(teamId: string | null): SeasonStateRaw {
  const empty: SeasonStateRaw = { activeSeasonId: null, archivedSeasonIds: [] }
  if (!teamId || typeof window === 'undefined') return empty
  try {
    const raw = window.localStorage.getItem(`season-state:${teamId}`)
    if (!raw) return empty
    const parsed = JSON.parse(raw)
    return {
      activeSeasonId: parsed?.activeSeasonId ?? null,
      archivedSeasonIds: Array.isArray(parsed?.archivedSeasonIds) ? parsed.archivedSeasonIds : [],
    }
  } catch {
    return empty
  }
}

function readActiveTeamId(userId: string | null): string | null {
  if (!userId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(`active-team:${userId}`)
    if (!raw) return null
    return JSON.parse(raw)?.activeTeamId ?? null
  } catch {
    return null
  }
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

// Bumps a counter on any localStorage write to a `season-state:*` or
// `active-team:*` key so that React Query callers (whose queryKey includes
// the counter) re-run.
function useTeamScopeRevision() {
  const [rev, setRev] = useState(0)
  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (
        e.key === null ||
        e.key.startsWith('season-state:') ||
        e.key.startsWith('active-team:')
      ) {
        setRev((r) => r + 1)
      }
    }
    window.addEventListener('storage', onChange)
    return () => window.removeEventListener('storage', onChange)
  }, [])
  return rev
}

interface MembershipResolution {
  memberships: TeamMember[]
  teams: Team[]
}

interface MemberQueryClause {
  teamId?: string
  userId?: string | null
  email?: string
  status?: string
  role?: string
  id?: string
}

/**
 * Resolves the current user's memberships and the teams they cover.
 *
 * Side effects (idempotent, run on every call but only do work when needed):
 *  1. Auto-claim pending invites whose email matches the signed-in user.
 *  2. Backfill an `owner` membership for legacy teams where `teams.userId == me`
 *     but no membership row exists yet. Also stamps `plan` and `seatLimit` if
 *     missing so monetization fields are present on every team.
 */
async function resolveMemberships(user: BlinkUser): Promise<MembershipResolution> {
  const myEmail = normalizeEmail(user.email ?? '')

  // 1. Memberships I'm linked to via userId, plus ANY membership row whose
  //    email matches mine. The email match catches two cases at once:
  //     - Pending invites I haven't claimed yet.
  //     - Orphaned owner rows whose userId points at a previous session
  //       identity (e.g. the workspace iframe was reissued a fresh user.id).
  //    Both cases get re-linked to the current user.id below.
  const orClauses: MemberQueryClause[] = [{ userId: user.id }]
  if (myEmail) orClauses.push({ email: myEmail })

  let memberships = (await blink.db.teamMembers.list({
    where: orClauses.length === 1 ? orClauses[0] : { OR: orClauses },
  })) as TeamMember[]

  // 2. Reclaim memberships matching my email whose userId isn't me yet.
  //    Pending rows also get flipped to active. Owner-role rows keep their
  //    role — we just re-attach the identity.
  const claimable = memberships.filter(
    (m) => normalizeEmail(m.email) === myEmail && m.userId !== user.id,
  )
  if (claimable.length > 0) {
    const now = new Date().toISOString()
    await Promise.all(
      claimable.map((m) =>
        blink.db.teamMembers.update(m.id, {
          userId: user.id,
          status: m.status === 'pending' ? 'active' : m.status,
          updatedAt: now,
        }),
      ),
    )
    memberships = memberships.map((m) =>
      claimable.find((c) => c.id === m.id)
        ? {
            ...m,
            userId: user.id,
            status: m.status === 'pending' ? 'active' : m.status,
          }
        : m,
    )
  }

  // 3. Backfill owner row for legacy teams owned by this user.
  //    Uses a DETERMINISTIC id (`tm_owner_${teamId}`) so that concurrent first
  //    sign-ins (across tabs/sessions) cannot create duplicate owner rows —
  //    the second create is either a primary-key conflict (caught) or a no-op.
  const knownTeamIds = new Set(memberships.map((m) => m.teamId))
  const legacyTeams = (await blink.db.teams.list({
    where: { userId: user.id },
  })) as Team[]
  const missing = legacyTeams.filter((t) => !knownTeamIds.has(t.id))
  if (missing.length > 0) {
    const now = new Date().toISOString()
    const results = await Promise.all(
      missing.map(async (team) => {
        const ownerId = `tm_owner_${team.id}`
        // Re-check first to avoid the round-trip when a parallel run already wrote.
        const already = (await blink.db.teamMembers.list({
          where: { teamId: team.id, role: 'owner' },
          limit: 1,
        })) as TeamMember[]
        if (already.length > 0) return already[0]
        try {
          await blink.db.teamMembers.create({
            id: ownerId,
            teamId: team.id,
            userId: user.id,
            email: myEmail,
            role: 'owner',
            status: 'active',
            invitedBy: null,
            invitedByName: null,
            createdAt: now,
            updatedAt: now,
          })
          return {
            id: ownerId,
            teamId: team.id,
            userId: user.id,
            email: myEmail,
            role: 'owner' as const,
            status: 'active' as const,
            invitedBy: null,
            invitedByName: null,
            createdAt: now,
            updatedAt: now,
          } as TeamMember
        } catch (err) {
          // Most likely another tab won the race and wrote the owner row first
          // (deterministic id collision). Re-fetch to recover. Log so real
          // schema/permission errors aren't silently swallowed.
          console.warn(
            '[useTeam] owner-backfill create failed for team',
            team.id,
            '— falling back to existing row',
            err,
          )
          const existing = (await blink.db.teamMembers.list({
            where: { teamId: team.id, role: 'owner' },
            limit: 1,
          })) as TeamMember[]
          return existing[0] ?? null
        }
      }),
    )
    memberships = [...memberships, ...results.filter((m): m is TeamMember => !!m)]
  }

  // 3b. Single-orphan auto-claim. If after the above I still have NO
  //     memberships but exactly one team in the database has an owner
  //     row whose email exactly matches mine (and it's not me), claim it
  //     transparently. This handles the common identity-drift case
  //     without forcing the user through the recovery UI.
  if (memberships.length === 0 && myEmail) {
    const ownerByEmail = (await blink.db.teamMembers.list({
      where: { email: myEmail, role: 'owner' },
    })) as TeamMember[]
    const orphanTeamIds = Array.from(
      new Set(ownerByEmail.filter((m) => m.userId !== user.id).map((m) => m.teamId)),
    )
    if (orphanTeamIds.length === 1) {
      const teamId = orphanTeamIds[0]
      const now = new Date().toISOString()
      const ownerRows = (await blink.db.teamMembers.list({
        where: { teamId, role: 'owner' },
        limit: 1,
      })) as TeamMember[]
      if (ownerRows.length > 0) {
        try {
          await blink.db.teamMembers.update(ownerRows[0].id, {
            userId: user.id,
            email: myEmail,
            status: 'active',
            updatedAt: now,
          })
          memberships = [
            ...memberships,
            { ...ownerRows[0], userId: user.id, email: myEmail, status: 'active', updatedAt: now },
          ]
          try {
            await blink.db.teams.update(teamId, { userId: user.id })
          } catch (err) {
            console.warn('[useTeam] auto-claim teams.userId update failed', teamId, err)
          }
        } catch (err) {
          console.warn('[useTeam] single-orphan auto-claim failed', teamId, err)
        }
      }
    }
  }

  // 4. Load every team I have a membership for.
  const teamIds = Array.from(new Set(memberships.map((m) => m.teamId)))
  if (teamIds.length === 0) return { memberships, teams: [] }

  const teamsRaw = (await blink.db.teams.list({
    where: { id: { in: teamIds } },
  })) as Team[]

  // 5. Stamp plan/seatLimit defaults on any team that's missing them so the
  //    monetization fields are guaranteed present (one-time per team).
  const needsPlanStamp = teamsRaw.filter(
    (t) => t.plan == null || t.plan === undefined,
  )
  if (needsPlanStamp.length > 0) {
    await Promise.all(
      needsPlanStamp.map((t) =>
        blink.db.teams
          .update(t.id, { plan: 'beta_free', seatLimit: null })
          .catch((err) => {
            // Stamping the plan default is best-effort; another tab may have
            // already done it. Log so real schema/permission errors aren't
            // silently swallowed.
            console.warn('[useTeam] could not stamp plan defaults on team', t.id, err)
          }),
      ),
    )
  }
  const teams = teamsRaw.map((t) => ({
    ...t,
    plan: t.plan ?? 'beta_free',
    seatLimit: t.seatLimit ?? null,
  })) as Team[]

  return { memberships, teams }
}

/** All teams the current user belongs to. Drives the team switcher. */
export function useMyTeams() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['myTeams', user?.id],
    queryFn: async () => {
      if (!user) return [] as Team[]
      const { teams } = await resolveMemberships(user)
      return teams
    },
    enabled: !!user,
  })
}

export function useTeam() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const teamScopeRev = useTeamScopeRevision()

  return useQuery({
    queryKey: ['team', user?.id, teamScopeRev],
    queryFn: async () => {
      if (!user) return null

      const { teams } = await resolveMemberships(user)
      if (teams.length === 0) return null

      // Pick the active team for users with multiple teams.
      const activeTeamId = readActiveTeamId(user.id)
      let team = activeTeamId ? teams.find((t) => t.id === activeTeamId) ?? null : null
      if (!team) team = teams[0]

      // Keep the myTeams cache fresh so the switcher reflects new memberships
      // discovered during resolution.
      queryClient.setQueryData(['myTeams', user.id], teams)

      const seasons = (await blink.db.seasons.list({
        where: { teamId: team.id },
        orderBy: { createdAt: 'desc' },
      })) as Season[]

      const { activeSeasonId, archivedSeasonIds } = readSeasonState(team.id)
      let season: Season | null = null

      if (activeSeasonId) {
        const candidate = seasons.find((s) => s.id === activeSeasonId)
        if (candidate && !archivedSeasonIds.includes(candidate.id)) {
          season = candidate
        }
      }
      if (!season) {
        season = seasons.find((s) => !archivedSeasonIds.includes(s.id)) ?? null
      }

      return { team, season }
    },
    enabled: !!user,
  })
}
