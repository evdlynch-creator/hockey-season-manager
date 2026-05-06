import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { useTeam } from './useTeam'
import type { CoachMessage } from '../types'

export function useMyPendingProposals() {
  const { user } = useAuth()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id

  return useQuery({
    queryKey: ['staff-mailbox', teamId, user?.id],
    queryFn: async () => {
      if (!teamId || !user?.id) return { received: [], sent: [] }
      
      // We list all line proposals for the team
      const allProposals = (await blink.db.coachMessages.list({
        where: { teamId: teamId },
        orderBy: { createdAt: 'desc' },
        limit: 100
      })) as CoachMessage[]

      const received: CoachMessage[] = []
      const sent: CoachMessage[] = []

      allProposals.forEach(m => {
        try {
          const meta = JSON.parse(m.metadata || '{}')
          if (meta.type !== 'line_proposal') return

          // Sent to me
          if (meta.taggedUserId === user.id) {
            received.push(m)
          }
          // Sent by me
          else if (m.userId === user.id) {
            sent.push(m)
          }
        } catch {
          // ignore invalid JSON
        }
      })

      return { received, sent }
    },
    enabled: !!teamId && !!user?.id
  })
}
