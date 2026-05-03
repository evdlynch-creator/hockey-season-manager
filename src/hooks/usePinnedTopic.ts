import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'

export function usePinnedTopic() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id

  const query = useQuery({
    queryKey: ['pinned-topic', teamId],
    queryFn: async () => {
      if (!teamId) return null
      const topics = await blink.db.pinnedTopics.list({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
        limit: 1
      })
      return topics[0] || null
    },
    enabled: !!teamId
  })

  const update = useMutation({
    mutationFn: async (content: string) => {
      if (!teamId) throw new Error('No team selected')
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      const id = crypto.randomUUID()
      return await blink.db.pinnedTopics.create({
        id,
        teamId,
        content,
        userId: user.id,
        createdAt: new Date().toISOString()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-topic', teamId] })
    }
  })

  return {
    topic: query.data,
    isLoading: query.isLoading,
    updateTopic: update.mutateAsync
  }
}
