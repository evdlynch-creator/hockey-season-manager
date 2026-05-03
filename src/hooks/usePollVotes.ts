import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'

export function usePollVotes(messageId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['poll-votes', messageId],
    queryFn: async () => {
      return await blink.db.pollVotes.list({
        where: { messageId }
      })
    },
    enabled: !!messageId
  })

  const vote = useMutation({
    mutationFn: async (optionIndex: number) => {
      if (!user) throw new Error('Not authenticated')

      const id = crypto.randomUUID()
      // Use upsert pattern
      const existing = await blink.db.pollVotes.list({
        where: { messageId, userId: user.id }
      })

      if (existing.length > 0) {
        return await blink.db.pollVotes.update(existing[0].id, {
          optionIndex,
          createdAt: new Date().toISOString()
        })
      }

      return await blink.db.pollVotes.create({
        id,
        messageId,
        userId: user.id,
        optionIndex,
        createdAt: new Date().toISOString()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll-votes', messageId] })
    }
  })

  const votes = query.data || []
  const userVote = votes.find(v => v.userId === user?.id)
  
  const results = votes.reduce((acc: Record<number, number>, vote) => {
    acc[vote.optionIndex] = (acc[vote.optionIndex] || 0) + 1
    return acc
  }, {})

  return {
    votes,
    results,
    userVote,
    castVote: vote.mutate,
    isVoting: vote.isPending
  }
}
