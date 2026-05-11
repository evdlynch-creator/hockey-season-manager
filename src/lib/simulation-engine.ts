import { blink } from '@/blink/client'
import type { Player, Lineup, GameReview, PracticeSegment } from '@/types'

export interface SimulationEvent {
  id: string
  timestamp: number // Match clock seconds
  type: 'possession' | 'shot' | 'goal' | 'penalty' | 'turnover' | 'check' | 'tactical_move'
  description: string
  involvedPlayerIds: string[]
  outcome: 'success' | 'failure' | 'neutral'
  impactRating: number // 1-5
}

export interface SimulationResult {
  scoreFor: number
  scoreAgainst: number
  summary: string
  keyTakeaway: string
  drillSuggestions: string[] // Names of concepts to focus on
  confidenceScore: number // 0-1
}

export interface SimulationParams {
  lineup: Lineup[]
  players: Player[]
  concept: string
  scenario: string
  historicalData: {
    reviews: GameReview[]
    practices: PracticeSegment[]
  }
}

const SIMULATION_SCHEMA = {
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          timestamp: { type: 'number' },
          type: { type: 'string', enum: ['possession', 'shot', 'goal', 'penalty', 'turnover', 'check', 'tactical_move'] },
          description: { type: 'string' },
          involvedPlayerIds: { type: 'array', items: { type: 'string' } },
          outcome: { type: 'string', enum: ['success', 'failure', 'neutral'] },
          impactRating: { type: 'number' }
        },
        required: ['id', 'timestamp', 'type', 'description', 'involvedPlayerIds', 'outcome', 'impactRating']
      }
    },
    result: {
      type: 'object',
      properties: {
        scoreFor: { type: 'number' },
        scoreAgainst: { type: 'number' },
        summary: { type: 'string' },
        keyTakeaway: { type: 'string' },
        drillSuggestions: { type: 'array', items: { type: 'string' } },
        confidenceScore: { type: 'number' }
      },
      required: ['scoreFor', 'scoreAgainst', 'summary', 'keyTakeaway', 'drillSuggestions', 'confidenceScore']
    }
  },
  required: ['events']
}

export async function simulateScenario({
  lineup,
  players,
  concept,
  scenario,
  historicalData,
}: SimulationParams, onEvent: (event: SimulationEvent) => void): Promise<SimulationResult | null> {
  const playersMap = Object.fromEntries(players.map(p => [p.id, p]))
  
  // Format data for AI context
  const lineupsByUnit = lineup.reduce((acc, l) => {
    if (!acc[l.unit]) acc[l.unit] = []
    const p = playersMap[l.playerId]
    if (p) acc[l.unit].push(`${p.name} (#${p.number}, ${p.position})`)
    return acc
  }, {} as Record<string, string[]>)

  const tacticalContext = historicalData.reviews.slice(0, 5).map(r => ({
    date: r.createdAt,
    notes: r.notes,
    ratings: {
      breakouts: r.breakoutsRating,
      forecheck: r.forecheckRating,
      defensive: r.defensiveZoneRating,
    }
  }))

  const practiceContext = historicalData.practices.slice(0, 5).map(p => ({
    name: p.name,
    concept: p.primaryConcept,
    rating: p.executionRating,
  }))

  const prompt = `
    You are the Blue Line IQ Game Simulator. 
    Simulate a hockey game scenario based on the following data:
    
    SCENARIO: ${scenario}
    PRIMARY TACTICAL FOCUS: ${concept}
    
    LINEUPS:
    ${JSON.stringify(lineupsByUnit, null, 2)}
    
    HISTORICAL PERFORMANCE (Game Reviews):
    ${JSON.stringify(tacticalContext, null, 2)}
    
    RECENT PRACTICE FOCUS:
    ${JSON.stringify(practiceContext, null, 2)}
    
    TASKS:
    1. Generate a realistic sequence of 5-8 play-by-play events that would likely occur given the team's historical strengths and weaknesses.
    2. Ensure the events are chronologically ordered.
    3. Use the player names provided in the lineups.
    4. Provide a final result summary including score and drill suggestions.
  `

  let lastEventCount = 0
  let finalResult: SimulationResult | null = null

  await blink.ai.streamObject({
    model: 'google/gemini-3-flash',
    schema: SIMULATION_SCHEMA as any,
    prompt,
  }, (partial: any) => {
    if (partial.events && partial.events.length > lastEventCount) {
      const newEvents = partial.events.slice(lastEventCount)
      newEvents.forEach((e: any) => {
        // Only report if it has the core fields
        if (e && e.id && e.description && e.type) {
          onEvent(e as SimulationEvent)
        }
      })
      lastEventCount = partial.events.length
    }
    
    if (partial.result && partial.result.summary) {
      finalResult = partial.result as SimulationResult
    }
  })

  return finalResult
}
