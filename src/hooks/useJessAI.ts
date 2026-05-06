import { useEffect, useRef } from 'react'
import { blink } from '../blink/client'
import { JESS_IDENTITY, JESS_SYSTEM_PROMPT, type JessMetadata } from '../lib/jess-ai'
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
    
    // Only respond to recent mentions (last 2 minutes) to avoid responding to history on mount
    const isRecent = isAfter(parseISO(lastMsg.createdAt), subHours(new Date(), 0.033)) // ~2 mins
    if (!isRecent) {
      lastProcessedMessageId.current = lastMsg.id
      return
    }
    
    // Check if the message contains @Jess (case insensitive)
    if (lastMsg.userId !== JESS_IDENTITY.userId && lastMsg.content.toLowerCase().includes('@jess')) {
      // Small random jitter to reduce race conditions between multiple open tabs
      const jitter = Math.random() * 2000
      setTimeout(() => {
        handleJessMention(lastMsg)
      }, jitter)
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
    if (!teamId) return
    
    // DB Check: Has Jess already responded to THIS specific message ID?
    // We check the most recent Jess messages for this team
    const existingResponses = await blink.db.coachMessages.list({
      where: { 
        teamId,
        userId: JESS_IDENTITY.userId
      },
      orderBy: { createdAt: 'desc' },
      limit: 50
    })

    const alreadyResponded = existingResponses.some(m => {
      try {
        const meta = JSON.parse(m.metadata || '{}')
        return meta.type === 'jess_analysis' && meta.respondedToId === message.id
      } catch { return false }
    })

    if (alreadyResponded) {
      lastProcessedMessageId.current = message.id
      return
    }

    isGenerating.current = true
    try {
      const now = new Date()
      const upcoming = games
        .filter(g => g.status === 'scheduled' && isAfter(parseISO(g.date), subHours(now, 24)))
        .sort((a, b) => a.date.localeCompare(b.date))[0]
      
      const lastCompleted = games
        .filter(g => g.status !== 'scheduled')
        .sort((a, b) => b.date.localeCompare(a.date))[0]

      const last3 = games
        .filter(g => g.status !== 'scheduled')
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)

      const contextData = {
        upcomingGame: upcoming ? {
          opponent: upcoming.opponent,
          date: format(parseISO(upcoming.date), 'EEEE, MMM do'),
          time: upcoming.gameTime || 'TBD',
          location: upcoming.location
        } : null,
        recentResults: last3.map(g => `${g.opponent}: ${g.goalsFor}-${g.goalsAgainst} (${g.date})`).join(', '),
        lastGame: lastCompleted
      }

      // Check if they are asking about the last game specifically
      const isAskingAboutLastGame = message.content.toLowerCase().match(/last game|previous game|result|debrief/)

      if (isAskingAboutLastGame && lastCompleted) {
        return checkAndSendDebrief(lastCompleted, true)
      }

      const response = await blink.ai.generateText({
        model: 'google/gemini-3-flash',
        system: JESS_SYSTEM_PROMPT,
        prompt: `TEAM CONTEXT:
Upcoming Game: ${contextData.upcomingGame ? `${contextData.upcomingGame.opponent} on ${contextData.upcomingGame.date} at ${contextData.upcomingGame.time}` : 'No games scheduled'}
Recent Results: ${contextData.recentResults || 'No recent games'}

The coach said: "${message.content}". Provide a tactical response as Jess. Remember the 1-3 sentence rule and use the data provided.`
      })

      // Send the response as Jess
      await sendJessMessage(response.text, { 
        type: 'jess_analysis',
        respondedToId: message.id 
      })
    } catch (err) {
      console.error('Jess mention failed:', err)
    } finally {
      isGenerating.current = false
    }
  }

  // ── Helper: Game Reminders ───────────────────────────────────────────────
  async function checkAndSendReminder(game: any) {
    if (!teamId) return

    // DB Check: Has Jess already sent a reminder for this game ID?
    const existingMessages = await blink.db.coachMessages.list({
      where: { 
        teamId,
        userId: JESS_IDENTITY.userId
      },
      orderBy: { createdAt: 'desc' },
      limit: 50
    })

    const alreadySent = existingMessages.some(m => {
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
  async function checkAndSendDebrief(game: any, forced: boolean = false) {
    if (!teamId) return

    // DB Check: Has Jess already debriefed this game?
    const existingMessages = await blink.db.coachMessages.list({
      where: { 
        teamId,
        userId: JESS_IDENTITY.userId
      },
      orderBy: { createdAt: 'desc' },
      limit: 50
    })

    const alreadySent = !forced && existingMessages.some(m => {
      try {
        const meta = JSON.parse(m.metadata || '{}')
        return meta.type === 'jess_debrief' && meta.gameId === game.id
      } catch { return false }
    })

    if (alreadySent) return

    isGenerating.current = true
    try {
      // Get detailed game review if available
      const reviews = await blink.db.gameReviews.list({ where: { gameId: game.id }, limit: 1 })
      const review = reviews[0]

      const prompt = `Game vs ${game.opponent} ended ${game.goalsFor}-${game.goalsAgainst}. Shots: ${game.shotsFor}-${game.shotsAgainst}.
      Tactical Ratings: Breakouts(${review?.breakoutsRating || 'N/A'}), Forecheck(${review?.forecheckRating || 'N/A'}), D-Zone(${review?.defensiveZoneRating || 'N/A'}).
      Coach Notes: ${review?.notes || 'None'}.
      
      Generate a concise 1-sentence tactical summary AND a list of 3 specific tactical highlights (F1 pressure, D-to-D speed, etc.) for a high-performance debrief card.
      JSON format: { "summary": "...", "highlights": ["...", "...", "..."] }`

      const { object } = await blink.ai.generateObject({
        model: 'google/gemini-3-flash',
        prompt,
        schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            highlights: { type: 'array', items: { type: 'string' } }
          },
          required: ['summary', 'highlights']
        }
      })

      const summary = object as any

      await sendJessMessage(summary.summary, { 
        type: 'jess_debrief', 
        gameId: game.id,
        summaryData: {
          opponent: game.opponent,
          score: `${game.goalsFor}-${game.goalsAgainst}`,
          shots: game.shotsFor ? `${game.shotsFor}-${game.shotsAgainst}` : undefined,
          tacticalHighlights: summary.highlights
        }
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
    const channelName = `coach-${teamId.slice(-8)}-${contextType.slice(0, 4)}-${contextId ? contextId.slice(-8) : 'gen'}`
    const channel = blink.realtime.channel(channelName)
    await channel.publish('new_message', newMessage)

    // 3. Global broadcast
    const globalChannel = blink.realtime.channel(`coach-messages-${teamId}-global`)
    await globalChannel.publish('new_message', newMessage)
  }
}