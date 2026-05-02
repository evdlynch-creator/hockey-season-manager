import { useState, useMemo } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Separator, EmptyState,
} from '@blinkdotnew/ui'
import { BarChart3, TrendingUp, TrendingDown, Minus, ClipboardList, Swords, Clock } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from 'recharts'
import { subDays, subMonths, parseISO, isAfter, isEqual } from 'date-fns'
import { useFilteredAnalytics } from '@/hooks/useAnalytics'
import type { ConceptSummary } from '@/hooks/useAnalytics'
import { useTeam } from '@/hooks/useTeam'
import { CONCEPTS } from '@/types'
import type { Concept } from '@/types'
import { cn } from '@/lib/utils'

const AMBER = '#F59E0B'
const BLUE = '#3B82F6'
const MUTED = '#8A8A8E'

type TimeFilter = 'all' | 'month' | '2weeks' | 'week'

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'Season' },
  { key: 'month', label: 'Last Month' },
  { key: '2weeks', label: '2 Weeks' },
  { key: 'week', label: '7 Days' },
]

function cutoffDate(filter: TimeFilter): Date | null {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (filter === 'week') return subDays(now, 7)
  if (filter === '2weeks') return subDays(now, 14)
  if (filter === 'month') return subMonths(now, 1)
  return null
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-full px-4 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums">{p.value?.toFixed?.(1) ?? '—'}</span>
        </p>
      ))}
    </div>
  )
}

// ── Trend indicator ──────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  if (Math.abs(value) < 0.2) {
    return (
      <Badge variant="secondary" className="gap-1 font-mono rounded-full">
        <Minus className="w-3 h-3" /> steady
      </Badge>
    )
  }
  if (value > 0) {
    return (
      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border gap-1 font-mono rounded-full">
        <TrendingUp className="w-3 h-3" /> +{value.toFixed(1)}
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border gap-1 font-mono rounded-full">
      <TrendingDown className="w-3 h-3" /> {value.toFixed(1)}
    </Badge>
  )
}

// ── Concept card ──────────────────────────────────────────────────────────────

