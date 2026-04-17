import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from '@blinkdotnew/ui'
import { Flame, ChevronRight, Swords, Trophy, ShieldCheck, ShieldAlert, Sparkles, Target } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Game, GameReview } from '@/types'
import { CONCEPTS } from '@/types'

const CONCEPT_FIELD_MAP: Record<string, keyof GameReview> = {
  'Breakouts': 'breakoutsRating',
  'Forecheck': 'forecheckRating',
  'Defensive Zone': 'defensiveZoneRating',
  'Transition': 'transitionRating',
  'Passing': 'passingRating',
  'Skating': 'skatingRating',
}

type Point = {
  icon: 'reinforce' | 'address' | 'history' | 'spark' | 'target'
  text: string
}

interface Args {
  nextGame: Game | null
  allGames: Game[]
  allReviews: GameReview[]
}

function avgConcept(reviews: GameReview[], concept: string): { avg: number; n: number } | null {
  const field = CONCEPT_FIELD_MAP[concept]
  const vals = reviews.map(r => r[field]).filter(v => v != null).map(Number)
  if (!vals.length) return null
  return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length }
}

function buildHype({ nextGame, allGames, allReviews }: Args): {
  headline: string
  sub: string
  points: Point[]
} {
  // ── Branch 1: next game vs known opponent ────────────────────────────────
  if (nextGame) {
    const opponentGames = allGames.filter(
      g => g.opponent === nextGame.opponent && g.goalsFor != null && g.goalsAgainst != null
    )
    const opponentReviews = allReviews.filter(r => opponentGames.some(g => g.id === r.gameId))

    const headline = `vs. ${nextGame.opponent}`
    const sub = `${format(parseISO(nextGame.date), 'EEE, MMM d')} · ${
      nextGame.location === 'home' ? 'Home ice' : 'On the road'
    }`

    const points: Point[] = []

    // Last meeting context
    if (opponentGames.length > 0) {
      const last = [...opponentGames].sort((a, b) => b.date.localeCompare(a.date))[0]
      const gf = Number(last.goalsFor)
      const ga = Number(last.goalsAgainst)
      if (gf > ga) {
        points.push({
          icon: 'history',
          text: `Last meeting you beat them ${gf}–${ga}. Same intensity, same result.`,
        })
      } else if (gf < ga) {
        points.push({
          icon: 'history',
          text: `Lost ${gf}–${ga} last time. This is the bounce-back game — you know what they bring.`,
        })
      } else {
        points.push({
          icon: 'history',
          text: `Tied them ${gf}–${ga} last meeting. Time to break the deadlock.`,
        })
      }
    } else {
      points.push({
        icon: 'spark',
        text: `First look at ${nextGame.opponent}. Set the tone in the first shift.`,
      })
    }

    // Concept-driven points (only if we have reviews against this opponent)
    if (opponentReviews.length > 0) {
      const tiers = CONCEPTS.map(c => ({ concept: c, ...avgConcept(opponentReviews, c)! }))
        .filter(t => t.n != null && !Number.isNaN(t.avg))

      const reinforce = [...tiers].filter(t => t.avg >= 3.5).sort((a, b) => b.avg - a.avg)[0]
      const address = [...tiers].filter(t => t.avg <= 2.75).sort((a, b) => a.avg - b.avg)[0]

      if (reinforce) {
        points.push({
          icon: 'reinforce',
          text: `Your ${reinforce.concept.toLowerCase()} crushed them (${reinforce.avg.toFixed(1)}/5). Keep that pressure on.`,
        })
      }
      if (address) {
        points.push({
          icon: 'address',
          text: `Lock down ${address.concept.toLowerCase()} — that's where the game gets won.`,
        })
      }
    }

    // Fall back to season-wide strength if we still need a 3rd point
    if (points.length < 3) {
      const seasonReviews = allReviews
      const seasonTiers = CONCEPTS.map(c => ({ concept: c, ...(avgConcept(seasonReviews, c) ?? { avg: 0, n: 0 }) }))
      const top = [...seasonTiers].filter(t => t.n > 0).sort((a, b) => b.avg - a.avg)[0]
      if (top) {
        points.push({
          icon: 'target',
          text: `${top.concept} is your weapon this season (${top.avg.toFixed(1)}/5). Lean on it.`,
        })
      }
    }

    return { headline, sub, points: points.slice(0, 3) }
  }

  // ── Branch 2: no upcoming game — generic season hype ─────────────────────
  const completed = allGames.filter(g => g.goalsFor != null && g.goalsAgainst != null)
  const last3 = [...completed].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
  const w = last3.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const l = last3.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length

  const seasonTiers = CONCEPTS.map(c => ({ concept: c, ...(avgConcept(allReviews, c) ?? { avg: 0, n: 0 }) }))
  const top = [...seasonTiers].filter(t => t.n > 0).sort((a, b) => b.avg - a.avg)[0]
  const bot = [...seasonTiers].filter(t => t.n > 0).sort((a, b) => a.avg - b.avg)[0]

  const points: Point[] = []
  if (last3.length === 3 && w >= 2) {
    points.push({ icon: 'history', text: `${w}–${l} in your last 3. Momentum is real — stay locked in.` })
  } else if (last3.length === 3 && l >= 2) {
    points.push({ icon: 'history', text: `Tough stretch (${w}–${l} last 3). Reset, refocus, get back to the basics.` })
  } else if (completed.length > 0) {
    points.push({ icon: 'history', text: `You've put in the work this season. Keep building.` })
  } else {
    points.push({ icon: 'spark', text: `Fresh season, blank slate. Establish your identity early.` })
  }

  if (top) {
    points.push({
      icon: 'reinforce',
      text: `${top.concept} is leading the way (${top.avg.toFixed(1)}/5). Make it your signature.`,
    })
  }
  if (bot && bot.concept !== top?.concept) {
    points.push({
      icon: 'address',
      text: `${bot.concept} is the next level (${bot.avg.toFixed(1)}/5). Small daily wins here.`,
    })
  }

  return {
    headline: 'Keep the standard high',
    sub: 'No game on the schedule yet — stay sharp in practice.',
    points: points.slice(0, 3),
  }
}

