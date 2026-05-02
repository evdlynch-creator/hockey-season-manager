import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import type { Drill } from '../types'

export function useDrills() {
  return useQuery({
    queryKey: ['drills'],
    queryFn: async () => {
      return (await blink.db.drills.list({
        orderBy: { name: 'asc' },
      })) as Drill[]
    },
  })
}

export function useCreateDrill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Drill, 'id' | 'createdAt'>) => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      return await blink.db.drills.create({
        id: crypto.randomUUID(),
        userId: user.id,
        ...data,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drills'] })
    },
  })
}

export function useUpdateDrill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Drill> & { id: string }) => {
      return await blink.db.drills.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drills'] })
    },
  })
}

export function useDeleteDrill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await blink.db.drills.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drills'] })
    },
  })
}
