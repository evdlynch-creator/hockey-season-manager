import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'

export function startTour() {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: {
        enabled: true
      },
      classes: 'custom-shepherd-theme',
      scrollTo: { behavior: 'smooth', block: 'center' }
    }
  })

  const commonButtons = [
    {
      text: 'Skip tour',
      action: tour.cancel,
      classes: 'shepherd-button-secondary'
    },
    {
      text: 'Next',
      action: tour.next,
      classes: 'shepherd-button-primary'
    }
  ]

  tour.addStep({
    id: 'dashboard',
    title: 'Dashboard',
    text: 'Your coaching command center. See upcoming games, current record, and how your team is trending across recent games, all in one high-velocity view.',
    attachTo: {
      element: '#tour-dashboard',
      on: 'right'
    },
    buttons: commonButtons
  })

  tour.addStep({
    id: 'snapshot',
    title: 'Team snapshot',
    text: 'This rolling snapshot shows how your team is performing across your most important concepts over the last several games. Spot momentum shifts before they become problems.',
    attachTo: {
      element: '#tour-snapshot',
      on: 'left'
    },
    buttons: commonButtons
  })

  tour.addStep({
    id: 'calendar',
    title: 'Calendar',
    text: 'Keep your season organized. Practices, games, and key dates all in one view so nothing slips through.',
    attachTo: {
      element: '#tour-calendar',
      on: 'right'
    },
    buttons: commonButtons
  })

  tour.addStep({
    id: 'practice',
    title: 'Practice planning',
    text: 'Build and manage practice plans directly in the app. Tie every drill back to the concepts you are developing so your sessions always connect to your bigger picture.',
    attachTo: {
      element: '#tour-practice',
      on: 'right'
    },
    buttons: commonButtons
  })

  tour.addStep({
    id: 'games',
    title: 'Games tab',
    text: 'Review every game with aggregated concept ratings. See exactly where your team executed and where you left points on the ice.',
    attachTo: {
      element: '#tour-games',
      on: 'right'
    },
    buttons: commonButtons
  })

  tour.addStep({
    id: 'opponents',
    title: 'Opponents tab',
    text: 'Prepare for rematches with data. See how your concepts performed against each opponent and build a game plan grounded in real history.',
    attachTo: {
      element: '#tour-opponents',
      on: 'right'
    },
    buttons: commonButtons
  })

  tour.addStep({
    id: 'concepts',
    title: 'Concepts tab',
    text: 'Track how each core concept is developing across both practices and games. This is where you see whether your coaching is actually moving the needle.',
    attachTo: {
      element: '#tour-concepts',
      on: 'right'
    },
    buttons: commonButtons
  })

  tour.addStep({
    id: 'trends',
    title: 'Trends tab',
    text: 'Your full season in one view. Identify what is working, what needs attention, and how far your team has come since day one.',
    attachTo: {
      element: '#tour-trends',
      on: 'right'
    },
    buttons: [
      {
        text: 'Start free trial',
        action: () => {
          window.location.href = '/signup'
        },
        classes: 'shepherd-button-primary'
      }
    ]
  })

  tour.start()
}
