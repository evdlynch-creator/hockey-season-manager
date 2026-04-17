import { useMemo, useState, useEffect } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Separator, EmptyState, Badge,
} from '@blinkdotnew/ui'
import { TrendingUp, Trophy, Target, Activity } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { useFilteredAnalytics } from '@/hooks/useAnalytics'
import { useTeam } from '@/hooks/useTeam'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'

const AMBER = '#F59E0B'
const BLUE = '#3B82F6'
const EMERALD = '#10B981'
const RED = '#EF4444'
const MUTED = '#8A8A8E'

// ── Tooltip ──────────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums">
            {typeof p.value === 'number' ? p.value.toFixed?.(1) ?? p.value : p.value ?? '—'}
          </span>
        </p>
      ))}
    </div>
  )
}

// ── Heatmap cell ─────────────────────────────────────────────────────────────

function heatmapColor(value: number | null): string {
  if (value == null) return 'hsl(0 0% 12%)'
  // 0 = red-ish, 5 = emerald
  if (value < 2) return 'rgba(239, 68, 68, 0.6)'
  if (value < 3) return 'rgba(245, 158, 11, 0.5)'
  if (value < 4) return 'rgba(245, 158, 11, 0.85)'
  return 'rgba(16, 185, 129, 0.85)'
}

// ── Main page ────────────────────────────────────────────────────────────────

type WindowMode = 'all' | 'last1' | 'last3' | 'last5' | 'last10' | 'month'

const WINDOW_OPTIONS: { value: WindowMode; label: string }[] = [
  { value: 'all', label: 'Full season' },
  { value: 'last1', label: 'Last game' },
  { value: 'last3', label: 'Last 3' },
  { value: 'last5', label: 'Last 5' },
  { value: 'last10', label: 'Last 10' },
  { value: 'month', label: 'By month' },
]

