import { useAuth } from './hooks/useAuth'
import { useTeam } from './hooks/useTeam'
import { blink } from './blink/client'
import { cn } from '@/lib/utils'
import { 
  Button, 
  LoadingOverlay, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Input,
  Field,
  FieldLabel,
  FieldError,
  Badge,
  toast,
  EmptyState
} from '@blinkdotnew/ui'
import { LayoutDashboard, LogIn, Plus, Rocket, Target, Calendar as CalendarIcon, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SharedAppLayout } from './layouts/shared-app-layout'
import { useState, useEffect } from 'react'
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PracticesPage from './pages/PracticesPage'
import PracticeDetailPage from './pages/PracticeDetailPage'
import GamesPage from './pages/GamesPage'
import GameDetailPage from './pages/GameDetailPage'
import CalendarPage from './pages/CalendarPage'
import ConceptsPage from './pages/ConceptsPage'
import TrendsPage from './pages/TrendsPage'
import OpponentsPage from './pages/OpponentsPage'
import { usePractices } from './hooks/usePractices'
import { useGames } from './hooks/useGames'
import { useAnalytics } from './hooks/useAnalytics'
import { format, isAfter, parseISO } from 'date-fns'
import { ClipboardList, Swords, ChevronRight } from 'lucide-react'

const CONCEPTS = [
  'Breakouts',
  'Forecheck',
  'Defensive Zone',
  'Transition',
  'Passing',
  'Skating'
]

const onboardingSchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
  seasonName: z.string().min(1, 'Season name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  concepts: z.array(z.string()).min(3, 'Select at least 3 concepts').max(5, 'Select at most 5 concepts'),
})

type OnboardingData = z.infer<typeof onboardingSchema>

// --- Routes ---

const rootRoute = createRootRoute({
  component: () => (
    <SharedAppLayout appName="Inside Edge">
      <Outlet />
    </SharedAppLayout>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
})

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarPage,
})

const practicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/practices',
  component: PracticesPage,
})

const practiceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/practices/$practiceId',
  component: PracticeDetailPage,
})

const gamesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games',
  component: GamesPage,
})

const gameDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/$gameId',
  component: GameDetailPage,
})

const opponentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/opponents',
  component: OpponentsPage,
})

const conceptsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/concepts',
  component: ConceptsPage,
})

const trendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trends',
  component: TrendsPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => <PlaceholderPage title="Settings" />,
})

