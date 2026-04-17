import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { useTeam } from './useTeam'
import type { TeamMember, TeamPlan } from '../types'

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function newMembershipId(): string {
  return `tm_${crypto.randomUUID().slice(0, 8)}`
}

/**
 * Throws if the current user is not the owner of `teamId`.
 *
 * The Blink writes still happen client-side (same trust model as the rest of
 * the app), but this guard prevents owner-only mutations from being triggered
 * accidentally — or from devtools — by a coach who somehow bypasses the UI.
 */
async function assertOwner(
  user: { id: string; email?: string | null } | null,
  teamId: string,
): Promise<void> {
  if (!user) throw new Error('Not signed in')
  const myEmail = ((user as any).email ?? '').toString().trim().toLowerCase()
  const orClauses: any[] = [{ teamId, userId: user.id }]
  if (myEmail) orClauses.push({ teamId, email: myEmail })
  const rows = (await blink.db.teamMembers.list({
    where: orClauses.length === 1 ? orClauses[0] : { OR: orClauses },
  })) as TeamMember[]
  const owner = rows.find((m) => m.role === 'owner' && m.status === 'active')
  if (!owner) throw new Error('Only the team owner can do that')
}

/**
 * Loads a membership by id from the DB and asserts the current user is the
 * owner of THAT membership's team. Use before any owner-only mutation that
 * targets a single membership row, so a forged caller payload can't redirect
 * the action at a row in a different team.
 */
async function loadAuthorizedMember(
  user: { id: string; email?: string | null } | null,
  memberId: string,
): Promise<TeamMember> {
  if (!user) throw new Error('Not signed in')
  const fresh = (await blink.db.teamMembers.list({
    where: { id: memberId },
    limit: 1,
  })) as TeamMember[]
  const row = fresh[0]
  if (!row) throw new Error('Member not found')
  await assertOwner(user, row.teamId)
  return row
}

/** All members for a single team, sorted owner → active coaches → pending. */
export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const rows = (await blink.db.teamMembers.list({
        where: { teamId },
        orderBy: { createdAt: 'asc' },
      })) as TeamMember[]
      return [...rows].sort((a, b) => {
        const rank = (m: TeamMember) =>
          m.role === 'owner' ? 0 : m.status === 'active' ? 1 : 2
        const r = rank(a) - rank(b)
        if (r !== 0) return r
        return a.createdAt.localeCompare(b.createdAt)
      })
    },
    enabled: !!teamId,
  })
}

/** The current user's membership row on the active team. */
export function useMyMembership(teamId: string | undefined) {
  const { user } = useAuth()
  const { data: members = [] } = useTeamMembers(teamId)

  if (!user || !teamId) {
    return { role: null as 'owner' | 'coach' | null, status: null, isOwner: false }
  }
  const email = normalizeEmail((user as any).email ?? '')
  const mine =
    members.find((m) => m.userId === user.id) ??
    members.find((m) => normalizeEmail(m.email) === email)
  return {
    role: mine?.role ?? null,
    status: mine?.status ?? null,
    isOwner: mine?.role === 'owner',
  }
}

/**
 * Single source of truth for plan/seat info on a team.
 * The future paywall task only has to change this helper.
 */
export function useTeamPlan(teamId: string | undefined) {
  const { data: teamData } = useTeam()
  const { data: members = [] } = useTeamMembers(teamId)

  const plan: TeamPlan = (teamData?.team.plan as TeamPlan | undefined) ?? 'beta_free'
  const seatLimit = teamData?.team.seatLimit ?? null
  const seatsUsed = members.filter(
    (m) => m.role === 'owner' || m.status === 'active' || m.status === 'pending',
  ).length
  return { plan, seatLimit, seatsUsed }
}

interface InviteInput {
  teamId: string
  email: string
}

export function useInviteCoach() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ teamId, email }: InviteInput) => {
      if (!user) throw new Error('Not signed in')
      await assertOwner(user, teamId)
      const cleaned = normalizeEmail(email)
      if (!isValidEmail(cleaned)) throw new Error('Enter a valid email address')
      const myEmail = normalizeEmail((user as any).email ?? '')
      if (cleaned === myEmail) throw new Error("You can't invite yourself")

      const existing = (await blink.db.teamMembers.list({
        where: { teamId, email: cleaned },
        limit: 1,
      })) as TeamMember[]
      if (existing.length > 0) {
        throw new Error('That email is already on the staff list')
      }

      const now = new Date().toISOString()
      await blink.db.teamMembers.create({
        id: newMembershipId(),
        teamId,
        email: cleaned,
        userId: null,
        role: 'coach',
        status: 'pending',
        invitedBy: user.id,
        invitedByName: (user as any).email ?? null,
        createdAt: now,
        updatedAt: now,
      })
      return cleaned
    },
    onSuccess: (_email, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] })
    },
  })
}

export function useResendInvite() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (member: TeamMember) => {
      // Re-fetch + authorize against the row's actual teamId — a caller
      // can't redirect this update at a row in another team.
      const row = await loadAuthorizedMember(user, member.id)
      // We don't actually send an email — invites are claimed at sign-in.
      // Touching updatedAt gives the user a visible "just resent" signal.
      await blink.db.teamMembers.update(row.id, {
        updatedAt: new Date().toISOString(),
      })
      return row
    },
    onSuccess: (_data, member) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', member.teamId] })
    },
  })
}

export function useRevokeInvite() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (member: TeamMember) => {
      const row = await loadAuthorizedMember(user, member.id)
      if (row.status !== 'pending') throw new Error('Only pending invites can be revoked')
      if (row.role === 'owner') throw new Error("Owner can't be revoked")
      await blink.db.teamMembers.delete(row.id)
      return row
    },
    onSuccess: (_data, member) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', member.teamId] })
    },
  })
}

/**
 * Removes a member. Allowed callers:
 *  - The team owner removing any non-owner.
 *  - A coach removing themselves (Settings → "Leave team").
 */
export function useRemoveMember() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (member: TeamMember) => {
      if (!user) throw new Error('Not signed in')

      // Re-fetch the authoritative row so the caller can't forge `userId`/`email`
      // to bypass the owner check via devtools.
      const fresh = (await blink.db.teamMembers.list({
        where: { id: member.id },
        limit: 1,
      })) as TeamMember[]
      const row = fresh[0]
      if (!row) throw new Error('Member not found')
      if (row.role === 'owner') throw new Error("Owner can't be removed")

      const myEmail = ((user as any).email ?? '').toString().trim().toLowerCase()
      const isSelf =
        row.userId === user.id ||
        (myEmail !== '' && row.email.trim().toLowerCase() === myEmail)
      if (!isSelf) {
        await assertOwner(user, row.teamId)
      }
      await blink.db.teamMembers.delete(row.id)
      return row
    },
    onSuccess: (_data, member) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', member.teamId] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['myTeams'] })
    },
  })
}
