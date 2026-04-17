import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import type { Team, Season } from '../types'

export function useTeam() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['team', user?.id],
    queryFn: async () => {
      if (!user) return null

      const teams = (await blink.db.teams.list({
        where: { userId: user.id },
        limit: 1,
      })) as Team[]

      const team = teams[0] ?? null
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
