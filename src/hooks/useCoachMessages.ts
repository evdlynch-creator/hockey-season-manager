import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { useTeam } from './useTeam'
import { useNotificationPreferences } from './usePreferences'
import type { CoachMessage, CoachMessageContext } from '../types'

export function useCoachMessages(contextType: CoachMessageContext, contextId: string | null = null) {
  const { user } = useAuth()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const [notifPrefs] = useNotificationPreferences(teamId)
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

    let mounted = true
    let channel: any = null

    const channelName = `coach-messages:${teamId}:${contextType}:${contextId || 'general'}`

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

            // Show browser notification if enabled and tab is hidden or message is from someone else
            if (
              notifPrefs.coachMessages &&
              messageData.userId !== user.id &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              const title = contextType === 'general' ? 'Coaches Board' : 
                            contextType === 'practice' ? 'Practice Planning' : 'Game Strategy'
              
              new Notification(title, {
                body: `${messageData.userDisplayName}: ${messageData.content}`,
                icon: '/favicon.png'
              })
            }
          }
        })
      } catch (err) {
        console.error('Failed to connect to coach chat:', err)
      }
    }

    connect()

    return () => {
      mounted = false
      if (channel) channel.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
    }
  }, [user?.id, teamId, contextType, contextId])

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !teamId) throw new Error('Missing auth or team')

      const newMessage: CoachMessage = {
        id: crypto.randomUUID(),
        teamId,
        userId: user.id,
        content,
        contextType,
        contextId,
        userDisplayName: user.displayName || user.email,
        createdAt: new Date().toISOString()
      }

      // 1. Save to DB
      await blink.db.coachMessages.create(newMessage)

      // 2. Broadcast via realtime
      if (channelRef.current) {
        await channelRef.current.publish('new_message', newMessage)
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
    sendMessage: (content: string) => sendMessage.mutate(content),
    isSending: sendMessage.isPending
  }
}