import { useState, useRef, useEffect } from 'react'
import { 
  Button, 
  Card, 
  CardContent, 
  Avatar, 
  Input,
  ScrollArea,
  Badge,
  Skeleton,
  toast
} from '@blinkdotnew/ui'
import { Send, MessageSquare, Loader2, Plus, Calendar, Users, ArrowRight } from 'lucide-react'
import { useCoachMessages } from '@/hooks/useCoachMessages'
import { useAuth } from '@/hooks/useAuth'
import { usePlayers } from '@/hooks/usePlayers'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CoachMessageContext } from '@/types'
import { PracticeLinkTool } from './tools/PracticeLinkTool'
import { LineBuilderTool } from './tools/LineBuilderTool'
import { Link, useNavigate } from '@tanstack/react-router'

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
  const [lineToolOpen, setLineToolOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMessagesCount = useRef(messages.length)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return
    sendMessage(content.trim())
    setContent('')
  }

  const handleLinkPractice = (id: string, title: string) => {
    sendMessage(`Check out this practice plan: ${title}`, JSON.stringify({
      type: 'practice_link',
      practiceId: id,
      practiceTitle: title
    }))
  }

  const handleShareLines = (lines: Record<string, string[]>, note: string) => {
    sendMessage(note || 'Proposed new line combinations for brainstorming.', JSON.stringify({
      type: 'line_proposal',
      lines
    }))
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }

    // Show toast for new messages if they weren't sent by current user and chat was already loaded
    if (messages.length > prevMessagesCount.current && !isLoading) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.userId !== user?.id) {
        toast.info(`New message from ${lastMessage.userDisplayName}`, {
          description: lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? '...' : '')
        })
      }
    }
    prevMessagesCount.current = messages.length
  }, [messages, user?.id, isLoading])

  return (
    <Card className={cn("flex flex-col h-[600px] border-border bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden shadow-2xl", className)}>
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter italic italic-700">
              {title || 'Coaches Chat'}
            </h3>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600")} />
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                {isConnected ? 'Realtime Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
          {messages.length} Messages
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-6">
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
                <div key={msg.id} className={cn("flex items-start gap-3", isOwn ? "flex-row-reverse" : "flex-row")}>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-[10px] font-black uppercase shrink-0 mt-1">
                    {msg.userDisplayName?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className={cn("flex flex-col max-w-[80%]", isOwn ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider italic">
                        {isOwn ? 'You' : msg.userDisplayName}
                      </span>
                      <span className="text-[9px] text-zinc-600">
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </span>
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm space-y-3",
                      isOwn 
                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/20" 
                        : "bg-zinc-800/50 border border-white/5 text-foreground rounded-tl-none"
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
                                  "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                  isOwn 
                                    ? "bg-white/10 border-white/20 hover:bg-white/20" 
                                    : "bg-primary/10 border-primary/20 hover:bg-primary/20"
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Linked Practice</p>
                                  <p className="font-bold text-sm truncate">{meta.practiceTitle}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 shrink-0" />
                              </button>
                            )
                          }

                          if (meta.type === 'line_proposal') {
                            return (
                              <div className={cn(
                                "rounded-xl border p-3 space-y-3",
                                isOwn ? "bg-white/5 border-white/10" : "bg-zinc-950/40 border-white/5"
                              )}>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                                  <Users className="w-3 h-3" /> Line Combinations
                                </p>
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

      <div className="p-6 bg-card/50 border-t border-border space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPracticeToolOpen(true)}
            className="rounded-full h-8 text-[10px] uppercase font-black tracking-widest gap-1.5 border-white/5 bg-white/5 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Calendar className="w-3 h-3" /> Link Practice
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLineToolOpen(true)}
            className="rounded-full h-8 text-[10px] uppercase font-black tracking-widest gap-1.5 border-white/5 bg-white/5 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Users className="w-3 h-3" /> Draft Lines
          </Button>
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-3">
          <Input 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your coaching note..."
            className="flex-1 rounded-full bg-zinc-900 border-white/5 h-12 px-6 focus:ring-primary/20"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!content.trim() || isSending}
            className="w-12 h-12 rounded-full shrink-0 shadow-lg shadow-primary/20"
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

      <LineBuilderTool
        open={lineToolOpen}
        onClose={() => setLineToolOpen(false)}
        onShare={handleShareLines}
      />
    </Card>
  )
}
