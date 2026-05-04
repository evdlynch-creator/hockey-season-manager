import { useEffect } from 'react'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { useTeam } from './useTeam'
import { useNotificationPreferences } from './usePreferences'
import { toast } from '@blinkdotnew/ui'
import { useRouterState } from '@tanstack/react-router'
import type { CoachMessage } from '../types'

export function useGlobalCoachNotifications() {
  const { user } = useAuth()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const [notifPrefs] = useNotificationPreferences(teamId)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  useEffect(() => {
    if (!user?.id || !teamId) return

    let mounted = true
    let channel: any = null

    const channelName = `coach-messages-${teamId}-global`

    const connect = async () => {
      try {
        channel = blink.realtime.channel(channelName)

        await channel.subscribe({
          userId: user.id
        })

        if (!mounted) return

        channel.onMessage((msg: any) => {
          if (!mounted) return
          if (msg.type === 'new_message') {
            const messageData = msg.data as CoachMessage
            
            // 1. Don't notify for our own messages
            if (messageData.userId === user.id) return

            // 2. Determine context path
            let messagePath = '/coaches-board'
            if (messageData.contextType === 'game') {
              messagePath = `/games/${messageData.contextId}`
            } else if (messageData.contextType === 'practice') {
              messagePath = `/practices/${messageData.contextId}`
            }

            // 3. Show In-App Toast ONLY if NOT on the exact same page
            if (currentPath !== messagePath) {
              toast.info(`Message from ${messageData.userDisplayName}`, {
                description: messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : ''),
              })
            }

            // 4. Show System Notification ONLY if enabled and tab is hidden
            // This works regardless of the page we are on
            if (
              notifPrefs.coachMessages &&
              'Notification' in window &&
              Notification.permission === 'granted' &&
              document.visibilityState === 'hidden'
            ) {
              const title = messageData.contextType === 'general' ? 'Locker Room Talk' : 
                            messageData.contextType === 'practice' ? 'Practice Planning' : 'Game Strategy'
              
              new Notification(title, {
                body: `${messageData.userDisplayName}: ${messageData.content}`,
                icon: '/favicon.png'
              })
            }
          }
        })
      } catch (err: any) {
        // Suppress transient WebSocket errors — non-critical notification channel
        if (mounted) {
          console.warn('Global notifications connection unavailable:', err?.message || err)
        }
      }
    }

    connect()

    return () => {
      mounted = false
      if (channel) {
        try { channel.unsubscribe() } catch (_) { /* ignore cleanup errors */ }
      }
    }
  }, [user?.id, teamId, currentPath, notifPrefs.coachMessages])
}
