import { useState, useRef, useEffect } from 'react'
import { Card, Skeleton, ScrollArea } from '@blinkdotnew/ui'
import { MessageSquare } from 'lucide-react'
import { useCoachMessages } from '@/hooks/useCoachMessages'
import { useJessAI } from '@/hooks/useJessAI'
import { useAuth } from '@/hooks/useAuth'
import { usePlayers } from '@/hooks/usePlayers'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CoachMessageContext } from '@/types'

import { PracticeLinkTool } from './tools/PracticeLinkTool'
import { LineBuilderTool } from './tools/LineBuilderTool'
import { GameLinkTool } from './tools/GameLinkTool'
import { PollTool } from './tools/PollTool'
import { CoachVoiceMemoTool } from './tools/CoachVoiceMemoTool'
import { ChatEventPrompt } from './ChatEventPrompt'

import { ChatHeader } from './chat/ChatHeader'
import { ChatToolbar } from './chat/ChatToolbar'
import { MessageBubble } from './chat/MessageBubble'
import { ChatInput } from './chat/ChatInput'

interface CoachChatProps {
  contextType: CoachMessageContext
  contextId?: string | null
  className?: string
  title?: string
}

export function CoachChat({ contextType, contextId = null, className, title }: CoachChatProps) {
  const { user } = useAuth()
  const { data: players = [] } = usePlayers()
  const { messages, isLoading, isConnected, sendMessage, isSending } = useCoachMessages(contextType, contextId)
  
  // Activate Jess AI automation
  useJessAI({ messages, sendMessage, contextType, contextId })

  const [practiceToolOpen, setPracticeToolOpen] = useState(false)
  const [gameToolOpen, setGameToolOpen] = useState(false)
  const [lineToolOpen, setLineToolOpen] = useState(false)
  const [pollToolOpen, setPollToolOpen] = useState(false)
  const [voiceToolOpen, setVoiceToolOpen] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Auto-scroll to bottom ────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [messages.length, isLoading])

  const handleLinkPractice = (id: string, title: string, date: string, index: number) => {
    const formattedDate = format(new Date(date + 'T00:00:00'), 'MMM do')
    sendMessage(`Let's review Practice #${index} (${formattedDate}): ${title}`, JSON.stringify({
      type: 'practice_link',
      practiceId: id,
      practiceTitle: title,
      practiceIndex: index,
      practiceDate: formattedDate
    }))
  }

  const handleLinkGame = (id: string, opponent: string, date: string, score?: string) => {
    const formattedDate = format(new Date(date + 'T00:00:00'), 'MMM do')
    sendMessage(`Referencing game vs ${opponent} (${formattedDate})${score ? ` • Result: ${score}` : ''}`, JSON.stringify({
      type: 'game_link',
      gameId: id,
      opponent,
      gameDate: formattedDate,
      score
    }))
  }

  const handleShareLines = (lines: Record<string, string[]>, note: string, pushToGameId?: string) => {
    sendMessage(note || 'Proposed new line combinations for brainstorming.', JSON.stringify({
      type: 'line_proposal',
      lines,
      pushedToGameId: pushToGameId
    }))
  }

  const handleSharePoll = (question: string, options: string[]) => {
    sendMessage(question, JSON.stringify({
      type: 'strategic_poll',
      options
    }))
  }

  const handleShareVoice = (text: string, audioUrl: string) => {
    sendMessage(text, JSON.stringify({
      type: 'voice_memo',
      audioUrl
    }))
  }

  return (
    <Card className={cn("flex flex-col h-[600px] border-border bg-card/30 backdrop-blur-[20px] rounded-[2.5rem] overflow-hidden shadow-2xl", className)}>
      <ChatHeader 
        title={title} 
        isConnected={isConnected} 
        messageCount={messages.length} 
      />

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-8">
          {contextType === 'general' && <ChatEventPrompt />}
          
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn("flex items-start gap-3", i % 2 === 0 ? "flex-row" : "flex-row-reverse")}>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-50">
              <MessageSquare className="w-12 h-12 text-zinc-600" />
              <div className="space-y-1">
                <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">No messages yet</p>
                <p className="text-[10px] text-zinc-600 italic">Start the coaching conversation.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.userId === user?.id} 
                players={players}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-6 bg-zinc-950/40 border-t border-white/5 space-y-4 backdrop-blur-lg">
        <ChatToolbar 
          onPracticeClick={() => setPracticeToolOpen(true)}
          onGameClick={() => setGameToolOpen(true)}
          onLinesClick={() => setLineToolOpen(true)}
          onPollClick={() => setPollToolOpen(true)}
          onMemoClick={() => setVoiceToolOpen(true)}
        />

        <ChatInput 
          onSend={(content) => sendMessage(content)} 
          isSending={isSending} 
        />
      </div>

      <PracticeLinkTool 
        open={practiceToolOpen} 
        onClose={() => setPracticeToolOpen(false)} 
        onSelect={handleLinkPractice} 
      />
      <GameLinkTool 
        open={gameToolOpen} 
        onClose={() => setGameToolOpen(false)} 
        onSelect={handleLinkGame} 
      />
      <LineBuilderTool 
        open={lineToolOpen} 
        onClose={() => setLineToolOpen(false)} 
        onShare={handleShareLines} 
      />
      <PollTool 
        open={pollToolOpen} 
        onClose={() => setPollToolOpen(false)} 
        onShare={handleSharePoll} 
      />
      <CoachVoiceMemoTool 
        open={voiceToolOpen} 
        onClose={() => setVoiceToolOpen(false)} 
        onShare={handleShareVoice} 
      />
    </Card>
  )
}