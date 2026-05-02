import { Player } from '@/types'

export interface GameEvent {
  id: string
  type: 'goal_for' | 'goal_against' | 'shot_for' | 'shot_against' | 'tactical_plus' | 'tactical_minus'
  timestamp: number
  label: string
  concept?: string
  playerId?: string
  scorerId?: string
  assist1Id?: string
  assist2Id?: string
  onIcePlayerIds?: string[]
}

export interface PlayerSessionStats {
  goals: number
  assists: number
  plusMinus: number
}
