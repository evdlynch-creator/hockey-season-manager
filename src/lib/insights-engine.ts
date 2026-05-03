import type { Game, GameReview } from '../types'
import { CONCEPTS } from '../types'
import { 
  ConceptKey, 
  ConceptSummary, 
  SeasonAnalytics, 
  GAME_REVIEW_FIELDS,
  buildByConcept
} from './analytics-builders'

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

interface InsightOptions {
  minHighGames?: number
  minConceptRatings?: number
  minGamesForDifferential?: number
  trendThreshold?: number
  max?: number
}

interface InsightSlice {
  games: Game[]
  reviews: GameReview[]
  byConcept: Record<ConceptKey, ConceptSummary>
}

function gameResult(gf?: number, ga?: number): 'W' | 'L' | 'T' | null {
  if (gf == null || ga == null) return null
  if (gf > ga) return 'W'
  if (gf < ga) return 'L'
  return 'T'
}

export function buildOpponentInsights(
  analytics: SeasonAnalytics,
  opponentName: string,
): Insight[] {
  const games = analytics.games.filter(g => g.opponent === opponentName)
  const allowed = new Set(games.map(g => g.id))
  const reviews = analytics.reviews.filter(r => allowed.has(r.gameId))
  const byConcept = buildByConcept(games, [], [], reviews)
  return buildInsightsCore(
    { games, reviews, byConcept },
    {
      minHighGames: 2,
      minConceptRatings: 2,
      minGamesForDifferential: 3,
      trendThreshold: 0.4,
      max: 3,
    },
  )
}

export function buildInsights(analytics: SeasonAnalytics): Insight[] {
  return buildInsightsCore(
    { games: analytics.games, reviews: analytics.reviews, byConcept: analytics.byConcept },
    {},
  )
}

function buildInsightsCore(slice: InsightSlice, options: InsightOptions): Insight[] {
  const minHighGames = options.minHighGames ?? MIN_HIGH_GAMES
  const minConceptRatings = options.minConceptRatings ?? MIN_CONCEPT_RATINGS
  const minGamesForDifferential = options.minGamesForDifferential ?? MIN_GAMES_FOR_DIFFERENTIAL
  const trendThreshold = options.trendThreshold ?? TREND_THRESHOLD
  const max = options.max ?? 6

  const analytics = slice
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

  const seasonWinPct = completedGames.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length / completedGames.length

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

    if (high >= minHighGames) {
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

  const eligibleLevers = conceptStats.filter(s => s.highGames >= minHighGames)
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

  const ratedConcepts = conceptStats.filter(s => s.ratingCount >= minConceptRatings)
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

  const conceptsWithTrend = CONCEPTS
    .map(c => ({ concept: c, summary: analytics.byConcept[c] }))
    .filter(x => x.summary.gamePoints + x.summary.practicePoints >= minConceptRatings)

  if (conceptsWithTrend.length) {
    const up = conceptsWithTrend.reduce((a, b) => (b.summary.trend > a.summary.trend ? b : a))
    if (up.summary.trend >= trendThreshold) {
      trendUpInsights.push({
        id: 'trending-up',
        kind: 'trending-up',
        tone: 'positive',
        headline: `{{${up.concept}}} is trending up: +${up.summary.trend.toFixed(1)} since the start of the window.`,
        detail: `Latest combined rating: ${up.summary.latestAvg?.toFixed(1) ?? '—'}/5.`,
      })
    }

    const down = conceptsWithTrend.reduce((a, b) => (b.summary.trend < a.summary.trend ? b : a))
    if (down.summary.trend <= -trendThreshold) {
      trendDownInsights.push({
        id: 'trending-down',
        kind: 'trending-down',
        tone: 'negative',
        headline: `{{${down.concept}}} is sliding: ${down.summary.trend.toFixed(1)} since the start of the window.`,
        detail: `Latest combined rating: ${down.summary.latestAvg?.toFixed(1) ?? '—'}/5.`,
      })
    }
  }

  if (analytics.reviews.length >= minGamesForDifferential) {
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
    if (perGame.length >= minGamesForDifferential) {
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

  const families: Insight[][] = [
    bestLeverInsights,
    weakestInsights,
    trendUpInsights,
    trendDownInsights,
    goalDiffInsights,
    correlationInsights,
  ]

  const ordered: Insight[] = []
  // Pass 1: take up to one from each family in priority order
  for (const fam of families) {
    if (ordered.length >= max) break
    if (fam.length) ordered.push(fam[0])
  }
  // Pass 2: fill remaining slots from leftover correlations (most varied family)
  const seen = new Set(ordered.map(i => i.id))
  for (const fam of families) {
    for (const item of fam) {
      if (ordered.length >= max) break
      if (!seen.has(item.id)) {
        ordered.push(item)
        seen.add(item.id)
      }
    }
    if (ordered.length >= max) break
  }

  return ordered
}
