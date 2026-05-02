import { z } from 'zod'

export const gameSchema = z.object({
  opponent: z.string().min(1, 'Opponent is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.enum(['home', 'away']),
  status: z.enum(['scheduled', 'completed', 'reviewed']),
  gameType: z.enum(['league', 'tournament', 'exhibition']),
  tournamentName: z.string().optional(),
})

export type GameForm = z.infer<typeof gameSchema>
