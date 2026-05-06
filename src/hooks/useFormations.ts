import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import type { Formation, FormationAssignment } from '../types'
import { useTeam } from './useTeam'

export function useFormations() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery({
    queryKey: ['formations', seasonId],
    queryFn: async () => {
      if (!seasonId) return []
      return (await blink.db.formations.list({
        where: { seasonId },
        orderBy: { createdAt: 'desc' }
      })) as Formation[]
    },
    enabled: !!seasonId,
  })
}

export function useFormationAssignments(formationId: string | null) {
  return useQuery({
    queryKey: ['formation-assignments', formationId],
    queryFn: async () => {
      if (!formationId) return []
      return (await blink.db.formationAssignments.list({
        where: { formationId },
      })) as FormationAssignment[]
    },
    enabled: !!formationId,
  })
}

export function useCreateFormation() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async (name: string) => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')
      if (!seasonId) throw new Error('No active season')

      return await blink.db.formations.create({
        id: crypto.randomUUID(),
        name,
        seasonId,
        userId: user.id,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations', seasonId] })
    },
  })
}

export function useUpdateFormation() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await blink.db.formations.update(id, { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations', seasonId] })
    },
  })
}

export function useDeleteFormation() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete assignments first
      await blink.db.formationAssignments.deleteMany({
        where: { formationId: { equals: id } }
      })
      // Then delete formation
      return await blink.db.formations.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations', seasonId] })
    },
  })
}

export function useUpdateFormationAssignments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ formationId, assignments }: { formationId: string, assignments: { playerId: string, unit: string }[] }) => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      // 1. Get existing assignments
      const existing = (await blink.db.formationAssignments.list({ 
        where: { formationId: { equals: formationId } } 
      })) as FormationAssignment[]
      
      // 2. Delete all existing
      if (existing.length > 0) {
        await blink.db.formationAssignments.deleteMany({
          where: { formationId: { equals: formationId } }
        })
      }

      // 3. Create new assignments
      if (assignments.length > 0) {
        await blink.db.formationAssignments.createMany(
          assignments.map(a => ({
            id: crypto.randomUUID(),
            formationId,
            playerId: a.playerId,
            unit: a.unit,
            userId: user.id,
            createdAt: new Date().toISOString(),
          }))
        )
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['formation-assignments', variables.formationId] })
    },
  })
}
