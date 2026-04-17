import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'

export function useTeam() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['team', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const teams = await blink.db.teams.list({
        where: { user_id: user.id },
        limit: 1
      })
      
      if (teams.length === 0) return null
      
      const team = teams[0]
      
      const seasons = await blink.db.seasons.list({
        where: { team_id: team.id },
        orderBy: { created_at: 'desc' },
        limit: 1
      })
      
      return {
        team,
        season: seasons[0] || null
      }
    },
    enabled: !!user
  })
}
