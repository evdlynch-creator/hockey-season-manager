export interface Team {
  id: string
  name: string
  userId: string
  createdAt: string
}

export interface Season {
  id: string
  teamId: string
  name: string
  startDate: string
  endDate: string
  priorityConcepts: string
  createdAt: string
}

export interface Practice {
  id: string
  seasonId: string
  date: string
  title: string
  notes?: string
  status: 'draft' | 'scheduled' | 'completed' | 'reviewed'
  createdAt: string
}

export interface PracticeSegment {
  id: string
  practiceId: string
  type: 'Skating' | 'Skill' | 'Systems' | 'Small Area'
  name?: string
  primaryConcept: string
  secondaryConcept?: string
  notes?: string
  link?: string
  fileUrl?: string
  understandingRating?: number
  executionRating?: number
  transferRating?: number
  createdAt: string
}

export interface Game {
  id: string
  seasonId: string
  date: string
  opponent: string
  location: 'home' | 'away'
  goalsFor?: number
  goalsAgainst?: number
  penalties?: string
  shotsFor?: number
  shotsAgainst?: number
  status: 'scheduled' | 'completed' | 'reviewed'
  createdAt: string
}

export interface GameReview {
  id: string
  gameId: string
  breakoutsRating?: number
  forecheckRating?: number
  defensiveZoneRating?: number
  transitionRating?: number
  passingRating?: number
  skatingRating?: number
  notes?: string
  opponentNotes?: string
  createdAt: string
}

export const CONCEPTS = [
  'Breakouts',
  'Forecheck',
  'Defensive Zone',
  'Transition',
  'Passing',
  'Skating',
] as const
export type Concept = typeof CONCEPTS[number]

export const SEGMENT_TYPES = ['Skating', 'Skill', 'Systems', 'Small Area'] as const
export type SegmentType = typeof SEGMENT_TYPES[number]

export const PRACTICE_STATUSES = ['draft', 'scheduled', 'completed', 'reviewed'] as const
export const GAME_STATUSES = ['scheduled', 'completed', 'reviewed'] as const