const ICON_MAP = {
  reinforce: { Comp: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'border-emerald-500/20' },
  address:   { Comp: ShieldAlert, color: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'border-amber-500/20' },
  history:   { Comp: Trophy,      color: 'text-primary',     bg: 'bg-primary/10',     ring: 'border-primary/20' },
  spark:     { Comp: Sparkles,    color: 'text-primary',     bg: 'bg-primary/10',     ring: 'border-primary/20' },
  target:    { Comp: Target,      color: 'text-blue-400',    bg: 'bg-blue-500/10',    ring: 'border-blue-500/20' },
} as const

export function HypeCard({
  nextGame,
  allGames,
  allReviews,
  className,
}: {
  nextGame: Game | null
  allGames: Game[]
  allReviews: GameReview[]
  className?: string
}) {
  const navigate = useNavigate()
  const hype = useMemo(() => buildHype({ nextGame, allGames, allReviews }), [nextGame, allGames, allReviews])

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden ${className ?? ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <span className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                  {nextGame ? 'Pre-game hype' : 'Coaching points'}
                </span>
                <span className="text-base font-bold tracking-tight">{hype.headline}</span>
              </span>
            </CardTitle>
            <CardDescription className="text-xs mt-2">{hype.sub}</CardDescription>
          </div>
          {nextGame && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs shrink-0"
              onClick={() => navigate({ to: '/games/$gameId', params: { gameId: nextGame.id } })}
            >
              <Swords className="w-3.5 h-3.5" />
              Open
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hype.points.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Log a few practices and reviews to start generating hype points.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {hype.points.map((p, i) => {
              const cfg = ICON_MAP[p.icon]
              const Icon = cfg.Comp
              return (
                <li
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border ${cfg.ring} ${cfg.bg} p-3`}
                >
                  <div className={`w-7 h-7 rounded-md ${cfg.bg} border ${cfg.ring} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <p className="text-sm text-foreground leading-snug pt-0.5">{p.text}</p>
                </li>
              )
            })}
          </ul>
        )}
        {nextGame && (
          <button
            onClick={() => navigate({ to: '/opponents', search: { opponent: nextGame.opponent } })}
            className="mt-3 text-[11px] text-primary hover:underline flex items-center gap-1"
          >
            Full coaching plan vs. {nextGame.opponent}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </CardContent>
    </Card>
  )
}