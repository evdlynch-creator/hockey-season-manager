import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { Game, GameReview } from '../types'

export function useGames() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery({
    queryKey: ['games', seasonId],
    queryFn: async () => {
      if (!seasonId) return []
      return await blink.db.games.list({
        where: { seasonId },
        orderBy: { date: 'desc' },
      }) as Game[]
    },
    enabled: !!seasonId,
  })
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      if (!gameId) return null
      return await blink.db.games.get(gameId) as Game | null
    },
    enabled: !!gameId,
  })
}

export function useGameReview(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game-review', gameId],
    queryFn: async () => {
      if (!gameId) return null
      const reviews = await blink.db.gameReviews.list({
        where: { gameId },
        limit: 1,
      }) as GameReview[]
      return reviews[0] || null
    },
    enabled: !!gameId,
  })
}
