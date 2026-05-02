import { useAuth } from '../hooks/useAuth'
import { useTeam } from '../hooks/useTeam'
import { usePractices } from '../hooks/usePractices'
import { useGames } from '../hooks/useGames'
import { useFilteredAnalytics, filterGamesByMode, buildInsights } from '../hooks/useAnalytics'
import { useGameTypes, useViewMode } from '../hooks/usePreferences'
import { isDemoMode } from '../hooks/useDemoData'
import { HypeCard } from '../components/HypeCard'
import { InsightsStrip } from '../components/InsightsStrip'
import { format, isAfter, parseISO } from 'date-fns'
import { 
  Plus, 
  Target, 
  Calendar as CalendarIcon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  ClipboardList, 
  Swords, 
  ChevronRight 
} from 'lucide-react'
import { 
  Button, 
  LoadingOverlay, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Badge,
  EmptyState
} from '@blinkdotnew/ui'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CONCEPTS } from '../types'

const SNAPSHOT_FIELD: Record<string, 'breakoutsRating' | 'forecheckRating' | 'defensiveZoneRating' | 'transitionRating' | 'passingRating' | 'skatingRating'> = {
  'Breakouts': 'breakoutsRating',
  'Forecheck': 'forecheckRating',
  'Defensive Zone': 'defensiveZoneRating',
  'Transition': 'transitionRating',
  'Passing': 'passingRating',
  'Skating': 'skatingRating',
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { data: teamData, isLoading, isFetching, isSuccess } = useTeam()
  const { data: practices = [] } = usePractices()
  const { data: rawGames = [] } = useGames()
  const teamId = teamData?.team?.id
  const { types: gameTypes } = useGameTypes(teamId)
  const { mode: viewMode } = useViewMode(teamId)
  const games = filterGamesByMode(rawGames, gameTypes, viewMode)
  const { data: analytics } = useFilteredAnalytics()
  const navigate = useNavigate()

  const demoActive = isDemoMode()

  useEffect(() => {
    if (!authLoading && !demoActive && user && isSuccess && !isFetching && !teamData?.team) {
      navigate({ to: '/onboarding', replace: true })
    }
  }, [teamData, isSuccess, isFetching, authLoading, user, navigate, demoActive])

  if ((authLoading && !demoActive) || isLoading || !teamData?.team) return <LoadingOverlay show />

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingPractices = practices
    .filter(p => {
      const d = parseISO(p.date)
      return isAfter(d, today) || format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    })
    .filter(p => p.status !== 'completed' && p.status !== 'reviewed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const upcomingGames = games
    .filter(g => {
      const d = parseISO(g.date)
      return isAfter(d, today) || format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    })
    .filter(g => g.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const nextEvent =
    upcomingPractices.length && upcomingGames.length
      ? (upcomingPractices[0].date <= upcomingGames[0].date
          ? { kind: 'practice' as const, data: upcomingPractices[0] }
          : { kind: 'game' as const, data: upcomingGames[0] })
      : upcomingPractices.length
        ? { kind: 'practice' as const, data: upcomingPractices[0] }
        : upcomingGames.length
          ? { kind: 'game' as const, data: upcomingGames[0] }
          : null

  const completedGames = games.filter(g => g.goalsFor != null && g.goalsAgainst != null)
  const wins = completedGames.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const losses = completedGames.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
  const ties = completedGames.filter(g => Number(g.goalsFor) === Number(g.goalsAgainst)).length

  const completedPractices = practices.filter(p => p.status === 'completed' || p.status === 'reviewed').length

  const recentCompleted = [...completedGames]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
  const reviewsByGameId = new Map((analytics?.reviews ?? []).map(r => [r.gameId, r]))
  const snapshotGF = recentCompleted.reduce((s, g) => s + Number(g.goalsFor ?? 0), 0)
  const snapshotGA = recentCompleted.reduce((s, g) => s + Number(g.goalsAgainst ?? 0), 0)
  const snapshotW = recentCompleted.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const snapshotL = recentCompleted.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
  const snapshotT = recentCompleted.length - snapshotW - snapshotL
  
  const conceptAvgs = CONCEPTS
    .map(c => {
      const field = SNAPSHOT_FIELD[c]
      const vals = recentCompleted
        .map(g => reviewsByGameId.get(g.id))
        .map(r => (r ? (r as any)[field] : null))
        .filter(v => v != null)
        .map(Number)
      return { concept: c, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, count: vals.length }
    })
    .filter((x): x is { concept: string; avg: number; count: number } => x.avg != null)
  const working = [...conceptAvgs].filter(c => c.avg >= 3.5).sort((a, b) => b.avg - a.avg).slice(0, 2)
  const hurting = [...conceptAvgs].filter(c => c.avg <= 2.7).sort((a, b) => a.avg - b.avg).slice(0, 2)
  let hurtNarrative = ''
  if (hurting.length && snapshotGA > 0) {
    const c = hurting[0]
    const field = SNAPSHOT_FIELD[c.concept]
    const badGames = recentCompleted.filter(g => {
      const r = reviewsByGameId.get(g.id)
      const v = r ? (r as any)[field] : null
      return v != null && Number(v) <= 2.5
    })
    const gaInBad = badGames.reduce((s, g) => s + Number(g.goalsAgainst ?? 0), 0)
    if (gaInBad > 0) {
      const pct = Math.round((gaInBad / snapshotGA) * 100)
      if (pct >= 30) {
        hurtNarrative = `${pct}% of goals against came in games where ${c.concept} rated 2.5 or lower.`
      }
    }
  }
  const avgGF = recentCompleted.length ? snapshotGF / recentCompleted.length : 0
  const avgGA = recentCompleted.length ? snapshotGA / recentCompleted.length : 0

  const topInsights = analytics ? buildInsights(analytics).slice(0, 3) : []

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl heading-premium">{teamData.team?.name}</h1>
          <div className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {teamData.season?.name}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={() => navigate({ to: '/practices' })}>
            <Plus className="w-4 h-4" />
            Practice
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20 flex-1 md:flex-none" onClick={() => navigate({ to: '/games' })}>
            <Plus className="w-4 h-4" />
            Game
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Record</p>
            <p className="text-2xl font-bold text-foreground mt-1">{wins}-{losses}-{ties}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Practices Logged</p>
            <p className="text-2xl font-bold text-foreground mt-1">{completedPractices}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Games Played</p>
            <p className="text-2xl font-bold text-foreground mt-1">{completedGames.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Upcoming</p>
            <p className="text-2xl font-bold text-foreground mt-1">{upcomingPractices.length + upcomingGames.length}</p>
          </CardContent>
        </Card>
      </div>

      {topInsights.length > 0 && (
        <div className="mb-6">
          <InsightsStrip
            insights={topInsights}
            limit={3}
            onViewAll={() => navigate({ to: '/trends' })}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HypeCard
          className="md:col-span-2"
          nextGame={upcomingGames[0] ?? null}
          allGames={analytics?.games ?? games}
          allReviews={analytics?.reviews ?? []}
        />

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-primary" />
              Next Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!nextEvent ? (
              <EmptyState
                title="No upcoming activities"
                description="Schedule a practice or game to get started."
                className="py-4"
              />
            ) : nextEvent.kind === 'practice' ? (
              <button
                onClick={() => navigate({ to: '/practices/$practiceId', params: { practiceId: nextEvent.data.id } })}
                className="w-full text-left space-y-2 hover:bg-secondary/40 p-3 -m-3 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Practice</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{nextEvent.data.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(nextEvent.data.date), 'EEE, MMM d')}
                </p>
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: '/games/$gameId', params: { gameId: nextEvent.data.id } })}
                className="w-full text-left space-y-2 hover:bg-secondary/40 p-3 -m-3 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Game</span>
                </div>
                <p className="font-semibold text-sm text-foreground">vs. {nextEvent.data.opponent}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(nextEvent.data.date), 'EEE, MMM d')} · {nextEvent.data.location === 'home' ? 'Home' : 'Away'}
                </p>
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingPractices.length === 0 && upcomingGames.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nothing scheduled.</p>
            ) : (
              [...upcomingPractices.map(p => ({ kind: 'practice' as const, data: p })),
                ...upcomingGames.map(g => ({ kind: 'game' as const, data: g }))]
                .sort((a, b) => a.data.date.localeCompare(b.data.date))
                .slice(0, 5)
                .map(ev =>
                  ev.kind === 'practice' ? (
                    <button
                      key={`p-${ev.data.id}`}
                      onClick={() => navigate({ to: '/practices/$practiceId', params: { practiceId: ev.data.id } })}
                      className="w-full flex items-center gap-3 p-2 rounded-md bg-secondary/40 hover:bg-secondary/60 transition-colors text-left"
                    >
                      <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ev.data.title}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(ev.data.date), 'EEE, MMM d')}</p>
                      </div>
                    </button>
                  ) : (
                    <button
                      key={`g-${ev.data.id}`}
                      onClick={() => navigate({ to: '/games/$gameId', params: { gameId: ev.data.id } })}
                      className="w-full flex items-center gap-3 p-2 rounded-md bg-secondary/40 hover:bg-secondary/60 transition-colors text-left"
                    >
                      <Swords className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">vs. {ev.data.opponent}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(ev.data.date), 'EEE, MMM d')} · {ev.data.location === 'home' ? 'Home' : 'Away'}</p>
                      </div>
                    </button>
                  )
                )
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-primary" />
                  Team Snapshot
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Rolling form over the last {recentCompleted.length || 'few'} game{recentCompleted.length === 1 ? '' : 's'}.
                </CardDescription>
              </div>
              <button
                onClick={() => navigate({ to: '/trends' })}
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5 shrink-0 mt-1"
              >
                Full trends <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCompleted.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Play and review a game to see your rolling form here.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-secondary/40 border border-border/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Record</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xl font-bold tabular-nums text-emerald-400">{snapshotW}</span>
                      <span className="text-xs text-muted-foreground">W</span>
                      <span className="text-xl font-bold tabular-nums text-red-400">{snapshotL}</span>
                      <span className="text-xs text-muted-foreground">L</span>
                      {snapshotT > 0 && (
                        <>
                          <span className="text-xl font-bold tabular-nums text-muted-foreground">{snapshotT}</span>
                          <span className="text-xs text-muted-foreground">T</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1.5 flex gap-0.5">
                      {recentCompleted.slice().reverse().map(g => {
                        const gf = Number(g.goalsFor)
                        const ga = Number(g.goalsAgainst)
                        const r = gf > ga ? 'W' : gf < ga ? 'L' : 'T'
                        return (
                          <span
                            key={g.id}
                            title={`${g.opponent}: ${gf}–${ga}`}
                            className={cn(
                              'flex-1 h-1.5 rounded-sm',
                              r === 'W' && 'bg-emerald-500',
                              r === 'L' && 'bg-red-500',
                              r === 'T' && 'bg-muted-foreground/40',
                            )}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-md bg-secondary/40 border border-border/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Goals (avg)</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold tabular-nums text-foreground">{avgGF.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">for</span>
                      <span className="text-xl font-bold tabular-nums text-foreground">{avgGA.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">against</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                      Total: {snapshotGF}–{snapshotGA} ({snapshotGF - snapshotGA >= 0 ? '+' : ''}{snapshotGF - snapshotGA})
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">What's working</p>
                  </div>
                  {working.length ? (
                    <ul className="space-y-1">
                      {working.map(c => (
                        <li key={c.concept} className="text-xs text-foreground flex items-center justify-between gap-2">
                          <span className="font-medium">{c.concept}</span>
                          <span className="text-emerald-400 tabular-nums font-semibold">
                            {c.avg.toFixed(1)}/5
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No concept is consistently grading 3.5+ yet — keep reviewing games to find the bright spots.
                    </p>
                  )}
                </div>

                <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-400">What's hurting you</p>
                  </div>
                  {hurting.length ? (
                    <>
                      <ul className="space-y-1">
                        {hurting.map(c => (
                          <li key={c.concept} className="text-xs text-foreground flex items-center justify-between gap-2">
                            <span className="font-medium">{c.concept}</span>
                            <span className="text-red-400 tabular-nums font-semibold">
                              {c.avg.toFixed(1)}/5
                            </span>
                          </li>
                        ))}
                      </ul>
                      {hurtNarrative && (
                        <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
                          {hurtNarrative}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nothing is grading below 2.7 — no clear weak spot in the recent window.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-primary" />
                Concept Trends
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Latest combined practice + game ratings, sorted by priority.
              </CardDescription>
            </div>
            <button
              onClick={() => navigate({ to: '/concepts' })}
              className="text-[11px] text-primary hover:underline flex items-center gap-0.5 shrink-0 mt-1"
            >
              View all concepts <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const priorityList: string[] = teamData.season?.priorityConcepts
              ? JSON.parse(teamData.season.priorityConcepts)
              : []
            const allSummaries = analytics
              ? Object.values(analytics.byConcept)
              : []
            const sorted = [...allSummaries].sort((a, b) => {
              const ap = priorityList.includes(a.concept) ? 0 : 1
              const bp = priorityList.includes(b.concept) ? 0 : 1
              if (ap !== bp) return ap - bp
              return (b.latestAvg ?? 0) - (a.latestAvg ?? 0)
            })

            if (!sorted.length) {
              return (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Loading concept analytics…
                </p>
              )
            }

            const hasAnyData = sorted.some(s => s.latestAvg != null)
            if (!hasAnyData) {
              return (
                <EmptyState
                  title="No ratings yet"
                  description="Rate practice segments or game performance to populate trends."
                  className="py-4"
                />
              )
            }

            return (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {sorted.map(s => {
                  const isPriority = priorityList.includes(s.concept)
                  const trendUp = s.trend > 0.2
                  const trendDown = s.trend < -0.2
                  return (
                    <button
                      key={s.concept}
                      onClick={() => navigate({ to: '/concepts' })}
                      className={cn(
                        'text-left rounded-md border p-3 transition-colors hover:bg-secondary/40',
                        isPriority ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-background'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-foreground truncate">{s.concept}</p>
                            {isPriority && (
                              <Badge className="bg-primary/15 text-primary border-primary/25 border text-[9px] px-1.5 py-0 h-4">
                                P
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {s.practicePoints} prac · {s.gamePoints} games
                          </p>
                        </div>
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {s.latestAvg != null ? s.latestAvg.toFixed(1) : '—'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[10px]">
                        {trendUp && <><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 font-mono">+{s.trend.toFixed(1)}</span></>}
                        {trendDown && <><TrendingDown className="w-3 h-3 text-red-400" /><span className="text-red-400 font-mono">{s.trend.toFixed(1)}</span></>}
                        {!trendUp && !trendDown && <><Minus className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground font-mono">steady</span></>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
