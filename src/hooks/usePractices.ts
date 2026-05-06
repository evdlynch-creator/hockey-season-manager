import { useEffect, useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import { useAuth } from './useAuth'
import type { Practice, PracticeSegment, PracticeRating } from '../types'
import { DEMO_PRACTICES, DEMO_SEGMENTS, isDemoMode } from './useDemoData'

export function usePractices() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery({
    queryKey: ['practices', seasonId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode()) return DEMO_PRACTICES
      if (!seasonId) return []
      return await blink.db.practices.list({
        where: { seasonId },
        orderBy: { date: 'asc' }, // Sort by date ascending for numbering
      }) as Practice[]
    },
    enabled: !!seasonId || isDemoMode(),
  })
}

export function usePractice(practiceId: string | undefined) {
  return useQuery({
    queryKey: ['practice', practiceId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode() && practiceId?.startsWith('demo-')) {
        return DEMO_PRACTICES.find(p => p.id === practiceId) || null
      }
      if (!practiceId) return null
      return await blink.db.practices.get(practiceId) as Practice | null
    },
    enabled: !!practiceId || (isDemoMode() && !!practiceId?.startsWith('demo-')),
  })
}

export function usePracticeSegments(practiceId: string | undefined) {
  return useQuery({
    queryKey: ['practice-segments', practiceId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode() && practiceId?.startsWith('demo-')) {
        return DEMO_SEGMENTS.filter(s => s.practiceId === practiceId)
      }
      if (!practiceId) return []
      return await blink.db.practiceSegments.list({
        where: { practiceId },
        orderBy: { createdAt: 'asc' },
      }) as PracticeSegment[]
    },
    enabled: !!practiceId || (isDemoMode() && !!practiceId?.startsWith('demo-')),
  })
}

export function usePracticeRatings(segmentId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['practice-ratings', segmentId],
    queryFn: async () => {
      if (!segmentId) return []
      return await blink.db.practiceRatings.list({
        where: { segmentId }
      }) as PracticeRating[]
    },
    enabled: !!segmentId
  })

  const saveRating = useMutation({
    mutationFn: async (data: Partial<PracticeRating>) => {
      if (!user) throw new Error('Not authenticated')
      if (!segmentId) throw new Error('Segment ID is required')

      const existing = await blink.db.practiceRatings.list({
        where: { segmentId, userId: user.id }
      })

      if (existing.length > 0) {
        return await blink.db.practiceRatings.update(existing[0].id, {
          ...data,
          createdAt: new Date().toISOString()
        })
      }

      return await blink.db.practiceRatings.create({
        id: crypto.randomUUID(),
        segmentId,
        userId: user.id,
        ...data,
        createdAt: new Date().toISOString()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-ratings', segmentId] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    }
  })

  const ratings = query.data || []
  const myRating = ratings.find(r => r.userId === user?.id)
  
  // Consensus logic
  const consensus = useMemo(() => {
    if (ratings.length === 0) return null
    const count = ratings.length
    const sumU = ratings.reduce((acc, r) => acc + (r.understandingRating || 0), 0)
    const sumE = ratings.reduce((acc, r) => acc + (r.executionRating || 0), 0)
    const sumT = ratings.reduce((acc, r) => acc + (r.transferRating || 0), 0)
    
    return {
      understandingRating: sumU / count,
      executionRating: sumE / count,
      transferRating: sumT / count,
      count
    }
  }, [ratings])

  return {
    ratings,
    myRating,
    consensus,
    saveRating: saveRating.mutate,
    isSaving: saveRating.isPending,
    isLoading: query.isLoading
  }
}