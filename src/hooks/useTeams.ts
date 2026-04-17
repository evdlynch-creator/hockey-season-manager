import { useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { useTeam } from './useTeam'
import type { Team, Season, Practice, Game } from '../types'

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { switchTeam } = useTeam()

  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error('Not authenticated')

      // 1. Get all seasons for this team
      const seasons = (await blink.db.seasons.list({ where: { teamId } })) as Season[]

      // 2. Delete everything for each season
      for (const season of seasons) {
        const seasonId = season.id
        const [practices, games] = await Promise.all([
          blink.db.practices.list({ where: { seasonId } }) as Promise<Practice[]>,
          blink.db.games.list({ where: { seasonId } }) as Promise<Game[]>,
        ])

        for (const p of practices) {
          const segments = await blink.db.practiceSegments.list({ where: { practiceId: p.id } })
          await Promise.all(
            (segments as { id: string }[]).map((s) => blink.db.practiceSegments.delete(s.id)),
          )
          await blink.db.practices.delete(p.id)
        }

        for (const g of games) {
          const reviews = await blink.db.gameReviews.list({ where: { gameId: g.id } })
          await Promise.all(
            (reviews as { id: string }[]).map((r) => blink.db.gameReviews.delete(r.id)),
          )
          await blink.db.games.delete(g.id)
        }
        await blink.db.seasons.delete(seasonId)
      }

      // 3. Delete the team itself
      await blink.db.teams.delete(teamId)
    },
    onSuccess: async () => {
      // Clear selected team if we deleted it
      const currentSelected = localStorage.getItem('selected_team_id')
      await queryClient.invalidateQueries({ queryKey: ['team'] })
      
      const { data: teamData } = await queryClient.fetchQuery({ queryKey: ['team', user?.id] }) as any
      if (teamData?.teams?.length > 0) {
        await switchTeam(teamData.teams[0].id)
      } else {
        localStorage.removeItem('selected_team_id')
      }
    },
  })
}
