import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import { useSeasonState } from './usePreferences'
import type { Season, Practice, Game } from '../types'

export function useSeasons() {
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id

  return useQuery({
    queryKey: ['seasons', teamId],
    queryFn: async () => {
      if (!teamId) return []
      return (await blink.db.seasons.list({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
      })) as Season[]
    },
    enabled: !!teamId,
  })
}

export interface CreateSeasonInput {
  name: string
  startDate: string
  endDate: string
  priorityConcepts: string[]
}

export function useCreateSeason() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const [, setSeasonState] = useSeasonState(teamId)

  return useMutation({
    mutationFn: async (input: CreateSeasonInput) => {
      if (!teamId) throw new Error('No team')
      const id = `season_${crypto.randomUUID().slice(0, 8)}`
      await blink.db.seasons.create({
        id,
        teamId,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        priorityConcepts: JSON.stringify(input.priorityConcepts),
      })
      return id
    },
    onSuccess: (newId) => {
      // Make the newly created season the active one.
      setSeasonState((prev) => ({
        ...prev,
        activeSeasonId: newId,
        archivedSeasonIds: prev.archivedSeasonIds.filter((id) => id !== newId),
      }))
      queryClient.invalidateQueries({ queryKey: ['seasons', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}

export interface UpdateSeasonInput {
  id: string
  name?: string
  startDate?: string
  endDate?: string
  priorityConcepts?: string[]
}

export function useUpdateSeason() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id

  return useMutation({
    mutationFn: async (input: UpdateSeasonInput) => {
      const patch: Record<string, unknown> = {}
      if (input.name !== undefined) patch.name = input.name
      if (input.startDate !== undefined) patch.startDate = input.startDate
      if (input.endDate !== undefined) patch.endDate = input.endDate
      if (input.priorityConcepts !== undefined) {
        patch.priorityConcepts = JSON.stringify(input.priorityConcepts)
      }
      await blink.db.seasons.update(input.id, patch)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}

export function useDeleteSeason() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const [, setSeasonState] = useSeasonState(teamId)

  return useMutation({
    mutationFn: async (seasonId: string) => {
      // Cascade delete: practices → segments, games → reviews, then the season itself.
      const [practices, games] = await Promise.all([
        blink.db.practices.list({ where: { seasonId } }) as Promise<Practice[]>,
        blink.db.games.list({ where: { seasonId } }) as Promise<Game[]>,
      ])

      for (const p of practices) {
        const segments = await blink.db.practiceSegments.list({ where: { practiceId: p.id } })
        await Promise.all(
          (segments as { id: string }[]).map((s) => blink.db.practiceSegments.delete(s.id)),
        )
        await blink.db.practices.delete(p.id)
      }

      for (const g of games) {
        const reviews = await blink.db.gameReviews.list({ where: { gameId: g.id } })
        await Promise.all(
          (reviews as { id: string }[]).map((r) => blink.db.gameReviews.delete(r.id)),
        )
        await blink.db.games.delete(g.id)
      }

      await blink.db.seasons.delete(seasonId)
    },
    onSuccess: (_, deletedId) => {
      setSeasonState((prev) => ({
        activeSeasonId: prev.activeSeasonId === deletedId ? null : prev.activeSeasonId,
        archivedSeasonIds: prev.archivedSeasonIds.filter((id) => id !== deletedId),
      }))
      queryClient.invalidateQueries({ queryKey: ['seasons', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['practices'] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

export function useUpdateTeamName() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()

  return useMutation({
    mutationFn: async (name: string) => {
      if (!teamData?.team?.id) throw new Error('No team')
      await blink.db.teams.update(teamData.team.id, { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}
