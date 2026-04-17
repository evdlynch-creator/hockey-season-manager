import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { Game, GameReview } from '../types'
import { DEMO_GAMES, DEMO_REVIEWS, isDemoMode } from './useDemoData'

export function useGames() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery({
    queryKey: ['games', seasonId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode()) return DEMO_GAMES
      if (!seasonId) return []
      return await blink.db.games.list({
        where: { seasonId },
        orderBy: { date: 'desc' },
      }) as Game[]
    },
    enabled: !!seasonId || isDemoMode(),
  })
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game', gameId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode() && gameId?.startsWith('demo-')) {
        return DEMO_GAMES.find(g => g.id === gameId) || null
      }
      if (!gameId) return null
      return await blink.db.games.get(gameId) as Game | null
    },
    enabled: !!gameId || (isDemoMode() && gameId?.startsWith('demo-')),
  })
}

export function useGameReview(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game-review', gameId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode() && gameId?.startsWith('demo-')) {
        return DEMO_REVIEWS.find(r => r.gameId === gameId) || null
      }
      if (!gameId) return null
      const reviews = await blink.db.gameReviews.list({
        where: { gameId },
        limit: 1,
      }) as GameReview[]
      return reviews[0] || null
    },
    enabled: !!gameId || (isDemoMode() && gameId?.startsWith('demo-')),
  })
}