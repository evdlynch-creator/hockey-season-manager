import { useEffect, useRef } from 'react'
import { blink } from '../blink/client'
import { JESS_IDENTITY, JESS_SYSTEM_PROMPT } from '../lib/jess-ai'
import { useGames } from './useGames'
import { useTeam } from './useTeam'
import type { CoachMessage, CoachMessageContext } from '../types'
import { format, isAfter, isBefore, addHours, subHours, parseISO } from 'date-fns'

interface UseJessAIProps {
  messages: CoachMessage[]
  sendMessage: (content: string, metadata?: string) => void
  contextType: CoachMessageContext
  contextId: string | null
}

export function useJessAI({ messages, sendMessage, contextType, contextId }: UseJessAIProps) {
  const { data: teamData } = useTeam()
  const { data: games = [] } = useGames()
  const teamId = teamData?.team?.id
  
  const lastProcessedMessageId = useRef<string | null>(null)
  const lastReminderCheck = useRef<number>(0)
  const isGenerating = useRef(false)

  // ── 1. Respond to @Jess Mentions ──────────────────────────────────────────
  useEffect(() => {
    if (!messages.length || isGenerating.current) return
    
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.id === lastProcessedMessageId.current) return
    
    // Check if the message contains @Jess (case insensitive)
    if (lastMsg.userId !== JESS_IDENTITY.userId && lastMsg.content.toLowerCase().includes('@jess')) {
      handleJessMention(lastMsg)
    }

    lastProcessedMessageId.current = lastMsg.id
  }, [messages])

  // ── 2. Automatic Game Reminders ───────────────────────────────────────────
  useEffect(() => {
    // Only send reminders in general context
    if (contextType !== 'general' || !teamId || isGenerating.current) return

    const now = new Date()
    // Check every 5 minutes (300000ms)
    if (Date.now() - lastReminderCheck.current < 300000) return
    lastReminderCheck.current = Date.now()

    const upcomingGame = games.find(g => {
      if (g.status !== 'scheduled') return false
      const gameDate = parseISO(g.date)
      // Reminder if game is within 4 hours
      return isAfter(gameDate, now) && isBefore(gameDate, addHours(now, 4))
    })

    if (upcomingGame) {
      checkAndSendReminder(upcomingGame)
    }
  }, [games, contextType, teamId])

  // ── 3. Automated Game Debriefs ────────────────────────────────────────────
  useEffect(() => {
    // We check for games that just moved to 'completed' or 'reviewed' but haven't been debriefed by Jess
    if (!teamId || isGenerating.current) return

    const recentCompletedGames = games.filter(g => 
      (g.status === 'completed' || g.status === 'reviewed') && 
      isAfter(parseISO(g.date), subHours(new Date(), 24))
    )

    recentCompletedGames.forEach(game => {
      checkAndSendDebrief(game)
    })
  }, [games, teamId])

  // ── Helper: Handle Mention ───────────────────────────────────────────────
  async function handleJessMention(message: CoachMessage) {
    isGenerating.current = true
    try {
      const response = await blink.ai.generateText({
        model: 'google/gemini-3-flash',
        system: JESS_SYSTEM_PROMPT,
        prompt: `The coach said: "${message.content}". Provide a tactical response as Jess.`
      })

      // Send the response as Jess
      await sendJessMessage(response.text, { type: 'jess_analysis' })
    } catch (err) {
      console.error('Jess mention failed:', err)
    } finally {
      isGenerating.current = false
    }
  }

  // ── Helper: Game Reminders ───────────────────────────────────────────────
  async function checkAndSendReminder(game: any) {
    // Check if Jess already sent a reminder for this game ID in this context
    const alreadySent = messages.some(m => {
      if (m.userId !== JESS_IDENTITY.userId) return false
      try {
        const meta = JSON.parse(m.metadata || '{}')
        return meta.type === 'jess_reminder' && meta.gameId === game.id
      } catch { return false }
    })

    if (alreadySent) return

    isGenerating.current = true
    try {
      const gameTime = game.gameTime || 'soon'
      const content = `Game Prep Alert: We match up against ${game.opponent} at ${gameTime}. Head over to the Game Room to finalize our tactical plan.`
      
      await sendJessMessage(content, { 
        type: 'jess_reminder', 
        gameId: game.id,
        priority: 'high'
      })
    } catch (err) {
      console.error('Jess reminder failed:', err)
    } finally {
      isGenerating.current = false
    }
  }

  // ── Helper: Game Debriefs ────────────────────────────────────────────────
  async function checkAndSendDebrief(game: any) {
    const alreadySent = messages.some(m => {
      if (m.userId !== JESS_IDENTITY.userId) return false
      try {
        const meta = JSON.parse(m.metadata || '{}')
        return meta.type === 'jess_debrief' && meta.gameId === game.id
      } catch { return false }
    })

    if (alreadySent) return

    isGenerating.current = true
    try {
      const prompt = `Game vs ${game.opponent} ended ${game.goalsFor}-${game.goalsAgainst}. Provide a very brief tactical debrief (2-3 sentences) for the coaching staff chat.`
      const response = await blink.ai.generateText({
        model: 'google/gemini-3-flash',
        system: JESS_SYSTEM_PROMPT,
        prompt
      })

      await sendJessMessage(response.text, { 
        type: 'jess_debrief', 
        gameId: game.id 
      })
    } catch (err) {
      console.error('Jess debrief failed:', err)
    } finally {
      isGenerating.current = false
    }
  }

  // ── Core: Post message to DB & Broadcast ─────────────────────────────────
  async function sendJessMessage(content: string, metadata: any) {
    if (!teamId) return

    const newMessage: any = {
      id: crypto.randomUUID(),
      teamId,
      userId: JESS_IDENTITY.userId,
      content,
      contextType,
      contextId,
      userDisplayName: JESS_IDENTITY.displayName,
      metadata: JSON.stringify(metadata),
      createdAt: new Date().toISOString()
    }

    // 1. Save to DB
    await blink.db.coachMessages.create(newMessage)

    // 2. Broadcast via realtime (simulate same logic as hook)
    const channelName = `coach-messages-${teamId}-${contextType}-${contextId || 'general'}`
    const channel = blink.realtime.channel(channelName)
    await channel.publish('new_message', newMessage)

    // 3. Global broadcast
    const globalChannel = blink.realtime.channel(`coach-messages-${teamId}-global`)
    await globalChannel.publish('new_message', newMessage)
  }
}