export default function TrendsPage() {
  const { data: teamData } = useTeam()
  const { data: rawAnalytics, isLoading } = useFilteredAnalytics()
  const [windowMode, setWindowMode] = useState<WindowMode>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  // Months represented in the data (YYYY-MM, newest first)
  const availableMonths = useMemo(() => {
    if (!rawAnalytics) return []
    const set = new Set<string>()
    rawAnalytics.games.forEach(g => g.date && set.add(g.date.slice(0, 7)))
    CONCEPTS.forEach(c =>
      rawAnalytics.byConcept[c].timeline.forEach(t => set.add(t.date.slice(0, 7))),
    )
    return [...set].sort().reverse()
  }, [rawAnalytics])

  // Auto-select most recent month when entering month mode
  useEffect(() => {
    if (windowMode === 'month' && !selectedMonth && availableMonths.length) {
      setSelectedMonth(availableMonths[0])
    }
  }, [windowMode, selectedMonth, availableMonths])

  // Apply window filter on top of game-type filter
  const analytics = useMemo(() => {
    if (!rawAnalytics) return null
    const completed = rawAnalytics.games
      .filter(g => g.goalsFor != null && g.goalsAgainst != null && !!g.date)
      .sort((a, b) => a.date.localeCompare(b.date))

    let inRange: (date: string) => boolean = () => true
    if (windowMode === 'month') {
      const m = selectedMonth || availableMonths[0]
      inRange = m ? (d: string) => d.startsWith(m) : () => false
    } else if (windowMode !== 'all') {
      const n =
        windowMode === 'last1' ? 1 :
        windowMode === 'last3' ? 3 :
        windowMode === 'last5' ? 5 : 10
      const win = completed.slice(-n)
      if (!win.length) {
        inRange = () => false
      } else {
        const start = win[0].date
        const end = win[win.length - 1].date
        inRange = (d: string) => d >= start && d <= end
      }
    }

    const games = rawAnalytics.games.filter(g => g.date && inRange(g.date))
    const byConcept = {} as typeof rawAnalytics.byConcept
    CONCEPTS.forEach(c => {
      const orig = rawAnalytics.byConcept[c]
      const timeline = orig.timeline.filter(t => inRange(t.date))
      const ratings: number[] = []
      timeline.forEach(t => {
        if (t.gameRating != null) ratings.push(t.gameRating)
        if (t.practiceAvg != null) ratings.push(t.practiceAvg)
      })
      const latestAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
      const firstAvg = ratings.length ? ratings[0] : 0
      const trend = latestAvg != null ? latestAvg - firstAvg : 0
      byConcept[c] = { ...orig, timeline, latestAvg, trend }
    })
    return { ...rawAnalytics, games, byConcept }
  }, [rawAnalytics, windowMode, selectedMonth, availableMonths])

  // Goals trend data
  const goalsData = useMemo(() => {
    if (!analytics) return []
    return analytics.games
      .filter(g => g.goalsFor != null && g.goalsAgainst != null)
      .map(g => ({
        label: g.date ? format(parseISO(g.date), 'MMM d') : '',
        opponent: g.opponent,
        'Goals For': Number(g.goalsFor),
        'Goals Against': Number(g.goalsAgainst),
      }))
  }, [analytics])

  // Rolling record (cumulative W-L-T)
  const recordData = useMemo(() => {
    if (!analytics) return []
    let w = 0, l = 0, t = 0
    return analytics.games
      .filter(g => g.goalsFor != null && g.goalsAgainst != null)
      .map(g => {
        const gf = Number(g.goalsFor)
        const ga = Number(g.goalsAgainst)
        if (gf > ga) w++
        else if (gf < ga) l++
        else t++
        return {
          label: g.date ? format(parseISO(g.date), 'MMM d') : '',
          Wins: w,
          Losses: l,
          Ties: t,
        }
      })
  }, [analytics])

  // Radar data — current concept health
  const radarData = useMemo(() => {
    if (!analytics) return []
    return CONCEPTS.map(c => ({
      concept: c,
      rating: analytics.byConcept[c].latestAvg ?? 0,
    }))
  }, [analytics])

  // Heatmap — concept × session (last N sessions combined)
  const heatmapRows = useMemo(() => {
    if (!analytics) return []
    // Build a union of all dates where any concept has data
    const allDates = new Set<string>()
    CONCEPTS.forEach(c => {
      analytics.byConcept[c].timeline.forEach(t => allDates.add(t.date))
    })
    const sortedDates = [...allDates].sort()
    const lastN = sortedDates.slice(-12) // show last 12 sessions max

    return CONCEPTS.map(c => {
      const timelineMap = new Map(analytics.byConcept[c].timeline.map(t => [t.date, t]))
      return {
        concept: c,
        cells: lastN.map(date => {
          const point = timelineMap.get(date)
          if (!point) return { date, value: null }
          const vals = [point.practiceAvg, point.gameRating].filter(v => v != null) as number[]
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
          return { date, value: avg }
        }),
        dates: lastN,
      }
    })
  }, [analytics])

  // KPIs
  const completedGames = analytics?.games.filter(g => g.goalsFor != null && g.goalsAgainst != null) ?? []
  const wins = completedGames.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const losses = completedGames.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
  const ties = completedGames.filter(g => Number(g.goalsFor) === Number(g.goalsAgainst)).length
  const totalGoalsFor = completedGames.reduce((sum, g) => sum + Number(g.goalsFor ?? 0), 0)
  const totalGoalsAgainst = completedGames.reduce((sum, g) => sum + Number(g.goalsAgainst ?? 0), 0)
  const avgGoalsFor = completedGames.length ? totalGoalsFor / completedGames.length : 0
  const avgGoalsAgainst = completedGames.length ? totalGoalsAgainst / completedGames.length : 0

  const strongest = analytics
    ? [...CONCEPTS].sort((a, b) => (analytics.byConcept[b].latestAvg ?? 0) - (analytics.byConcept[a].latestAvg ?? 0))[0]
    : null
  const weakest = analytics
    ? [...CONCEPTS].sort((a, b) => (analytics.byConcept[a].latestAvg ?? 6) - (analytics.byConcept[b].latestAvg ?? 6))[0]
    : null

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-md" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-card rounded-lg" />
          ))}
        </div>
        <div className="h-80 bg-card rounded-lg" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <EmptyState icon={<TrendingUp />} title="No season data" description="Set up a season to see trends." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Season Trends</h1>
          <p className="text-muted-foreground text-sm mt-1">{teamData?.season?.name ?? ''}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-border/60 bg-card p-1">
            {WINDOW_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setWindowMode(opt.value)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-semibold rounded transition-colors',
                  windowMode === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {windowMode === 'month' && (
            availableMonths.length ? (
              <select
                value={selectedMonth || availableMonths[0]}
                onChange={e => setSelectedMonth(e.target.value)}
                className="h-7 rounded-md border border-border/60 bg-card px-2 text-[11px] font-semibold text-foreground hover:bg-secondary/60 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {format(parseISO(`${m}-01`), 'MMM yyyy')}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">No months yet</span>
            )
          )}
        </div>
      </div>

      <Separator />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Record</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{wins}-{losses}-{ties}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-3.5 h-3.5 text-primary" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Goals / Game</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {avgGoalsFor.toFixed(1)}
              <span className="text-muted-foreground text-sm"> – </span>
              {avgGoalsAgainst.toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Strongest</p>
            </div>
            <p className="text-sm font-semibold truncate">{strongest ?? '—'}</p>
            {strongest && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {(analytics.byConcept[strongest].latestAvg ?? 0).toFixed(1)}/5
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Needs Work</p>
            </div>
            <p className="text-sm font-semibold truncate">{weakest ?? '—'}</p>
            {weakest && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {(analytics.byConcept[weakest].latestAvg ?? 0).toFixed(1)}/5
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Goals area chart + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Goals Per Game</CardTitle>
            <CardDescription className="text-xs">Scoring trend across completed games.</CardDescription>
          </CardHeader>
          <CardContent>
            {goalsData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-muted-foreground italic">No completed games yet.</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={goalsData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                    <defs>
                      <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={EMERALD} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={RED} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={RED} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke={MUTED} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: 'hsl(0 0% 15%)' }} />
                    <YAxis stroke={MUTED} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: 'hsl(0 0% 15%)' }} width={28} allowDecimals={false} />
                    <Tooltip content={<DarkTooltip />} cursor={{ stroke: MUTED, strokeDasharray: 3 }} />
                    <Area name="Goals For" type="monotone" dataKey="Goals For" stroke={EMERALD} strokeWidth={2} fill="url(#gf)" />
                    <Area name="Goals Against" type="monotone" dataKey="Goals Against" stroke={RED} strokeWidth={2} fill="url(#ga)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Concept Health</CardTitle>
            <CardDescription className="text-xs">Latest rating across all 6 core concepts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius={80}>
                  <PolarGrid stroke="hsl(0 0% 18%)" />
                  <PolarAngleAxis dataKey="concept" tick={{ fontSize: 10, fill: MUTED }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: MUTED }} stroke="hsl(0 0% 18%)" />
                  <Radar name="Rating" dataKey="rating" stroke={AMBER} fill={AMBER} fillOpacity={0.35} />
                  <Tooltip content={<DarkTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Cumulative record */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Cumulative Record</CardTitle>
          <CardDescription className="text-xs">How your W-L-T stacks up over the season.</CardDescription>
        </CardHeader>
        <CardContent>
          {recordData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-muted-foreground italic">No completed games yet.</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recordData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke={MUTED} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: 'hsl(0 0% 15%)' }} />
                  <YAxis stroke={MUTED} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: 'hsl(0 0% 15%)' }} width={28} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: 'hsl(0 0% 10%)' }} />
                  <Bar dataKey="Wins" stackId="a" fill={EMERALD} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Ties" stackId="a" fill={MUTED} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Losses" stackId="a" fill={RED} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Heatmap */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Concept × Session Heatmap</CardTitle>
          <CardDescription className="text-xs">
            Last 12 sessions with ratings. Greener = stronger execution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heatmapRows[0]?.cells.length === 0 ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-muted-foreground italic">No ratings yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex items-center gap-1 pl-[140px] mb-2">
                  {heatmapRows[0]?.dates.map(d => (
                    <div key={d} className="w-10 text-center text-[9px] text-muted-foreground font-medium tabular-nums">
                      {format(parseISO(d), 'M/d')}
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {heatmapRows.map(row => (
                    <div key={row.concept} className="flex items-center gap-1">
                      <div className="w-[132px] shrink-0 pr-2 text-right">
                        <span className="text-xs font-medium text-foreground">{row.concept}</span>
                      </div>
                      {row.cells.map(c => (
                        <div
                          key={c.date}
                          className={cn(
                            'w-10 h-10 rounded flex items-center justify-center text-[10px] font-semibold transition-transform hover:scale-110',
                            c.value == null ? 'text-muted-foreground/40' : 'text-white'
                          )}
                          style={{ backgroundColor: heatmapColor(c.value) }}
                          title={`${row.concept} · ${format(parseISO(c.date), 'MMM d')}: ${c.value?.toFixed(1) ?? 'No rating'}`}
                        >
                          {c.value != null ? c.value.toFixed(1) : '—'}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 pl-[140px] text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }} />
                    &lt; 2.0
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.5)' }} />
                    2.0 – 3.0
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.85)' }} />
                    3.0 – 4.0
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.85)' }} />
                    ≥ 4.0
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hide Badge unused import warning */}
      <div className="hidden"><Badge>_</Badge></div>
    </div>
  )
}
