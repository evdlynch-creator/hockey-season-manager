import { CONCEPTS } from '../types'
import type { Practice, PracticeSegment, Game, GameReview } from '../types'
import type { GameType, ViewMode } from '../hooks/usePreferences'

export type ConceptKey = typeof CONCEPTS[number]

// Maps concept name → GameReview field key
export const GAME_REVIEW_FIELDS: Record<ConceptKey, keyof GameReview> = {
  'Breakouts': 'breakoutsRating',
  'Forecheck': 'forecheckRating',
  'Defensive Zone': 'defensiveZoneRating',
  'Zone Entry': 'zoneEntryRating',
  'Offensive Zone': 'offensiveZoneRating',
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
  practiceRatings: PracticeRating[]
  totalGoalsFor: number
  totalGoalsAgainst: number
  wins: number
  losses: number
  ties: number
}

export function buildByConcept(
  games: Game[],
  practices: Practice[],
  segments: PracticeSegment[],
  reviews: GameReview[],
  practiceRatings: PracticeRating[] = [],
): Record<ConceptKey, ConceptSummary> {
  const gameById = new Map(games.map(g => [g.id, g]))
  const practiceById = new Map(practices.map(p => [p.id, p]))
  const byConcept = {} as Record<ConceptKey, ConceptSummary>

  for (const concept of CONCEPTS) {
    const segmentsByDate = new Map<string, number[]>()
    for (const s of segments) {
      if (s.primaryConcept !== concept && s.secondaryConcept !== concept) continue
      const practice = practiceById.get(s.practiceId)
      if (!practice?.date) continue

      // Aggregate all ratings for this segment
      const relevantRatings = practiceRatings.filter(r => r.segmentId === s.id)
      
      const vals: number[] = []
      
      if (relevantRatings.length > 0) {
        relevantRatings.forEach(r => {
          if (r.understandingRating) vals.push(Number(r.understandingRating))
          if (r.executionRating) vals.push(Number(r.executionRating))
          if (r.transferRating) vals.push(Number(r.transferRating))
        })
      } else {
        // Fallback to legacy segment ratings
        if (s.understandingRating) vals.push(Number(s.understandingRating))
        if (s.executionRating) vals.push(Number(s.executionRating))
        if (s.transferRating) vals.push(Number(s.transferRating))
      }
      
      if (!vals.length) continue
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const arr = segmentsByDate.get(practice.date) ?? []
      arr.push(avg)
      segmentsByDate.set(practice.date, arr)
    }

    const gameByDate = new Map<string, number[]>()
    const reviewField = GAME_REVIEW_FIELDS[concept]
    for (const r of reviews) {
      const game = gameById.get(r.gameId)
      if (!game?.date) continue
      const raw = r[reviewField]
      if (raw == null) continue
      
      const arr = gameByDate.get(game.date) ?? []
      arr.push(Number(raw))
      gameByDate.set(game.date, arr)
    }

    const allDates = new Set<string>([...segmentsByDate.keys(), ...gameByDate.keys()])
    const timeline: ConceptTimePoint[] = [...allDates]
      .sort()
      .map(date => {
        const pracRatings = segmentsByDate.get(date)
        const practiceAvg = pracRatings && pracRatings.length
          ? pracRatings.reduce((a, b) => a + b, 0) / pracRatings.length
          : null
        
        const gameRatings = gameByDate.get(date)
        const gameRating = gameRatings && gameRatings.length
          ? gameRatings.reduce((a, b) => a + b, 0) / gameRatings.length
          : null
          
        return { date, label: formatShort(date), practiceAvg, gameRating }
      })

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

  return byConcept
}

export function filterGamesByMode(
  games: Game[],
  types: Record<string, GameType>,
  mode: ViewMode,
): Game[] {
  if (mode === 'season') return games
  return games.filter(g => (types[g.id] ?? 'league') === mode)
}

export function applyViewModeFilter(
  analytics: SeasonAnalytics,
  types: Record<string, GameType>,
  mode: ViewMode,
): SeasonAnalytics {
  if (mode === 'season') return analytics
  const games = filterGamesByMode(analytics.games, types, mode)
  const allowed = new Set(games.map(g => g.id))
  const reviews = analytics.reviews.filter(r => allowed.has(r.gameId))
  const byConcept = buildByConcept(games, analytics.practices, analytics.segments, reviews, analytics.practiceRatings)
  return { ...analytics, games, reviews, byConcept }
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}