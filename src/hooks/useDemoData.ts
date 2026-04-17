import { useState, useCallback } from 'react'
import type { Team, Season, Practice, PracticeSegment, Game, GameReview, SeasonMember, Invitation } from '../types'
import { subDays, format } from 'date-fns'

const DEMO_TEAM_ID = 'demo-team'
const DEMO_SEASON_ID = 'demo-season'

export const DEMO_TEAM: Team = {
  id: DEMO_TEAM_ID,
  name: 'Chicago Blackhawks (Demo)',
  userId: 'demo-user',
  createdAt: new Date().toISOString(),
}

export const DEMO_SEASON: Season = {
  id: DEMO_SEASON_ID,
  teamId: DEMO_TEAM_ID,
  name: '2026 Pro Season',
  startDate: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
  endDate: format(subDays(new Date(), -120), 'yyyy-MM-dd'),
  priorityConcepts: JSON.stringify(['Breakouts', 'Forecheck', 'Defensive Zone']),
  createdAt: new Date().toISOString(),
}

// ── Practices ───────────────────────────────────────────────────────────────
export const DEMO_PRACTICES: Practice[] = [
  {
    id: 'demo-prac-1',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    title: 'Defensive Zone & Breakout Precision',
    notes: 'Focusing on clean exits and strong net-front presence.',
    status: 'reviewed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-prac-2',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    title: 'High-Tempo Transitions',
    notes: 'Pushing the pace on line changes and counter-attacks.',
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-prac-3',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), -3), 'yyyy-MM-dd'),
    title: 'Game Day Prep (Upcoming)',
    notes: 'Light skate, special teams work.',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  }
]

export const DEMO_SEGMENTS: PracticeSegment[] = [
  {
    id: 'demo-seg-1',
    practiceId: 'demo-prac-1',
    type: 'Systems',
    name: 'Controlled Breakout D-to-D',
    primaryConcept: 'Breakouts',
    notes: 'Emphasis on the weak-side wing staying low.',
    fileUrl: 'https://images.unsplash.com/photo-1515703407324-5f753eed23eda?q=80&w=800&auto=format&fit=crop',
    understandingRating: 4,
    executionRating: 3,
    transferRating: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-seg-2',
    practiceId: 'demo-prac-1',
    type: 'Skill',
    name: 'Neutral Zone Regroups',
    primaryConcept: 'Transition',
    notes: 'Quick passes to the D and immediate support.',
    fileUrl: 'https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?q=80&w=800&auto=format&fit=crop',
    understandingRating: 5,
    executionRating: 5,
    transferRating: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-seg-3',
    practiceId: 'demo-prac-2',
    type: 'Skating',
    name: 'Edge Work & Tight Turns',
    primaryConcept: 'Skating',
    notes: 'High speed turns around the dots.',
    fileUrl: 'https://images.unsplash.com/photo-1547113110-3886b6a03194?q=80&w=800&auto=format&fit=crop',
    understandingRating: 4,
    executionRating: 4,
    transferRating: 5,
    createdAt: new Date().toISOString(),
  }
]

// ── Games ──────────────────────────────────────────────────────────────────
export const DEMO_GAMES: Game[] = [
  {
    id: 'demo-game-1',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    opponent: 'Boston Bruins',
    location: 'away',
    goalsFor: 3,
    goalsAgainst: 2,
    status: 'reviewed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-game-2',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), 4), 'yyyy-MM-dd'),
    opponent: 'New York Rangers',
    location: 'home',
    goalsFor: 4,
    goalsAgainst: 1,
    status: 'reviewed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-game-3',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    opponent: 'Detroit Red Wings',
    location: 'home',
    goalsFor: 1,
    goalsAgainst: 5,
    status: 'reviewed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-game-4',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), -7), 'yyyy-MM-dd'),
    opponent: 'Toronto Maple Leafs',
    location: 'home',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-game-5',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    opponent: 'Toronto Maple Leafs',
    location: 'away',
    goalsFor: 2,
    goalsAgainst: 4,
    status: 'reviewed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-game-6',
    seasonId: DEMO_SEASON_ID,
    date: format(subDays(new Date(), 28), 'yyyy-MM-dd'),
    opponent: 'Toronto Maple Leafs',
    location: 'home',
    goalsFor: 5,
    goalsAgainst: 2,
    status: 'reviewed',
    createdAt: new Date().toISOString(),
  }
]

