import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import type { Team, Season, TeamMember } from '../types'

export function useTeam() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['team', user?.id],
    queryFn: async () => {
      if (!user) return null

      const userEmail = (user as any).email?.toLowerCase?.() ?? null

      // Claim any pending invites that match the current user's email.
      if (userEmail) {
        const pending = (await blink.db.teamMembers.list({
          where: { email: userEmail, status: 'pending' },
        })) as TeamMember[]

        for (const invite of pending) {
          await blink.db.teamMembers.update(invite.id, {
            userId: user.id,
            status: 'active',
          })
        }
      }

      // Find all active memberships for this user.
      const memberships = (await blink.db.teamMembers.list({
        where: { userId: user.id, status: 'active' },
      })) as TeamMember[]

      // Backwards compat: if no membership records exist, look up legacy team via userId.
      let team: Team | null = null
      if (memberships.length === 0) {
        const legacy = (await blink.db.teams.list({
          where: { userId: user.id },
          limit: 1,
        })) as Team[]
        team = legacy[0] ?? null

        // Backfill: create owner membership for legacy team.
        if (team && userEmail) {
          await blink.db.teamMembers.create({
            id: `tm_${crypto.randomUUID().slice(0, 8)}`,
            teamId: team.id,
            userId: user.id,
            email: userEmail,
            role: 'owner',
            status: 'active',
          })
        }
      } else {
        // Pick most recent active team. Query each by id to avoid SDK quirks with empty `where`.
        for (const m of memberships) {
          const found = (await blink.db.teams.list({
            where: { id: m.teamId },
            limit: 1,
          })) as Team[]
          if (found[0]) {
            team = found[0]
            break
          }
        }
      }

      if (!team) return null

      const seasons = (await blink.db.seasons.list({
        where: { teamId: team.id },
        orderBy: { createdAt: 'desc' },
        limit: 1,
      })) as Season[]

      return {
        team,
        season: seasons[0] || null,
      }
    },
    enabled: !!user,
  })
}

export function useTeamMembers(teamId?: string) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const members = (await blink.db.teamMembers.list({
        where: { teamId },
        orderBy: { createdAt: 'asc' },
      })) as TeamMember[]
      return members
    },
    enabled: !!teamId,
  })
}
