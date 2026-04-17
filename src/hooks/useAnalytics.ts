import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { Practice, PracticeSegment, Game, GameReview } from '../types'
import { CONCEPTS } from '../types'

export type ConceptKey = typeof CONCEPTS[number]

// Maps concept name → GameReview field key
const GAME_REVIEW_FIELDS: Record<ConceptKey, keyof GameReview> = {
  'Breakouts': 'breakoutsRating',
  'Forecheck': 'forecheckRating',
  'Defensive Zone': 'defensiveZoneRating',
  'Transition': 'transitionRating',
  'Passing': 'passingRating',
  'Skating': 'skatingRating',
}

export interface ConceptTimePoint {
  date: string            // yyyy-MM-dd
  label: string           // MMM d
  practiceAvg: number | null   // 0-5 avg across ratings
  gameRating: number | null    // 0-5 from game review
}

export interface ConceptSummary {
  concept: ConceptKey
  practicePoints: number       // # of rated practice segments
  gamePoints: number           // # of game reviews with this concept
  latestAvg: number | null     // latest combined signal
  trend: number                // latestAvg - firstAvg (0-5 scale)
  timeline: ConceptTimePoint[]
}

export interface SeasonAnalytics {
  byConcept: Record<ConceptKey, ConceptSummary>
  games: Game[]
  practices: Practice[]
  segments: PracticeSegment[]
  reviews: GameReview[]
}

// ── Core hook ────────────────────────────────────────────────────────────────

export function useAnalytics() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery<SeasonAnalytics | null>({
    queryKey: ['analytics', seasonId],
    queryFn: async () => {
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

      // Build a game lookup for dates
      const gameById = new Map(games.map(g => [g.id, g]))
      const practiceById = new Map(practices.map(p => [p.id, p]))

      // Build concept summaries
      const byConcept = {} as Record<ConceptKey, ConceptSummary>

      for (const concept of CONCEPTS) {
        // Collect practice segment ratings per date
        const segmentsByDate = new Map<string, number[]>()
        for (const s of segments) {
          if (s.primaryConcept !== concept && s.secondaryConcept !== concept) continue
          const practice = practiceById.get(s.practiceId)
          if (!practice?.date) continue
          const vals: number[] = []
          if (s.understandingRating) vals.push(Number(s.understandingRating))
          if (s.executionRating) vals.push(Number(s.executionRating))
          if (s.transferRating) vals.push(Number(s.transferRating))
          if (!vals.length) continue
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length
          const arr = segmentsByDate.get(practice.date) ?? []
          arr.push(avg)
          segmentsByDate.set(practice.date, arr)
        }

        // Collect game review ratings per date
        const gameByDate = new Map<string, number>()
        const reviewField = GAME_REVIEW_FIELDS[concept]
        for (const r of reviews) {
          const game = gameById.get(r.gameId)
          if (!game?.date) continue
          const raw = r[reviewField]
          if (raw == null) continue
          gameByDate.set(game.date, Number(raw))
        }

        // Build timeline sorted by date
        const allDates = new Set<string>([
          ...segmentsByDate.keys(),
          ...gameByDate.keys(),
        ])
        const timeline: ConceptTimePoint[] = [...allDates]
          .sort()
          .map(date => {
            const pracRatings = segmentsByDate.get(date)
            const practiceAvg = pracRatings && pracRatings.length
              ? pracRatings.reduce((a, b) => a + b, 0) / pracRatings.length
              : null
            const gameRating = gameByDate.get(date) ?? null
            return {
              date,
              label: formatShort(date),
              practiceAvg,
              gameRating,
            }
          })

        // Compute trend & latest avg (combined signal per point)
        const combined = timeline
          .map(t => {
            const vals = [t.practiceAvg, t.gameRating].filter(v => v != null) as number[]
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
          })
          .filter(v => v != null) as number[]

        const latestAvg = combined.length ? combined[combined.length - 1] : null
        const firstAvg = combined.length ? combined[0] : 0
        const trend = latestAvg != null ? latestAvg - firstAvg : 0

        byConcept[concept] = {
          concept,
          practicePoints: [...segmentsByDate.values()].reduce((a, b) => a + b.length, 0),
          gamePoints: gameByDate.size,
          latestAvg,
          trend,
          timeline,
        }
      }

      return {
        byConcept,
        games,
        practices,
        segments,
        reviews,
      }
    },
    enabled: !!seasonId,
  })
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