export const DEMO_REVIEWS: GameReview[] = [
  {
    id: 'demo-rev-1',
    gameId: 'demo-game-1',
    breakoutsRating: 4,
    forecheckRating: 5,
    defensiveZoneRating: 2,
    transitionRating: 4,
    passingRating: 3,
    skatingRating: 5,
    notes: 'Great energy on the forecheck, but defensive breakdowns cost us late.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-rev-2',
    gameId: 'demo-game-2',
    breakoutsRating: 5,
    forecheckRating: 4,
    defensiveZoneRating: 5,
    transitionRating: 5,
    passingRating: 4,
    skatingRating: 4,
    notes: 'Our most complete game of the season. Everything clicked.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-rev-3',
    gameId: 'demo-game-3',
    breakoutsRating: 2,
    forecheckRating: 3,
    defensiveZoneRating: 1,
    transitionRating: 2,
    passingRating: 2,
    skatingRating: 3,
    notes: 'Slow start and never recovered. D-zone was a mess.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-rev-4',
    gameId: 'demo-game-5',
    breakoutsRating: 3,
    forecheckRating: 4,
    defensiveZoneRating: 2,
    transitionRating: 3,
    passingRating: 4,
    skatingRating: 4,
    notes: 'Competitive game, but struggled to clear the zone under pressure. Toronto exploited our weak side D-to-D passes.',
    opponentNotes: 'High pressure forecheck, very fast transition. Watch out for #34 in the slot.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-rev-5',
    gameId: 'demo-game-6',
    breakoutsRating: 5,
    forecheckRating: 5,
    defensiveZoneRating: 4,
    transitionRating: 4,
    passingRating: 5,
    skatingRating: 5,
    notes: 'Dominant performance. Controlled the neutral zone and limited their odd-man rushes.',
    opponentNotes: 'Struggles when we play physical in their corners. Keep the pressure on their young D pair.',
    createdAt: new Date().toISOString(),
  }
]

export const DEMO_MEMBERS: SeasonMember[] = [
  {
    id: 'demo-mem-1',
    seasonId: DEMO_SEASON_ID,
    userId: 'demo-user',
    role: 'owner',
    displayName: 'Head Coach (Demo)',
    email: 'coach@blackhawks.demo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-mem-2',
    seasonId: DEMO_SEASON_ID,
    userId: 'demo-asst-1',
    role: 'assistant',
    displayName: 'Assistant Coach',
    email: 'asst@blackhawks.demo',
    createdAt: new Date().toISOString(),
  }
]

export const DEMO_INVITATIONS: Invitation[] = [
  {
    id: 'demo-inv-1',
    seasonId: DEMO_SEASON_ID,
    email: 'scout@nhl.com',
    role: 'viewer',
    token: 'demo-token-1',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
]

// ── Hook for managing Demo state ────────────────────────────────────────────

const DEMO_KEY = 'demo_mode'

export function isDemoMode() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEMO_KEY) === 'true'
}

export function useDemoMode() {
  const [isDemo, setIsDemo] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DEMO_KEY) === 'true'
  })

  const enterDemo = useCallback(() => {
    localStorage.setItem(DEMO_KEY, 'true')
    setIsDemo(true)
    // Clear selection so the demo team becomes the default
    localStorage.removeItem('selected_team_id')
    window.location.href = '/'
  }, [])

  const exitDemo = useCallback(() => {
    localStorage.removeItem(DEMO_KEY)
    setIsDemo(false)
    window.location.href = '/'
  }, [])

  return { isDemo, enterDemo, exitDemo }
}