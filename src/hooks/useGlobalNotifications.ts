import { useEffect } from 'react'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import { useTeam } from './useTeam'
import { useNotificationPreferences } from './usePreferences'
import { useRouterState } from '@tanstack/react-router'
import { useUnreadCoachMessages } from './useUnreadCoachMessages'
import type { CoachMessage } from '../types'

export function useGlobalCoachNotifications() {
  const { user } = useAuth()
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const [notifPrefs] = useNotificationPreferences(teamId)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { setUnread, markSeen } = useUnreadCoachMessages()

  useEffect(() => {
    if (!user?.id || !teamId) return

    // 0. Reset unread if we are already on the board and tab is active
    // We can't easily check activeTab here, so we'll let the page handle it.
    // REMOVED: Auto-reset on path check. Pages with tabs will handle markSeen().
    
    let mounted = true
    let channel: any = null

    const channelName = `coach-messages-${teamId}-global`

    const checkHistoricalUnread = async () => {
      try {
        const lastSeen = localStorage.getItem('last_seen_coach_message_at')
        if (!lastSeen) return

        const newMessages = await blink.db.coachMessages.list({
          where: {
            teamId,
            createdAt: { gt: lastSeen }
          },
          limit: 1
        })

        if (mounted && newMessages.length > 0 && currentPath !== '/coaches-board') {
          // Check if any of these messages are NOT ours
          const hasOthers = newMessages.some(m => m.userId !== user.id)
          if (hasOthers) {
            setUnread(true)
          }
        }
      } catch (err) {
        console.error('Failed to check historical unread messages:', err)
      }
    }

    const connect = async () => {
      // First check if there's anything new since we last looked
      checkHistoricalUnread()

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

            // 2. Mark as unread
            // Note: We always set unread to true. If the user is currently 
            // looking at the chat (activeTab === 'chat'), the page will 
            // immediately call markSeen() and clear it.
            setUnread(true)

            // 3. Show System Notification ONLY if enabled and tab is hidden
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
  }, [user?.id, teamId, currentPath, notifPrefs.coachMessages, setUnread, markSeen])
}
