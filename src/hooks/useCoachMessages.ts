import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { useTeam } from './useTeam'
import { useNotificationPreferences } from './usePreferences'
import { useUnreadCoachMessages } from './useUnreadCoachMessages'
import type { CoachMessage, CoachMessageContext } from '../types'

export function useCoachMessages(contextType: CoachMessageContext, contextId: string | null = null) {
  const { user } = useAuth()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const [notifPrefs] = useNotificationPreferences(teamId)
  const { markSeen } = useUnreadCoachMessages()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)

  const queryKey = ['coach-messages', teamId, contextType, contextId]

  // Fetch historical messages
  const { data: initialMessages = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!teamId) return []
      const where: any = { teamId, contextType }
      if (contextId) where.contextId = contextId
      
      return (await blink.db.coachMessages.list({
        where,
        orderBy: { createdAt: 'asc' },
        limit: 100
      })) as CoachMessage[]
    },
    enabled: !!teamId
  })

  // Sync state with query data
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  // Realtime subscription
  useEffect(() => {
    if (!user?.id || !teamId) return

    // Mark as seen whenever this hook is active (user is looking at messages)
    markSeen()

    let mounted = true
    let channel: any = null

    const channelName = `coach-${teamId.slice(-8)}-${contextType.slice(0, 4)}-${contextId ? contextId.slice(-8) : 'gen'}`

    const connect = async () => {
      try {
        // Request notification permission if enabled in settings
        if (notifPrefs.coachMessages && 'Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission()
        }

        channel = blink.realtime.channel(channelName)
        channelRef.current = channel

        await channel.subscribe({
          userId: user.id,
          metadata: { displayName: user.displayName || user.email }
        })

        if (!mounted) return
        setIsConnected(true)

        channel.onMessage((msg: any) => {
          if (!mounted) return
          if (msg.type === 'new_message') {
            const messageData = msg.data as CoachMessage
            
            setMessages(prev => {
              // Prevent duplicates
              if (prev.find(m => m.id === messageData.id)) return prev
              return [...prev, messageData]
            })
          }
        })
      } catch (err: any) {
        // Suppress transient WebSocket errors after unmount or on navigation
        if (mounted) {
          console.warn('Coach chat connection unavailable — will retry on next mount:', err?.message || err)
        }
      }
    }

    connect()

    return () => {
      mounted = false
      channelRef.current = null
      setIsConnected(false)
      // Unsubscribe after clearing mounted flag so any pending errors are suppressed
      if (channel) {
        try { channel.unsubscribe() } catch (_) { /* ignore cleanup errors */ }
      }
    }
  }, [user?.id, teamId, contextType, contextId])

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ content, metadata }: { content: string, metadata?: string }) => {
      if (!user?.id || !teamId) throw new Error('Missing auth or team')

      const newMessage: CoachMessage = {
        id: crypto.randomUUID(),
        teamId,
        userId: user.id,
        content,
        contextType,
        contextId,
        metadata,
        userDisplayName: user.displayName || user.email,
        createdAt: new Date().toISOString()
      }

      // 1. Save to DB
      await blink.db.coachMessages.create(newMessage)

      // 2. Broadcast via realtime
      if (channelRef.current) {
        await channelRef.current.publish('new_message', newMessage)
      }

      // 3. Broadcast to global team channel for notifications across the app
      try {
        const globalChannel = blink.realtime.channel(`coach-messages-${teamId}-global`)
        await globalChannel.publish('new_message', newMessage)
      } catch (err) {
        console.error('Failed to broadcast global message:', err)
      }

      return newMessage
    },
    onSuccess: (newMessage) => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
    }
  })

  return {
    messages,
    isLoading,
    isConnected,
    sendMessage: (content: string, metadata?: string) => sendMessage.mutate({ content, metadata }),
    isSending: sendMessage.isPending
  }
}
