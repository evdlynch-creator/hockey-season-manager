import { Badge } from '@blinkdotnew/ui'
import { format, parseISO } from 'date-fns'
import type { GameReview } from '@/types'
import { CONCEPTS } from '@/types'
import type { OpponentStats, CoachingPlanData, ConceptTier } from './types'

export const CONCEPT_FIELD_MAP: Record<string, keyof GameReview> = {
  'Breakouts': 'breakoutsRating',
  'Forecheck': 'forecheckRating',
  'Defensive Zone': 'defensiveZoneRating',
  'Transition': 'transitionRating',
  'Passing': 'passingRating',
  'Skating': 'skatingRating',
}

export const AMBER = '#F59E0B'
export const MUTED = '#8A8A8E'

export function resultBadge(result: 'W' | 'L' | 'T') {
  if (result === 'W') return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border text-[10px] px-1.5 py-0 h-5 rounded-full">W</Badge>
  if (result === 'L') return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border text-[10px] px-1.5 py-0 h-5 rounded-full">L</Badge>
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 rounded-full">T</Badge>
}

export function recordColor(wins: number, losses: number) {
  if (wins > losses) return 'text-emerald-400'
  if (wins < losses) return 'text-red-400'
  return 'text-muted-foreground'
}

export function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-full px-4 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-semibold tabular-nums">{typeof p.value === 'number' ? p.value.toFixed(1) : '—'}</span>
        </p>
      ))}
    </div>
  )
}

export function buildCoachingPlan(stats: OpponentStats): CoachingPlanData {
  const reviewedGames = stats.games
    .filter((g) => stats.reviews.find((r) => r.gameId === g.id))
    .sort((a, b) => a.date.localeCompare(b.date))

  const tiers: ConceptTier[] = CONCEPTS.map((c) => {
    const field = CONCEPT_FIELD_MAP[c]
    const vals = stats.reviews.map((r) => r[field]).filter((v) => v != null).map(Number)
    return {
      concept: c,
      avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
      samples: vals.length,
    }
  }).filter((t) => t.samples > 0)

  const reinforce = tiers.filter((t) => t.avg >= 3.5).sort((a, b) => b.avg - a.avg)
  const address = tiers.filter((t) => t.avg <= 2.5).sort((a, b) => a.avg - b.avg)
  const mixed = tiers.filter((t) => t.avg > 2.5 && t.avg < 3.5).sort((a, b) => b.avg - a.avg)

  // Trend: compare avg of last review vs. avg of all earlier reviews
  let trend: CoachingPlanData['trend'] = 'unknown'
  let trendDelta = 0
  if (reviewedGames.length >= 2) {
    const reviewAvg = (gameId: string) => {
      const r = stats.reviews.find((rr) => rr.gameId === gameId)
      if (!r) return null
      const vals = CONCEPTS.map((c) => r[CONCEPT_FIELD_MAP[c]])
        .filter((v) => v != null)
        .map(Number)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }
    const lastAvg = reviewAvg(reviewedGames[reviewedGames.length - 1].id)
    const earlier = reviewedGames
      .slice(0, -1)
      .map((g) => reviewAvg(g.id))
      .filter((v): v is number => v != null)
    const earlierAvg = earlier.length ? earlier.reduce((a, b) => a + b, 0) / earlier.length : null
    if (lastAvg != null && earlierAvg != null) {
      trendDelta = lastAvg - earlierAvg
      if (trendDelta > 0.3) trend = 'up'
      else if (trendDelta < -0.3) trend = 'down'
      else trend = 'steady'
    }
  }

  const completed = stats.games.filter((g) => g.goalsFor != null && g.goalsAgainst != null)
  const goalsForAvg = completed.length ? stats.totalGoalsFor / completed.length : null
  const goalsAgainstAvg = completed.length ? stats.totalGoalsAgainst / completed.length : null

  const observations = stats.reviews
    .filter((r) => (r.opponentNotes ?? '').trim())
    .map((r) => {
      const game = stats.games.find((g) => g.id === r.gameId)
      return {
        gameId: r.gameId,
        date: game?.date ?? '',
        note: r.opponentNotes!.trim(),
      }
    })
    .filter((o) => o.date)
    .sort((a, b) => b.date.localeCompare(a.date))

  return {
    reinforce,
    address,
    mixed,
    trend,
    trendDelta,
    reviewedCount: reviewedGames.length,
    goalsForAvg,
    goalsAgainstAvg,
    observations,
  }
}

export function planToText(stats: OpponentStats, plan: CoachingPlanData): string {
  const lines: string[] = []
  lines.push(`Coaching Plan vs. ${stats.name}`)
  lines.push(`Record: ${stats.wins}W ${stats.losses}L ${stats.ties}T · Based on ${plan.reviewedCount} reviewed game${plan.reviewedCount !== 1 ? 's' : ''}`)
  if (plan.goalsForAvg != null && plan.goalsAgainstAvg != null) {
    lines.push(`Avg goals: ${plan.goalsForAvg.toFixed(1)} for / ${plan.goalsAgainstAvg.toFixed(1)} against`)
  }
  if (plan.trend !== 'unknown') {
    const dir = plan.trend === 'up' ? 'improving' : plan.trend === 'down' ? 'declining' : 'steady'
    lines.push(`Trend: ${dir} (${plan.trendDelta >= 0 ? '+' : ''}${plan.trendDelta.toFixed(2)} avg)`)
  }
  lines.push('')
  if (plan.reinforce.length) {
    lines.push('REINFORCE (strengths to keep doing):')
    plan.reinforce.forEach((t) => lines.push(`  • ${t.concept} — avg ${t.avg.toFixed(1)}/5 (${t.samples} game${t.samples !== 1 ? 's' : ''})`))
    lines.push('')
  }
  if (plan.address.length) {
    lines.push('ADDRESS (focus areas for next practice):')
    plan.address.forEach((t) => lines.push(`  • ${t.concept} — avg ${t.avg.toFixed(1)}/5 (${t.samples} game${t.samples !== 1 ? 's' : ''})`))
    lines.push('')
  }
  if (plan.mixed.length) {
    lines.push('WATCH (mixed results):')
    plan.mixed.forEach((t) => lines.push(`  • ${t.concept} — avg ${t.avg.toFixed(1)}/5`))
    lines.push('')
  }
  if (plan.observations.length) {
    lines.push('STYLE OF PLAY (running notes):')
    plan.observations.forEach((o) => {
      const d = format(parseISO(o.date), 'MMM d, yyyy')
      lines.push(`  ${d} — ${o.note}`)
    })
  }
  return lines.join('\n')
}
