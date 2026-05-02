import { useAuth } from './hooks/useAuth'
import { 
  LoadingOverlay, 
  Toaster
} from '@blinkdotnew/ui'
import { SharedAppLayout } from './layouts/shared-app-layout'
import { isDemoMode } from './hooks/useDemoData'
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
import CalendarPage from './pages/CalendarPage'
import ConceptsPage from './pages/ConceptsPage'
import TrendsPage from './pages/TrendsPage'
import OpponentsPage from './pages/OpponentsPage'
import TeamMembersPage from './pages/TeamMembersPage'
import SettingsPage from './pages/SettingsPage'

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
  component: SettingsPage,
})

const teamMembersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/team',
  component: TeamMembersPage,
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
  teamMembersRoute,
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