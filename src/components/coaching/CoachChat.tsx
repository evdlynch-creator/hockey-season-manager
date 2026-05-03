import { useState, useRef, useEffect } from 'react'
import { 
  Button, 
  Card, 
  Badge,
  Skeleton,
  Input,
  ScrollArea
} from '@blinkdotnew/ui'
import { Send, MessageSquare, Loader2, Plus, Calendar, Users, ArrowRight, BarChart3, Mic, Play, Pause, ClipboardList, Swords } from 'lucide-react'
import { useCoachMessages } from '@/hooks/useCoachMessages'
import { useAuth } from '@/hooks/useAuth'
import { usePlayers } from '@/hooks/usePlayers'
import { usePollVotes } from '@/hooks/usePollVotes'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CoachMessageContext } from '@/types'
import { PracticeLinkTool } from './tools/PracticeLinkTool'
import { LineBuilderTool } from './tools/LineBuilderTool'
import { GameLinkTool } from './tools/GameLinkTool'
import { PollTool } from './tools/PollTool'
import { CoachVoiceMemoTool } from './tools/CoachVoiceMemoTool'
import { ChatEventPrompt } from './ChatEventPrompt'
import { useNavigate } from '@tanstack/react-router'

interface CoachChatProps {
  contextType: CoachMessageContext
  contextId?: string | null
  className?: string
  title?: string
}

