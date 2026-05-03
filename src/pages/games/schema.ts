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

export const CONCEPT_FIELDS: { key: string; label: string }[] = [
  { key: 'breakoutsRating', label: 'Breakouts' },
  { key: 'forecheckRating', label: 'Forecheck' },
  { key: 'defensiveZoneRating', label: 'Defensive Zone' },
  { key: 'zoneEntryRating', label: 'Zone Entry' },
  { key: 'offensiveZoneRating', label: 'Offensive Zone' },
  { key: 'passingRating', label: 'Passing' },
  { key: 'skatingRating', label: 'Skating' },
]
