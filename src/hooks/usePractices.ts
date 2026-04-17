import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { Practice, PracticeSegment } from '../types'

export function usePractices() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery({
    queryKey: ['practices', seasonId],
    queryFn: async () => {
      if (!seasonId) return []
      return await blink.db.practices.list({
        where: { seasonId },
        orderBy: { date: 'desc' },
      }) as Practice[]
    },
    enabled: !!seasonId,
  })
}

export function usePractice(practiceId: string | undefined) {
  return useQuery({
    queryKey: ['practice', practiceId],
    queryFn: async () => {
      if (!practiceId) return null
      return await blink.db.practices.get(practiceId) as Practice | null
    },
    enabled: !!practiceId,
  })
}

export function usePracticeSegments(practiceId: string | undefined) {
  return useQuery({
    queryKey: ['practice-segments', practiceId],
    queryFn: async () => {
      if (!practiceId) return []
      return await blink.db.practiceSegments.list({
        where: { practiceId },
        orderBy: { createdAt: 'asc' },
      }) as PracticeSegment[]
    },
    enabled: !!practiceId,
  })
}
