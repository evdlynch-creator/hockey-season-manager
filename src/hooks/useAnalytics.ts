import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { Practice, PracticeSegment, Game, GameReview } from '../types'
import { CONCEPTS } from '../types'
import { useGameTypes, useViewMode } from './usePreferences'
import type { GameType, ViewMode } from './usePreferences'

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

// ── Pure builders (reused for view-mode filtering) ───────────────────────────

export function buildByConcept(
  games: Game[],
  practices: Practice[],
  segments: PracticeSegment[],
  reviews: GameReview[],
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

    const gameByDate = new Map<string, number>()
    const reviewField = GAME_REVIEW_FIELDS[concept]
    for (const r of reviews) {
      const game = gameById.get(r.gameId)
      if (!game?.date) continue
      const raw = r[reviewField]
      if (raw == null) continue
      gameByDate.set(game.date, Number(raw))
    }

    const allDates = new Set<string>([...segmentsByDate.keys(), ...gameByDate.keys()])
    const timeline: ConceptTimePoint[] = [...allDates]
      .sort()
      .map(date => {
        const pracRatings = segmentsByDate.get(date)
        const practiceAvg = pracRatings && pracRatings.length
          ? pracRatings.reduce((a, b) => a + b, 0) / pracRatings.length
          : null
        const gameRating = gameByDate.get(date) ?? null
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
  // Practices/segments are not filtered (they aren't game-typed) — but we
  // keep them so practice trends remain visible. byConcept reflects only the
  // filtered games' contributions.
  const byConcept = buildByConcept(games, analytics.practices, analytics.segments, reviews)
  return { ...analytics, games, reviews, byConcept }
}

export function useFilteredAnalytics() {
  const { data: teamData } = useTeam()
  const teamId = teamData?.team.id
  const { types } = useGameTypes(teamId)
  const { mode } = useViewMode(teamId)
  const query = useAnalytics()
  const filtered = useMemo(() => {
    if (!query.data) return query.data
    return applyViewModeFilter(query.data, types, mode)
  }, [query.data, types, mode])
  return { ...query, data: filtered, mode }
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

      const byConcept = buildByConcept(games, practices, segments, reviews)
      return { byConcept, games, practices, segments, reviews }
    },
    enabled: !!seasonId,
  })
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Insights engine ──────────────────────────────────────────────────────────

export type InsightTone = 'positive' | 'negative' | 'neutral' | 'info'
export type InsightKind =
  | 'concept-correlation'
  | 'best-lever'
  | 'weakest-concept'
  | 'trending-up'
  | 'trending-down'
  | 'goal-differential'

export interface Insight {
  id: string
  kind: InsightKind
  tone: InsightTone
  headline: string         // Plain text, key number wrapped in {{...}} for highlight
  detail: string
}

const HIGH = 4.0
const LOW = 2.5
const MIN_HIGH_GAMES = 3
const MIN_CONCEPT_RATINGS = 3
const MIN_GAMES_FOR_DIFFERENTIAL = 5
const TREND_THRESHOLD = 0.5

function gameResult(gf?: number, ga?: number): 'W' | 'L' | 'T' | null {
  if (gf == null || ga == null) return null
  if (gf > ga) return 'W'
  if (gf < ga) return 'L'
  return 'T'
}

