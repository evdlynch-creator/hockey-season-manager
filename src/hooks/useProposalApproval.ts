import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export type ApprovalStatus = 'approved' | 'changes_requested' | 'declined' | 'pending'

export function useProposalApproval(messageId: string, meta?: any) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: votes = [], isLoading } = useQuery({
    queryKey: ['proposal-approval', messageId],
    queryFn: async () => {
      return await blink.db.pollVotes.list({
        where: { messageId }
      })
    },
    enabled: !!messageId
  })

  const submitApproval = useMutation({
    mutationFn: async (requestedStatus: 'approve' | 'request_changes' | 'decline') => {
      if (!user) throw new Error('Not authenticated')

      const optionIndex = requestedStatus === 'approve' ? 0 : requestedStatus === 'request_changes' ? 1 : 2
      
      const existing = await blink.db.pollVotes.list({
        where: { messageId, userId: user.id }
      })

      if (existing.length > 0) {
        await blink.db.pollVotes.update(existing[0].id, {
          optionIndex,
          createdAt: new Date().toISOString()
        })
      } else {
        await blink.db.pollVotes.create({
          id: crypto.randomUUID(),
          messageId,
          userId: user.id,
          optionIndex,
          createdAt: new Date().toISOString()
        })
      }

      // If approved and associated with a game, push to roster
      if (requestedStatus === 'approve' && meta?.pushedToGameId && meta?.lines) {
        const gameId = meta.pushedToGameId
        const flatAssignments: any[] = []
        Object.entries(meta.lines as Record<string, string[]>).forEach(([unit, playerIds]) => {
          playerIds.forEach(playerId => {
            if (playerId) {
              flatAssignments.push({ playerId, unit })
            }
          })
        })

        if (flatAssignments.length > 0) {
          // Clear existing lineups for this game
          const existingLineups = await blink.db.lineups.list({ where: { gameId } })
          if (existingLineups.length > 0) {
            // Note: deleteMany by ID list is often more reliable
            const ids = existingLineups.map((l: any) => l.id)
            await Promise.all(ids.map(id => blink.db.lineups.delete(id)))
          }

          // Create new
          await blink.db.lineups.createMany(
            flatAssignments.map(pl => ({
              id: crypto.randomUUID(),
              gameId,
              playerId: pl.playerId,
              unit: pl.unit,
              userId: user.id,
              createdAt: new Date().toISOString(),
            }))
          )
          
          toast.success('Roster successfully updated with approved lines')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-approval', messageId] })
      if (meta?.pushedToGameId) {
        queryClient.invalidateQueries({ queryKey: ['lineups', meta.pushedToGameId] })
      }
    }
  })

  // We look for the tagged user's vote primarily, or the consensus
  const latestVote = votes.length > 0 ? [...votes].sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))[0] : null
  
  let status: ApprovalStatus = 'pending'
  if (latestVote) {
    if (latestVote.optionIndex === 0) status = 'approved'
    else if (latestVote.optionIndex === 1) status = 'changes_requested'
    else if (latestVote.optionIndex === 2) status = 'declined'
  }

  return {
    status,
    votes,
    submitApproval: submitApproval.mutate,
    pushToRoster: async () => {
      if (!user) throw new Error('Not authenticated')
      if (!meta?.pushedToGameId || !meta?.lines) return

      const gameId = meta.pushedToGameId
      const flatAssignments: any[] = []
      Object.entries(meta.lines as Record<string, string[]>).forEach(([unit, playerIds]) => {
        playerIds.forEach(playerId => flatAssignments.push({ playerId, unit }))
      })

      try {
        const existingLineups = await blink.db.lineups.list({ where: { gameId } })
        if (existingLineups.length > 0) {
          await blink.db.lineups.deleteMany({ where: { gameId } })
        }

        await blink.db.lineups.createMany(
          flatAssignments.map(pl => ({
            id: crypto.randomUUID(),
            gameId,
            playerId: pl.playerId,
            unit: pl.unit,
            userId: user.id,
            createdAt: new Date().toISOString(),
          }))
        )
        
        queryClient.invalidateQueries({ queryKey: ['lineups', gameId] })
        toast.success('Lines manually pushed to roster')
      } catch (err) {
        toast.error('Failed to push lines')
      }
    },
    isSubmitting: submitApproval.isPending,
    isLoading
  }
}