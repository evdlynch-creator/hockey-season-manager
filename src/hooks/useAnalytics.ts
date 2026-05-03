import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { Practice, PracticeSegment, Game, GameReview } from '../types'
import { useGameTypes, useViewMode } from './usePreferences'
import { DEMO_PRACTICES, DEMO_SEGMENTS, DEMO_GAMES, DEMO_REVIEWS, isDemoMode } from './useDemoData'
import { 
  SeasonAnalytics, 
  buildByConcept, 
  applyViewModeFilter 
} from '../lib/analytics-builders'

export * from '../lib/analytics-builders'
export * from '../lib/insights-engine'

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useFilteredAnalytics() {
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const { types } = useGameTypes(teamId)
  const { mode } = useViewMode(teamId)
  const query = useAnalytics()
  const filtered = useMemo(() => {
    if (!query.data) return query.data
    return applyViewModeFilter(query.data, types, mode)
  }, [query.data, types, mode])
  return { ...query, data: filtered, mode }
}

export function useAnalytics() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery<SeasonAnalytics | null>({
    queryKey: ['analytics', seasonId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode()) {
        const byConcept = buildByConcept(DEMO_GAMES, DEMO_PRACTICES, DEMO_SEGMENTS, DEMO_REVIEWS)
        return { byConcept, games: DEMO_GAMES, practices: DEMO_PRACTICES, segments: DEMO_SEGMENTS, reviews: DEMO_REVIEWS }
      }
      if (!seasonId) return null

      // Parallel load everything
      const [practices, games] = await Promise.all([
        blink.db.practices.list({ where: { seasonId }, orderBy: { date: 'asc' } }) as Promise<Practice[]>,
        blink.db.games.list({ where: { seasonId }, orderBy: { date: 'asc' } }) as Promise<Game[]>,
      ])

      // Fetch segments for all practices (flat list)
      const practiceIds = practices.map(p => p.id)
      const segmentLists = await Promise.all(
        practiceIds.map(id =>
          blink.db.practiceSegments.list({ where: { practiceId: id } }) as Promise<PracticeSegment[]>
        )
      )
      const segments = segmentLists.flat()

      // Fetch all reviews
      const gameIds = games.map(g => g.id)
      const reviewLists = await Promise.all(
        gameIds.map(id =>
          blink.db.gameReviews.list({ where: { gameId: id }, limit: 1 }) as Promise<GameReview[]>
        )
      )
      const reviews = reviewLists.flat()

      const byConcept = buildByConcept(games, practices, segments, reviews)
      return { byConcept, games, practices, segments, reviews }
    },
    enabled: !!seasonId || isDemoMode(),
  })
}
