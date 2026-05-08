import { useAuth } from './hooks/useAuth'
import { 
  LoadingOverlay, 
  Toaster
} from '@blinkdotnew/ui'
import { SharedAppLayout } from './layouts/shared-app-layout'
import { isDemoMode } from './hooks/useDemoData'
import { useEffect } from 'react'
import { startTour } from './tour'
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import DashboardPage from './pages/DashboardPage'
import OnboardingPage from './pages/OnboardingPage'
import LandingPage from './pages/LandingPage'
import PracticesPage from './pages/PracticesPage'
import PracticeDetailPage from './pages/PracticeDetailPage'
import GamesPage from './pages/GamesPage'
import GameDetailPage from './pages/GameDetailPage'
import BenchModePage from './pages/BenchModePage'
import CalendarPage from './pages/CalendarPage'
import ConceptsPage from './pages/ConceptsPage'
import TrendsPage from './pages/TrendsPage'
import OpponentsPage from './pages/OpponentsPage'
import SettingsPage from './pages/SettingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SimulationPage from './pages/SimulationPage'

import RosterPage from './pages/RosterPage'
import DrillLibraryPage from './pages/DrillLibraryPage'
import CoachBoardPage from './pages/CoachBoardPage'

// --- Routes ---

const rootRoute = createRootRoute({
  component: () => (
    <SharedAppLayout appName="Blue Line IQ">
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

const benchModeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/$gameId/bench',
  component: BenchModePage,
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

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const simulationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/simulation',
  component: SimulationPage,
})

const rosterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/roster',
  component: RosterPage,
})

const drillsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/drills',
  component: DrillLibraryPage,
})

const coachBoardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/coaches-board',
  component: CoachBoardPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute, 
  onboardingRoute,
  calendarRoute,
  practicesRoute,
  practiceDetailRoute,
  gamesRoute,
  gameDetailRoute,
  benchModeRoute,
  opponentsRoute,
  conceptsRoute,
  trendsRoute,
  analyticsRoute,
  rosterRoute,
  drillsRoute,
  coachBoardRoute,
  simulationRoute,
  settingsRoute
])
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  const { user, isLoading } = useAuth()
  const demoActive = isDemoMode()

  useEffect(() => {
    if (!user && !demoActive) return
    
    const hasSeenTour = localStorage.getItem('blue-line-iq-tour-seen') === 'true'
    if (hasSeenTour) return

    const timer = setTimeout(() => {
      startTour((path) => router.navigate({ to: path as any }))
    }, 1000)
    return () => clearTimeout(timer)
  }, [user, demoActive])

  if (isLoading && !demoActive) return <LoadingOverlay show />

  if (!user && !demoActive) {
    return (
      <>
        <LandingPage />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}