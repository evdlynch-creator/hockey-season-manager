import type { Game, GameReview } from '@/types'

export interface OpponentStats {
  name: string
  games: Game[]
  reviews: GameReview[]
  wins: number
  losses: number
  ties: number
  totalGoalsFor: number
  totalGoalsAgainst: number
  avgConceptRatings: Record<string, number | null>
  notes: string[]
  lastPlayed: string | null
  nextGame: Game | null
}

export type ConceptTier = { concept: string; avg: number; samples: number }

export interface CoachingPlanData {
  reinforce: ConceptTier[]
  address: ConceptTier[]
  mixed: ConceptTier[]
  trend: 'up' | 'down' | 'steady' | 'unknown'
  trendDelta: number
  reviewedCount: number
  goalsForAvg: number | null
  goalsAgainstAvg: number | null
  observations: { date: string; gameId: string; note: string }[]
}
