export type TeamPlan = 'beta_free' | 'pro'

export interface Team {
  id: string
  name: string
  userId: string
  createdAt: string
  plan?: TeamPlan | null
  seatLimit?: number | null
}

export type TeamMemberRole = 'owner' | 'coach'
export type TeamMemberStatus = 'active' | 'pending'

export interface TeamMember {
  id: string
  teamId: string
  userId?: string | null
  email: string
  role: TeamMemberRole
  status: TeamMemberStatus
  invitedBy?: string | null
  invitedByName?: string | null
  createdAt: string
  updatedAt?: string | null
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