export function buildInsights(analytics: SeasonAnalytics): Insight[] {
  const correlationInsights: Insight[] = []
  const bestLeverInsights: Insight[] = []
  const weakestInsights: Insight[] = []
  const trendUpInsights: Insight[] = []
  const trendDownInsights: Insight[] = []
  const goalDiffInsights: Insight[] = []

  const gameById = new Map(analytics.games.map(g => [g.id, g]))
  const completedGames = analytics.games.filter(
    g => g.goalsFor != null && g.goalsAgainst != null,
  )

  if (completedGames.length === 0 || analytics.reviews.length === 0) {
    return []
  }

  // Season win rate baseline (excluding ties from denominator? No — use all decided games)
  const seasonWins = completedGames.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const seasonWinPct = completedGames.length ? seasonWins / completedGames.length : 0

  // ── Concept correlations ───────────────────────────────────────────────────
  type ConceptStat = {
    concept: ConceptKey
    highGames: number
    highWins: number
    highWinPct: number
    lowGames: number
    lowWins: number
    lowWinPct: number
    avgRating: number
    ratingCount: number
  }
  const conceptStats: ConceptStat[] = []

  for (const concept of CONCEPTS) {
    const reviewField = GAME_REVIEW_FIELDS[concept]
    let high = 0, highW = 0, low = 0, lowW = 0
    let sum = 0, count = 0

    for (const review of analytics.reviews) {
      const game = gameById.get(review.gameId)
      if (!game) continue
      const result = gameResult(game.goalsFor, game.goalsAgainst)
      if (!result) continue
      const raw = review[reviewField]
      if (raw == null) continue
      const rating = Number(raw)
      sum += rating
      count++
      if (rating >= HIGH) {
        high++
        if (result === 'W') highW++
      } else if (rating <= LOW) {
        low++
        if (result === 'W') lowW++
      }
    }

    conceptStats.push({
      concept,
      highGames: high,
      highWins: highW,
      highWinPct: high ? highW / high : 0,
      lowGames: low,
      lowWins: lowW,
      lowWinPct: low ? lowW / low : 0,
      avgRating: count ? sum / count : 0,
      ratingCount: count,
    })

    if (high >= MIN_HIGH_GAMES) {
      const pct = Math.round((highW / high) * 100)
      const lift = highW / high - seasonWinPct
      const tone: InsightTone = lift >= 0.1 ? 'positive' : lift <= -0.1 ? 'negative' : 'neutral'
      const liftPct = Math.round(Math.abs(lift) * 100)
      const liftPhrase =
        lift >= 0.05 ? ` ${liftPct} pts above season average.`
        : lift <= -0.05 ? ` ${liftPct} pts below season average.`
        : ''
      const lowPart = low > 0
        ? ` Low (≤2.5): ${Math.round((lowW / low) * 100)}% (${lowW}-${low - lowW} in ${low}).`
        : ' No games rated ≤ 2.5 yet.'
      correlationInsights.push({
        id: `corr-${concept}`,
        kind: 'concept-correlation',
        tone,
        headline: `When ${concept} is rated 4+ , you win {{${pct}%}} of games.`,
        detail: `High (≥4.0): ${highW}-${high - highW} in ${high} game${high === 1 ? '' : 's'}.${lowPart}${liftPhrase}`,
      })
    }
  }

  // ── Best lever (concept whose high-rating win rate most exceeds baseline) ─
  const eligibleLevers = conceptStats.filter(s => s.highGames >= MIN_HIGH_GAMES)
  if (eligibleLevers.length) {
    const best = eligibleLevers.reduce((a, b) =>
      (b.highWinPct - seasonWinPct) > (a.highWinPct - seasonWinPct) ? b : a,
    )
    const lift = best.highWinPct - seasonWinPct
    const liftPts = Math.round(lift * 100)
    const sign = liftPts >= 0 ? '+' : ''
    bestLeverInsights.push({
      id: 'best-lever',
      kind: 'best-lever',
      tone: lift >= 0 ? 'positive' : 'neutral',
      headline: `Biggest swing factor: {{${best.concept}}} (${sign}${liftPts} pts win rate).`,
      detail: `When ${best.concept} is rated 4+ , win rate is ${Math.round(best.highWinPct * 100)}% vs season ${Math.round(seasonWinPct * 100)}% (n=${best.highGames}).`,
    })
  }

  // ── Weakest concept (lowest season-average rating, ≥ 3 ratings) ──────────
  const ratedConcepts = conceptStats.filter(s => s.ratingCount >= MIN_CONCEPT_RATINGS)
  if (ratedConcepts.length) {
    const weakest = ratedConcepts.reduce((a, b) => (b.avgRating < a.avgRating ? b : a))
    weakestInsights.push({
      id: 'weakest',
      kind: 'weakest-concept',
      tone: 'negative',
      headline: `Lowest-rated area this season: {{${weakest.concept}}} at ${weakest.avgRating.toFixed(1)}/5.`,
      detail: `Across ${weakest.ratingCount} reviewed game${weakest.ratingCount === 1 ? '' : 's'}. Worth a focused practice block.`,
    })
  }

  // ── Trending up / down (use existing concept summaries) ───────────────────
  const conceptsWithTrend = CONCEPTS
    .map(c => ({ concept: c, summary: analytics.byConcept[c] }))
    .filter(x => x.summary.gamePoints + x.summary.practicePoints >= MIN_CONCEPT_RATINGS)

  if (conceptsWithTrend.length) {
    const up = conceptsWithTrend.reduce((a, b) => (b.summary.trend > a.summary.trend ? b : a))
    if (up.summary.trend >= TREND_THRESHOLD) {
      trendUpInsights.push({
        id: 'trending-up',
        kind: 'trending-up',
        tone: 'positive',
        headline: `{{${up.concept}}} is trending up: +${up.summary.trend.toFixed(1)} since the start of the window.`,
        detail: `Latest combined rating: ${up.summary.latestAvg?.toFixed(1) ?? '—'}/5.`,
      })
    }

    const down = conceptsWithTrend.reduce((a, b) => (b.summary.trend < a.summary.trend ? b : a))
    if (down.summary.trend <= -TREND_THRESHOLD) {
      trendDownInsights.push({
        id: 'trending-down',
        kind: 'trending-down',
        tone: 'negative',
        headline: `{{${down.concept}}} is sliding: ${down.summary.trend.toFixed(1)} since the start of the window.`,
        detail: `Latest combined rating: ${down.summary.latestAvg?.toFixed(1) ?? '—'}/5.`,
      })
    }
  }

  // ── Goal differential signal (overall review average vs goal diff) ───────
  if (analytics.reviews.length >= MIN_GAMES_FOR_DIFFERENTIAL) {
    const perGame: { avg: number; diff: number }[] = []
    for (const review of analytics.reviews) {
      const game = gameById.get(review.gameId)
      if (!game || game.goalsFor == null || game.goalsAgainst == null) continue
      const ratings: number[] = []
      for (const c of CONCEPTS) {
        const v = review[GAME_REVIEW_FIELDS[c]]
        if (v != null) ratings.push(Number(v))
      }
      if (!ratings.length) continue
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
      perGame.push({ avg, diff: Number(game.goalsFor) - Number(game.goalsAgainst) })
    }
    if (perGame.length >= MIN_GAMES_FOR_DIFFERENTIAL) {
      const sorted = [...perGame].sort((a, b) => a.avg - b.avg)
      const half = Math.floor(sorted.length / 2)
      const lowHalf = sorted.slice(0, half)
      const highHalf = sorted.slice(sorted.length - half)
      if (lowHalf.length && highHalf.length) {
        const lowDiff = lowHalf.reduce((a, b) => a + b.diff, 0) / lowHalf.length
        const highDiff = highHalf.reduce((a, b) => a + b.diff, 0) / highHalf.length
        const swing = highDiff - lowDiff
        goalDiffInsights.push({
          id: 'goal-diff',
          kind: 'goal-differential',
          tone: swing > 0 ? 'positive' : swing < 0 ? 'negative' : 'neutral',
          headline: `High-rated games swing goal differential by {{${swing >= 0 ? '+' : ''}${swing.toFixed(1)}}} per game.`,
          detail: `Top half average ${highDiff >= 0 ? '+' : ''}${highDiff.toFixed(1)} vs bottom half ${lowDiff >= 0 ? '+' : ''}${lowDiff.toFixed(1)} (n=${perGame.length}).`,
        })
      }
    }
  }

  // ── Selection: reserve one slot per family first, then fill with extras ──
  const families: Insight[][] = [
    bestLeverInsights,
    weakestInsights,
    trendUpInsights,
    trendDownInsights,
    goalDiffInsights,
    correlationInsights,
  ]

  const MAX = 6
  const ordered: Insight[] = []
  // Pass 1: take up to one from each family in priority order
  for (const fam of families) {
    if (ordered.length >= MAX) break
    if (fam.length) ordered.push(fam[0])
  }
  // Pass 2: fill remaining slots from leftover correlations (most varied family)
  const seen = new Set(ordered.map(i => i.id))
  for (const fam of families) {
    for (const item of fam) {
      if (ordered.length >= MAX) break
      if (!seen.has(item.id)) {
        ordered.push(item)
        seen.add(item.id)
      }
    }
    if (ordered.length >= MAX) break
  }

  return ordered
}
