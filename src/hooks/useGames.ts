import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import { useAuth } from './useAuth'
import type { Game, GameReview } from '../types'
import { DEMO_GAMES, DEMO_REVIEWS, isDemoMode } from './useDemoData'
import { useMemo } from 'react'

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
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['game-review', gameId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode() && gameId?.startsWith('demo-')) {
        return DEMO_REVIEWS.filter(r => r.gameId === gameId)
      }
      if (!gameId) return []
      return await blink.db.gameReviews.list({
        where: { gameId },
      }) as GameReview[]
    },
    enabled: !!gameId || (isDemoMode() && !!gameId?.startsWith('demo-')),
  })

  const reviews = query.data || []
  const myReview = reviews.find(r => r.userId === user?.id)

  const consensus = useMemo(() => {
    if (reviews.length === 0) return null
    
    const count = reviews.length
    const fields = [
      'breakoutsRating', 'forecheckRating', 'defensiveZoneRating', 
      'transitionRating', 'passingRating', 'skatingRating',
      'zoneEntryRating', 'offensiveZoneRating'
    ] as const

    const averages: any = {}
    fields.forEach(f => {
      const sum = reviews.reduce((acc, r) => acc + (Number(r[f]) || 0), 0)
      averages[f] = sum / count
    })

    return {
      ...averages,
      count
    }
  }, [reviews])

  return {
    reviews,
    myReview,
    consensus,
    isLoading: query.isLoading
  }
}