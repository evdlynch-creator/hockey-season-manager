import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Separator, EmptyState,
} from '@blinkdotnew/ui'
import {
  Users, Swords, TrendingUp, TrendingDown, Minus,
  ChevronRight, MapPin, Calendar, Trophy, FileText,
} from 'lucide-react'
import {
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip,
} from 'recharts'
import { format, parseISO, isAfter } from 'date-fns'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useGames } from '@/hooks/useGames'
import type { Game, GameReview } from '@/types'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'

const CONCEPT_FIELD_MAP: Record<string, keyof GameReview> = {
  'Breakouts': 'breakoutsRating',
  'Forecheck': 'forecheckRating',
  'Defensive Zone': 'defensiveZoneRating',
  'Transition': 'transitionRating',
  'Passing': 'passingRating',
  'Skating': 'skatingRating',
}

const AMBER = '#F59E0B'
const MUTED = '#8A8A8E'

// ── Types ────────────────────────────────────────────────────────────────────

interface OpponentStats {
  name: string
  games: Game[]
  reviews: GameReview[]
  wins: number
  losses: number
  ties: number
  totalGoalsFor: number
  totalGoalsAgainst: number
  avgConceptRatings: Record<string, number | null>
  notes: string[]
  lastPlayed: string | null
  nextGame: Game | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resultBadge(result: 'W' | 'L' | 'T') {
  if (result === 'W') return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border text-[10px] px-1.5 py-0 h-5">W</Badge>
  if (result === 'L') return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border text-[10px] px-1.5 py-0 h-5">L</Badge>
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">T</Badge>
}

function recordColor(wins: number, losses: number) {
  if (wins > losses) return 'text-emerald-400'
  if (wins < losses) return 'text-red-400'
  return 'text-muted-foreground'
}

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg text-xs">
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

// ── Opponent detail panel ────────────────────────────────────────────────────

function OpponentDetail({ stats }: { stats: OpponentStats }) {
  const navigate = useNavigate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const radarData = CONCEPTS.map(c => ({
    concept: c === 'Defensive Zone' ? 'Def Zone' : c,
    rating: stats.avgConceptRatings[c] ?? 0,
  }))

  const hasConceptData = Object.values(stats.avgConceptRatings).some(v => v != null)
  const hasNotes = stats.notes.filter(Boolean).length > 0
  const gamesWithScore = stats.games.filter(g => g.goalsFor != null && g.goalsAgainst != null)
  const avgGF = gamesWithScore.length ? stats.totalGoalsFor / gamesWithScore.length : null
  const avgGA = gamesWithScore.length ? stats.totalGoalsAgainst / gamesWithScore.length : null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Rematch alert */}
      {stats.nextGame && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Swords className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary mb-0.5">Rematch upcoming</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(stats.nextGame.date), 'EEEE, MMM d')} ·{' '}
              {stats.nextGame.location === 'home' ? 'Home' : 'Away'}
            </p>
          </div>
          <button
            onClick={() => navigate({ to: '/games/$gameId', params: { gameId: stats.nextGame!.id } })}
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            Open <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Record vs.</p>
            <p className={cn('text-xl font-bold tabular-nums', recordColor(stats.wins, stats.losses))}>
              {stats.wins}–{stats.losses}–{stats.ties}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Avg Goals</p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {avgGF != null ? avgGF.toFixed(1) : '—'}
              <span className="text-muted-foreground text-sm"> – </span>
              {avgGA != null ? avgGA.toFixed(1) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Meetings</p>
            <p className="text-xl font-bold tabular-nums text-foreground">{stats.games.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Concept radar */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm">Concept Performance vs. {stats.name}</CardTitle>
            <CardDescription className="text-xs">Average ratings from all reviewed games.</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasConceptData ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground italic">No reviewed games yet.</p>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius={75}>
                    <PolarGrid stroke="hsl(0 0% 18%)" />
                    <PolarAngleAxis dataKey="concept" tick={{ fontSize: 9, fill: MUTED }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 8, fill: MUTED }} stroke="hsl(0 0% 18%)" />
                    <Radar name="Avg Rating" dataKey="rating" stroke={AMBER} fill={AMBER} fillOpacity={0.3} />
                    <Tooltip content={<DarkTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Concept breakdown */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm">Concept Breakdown</CardTitle>
            <CardDescription className="text-xs">How each concept fared in your games against {stats.name}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {CONCEPTS.map(c => {
              const val = stats.avgConceptRatings[c]
              const pct = val != null ? (val / 5) * 100 : 0
              return (
                <div key={c} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{c}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {val != null ? val.toFixed(1) : '—'}/5
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Game history */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Game History vs. {stats.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.games.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">No completed games.</p>
          ) : (
            [...stats.games]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(g => {
                const gf = g.goalsFor != null ? Number(g.goalsFor) : null
                const ga = g.goalsAgainst != null ? Number(g.goalsAgainst) : null
                const result = gf != null && ga != null
                  ? (gf > ga ? 'W' : gf < ga ? 'L' : 'T') as 'W' | 'L' | 'T'
                  : null
                const review = stats.reviews.find(r => r.gameId === g.id)
                const d = isAfter(parseISO(g.date), new Date()) ? parseISO(g.date) : null
                return (
                  <button
                    key={g.id}
                    onClick={() => navigate({ to: '/games/$gameId', params: { gameId: g.id } })}
                    className="w-full flex items-center gap-3 p-2.5 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="shrink-0">{result ? resultBadge(result) : <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">TBD</Badge>}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {format(parseISO(g.date), 'EEE, MMM d, yyyy')} · {g.location === 'home' ? 'Home' : 'Away'}
                      </p>
                      {gf != null && ga != null && (
                        <p className="text-[11px] text-muted-foreground">{gf} – {ga}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {review && <Badge variant="secondary" className="text-[9px] h-4 px-1">Reviewed</Badge>}
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </button>
                )
              })
          )}
        </CardContent>
      </Card>

      {/* Opponent notes/tendencies */}
      {hasNotes && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Scouting Notes &amp; Tendencies
            </CardTitle>
            <CardDescription className="text-xs">Collected from all game reviews against {stats.name}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.reviews
              .filter(r => r.opponentNotes)
              .map((r, i) => {
                const game = stats.games.find(g => g.id === r.gameId)
                return (
                  <div key={i} className="rounded-md bg-secondary/30 p-3 space-y-1">
                    {game && (
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                        {format(parseISO(game.date), 'MMM d, yyyy')}
                      </p>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">{r.opponentNotes}</p>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Opponent list item ────────────────────────────────────────────────────────

function OpponentListItem({
  stats,
  selected,
  onClick,
}: {
  stats: OpponentStats
  selected: boolean
  onClick: () => void
}) {
  const total = stats.wins + stats.losses + stats.ties
  const winPct = total > 0 ? stats.wins / total : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border p-4 transition-all duration-200',
        selected
          ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border bg-card hover:border-border/80 hover:bg-card/80'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm text-foreground truncate">{stats.name}</p>
            {stats.nextGame && (
              <Badge className="bg-primary/15 text-primary border-primary/25 border text-[9px] px-1.5 py-0 h-4 shrink-0">
                Rematch
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {stats.games.length} game{stats.games.length !== 1 ? 's' : ''}
            {stats.lastPlayed && ` · Last: ${format(parseISO(stats.lastPlayed), 'MMM d')}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-base font-bold tabular-nums', recordColor(stats.wins, stats.losses))}>
            {stats.wins}–{stats.losses}–{stats.ties}
          </p>
          {winPct != null && (
            <p className="text-[10px] text-muted-foreground">{Math.round(winPct * 100)}% win</p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function OpponentsPage() {
  const { data: analytics, isLoading } = useAnalytics()
  const { data: allGames = [] } = useGames()
  const [selected, setSelected] = useState<string | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const opponents = useMemo<OpponentStats[]>(() => {
    if (!analytics) return []

    const { games, reviews } = analytics
    const gamesByOpponent = new Map<string, Game[]>()
    for (const g of games) {
      const arr = gamesByOpponent.get(g.opponent) ?? []
      arr.push(g)
      gamesByOpponent.set(g.opponent, arr)
    }

    const reviewsByGameId = new Map<string, GameReview>()
    for (const r of reviews) {
      reviewsByGameId.set(r.gameId, r)
    }

    const upcomingByOpponent = new Map<string, Game>()
    for (const g of allGames) {
      if (g.status !== 'scheduled') continue
      const d = parseISO(g.date)
      if (!isAfter(d, today) && format(d, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')) continue
      const existing = upcomingByOpponent.get(g.opponent)
      if (!existing || g.date < existing.date) {
        upcomingByOpponent.set(g.opponent, g)
      }
    }

    const result: OpponentStats[] = []

    for (const [opponent, opGames] of gamesByOpponent.entries()) {
      const completedGames = opGames.filter(g => g.goalsFor != null && g.goalsAgainst != null)
      const wins = completedGames.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
      const losses = completedGames.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
      const ties = completedGames.filter(g => Number(g.goalsFor) === Number(g.goalsAgainst)).length
      const totalGoalsFor = completedGames.reduce((s, g) => s + Number(g.goalsFor ?? 0), 0)
      const totalGoalsAgainst = completedGames.reduce((s, g) => s + Number(g.goalsAgainst ?? 0), 0)

      const opReviews = opGames.map(g => reviewsByGameId.get(g.id)).filter(Boolean) as GameReview[]

      const avgConceptRatings: Record<string, number | null> = {}
      for (const c of CONCEPTS) {
        const field = CONCEPT_FIELD_MAP[c]
        const vals = opReviews.map(r => r[field]).filter(v => v != null).map(Number)
        avgConceptRatings[c] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      }

      const notes = opReviews.map(r => r.opponentNotes ?? '').filter(Boolean)

      const sortedByDate = [...opGames].sort((a, b) => b.date.localeCompare(a.date))
      const lastPlayed = completedGames.length > 0
        ? [...completedGames].sort((a, b) => b.date.localeCompare(a.date))[0].date
        : null

      result.push({
        name: opponent,
        games: opGames,
        reviews: opReviews,
        wins,
        losses,
        ties,
        totalGoalsFor,
        totalGoalsAgainst,
        avgConceptRatings,
        notes,
        lastPlayed,
        nextGame: upcomingByOpponent.get(opponent) ?? null,
      })
    }

    return result.sort((a, b) => {
      if (a.nextGame && !b.nextGame) return -1
      if (!a.nextGame && b.nextGame) return 1
      return b.games.length - a.games.length
    })
  }, [analytics, allGames])

  const selectedStats = opponents.find(o => o.name === selected) ?? (opponents.length > 0 ? opponents[0] : null)

  const rematchCount = opponents.filter(o => o.nextGame).length

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-lg" />
            ))}
          </div>
          <div className="lg:col-span-2 h-96 bg-card rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opponents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            History, tendencies, and rematch prep for every team you&apos;ve faced.
          </p>
        </div>
        {rematchCount > 0 && (
          <Badge className="bg-primary/15 text-primary border-primary/25 border gap-1.5 px-3 py-1.5 h-auto">
            <Swords className="w-3.5 h-3.5" />
            {rematchCount} rematch{rematchCount !== 1 ? 'es' : ''} coming up
          </Badge>
        )}
      </div>

      <Separator />

      {opponents.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No opponents yet"
          description="Log games and add opponents. Once you've played teams, their history and tendencies will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Opponent list */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1 mb-3">
              {opponents.length} Opponent{opponents.length !== 1 ? 's' : ''}
            </p>
            {opponents.map(o => (
              <OpponentListItem
                key={o.name}
                stats={o}
                selected={(selected ?? selectedStats?.name) === o.name}
                onClick={() => setSelected(o.name)}
              />
            ))}
          </div>

          {/* Right: Detail */}
          <div className="lg:col-span-2">
            {selectedStats ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{selectedStats.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedStats.games.length} game{selectedStats.games.length !== 1 ? 's' : ''} ·{' '}
                      Record: <span className={cn('font-semibold', recordColor(selectedStats.wins, selectedStats.losses))}>
                        {selectedStats.wins}W {selectedStats.losses}L {selectedStats.ties}T
                      </span>
                    </p>
                  </div>
                </div>
                <OpponentDetail stats={selectedStats} />
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
