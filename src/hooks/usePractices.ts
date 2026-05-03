import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { Practice, PracticeSegment } from '../types'
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
        orderBy: { date: 'asc' },
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