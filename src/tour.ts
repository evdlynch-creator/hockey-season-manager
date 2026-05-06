import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

interface TourStep {
  element: string;
  title: string;
  description: string;
  path: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  isFinal?: boolean;
}

export function startTour(navigate: (path: string) => void) {
  const tourSteps: TourStep[] = [
    {
      element: '#tour-dashboard',
      title: 'Dashboard',
      description: 'Your coaching command center. See upcoming games, current record, and how your team is trending across recent games, all in one high-velocity view.',
      path: '/',
      side: 'right'
    },
    {
      element: '#tour-snapshot',
      title: 'Team snapshot',
      description: 'This rolling snapshot shows how your team is performing across your most important concepts over the last several games. Spot momentum shifts before they become problems.',
      path: '/',
      side: 'left'
    },
    {
      element: '#tour-calendar',
      title: 'Calendar',
      description: 'Keep your season organized. Practices, games, and key dates all in one view so nothing slips through.',
      path: '/calendar',
      side: 'right'
    },
    {
      element: '#tour-practice',
      title: 'Practice planning',
      description: 'Build and manage practice plans directly in the app. Tie every drill back to the concepts you are developing so your sessions always connect to your bigger picture.',
      path: '/practices',
      side: 'right'
    },
    {
      element: '#tour-games',
      title: 'Games tab',
      description: 'Review every game with aggregated concept ratings. See exactly where your team executed and where you left points on the ice.',
      path: '/games',
      side: 'right'
    },
    {
      element: '#tour-opponents',
      title: 'Opponents tab',
      description: 'Prepare for rematches with data. See how your concepts performed against each opponent and build a game plan grounded in real history.',
      path: '/opponents',
      side: 'right'
    },
    {
      element: '#tour-analytics-kpis',
      title: 'Analytics',
      description: 'Deep dive into your season performance. Track win rates, goal differentials, and tactical momentum to see exactly how your team is trending.',
      path: '/analytics',
      side: 'bottom'
    },
    {
      element: '#tour-concepts',
      title: 'Concepts tab',
      description: 'Track how each core concept is developing across both practices and games. This is where you see whether your coaching is actually moving the needle.',
      path: '/concepts',
      side: 'right'
    },
    {
      element: '#tour-trends',
      title: 'Trends tab',
      description: 'Your full season in one view. Identify what is working, what needs attention, and how far your team has come since day one.',
      path: '/trends',
      side: 'right',
      isFinal: true
    }
  ]

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(0, 0, 0, 0.75)',
    stageRadius: 4,
    popoverClass: 'custom-driver-theme',
    onDestroyStarted: () => {
      localStorage.setItem('blue-line-iq-tour-seen', 'true')
      driverObj.destroy()
    },
    steps: tourSteps.map((step, index) => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side,
        align: 'start',
        onNextClick: () => {
          if (step.isFinal) {
            localStorage.setItem('blue-line-iq-tour-seen', 'true')
            window.location.href = '/signup'
          } else {
            driverObj.moveNext()
          }
        }
      }
    })),
    onHighlightStarted: (element, step, { stageValue }) => {
      // Handle navigation
      const stepIndex = driverObj.getActiveIndex()
      if (stepIndex !== undefined) {
        const config = tourSteps[stepIndex]
        if (config && window.location.pathname !== config.path) {
          navigate(config.path)
        }
      }
    }
  })

  driverObj.drive()
}
