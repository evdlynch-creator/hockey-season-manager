import { format } from 'date-fns'
import { Brain, Sparkles, AlertCircle, ArrowRight, Users, BarChart3, Mic, ClipboardList } from 'lucide-react'
import { Badge } from '@blinkdotnew/ui'
import { cn } from '@/lib/utils'
import { JESS_IDENTITY } from '@/lib/jess-ai'
import { usePollVotes } from '@/hooks/usePollVotes'
import { useNavigate } from '@tanstack/react-router'
import type { Player, CoachMessage } from '@/types'

interface MessageBubbleProps {
  message: CoachMessage
  isOwn: boolean
  players: Player[]
}

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

export function MessageBubble({ message, isOwn, players }: MessageBubbleProps) {
  const navigate = useNavigate()
  const isJess = message.userId === JESS_IDENTITY.userId

  return (
    <div className={cn("flex items-start gap-4", isOwn ? "flex-row-reverse" : "flex-row")}>
      {isJess ? (
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 shrink-0 mt-1 animate-pulse-subtle">
          <Sparkles className="w-5 h-5" />
        </div>
      ) : (
        <div className={cn(
          "w-10 h-10 rounded-2xl border flex items-center justify-center text-[10px] font-black uppercase shrink-0 shadow-lg",
          isOwn ? "bg-zinc-100 text-zinc-900 border-white" : "bg-zinc-800 border-white/10 text-zinc-400"
        )}>
          {message.userDisplayName?.slice(0, 2).toUpperCase() || '??'}
        </div>
      )}
      
      <div className={cn("flex flex-col max-w-[85%]", isOwn ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span className={cn("text-[10px] font-black uppercase tracking-wider italic", isOwn ? "text-primary" : isJess ? "text-indigo-400 font-black" : "text-zinc-500")}>
            {isOwn ? 'You' : isJess ? 'Jess (AI Staff)' : message.userDisplayName}
          </span>
          <span className="text-[9px] text-zinc-600 font-medium uppercase">
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>
        <div className={cn(
          "p-4 rounded-[1.75rem] text-sm leading-relaxed shadow-xl transition-all",
          isOwn 
            ? "bg-primary text-primary-foreground rounded-tr-none border border-primary/20" 
            : isJess
              ? "bg-indigo-950/20 border border-indigo-500/20 text-zinc-100 rounded-tl-none ring-1 ring-indigo-500/10"
              : "bg-zinc-900/80 border border-white/5 text-zinc-100 rounded-tl-none"
        )}>
          <div className={cn(isJess && "italic font-medium")}>
            {message.content}
          </div>

          {message.metadata && (() => {
            try {
              const meta = JSON.parse(message.metadata)
              
              if (meta.type === 'jess_analysis' || meta.type === 'jess_debrief' || meta.type === 'jess_reminder') {
                const isHigh = meta.priority === 'high'
                return (
                  <div className={cn(
                    "mt-3 p-3 rounded-xl border flex items-start gap-3",
                    isHigh ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/10"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isHigh ? "bg-indigo-500/20 text-indigo-400" : "bg-white/10 text-zinc-400"
                    )}>
                      {meta.type === 'jess_reminder' ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">
                        {meta.type === 'jess_analysis' ? 'Tactical Insight' : meta.type === 'jess_reminder' ? 'Strategic Alert' : 'Post-Game Debrief'}
                      </p>
                      {meta.gameId && (
                        <button 
                          onClick={() => navigate({ to: '/games/$gameId', params: { gameId: meta.gameId } })}
                          className="text-[10px] font-bold text-indigo-400 hover:underline block"
                        >
                          View Related Game Reference
                        </button>
                      )}
                    </div>
                  </div>
                )
              }

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
                return <PollCard messageId={message.id} options={meta.options} isOwn={isOwn} />
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
}
