import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import type { Lineup } from '../types'

export function useLineups(gameId: string) {
  return useQuery({
    queryKey: ['lineups', gameId],
    queryFn: async () => {
      if (!gameId) return []
      return (await blink.db.lineups.list({
        where: { gameId },
      })) as Lineup[]
    },
    enabled: !!gameId,
  })
}

export function useUpdateLineup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gameId, playerLineups }: { gameId: string, playerLineups: { playerId: string, unit: string }[] }) => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      // 1. Get existing lineups for this game
      const existing = (await blink.db.lineups.list({ where: { gameId } })) as Lineup[]
      
      // 2. Delete all existing (simpler than selective update for this use case)
      if (existing.length > 0) {
        await blink.db.lineups.deleteMany({
          where: { gameId }
        })
      }

      // 3. Create new lineups
      if (playerLineups.length > 0) {
        await blink.db.lineups.createMany(
          playerLineups.map(pl => ({
            id: crypto.randomUUID(),
            gameId,
            playerId: pl.playerId,
            unit: pl.unit,
            userId: user.id,
            createdAt: new Date().toISOString(),
          }))
        )
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineups', variables.gameId] })
    },
  })
}
