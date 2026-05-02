import { useMemo, useState, useEffect } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Separator, EmptyState, Badge,
} from '@blinkdotnew/ui'
import { TrendingUp, Trophy, Target, Activity, Lightbulb } from 'lucide-react'
import { InsightsList } from '@/components/InsightsStrip'
import { format, parseISO } from 'date-fns'
import { useFilteredAnalytics, buildInsights } from '@/hooks/useAnalytics'
import { useTeam } from '@/hooks/useTeam'
import { usePlayers } from '@/hooks/usePlayers'
import { useTeamPreferences } from '@/hooks/usePreferences'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'

// Analytics Components
import { GoalsTrendChart } from '@/components/analytics/GoalsTrendChart'
import { ConceptRadarChart } from '@/components/analytics/ConceptRadarChart'
import { CumulativeRecordChart } from '@/components/analytics/CumulativeRecordChart'
import { ConceptHeatmap } from '@/components/analytics/ConceptHeatmap'
import { PlayerAttendanceList } from '@/components/analytics/PlayerAttendanceList'

const AMBER = '#F59E0B'
const MUTED = '#8A8A8E'

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
  const [teamPrefs] = useTeamPreferences(teamData?.team?.id)
  const { data: rawAnalytics, isLoading } = useFilteredAnalytics()
  const { data: players = [] } = usePlayers()
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
      const combined = timeline
        .map(t => {
          const vals = [t.practiceAvg, t.gameRating].filter(v => v != null) as number[]
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
        })
        .filter((v): v is number => v != null)
      const latestAvg = combined.length ? combined[combined.length - 1] : null
      const firstAvg = combined.length ? combined[0] : 0
      const trend = latestAvg != null ? latestAvg - firstAvg : 0
      let practicePoints = 0
      let gamePoints = 0
      timeline.forEach(t => {
        if (t.practiceAvg != null) practicePoints++
        if (t.gameRating != null) gamePoints++
      })
      byConcept[c] = { ...orig, timeline, latestAvg, trend, practicePoints, gamePoints }
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

  const insights = useMemo(() => analytics ? buildInsights(analytics) : [], [analytics])

  const strongest = analytics
    ? [...CONCEPTS].sort((a, b) => (analytics.byConcept[b].latestAvg ?? 0) - (analytics.byConcept[a].latestAvg ?? 0))[0]
    : null
  const weakest = analytics
    ? [...CONCEPTS].sort((a, b) => (analytics.byConcept[a].latestAvg ?? 6) - (analytics.byConcept[b].latestAvg ?? 6))[0]
    : null

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
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
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <EmptyState icon={<TrendingUp />} title="No season data" description="Set up a season to see trends." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
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
        <GoalsTrendChart data={goalsData} />
        <ConceptRadarChart data={radarData} />
      </div>

      {/* Row 2: Cumulative record + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn(teamPrefs.enableAttendance ? "lg:col-span-2" : "lg:col-span-3")}>
          <CumulativeRecordChart data={recordData} />
        </div>
        {teamPrefs.enableAttendance && <PlayerAttendanceList players={players} />}
      </div>

      {/* Row 3: Heatmap */}
      <ConceptHeatmap rows={heatmapRows} />

      {/* Tracked Insights */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Tracked Insights</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Plain-English signals from your ratings and results. Updates as more games are reviewed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="py-8 text-center">
              <Lightbulb className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Insights appear here once you've reviewed a few games in this window.
              </p>
            </div>
          ) : (
            <InsightsList insights={insights} />
          )}
        </CardContent>
      </Card>

      {/* Hide Badge unused import warning */}
      <div className="hidden"><Badge>_</Badge></div>
    </div>
  )
}