const routeTree = rootRoute.addChildren([
  indexRoute, 
  onboardingRoute,
  calendarRoute,
  practicesRoute,
  practiceDetailRoute,
  gamesRoute,
  gameDetailRoute,
  opponentsRoute,
  conceptsRoute,
  trendsRoute,
  settingsRoute
])
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// --- Components ---

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">This feature is coming soon in Phase 2.</p>
    </div>
  )
}

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { data: teamData, isLoading, isFetching, isSuccess } = useTeam()
  const { data: practices = [] } = usePractices()
  const { data: games = [] } = useGames()
  const { data: analytics } = useAnalytics()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user && isSuccess && !isFetching && !teamData) {
      navigate({ to: '/onboarding', replace: true })
    }
  }, [teamData, isSuccess, isFetching, authLoading, user, navigate])

  if (authLoading || isLoading || !teamData) return <LoadingOverlay show />

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

  // Rematch prep: find opponents we've already played
  const pastOpponents = new Set(completedGames.map(g => g.opponent))
  const rematchGames = upcomingGames.filter(g => pastOpponents.has(g.opponent))

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{teamData.team.name}</h1>
          <div className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {teamData.season?.name}
            </Badge>
            <span>{teamData.season?.startDate} — {teamData.season?.endDate}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate({ to: '/practices' })}>
            <Plus className="w-4 h-4" />
            Practice
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => navigate({ to: '/games' })}>
            <Plus className="w-4 h-4" />
            Game
          </Button>
        </div>
      </div>

      {/* Quick stats */}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Season overview */}
        <Card className="md:col-span-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Season Overview
            </CardTitle>
            <CardDescription>Priority concepts this season.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {JSON.parse(teamData.season?.priorityConcepts || '[]').map((concept: string) => (
                <Badge key={concept} variant="secondary" className="px-3 py-1 bg-background border-border">
                  {concept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next activity */}
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

      {/* Upcoming & rematch prep */}
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
                  <Target className="w-4 h-4 text-primary" />
                  Rematch Prep
                </CardTitle>
                <CardDescription className="text-xs mt-1">Upcoming games vs. teams you've faced before.</CardDescription>
              </div>
              <button
                onClick={() => navigate({ to: '/opponents' })}
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5 shrink-0 mt-1"
              >
                Full history <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {rematchGames.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No rematches coming up.</p>
            ) : (
              rematchGames.map(g => {
                const past = completedGames.filter(c => c.opponent === g.opponent)
                const sortedPast = [...past].sort((a, b) => b.date.localeCompare(a.date))
                const lastGame = sortedPast[0]
                const gf = lastGame?.goalsFor != null ? Number(lastGame.goalsFor) : null
                const ga = lastGame?.goalsAgainst != null ? Number(lastGame.goalsAgainst) : null
                const result = gf != null && ga != null
                  ? (gf > ga ? 'W' : gf < ga ? 'L' : 'T')
                  : null
                const allWins = past.filter(c => Number(c.goalsFor) > Number(c.goalsAgainst)).length
                const allLosses = past.filter(c => Number(c.goalsFor) < Number(c.goalsAgainst)).length
                return (
                  <div
                    key={g.id}
                    className="rounded-md bg-secondary/30 border border-border/40 overflow-hidden"
                  >
                    <button
                      onClick={() => navigate({ to: '/games/$gameId', params: { gameId: g.id } })}
                      className="w-full flex items-start gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Swords className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">vs. {g.opponent}</p>
                          {result && (
                            <Badge className={cn(
                              'shrink-0 text-[10px] px-1.5 py-0 h-4',
                              result === 'W' && 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border',
                              result === 'L' && 'bg-red-600/20 text-red-400 border-red-600/30 border',
                              result === 'T' && 'bg-secondary',
                            )}>
                              Last: {result} {gf != null && ga != null ? `${gf}–${ga}` : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(parseISO(g.date), 'EEE, MMM d')} · {g.location === 'home' ? 'Home' : 'Away'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {past.length} prior meeting{past.length !== 1 ? 's' : ''} · Record: {allWins}W {allLosses}L
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </button>
                    <div className="flex border-t border-border/30">
                      <button
                        onClick={() => navigate({ to: '/opponents' })}
                        className="flex-1 py-1.5 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors font-medium uppercase tracking-wide"
                      >
                        View scout notes
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Concept trends summary */}
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: existingTeam, isFetching: teamFetching, isSuccess: teamSuccess } = useTeam()

  useEffect(() => {
    if (!authLoading && user && teamSuccess && !teamFetching && existingTeam) {
      navigate({ to: '/', replace: true })
    }
  }, [existingTeam, teamSuccess, teamFetching, authLoading, user, navigate])

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      concepts: []
    }
  })

  const selectedConcepts = watch('concepts')

  const mutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      if (!user) throw new Error('Not authenticated')

      const teamId = `team_${crypto.randomUUID().slice(0, 8)}`
      const seasonId = `season_${crypto.randomUUID().slice(0, 8)}`

      await blink.db.teams.create({
        id: teamId,
        name: data.teamName,
        userId: user.id
      })

      await blink.db.seasons.create({
        id: seasonId,
        teamId,
        name: data.seasonName,
        startDate: data.startDate,
        endDate: data.endDate,
        priorityConcepts: JSON.stringify(data.concepts)
      })

      return { teamId, seasonId }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['team'] })
      toast.success('Season setup complete!', { description: "You're ready to start coaching." })
      navigate({ to: '/', replace: true })
    },
    onError: (error: any) => {
      console.error('Season setup failed:', error)
      toast.error('Failed to set up season', { description: `${error?.name || 'Error'}: ${error?.message}` })
    }
  })

  const toggleConcept = (concept: string) => {
    const current = selectedConcepts
    if (current.includes(concept)) {
      setValue('concepts', current.filter(c => c !== concept), { shouldValidate: true })
    } else if (current.length < 5) {
      setValue('concepts', [...current, concept], { shouldValidate: true })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 animate-fade-in">
      <Card className="w-full max-w-2xl border-primary/10 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg shadow-primary/20">
            <Rocket className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl">Set up your season</CardTitle>
          <CardDescription className="text-base">
            Configure your team and pick the concepts you want to prioritize this season.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel>Team Name</FieldLabel>
                <Input {...register('teamName')} placeholder="e.g. Gotham Knights" />
                {errors.teamName && <FieldError>{errors.teamName.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel>Season Name</FieldLabel>
                <Input {...register('seasonName')} placeholder="e.g. 2026 Winter Season" />
                {errors.seasonName && <FieldError>{errors.seasonName.message}</FieldError>}
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Season Start
                </FieldLabel>
                <Input type="date" {...register('startDate')} />
                {errors.startDate && <FieldError>{errors.startDate.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Season End
                </FieldLabel>
                <Input type="date" {...register('endDate')} />
                {errors.endDate && <FieldError>{errors.endDate.message}</FieldError>}
              </Field>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Priority Concepts (3-5)
                </FieldLabel>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  {selectedConcepts.length} / 5 Selected
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CONCEPTS.map(concept => {
                  const isSelected = selectedConcepts.includes(concept)
                  return (
                    <button
                      key={concept}
                      type="button"
                      onClick={() => toggleConcept(concept)}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-center",
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                          : "bg-sidebar hover:bg-accent border-border text-muted-foreground"
                      )}
                    >
                      {concept}
                    </button>
                  )
                })}
              </div>
              {errors.concepts && <FieldError>{errors.concepts.message}</FieldError>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold gap-2 shadow-xl shadow-primary/20"
              disabled={isSubmitting || mutation.isPending}
            >
              {(isSubmitting || mutation.isPending) ? 'Setting up...' : 'Finalize Season Setup'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

const isInIframe = typeof window !== 'undefined' && window.self !== window.top

const authSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type AuthData = z.infer<typeof authSchema>

function EmbeddedSignInForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [authError, setAuthError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthData>({
    resolver: zodResolver(authSchema),
  })

  const onSubmit = async (data: AuthData) => {
    setAuthError(null)
    try {
      if (mode === 'signup') {
        await blink.auth.signUp({ email: data.email, password: data.password })
      } else {
        await blink.auth.signInWithEmail(data.email, data.password)
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please try again.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-primary/20">
            <LayoutDashboard className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Inside<span className="text-primary">Edge</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-center">
            {mode === 'signin' ? 'Sign in to your coaching account' : 'Create your coaching account'}
          </p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="coach@team.com"
                  autoComplete="email"
                />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                {errors.password && <FieldError>{errors.password.message}</FieldError>}
              </Field>

              {authError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {authError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full gap-2 font-bold shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting
                  ? mode === 'signin' ? 'Signing in...' : 'Creating account...'
                  : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setAuthError(null) }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function App() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    if (isInIframe) {
      return <EmbeddedSignInForm />
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="mb-10 flex flex-col items-center animate-fade-in">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20">
            <LayoutDashboard className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl text-foreground">
            Inside<span className="text-primary">Edge</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
            The platform built for hockey coaches who demand precision, tracking, and continuous improvement.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in delay-200">
          <Button 
            size="lg" 
            onClick={() => blink.auth.login(window.location.href)}
            className="gap-2 px-10 h-14 text-base font-bold shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <LogIn className="w-5 h-5" />
            Sign in as Coach
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-14 px-10 border-border/50 hover:bg-accent"
          >
            View Demo
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground mt-12 uppercase font-bold tracking-[0.2em] opacity-50">
          Built for the Elite · Season 2026
        </p>
      </div>
    )
  }

  return <RouterProvider router={router} />
}