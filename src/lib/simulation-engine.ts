import { blink } from '@/blink/client'
import { z } from 'zod'
import type { Player, Lineup, GameReview, PracticeSegment } from '@/types'

export const SimulationEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(), // Match clock seconds
  type: z.enum(['possession', 'shot', 'goal', 'penalty', 'turnover', 'check', 'tactical_move']),
  description: z.string(),
  involvedPlayerIds: z.array(z.string()),
  outcome: z.enum(['success', 'failure', 'neutral']),
  impactRating: z.number().min(1).max(5),
})

export type SimulationEvent = z.infer<typeof SimulationEventSchema>

export const SimulationResultSchema = z.object({
  scoreFor: z.number(),
  scoreAgainst: z.number(),
  summary: z.string(),
  keyTakeaway: z.string(),
  drillSuggestions: z.array(z.string()), // Names of concepts to focus on
  confidenceScore: z.number().min(0).max(1),
})

export type SimulationResult = z.infer<typeof SimulationResultSchema>

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

export async function simulateScenario({
  lineup,
  players,
  concept,
  scenario,
  historicalData,
}: SimulationParams, onEvent: (event: SimulationEvent) => void) {
  const playersMap = Object.fromEntries(players.map(p => [p.id, p]))
  
  // Format data for AI context
  const lineupsByUnit = lineup.reduce((acc, l) => {
    if (!acc[l.unit]) acc[l.unit] = []
    const p = playersMap[l.playerId]
    if (p) acc[l.unit].push(`${p.name} (#${p.number}, ${p.position})`)
    return acc
  }, {} as Record<string, string[]>)

  const tacticalContext = historicalData.reviews.slice(0, 5).map(r => ({
    date: r.created_at,
    notes: r.notes,
    ratings: {
      breakouts: r.breakouts_rating,
      forecheck: r.forecheck_rating,
      defensive: r.defensive_zone_rating,
    }
  }))

  const practiceContext = historicalData.practices.slice(0, 5).map(p => ({
    name: p.name,
    concept: p.primary_concept,
    rating: p.execution_rating,
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

  // We use streamObject to get structured events in real-time
  const { partialObjectStream } = await blink.ai.streamObject({
    model: 'google/gemini-3-flash',
    schema: z.object({
      events: z.array(SimulationEventSchema),
      result: SimulationResultSchema.optional(),
    }),
    prompt,
  })

  if (!partialObjectStream) {
    throw new Error('Failed to initialize simulation stream. Please check your connection or sign in again.')
  }

  let lastEventCount = 0
  for await (const partial of partialObjectStream) {
    if (partial.events && partial.events.length > lastEventCount) {
      const newEvents = partial.events.slice(lastEventCount)
      newEvents.forEach(e => {
        if (e && e.description && e.type) {
          onEvent(e as SimulationEvent)
        }
      })
      lastEventCount = partial.events.length
    }
    
    if (partial.result && partial.result.summary) {
      return partial.result as SimulationResult
    }
  }

  return null
}