function ConceptCard({
  summary,
  filteredSummary,
  selected,
  isPriority,
  onClick,
}: {
  summary: ConceptSummary
  filteredSummary: ConceptSummary
  selected: boolean
  isPriority: boolean
  onClick: () => void
}) {
  const hasData = filteredSummary.timeline.length > 0

  // Sub-metric averages from practice (understanding/execution/transfer) aren't
  // stored in ConceptSummary directly—we use practiceAvg as a proxy here.
  const practiceVals = filteredSummary.timeline
    .map(t => t.practiceAvg)
    .filter(v => v != null) as number[]
  const gameVals = filteredSummary.timeline
    .map(t => t.gameRating)
    .filter(v => v != null) as number[]

  const practiceAvg = practiceVals.length
    ? practiceVals.reduce((a, b) => a + b, 0) / practiceVals.length
    : null
  const gameAvg = gameVals.length
    ? gameVals.reduce((a, b) => a + b, 0) / gameVals.length
    : null
  const gap = practiceAvg != null && gameAvg != null ? practiceAvg - gameAvg : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left rounded-[2rem] border transition-all duration-200 p-4 w-full',
        selected
          ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border bg-card hover:border-border/80'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm text-foreground">{filteredSummary.concept}</h3>
            {isPriority && (
              <Badge className="bg-primary/15 text-primary border-primary/25 border text-[9px] px-1.5 py-0 h-4 rounded-full">
                P
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {filteredSummary.practicePoints} practice · {filteredSummary.gamePoints} games
          </p>
        </div>
        <TrendBadge value={filteredSummary.trend} />
      </div>

      {/* Sparkline */}
      <div className="h-10 -mx-1">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredSummary.timeline}>
              <YAxis domain={[0, 5]} hide />
              <Line type="monotone" dataKey="practiceAvg" stroke={AMBER} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="gameRating" stroke={BLUE} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground italic">No data in range</p>
          </div>
        )}
      </div>

      {/* Practice vs Game sub-metrics */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <div className="flex gap-3 text-[10px]">
          <span className="text-muted-foreground">
            Prac: <span className="font-semibold text-amber-400">{practiceAvg != null ? practiceAvg.toFixed(1) : '—'}</span>
          </span>
          <span className="text-muted-foreground">
            Game: <span className="font-semibold text-blue-400">{gameAvg != null ? gameAvg.toFixed(1) : '—'}</span>
          </span>
          {gap != null && Math.abs(gap) > 0.3 && (
            <span className={cn('font-semibold', gap > 0 ? 'text-emerald-400' : 'text-red-400')}>
              {gap > 0 ? '+' : ''}{gap.toFixed(1)} gap
            </span>
          )}
        </div>
        <span className="text-lg font-bold tabular-nums text-foreground">
          {filteredSummary.latestAvg != null ? filteredSummary.latestAvg.toFixed(1) : '—'}
          <span className="text-xs font-normal text-muted-foreground">/5</span>
        </span>
      </div>
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ConceptsPage() {
  const { data: teamData } = useTeam()
  const { data: analytics, isLoading } = useFilteredAnalytics()
  const [selected, setSelected] = useState<Concept>(CONCEPTS[0])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  const priorityConcepts: string[] =
    teamData?.season?.priorityConcepts
      ? JSON.parse(teamData.season.priorityConcepts)
      : []

  // Filter concept summaries by time range
  const filteredAnalytics = useMemo(() => {
    if (!analytics) return null
    const cutoff = cutoffDate(timeFilter)
    if (!cutoff) return analytics

    const byConcept = {} as typeof analytics.byConcept
    for (const concept of CONCEPTS) {
      const orig = analytics.byConcept[concept]
      const timeline = orig.timeline.filter(t => {
        const d = parseISO(t.date)
        return isAfter(d, cutoff) || isEqual(d, cutoff)
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

      const practicePoints = timeline.reduce((sum, t) => sum + (t.practiceAvg != null ? 1 : 0), 0)
      const gamePoints = timeline.reduce((sum, t) => sum + (t.gameRating != null ? 1 : 0), 0)

      byConcept[concept] = { ...orig, timeline, latestAvg, trend, practicePoints, gamePoints }
    }
    return { ...analytics, byConcept }
  }, [analytics, timeFilter])

  const selectedSummary = filteredAnalytics?.byConcept[selected]
  const fullSelectedSummary = analytics?.byConcept[selected]

  // Insights derived from filtered data
  const insights = useMemo(() => {
    if (!filteredAnalytics) return null
    const all = CONCEPTS.map(c => filteredAnalytics.byConcept[c])
    const withData = all.filter(s => s.latestAvg != null)
    if (!withData.length) return null
    const sorted = [...withData].sort((a, b) => (b.latestAvg ?? 0) - (a.latestAvg ?? 0))
    const strongest = sorted[0]
    const weakest = sorted[sorted.length - 1]
    const mostImproved = [...withData].sort((a, b) => b.trend - a.trend)[0]
    const declining = [...withData].sort((a, b) => a.trend - b.trend)[0]
    return { strongest, weakest, mostImproved, declining }
  }, [filteredAnalytics])

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-full" />
        <div className="h-4 w-64 bg-card rounded-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-[2rem]" />
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <EmptyState icon={<BarChart3 />} title="No season data" description="Set up a season to start tracking concept progress." />
      </div>
    )
  }

  const barData = selectedSummary?.timeline.map(p => ({
    label: p.label,
    'Practice': p.practiceAvg ? Number(p.practiceAvg.toFixed(2)) : null,
    'Game': p.gameRating ? Number(p.gameRating.toFixed(2)) : null,
  })) ?? []

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Concepts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track how each core concept is progressing across practices and games.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: AMBER }} />
            Practice
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BLUE }} />
            Game
          </div>
        </div>
      </div>

      {/* Time filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/50 w-fit">
        <Clock className="w-3.5 h-3.5 text-muted-foreground ml-2 shrink-0" />
        {TIME_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setTimeFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              timeFilter === f.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Separator />

      {/* Season insights row */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/50 rounded-[2rem]">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Strongest</p>
              </div>
              <p className="text-sm font-semibold truncate">{insights.strongest.concept}</p>
              <p className="text-xs text-emerald-400 font-mono">{insights.strongest.latestAvg?.toFixed(1)}/5</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 rounded-[2rem]">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Needs Work</p>
              </div>
              <p className="text-sm font-semibold truncate">{insights.weakest.concept}</p>
              <p className="text-xs text-red-400 font-mono">{insights.weakest.latestAvg?.toFixed(1)}/5</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 rounded-[2rem]">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Most Improved</p>
              </div>
              <p className="text-sm font-semibold truncate">{insights.mostImproved.concept}</p>
              <p className="text-xs text-primary font-mono">+{insights.mostImproved.trend.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 rounded-[2rem]">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3 h-3 text-amber-400" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Declining</p>
              </div>
              <p className="text-sm font-semibold truncate">{insights.declining.concept}</p>
              <p className="text-xs text-amber-400 font-mono">{insights.declining.trend.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Concept grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {CONCEPTS.map(c => {
          const summary = analytics.byConcept[c]
          const filtered = filteredAnalytics!.byConcept[c]
          const isPriority = priorityConcepts.includes(c)
          return (
            <ConceptCard
              key={c}
              summary={summary}
              filteredSummary={filtered}
              selected={selected === c}
              isPriority={isPriority}
              onClick={() => setSelected(c)}
            />
          )
        })}
      </div>

      {/* Detail section */}
      {selectedSummary && (
        <>
          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line chart */}
            <Card className="lg:col-span-2 border-border bg-card rounded-[2rem]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  {selected} — Progress Over Time
                </CardTitle>
                <CardDescription className="text-xs">
                  Combined signal from practice segment ratings and post-game reviews.
                  {timeFilter !== 'all' && (
                    <span className="ml-1 text-primary">
                      · Filtered: {TIME_FILTERS.find(f => f.key === timeFilter)?.label}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSummary.timeline.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground italic">
                      No ratings in this time range for {selected}.
                    </p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedSummary.timeline} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" stroke={MUTED} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: 'hsl(0 0% 15%)' }} />
                        <YAxis domain={[0, 5]} stroke={MUTED} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: 'hsl(0 0% 15%)' }} width={28} />
                        <Tooltip content={<DarkTooltip />} cursor={{ stroke: MUTED, strokeDasharray: 3 }} />
                        <Line name="Practice" type="monotone" dataKey="practiceAvg" stroke={AMBER} strokeWidth={2.5} dot={{ r: 3, fill: AMBER }} activeDot={{ r: 5 }} connectNulls />
                        <Line name="Game" type="monotone" dataKey="gameRating" stroke={BLUE} strokeWidth={2.5} dot={{ r: 3, fill: BLUE }} activeDot={{ r: 5 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="space-y-4">
              <Card className="border-border bg-card rounded-[2rem]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    {timeFilter === 'all' ? 'Season' : TIME_FILTERS.find(f => f.key === timeFilter)?.label} Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums text-foreground">
                      {selectedSummary.latestAvg != null ? selectedSummary.latestAvg.toFixed(1) : '—'}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
                  <div className="mt-3">
                    <TrendBadge value={selectedSummary.trend} />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {timeFilter === 'all' ? 'since season start' : `over ${TIME_FILTERS.find(f => f.key === timeFilter)?.label?.toLowerCase()}`}
                    </p>
                  </div>
                  {timeFilter !== 'all' && fullSelectedSummary?.latestAvg != null && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-[10px] text-muted-foreground">Season avg:</p>
                      <p className="text-sm font-semibold">{fullSelectedSummary.latestAvg.toFixed(1)}/5</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card rounded-[2rem]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <div className="flex-1 flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Practice ratings</span>
                      <span className="text-sm font-semibold tabular-nums">{selectedSummary.practicePoints}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Swords className="w-4 h-4 text-primary" />
                    <div className="flex-1 flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Games reviewed</span>
                      <span className="text-sm font-semibold tabular-nums">{selectedSummary.gamePoints}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bar chart — per-session detail */}
          {barData.length > 0 && (
            <Card className="border-border bg-card rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-base">Session-by-Session Detail</CardTitle>
                <CardDescription className="text-xs">
                  Every practice or game where {selected} was rated
                  {timeFilter !== 'all' ? ` (${TIME_FILTERS.find(f => f.key === timeFilter)?.label})` : ''}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                      <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke={MUTED} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: 'hsl(0 0% 15%)' }} />
                      <YAxis domain={[0, 5]} stroke={MUTED} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: 'hsl(0 0% 15%)' }} width={28} />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: 'hsl(0 0% 10%)' }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} iconType="circle" />
                      <Bar dataKey="Practice" fill={AMBER} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Game" fill={BLUE} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