export function CoachChat({ contextType, contextId = null, className, title }: CoachChatProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: players = [] } = usePlayers()
  const { messages, isLoading, isConnected, sendMessage, isSending } = useCoachMessages(contextType, contextId)
  const [content, setContent] = useState('')
  const [practiceToolOpen, setPracticeToolOpen] = useState(false)
  const [gameToolOpen, setGameToolOpen] = useState(false)
  const [lineToolOpen, setLineToolOpen] = useState(false)
  const [pollToolOpen, setPollToolOpen] = useState(false)
  const [voiceToolOpen, setVoiceToolOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMessagesCount = useRef(messages.length)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return
    sendMessage(content.trim())
    setContent('')
  }

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
    prevMessagesCount.current = messages.length
  }, [messages, isLoading])

  function PollCard({ messageId, options, isOwn }: { messageId: string, options: string[], isOwn: boolean }) {
    const { results, userVote, castVote, votes } = usePollVotes(messageId)
    const totalVotes = votes.length

    return (
      <div className={cn(
        "rounded-xl border p-3 space-y-3",
        isOwn ? "bg-white/5 border-white/10" : "bg-zinc-950/40 border-white/5"
      )}>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3" /> Strategic Poll
        </p>
        <div className="space-y-2">
          {options.map((opt, i) => {
            const voteCount = results[i] || 0
            const percent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
            const isSelected = userVote?.optionIndex === i

            return (
              <button
                key={i}
                onClick={() => castVote(i)}
                className="w-full relative h-9 rounded-lg overflow-hidden border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all duration-500",
                    isSelected ? "bg-primary/30" : "bg-white/5"
                  )}
                  style={{ width: `${percent}%` }}
                />
                <div className="absolute inset-0 px-3 flex items-center justify-between text-xs">
                  <span className={cn("font-bold truncate pr-4", isSelected && "text-primary")}>{opt}</span>
                  <span className="opacity-50 tabular-nums">{voteCount}</span>
                </div>
              </button>
            )
          })}
        </div>
        <p className="text-[9px] text-center text-zinc-500 uppercase font-black tracking-widest">
          {totalVotes} total votes
        </p>
      </div>
    )
  }

  function VoiceMemoCard({ audioUrl, isOwn }: { audioUrl: string, isOwn: boolean }) {
    return (
      <div className={cn(
        "rounded-xl border p-2 flex items-center gap-3",
        isOwn ? "bg-white/5 border-white/10" : "bg-zinc-950/40 border-white/5"
      )}>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Mic className="w-4 h-4 text-primary" />
        </div>
        <audio src={audioUrl} controls className={cn(
          "h-8 flex-1",
          isOwn ? "invert brightness-200" : ""
        )} />
      </div>
    )
  }

  return (
    <Card className={cn("flex flex-col h-[600px] border-border bg-card/30 backdrop-blur-[20px] rounded-[2.5rem] overflow-hidden shadow-2xl", className)}>
      <div className="p-6 border-b border-white/5 bg-zinc-900/40 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner rotate-3">
            <MessageSquare className="w-6 h-6 -rotate-3" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter italic italic-700 leading-none">
              {title || 'Coaches Chat'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-zinc-600")} />
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                {isConnected ? 'Realtime Operational' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full text-[10px] font-black border-white/10 bg-white/5 text-zinc-400 px-3 py-1">
          {messages.length} LITS
        </Badge>
      </div>

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
            messages.map((msg) => {
              const isOwn = msg.userId === user?.id
              return (
                <div key={msg.id} className={cn("flex items-start gap-4", isOwn ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-10 h-10 rounded-2xl border flex items-center justify-center text-[10px] font-black uppercase shrink-0 shadow-lg",
                    isOwn ? "bg-zinc-100 text-zinc-900 border-white" : "bg-zinc-800 border-white/10 text-zinc-400"
                  )}>
                    {msg.userDisplayName?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className={cn("flex flex-col max-w-[85%]", isOwn ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className={cn("text-[10px] font-black uppercase tracking-wider italic", isOwn ? "text-primary" : "text-zinc-500")}>
                        {isOwn ? 'You' : msg.userDisplayName}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-medium uppercase">
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </span>
                    </div>
                    <div className={cn(
                      "p-4 rounded-[1.75rem] text-sm leading-relaxed shadow-xl",
                      isOwn 
                        ? "bg-primary text-primary-foreground rounded-tr-none border border-primary/20" 
                        : "bg-zinc-900/80 border border-white/5 text-zinc-100 rounded-tl-none"
                    )}>
                      {msg.content}

                      {msg.metadata && (() => {
                        try {
                          const meta = JSON.parse(msg.metadata)
                          
                          if (meta.type === 'practice_link') {
                            return (
                              <button 
                                onClick={() => navigate({ to: '/practices/$practiceId', params: { practiceId: meta.practiceId } })}
                                className={cn(
                                  "w-full mt-3 flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group/btn",
                                  isOwn 
                                    ? "bg-white/10 border-white/20 hover:bg-white/20" 
                                    : "bg-primary/10 border-primary/20 hover:bg-primary/20"
                                )}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className="h-4 px-1.5 text-[8px] font-black uppercase rounded-full bg-primary text-primary-foreground">#{meta.practiceIndex || '?'}</Badge>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Linked Practice • {meta.practiceDate}</p>
                                  </div>
                                  <p className="font-bold text-sm truncate group-hover/btn:translate-x-1 transition-transform">{meta.practiceTitle}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                  <ArrowRight className="w-4 h-4 shrink-0 opacity-40 group-hover/btn:opacity-100 transition-opacity text-primary" />
                                </div>
                              </button>
                            )
                          }

                          if (meta.type === 'game_link') {
                            return (
                              <button 
                                onClick={() => navigate({ to: '/games/$gameId', params: { gameId: meta.gameId } })}
                                className={cn(
                                  "w-full mt-3 flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group/btn",
                                  isOwn 
                                    ? "bg-white/10 border-white/20 hover:bg-white/20" 
                                    : "bg-primary/10 border-primary/20 hover:bg-primary/20"
                                )}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className="h-4 px-1.5 text-[8px] font-black uppercase rounded-full bg-primary text-primary-foreground">GAME</Badge>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Linked Game • {meta.gameDate}</p>
                                  </div>
                                  <p className="font-bold text-sm truncate group-hover/btn:translate-x-1 transition-transform">vs. {meta.opponent}</p>
                                  {meta.score && <p className="text-[10px] font-black text-primary/60 uppercase mt-1 tracking-widest leading-none">Result: {meta.score}</p>}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                  <ArrowRight className="w-4 h-4 shrink-0 opacity-40 group-hover/btn:opacity-100 transition-opacity text-primary" />
                                </div>
                              </button>
                            )
                          }

                          if (meta.type === 'line_proposal') {
                            return (
                              <div className={cn(
                                "rounded-xl border p-3 space-y-3",
                                isOwn ? "bg-white/5 border-white/10" : "bg-zinc-950/40 border-white/5"
                              )}>
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                                    <Users className="w-3 h-3" /> Line Combinations
                                  </p>
                                  {meta.pushedToGameId && (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] h-4 uppercase font-black rounded-full">
                                      Deployed
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {Object.entries(meta.lines as Record<string, string[]>).map(([unit, pids]) => {
                                    if (pids.length === 0) return null
                                    return (
                                      <div key={unit} className="flex items-start gap-2">
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 w-12 shrink-0 mt-0.5">{unit}</span>
                                        <div className="flex flex-wrap gap-1">
                                          {pids.map(pid => {
                                            const p = players.find(x => x.id === pid)
                                            return (
                                              <Badge 
                                                key={pid} 
                                                variant="outline" 
                                                className={cn(
                                                  "text-[9px] h-5 rounded-full px-1.5 font-bold",
                                                  isOwn ? "border-white/20 text-white" : "border-primary/20 text-primary"
                                                )}
                                              >
                                                {p?.name.split(' ').pop()}
                                              </Badge>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          }

                          if (meta.type === 'strategic_poll') {
                            return <PollCard messageId={msg.id} options={meta.options} isOwn={isOwn} />
                          }

                          if (meta.type === 'voice_memo') {
                            return <VoiceMemoCard audioUrl={meta.audioUrl} isOwn={isOwn} />
                          }

                          if (meta.type === 'post_game_report') {
                            return (
                              <button 
                                onClick={() => navigate({ to: '/games/$gameId', params: { gameId: meta.gameId } })}
                                className={cn(
                                  "w-full p-4 rounded-xl border transition-all text-left space-y-3",
                                  isOwn 
                                    ? "bg-white/10 border-white/20 hover:bg-white/20" 
                                    : "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-amber-500">
                                    <ClipboardList className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Tactical Briefing</span>
                                  </div>
                                  <Badge className="bg-amber-500/20 text-amber-500 border-none text-[8px] h-4 font-black rounded-full uppercase">Finalized</Badge>
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-sm">vs. {meta.opponent}</p>
                                  <p className="text-[10px] opacity-60">Result: {meta.score}</p>
                                </div>
                                <p className="text-[11px] italic line-clamp-3 opacity-80 border-l-2 border-white/20 pl-3">
                                  {meta.summary}
                                </p>
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-amber-500/80 pt-1">
                                  View Full Breakdown <ArrowRight className="w-3 h-3" />
                                </div>
                              </button>
                            )
                          }
                        } catch (e) {
                          return null
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-6 bg-zinc-950/40 border-t border-white/5 space-y-4 backdrop-blur-lg">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => setPracticeToolOpen(true)}
            className="rounded-full h-8 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 border border-white/5 bg-zinc-900/50 hover:bg-primary hover:text-primary-foreground transition-all shrink-0 px-4"
          >
            <Calendar className="w-3 h-3" /> Practice
          </button>
          <button 
            onClick={() => setGameToolOpen(true)}
            className="rounded-full h-8 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 border border-white/5 bg-zinc-900/50 hover:bg-primary hover:text-primary-foreground transition-all shrink-0 px-4"
          >
            <Swords className="w-3 h-3" /> Game Link
          </button>
          <button 
            onClick={() => setLineToolOpen(true)}
            className="rounded-full h-8 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 border border-white/5 bg-zinc-900/50 hover:bg-primary hover:text-primary-foreground transition-all shrink-0 px-4"
          >
            <Users className="w-3 h-3" /> Lines
          </button>
          <button 
            onClick={() => setPollToolOpen(true)}
            className="rounded-full h-8 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 border border-white/5 bg-zinc-900/50 hover:bg-primary hover:text-primary-foreground transition-all shrink-0 px-4"
          >
            <BarChart3 className="w-3 h-3" /> Poll
          </button>
          <button 
            onClick={() => setVoiceToolOpen(true)}
            className="rounded-full h-8 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 border border-white/5 bg-zinc-900/50 hover:bg-primary hover:text-primary-foreground transition-all shrink-0 px-4"
          >
            <Mic className="w-3 h-3" /> Memo
          </button>
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-3">
          <Input 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your coaching note..."
            className="flex-1 rounded-full bg-zinc-900 border-white/10 h-12 px-6 focus:ring-primary/20 text-sm"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!content.trim() || isSending}
            className="w-12 h-12 rounded-full shrink-0 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
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