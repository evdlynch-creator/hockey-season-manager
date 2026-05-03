export interface Team {
  id: string
  name: string
  userId: string
  createdAt: string
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
}

export interface Season {
  id: string
  teamId: string
  name: string
  startDate: string
  endDate: string
  priorityConcepts: string // JSON string
  createdAt: string
}

export type SeasonRole = 'owner' | 'assistant' | 'viewer'

export interface SeasonMember {
  id: string
  seasonId: string
  userId: string
  role: SeasonRole
  createdAt: string
  email: string
  displayName: string
}

export interface Invitation {
  id: string
  seasonId: string
  userId?: string
  email: string
  role: SeasonRole
  token: string
  status: 'pending' | 'accepted'
  createdAt: string
}

export interface Practice {
  id: string
  seasonId: string
  date: string
  practiceTime?: string
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
  gameTime?: string
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
  zoneEntryRating?: number
  offensiveZoneRating?: number
  passingRating?: number
  skatingRating?: number
  notes?: string
  opponentNotes?: string
  createdAt: string
  userId: string
}

export interface Player {
  id: string
  seasonId: string
  name: string
  number?: string
  position?: string
  notes?: string
  createdAt: string
  userId: string
}

export interface Lineup {
  id: string
  gameId: string
  playerId: string
  unit: string
  position?: string
  userId: string
  createdAt: string
}

export interface Formation {
  id: string
  name: string
  seasonId: string
  userId: string
  createdAt: string
}

export interface FormationAssignment {
  id: string
  formationId: string
  playerId: string
  unit: string
  position?: string
  userId: string
  createdAt: string
}

export const CONCEPTS = [
  'Breakouts',
  'Forecheck',
  'Defensive Zone',
  'Zone Entry',
  'Offensive Zone',
  'Passing',
  'Skating',
] as const
export type Concept = typeof CONCEPTS[number]

export const SEGMENT_TYPES = ['Skating', 'Skill', 'Systems', 'Small Area'] as const
export type SegmentType = typeof SEGMENT_TYPES[number]

export const PRACTICE_STATUSES = ['draft', 'scheduled', 'completed', 'reviewed'] as const
export const GAME_STATUSES = ['scheduled', 'completed', 'reviewed'] as const

export type CoachMessageContext = 'general' | 'practice' | 'game'

export interface CoachMessage {
  id: string
  teamId: string
  userId: string
  content: string
  contextType: CoachMessageContext
  contextId: string | null
  userDisplayName?: string
  metadata?: string // JSON string for rich content like linked practices or line combinations
  createdAt: string
}
