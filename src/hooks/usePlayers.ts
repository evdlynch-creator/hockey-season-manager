import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { Player } from '../types'

export function usePlayers() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery({
    queryKey: ['players', seasonId],
    queryFn: async () => {
      if (!seasonId) return []
      return (await blink.db.players.list({
        where: { seasonId },
        orderBy: { number: 'asc' },
      })) as Player[]
    },
    enabled: !!seasonId,
  })
}

export function useCreatePlayer() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async (data: Omit<Player, 'id' | 'seasonId' | 'createdAt'>) => {
      if (!seasonId) throw new Error('No active season')
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      return await blink.db.players.create({
        id: crypto.randomUUID(),
        seasonId,
        userId: user.id,
        ...data,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', seasonId] })
    },
  })
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Player> & { id: string }) => {
      return await blink.db.players.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', seasonId] })
    },
  })
}

export function useDeletePlayer() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async (id: string) => {
      await blink.db.players.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', seasonId] })
    },
  })
}
