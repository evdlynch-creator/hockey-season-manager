import { format, parseISO } from 'date-fns'
import { Brain, Sparkles, AlertCircle, ArrowRight, Users, BarChart3, Mic, ClipboardList, Target, Rocket, Calendar, Swords, MessageCircle } from 'lucide-react'
import { Badge, Button } from '@blinkdotnew/ui'
import { cn } from '@/lib/utils'
import { JESS_IDENTITY } from '@/lib/jess-ai'
import { usePollVotes } from '@/hooks/usePollVotes'
import { useProposalApproval } from '@/hooks/useProposalApproval'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useMemo } from 'react'
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
      "rounded-2xl border p-4 space-y-4 shadow-xl transition-all duration-300",
      isOwn ? "bg-white/[0.03] border-white/10" : "bg-emerald-500/[0.03] border-emerald-500/10"
    )}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-zinc-300">
          Strategic Poll
        </p>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const voteCount = results[i] || 0
          const percent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
          const isSelected = userVote?.optionIndex === i

          return (
            <button
              key={i}
              onClick={() => castVote(i)}
              className="w-full relative h-11 rounded-xl overflow-hidden border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
            >
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-500",
                  isSelected ? "bg-primary/30" : "bg-white/5"
                )}
                style={{ width: `${percent}%` }}
              />
              <div className="absolute inset-0 px-4 flex items-center justify-between text-xs">
                <span className={cn("font-bold truncate pr-4", isSelected && "text-primary")}>{opt}</span>
                <span className="opacity-50 tabular-nums font-black">{voteCount}</span>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-[9px] text-center text-zinc-500 uppercase font-black tracking-widest italic">
        {totalVotes} total staff votes
      </p>
    </div>
  )
}

function VoiceMemoCard({ audioUrl, isOwn }: { audioUrl: string, isOwn: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border p-3 flex items-center gap-4 shadow-xl transition-all",
      isOwn ? "bg-white/[0.03] border-white/10" : "bg-emerald-500/[0.03] border-emerald-500/10"
    )}>
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
        <Mic className="w-5 h-5 text-primary" />
      </div>
      <audio src={audioUrl} controls className={cn(
        "h-8 flex-1",
        isOwn ? "invert brightness-200" : ""
      )} />
    </div>
  )
}

function LineProposalCard({ 
  message, 
  meta, 
  isOwn, 
  players 
}: { 
  message: CoachMessage, 
  meta: any, 
  isOwn: boolean, 
  players: Player[] 
}) {
  const { user } = useAuth()
  const { status, submitApproval, isSubmitting, pushToRoster } = useProposalApproval(message.id, meta)
  
  const isTagged = meta.taggedUserId === user?.id
  const hasTagged = !!meta.taggedUserId
  const isAuthor = message.userId === user?.id

  return (
    <div className={cn(
      "rounded-[2.5rem] p-6 space-y-6 transition-all duration-500 overflow-hidden relative",
      isOwn 
        ? "bg-black/20 border border-white/10 backdrop-blur-md shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]" 
        : "bg-zinc-950/40 border border-white/5 backdrop-blur-md shadow-2xl"
    )}>
      {/* Subtle Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-[50px] pointer-events-none rounded-full opacity-50" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
          <Users className="w-4 h-4 text-primary" />
        </div>
        
        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-100/90 text-center flex-1">
          Tactical Roster Plan
        </h4>

        <div className="flex items-center gap-2 shrink-0">
          {meta.pushedToGameId && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Rocket className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Deployed</span>
            </div>
          )}
          {hasTagged && !meta.pushedToGameId && (
            <Badge className={cn(
              "text-[8px] h-5 uppercase font-black rounded-full px-2.5 border-none",
              status === 'approved' ? "bg-emerald-500 text-white" :
              status === 'declined' ? "bg-red-500 text-white" :
              status === 'changes_requested' ? "bg-amber-500 text-black" :
              "bg-zinc-800 text-zinc-400"
            )}>
              {status === 'approved' ? 'Approved' :
               status === 'declined' ? 'Declined' :
               status === 'changes_requested' ? 'Changes' :
               `Pending`}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {Object.entries(meta.lines as Record<string, string[]>).map(([unit, pids], idx) => {
          if (pids.length === 0) return null
          return (
            <div key={unit} className="flex items-center gap-4 bg-zinc-950/60 p-3.5 rounded-[1.75rem] border border-white/5 group/unit hover:bg-zinc-950 transition-all duration-300 shadow-lg">
              <span className="text-[9px] font-black uppercase text-primary/50 w-12 shrink-0 italic tracking-tighter pl-1">Line {idx + 1}</span>
              <div className="flex flex-wrap gap-2">
                {pids.map(pid => {
                  const p = players.find(x => x.id === pid)
                  return (
                    <div 
                      key={pid} 
                      className="h-10 rounded-full px-4 bg-black border border-white/5 flex items-center shadow-2xl transition-all hover:scale-105 active:scale-95 group-hover/unit:border-primary/30"
                    >
                      <span className="text-primary text-[10px] font-black mr-2.5">#{p?.number || '??'}</span>
                      <span className="text-sm font-bold text-zinc-100">{p?.name.split(' ').pop()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {isTagged && status === 'pending' && (
        <div className="pt-4 flex items-center gap-3 border-t border-white/10 relative z-10">
          <Button 
            size="sm" 
            onClick={() => submitApproval('approve')}
            disabled={isSubmitting}
            className="h-11 rounded-full text-[10px] font-black uppercase tracking-widest flex-1 bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 gap-2 text-white"
          >
            <Rocket className="w-4 h-4" /> Approve & Deploy
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => submitApproval('request_changes')}
            disabled={isSubmitting}
            className="h-11 rounded-full text-[10px] font-black uppercase tracking-widest px-8 bg-white/5 text-zinc-300 hover:bg-white/10"
          >
            Changes
          </Button>
        </div>
      )}

      {status === 'approved' && isAuthor && !meta.pushedToGameId && (
        <div className="pt-4 border-t border-white/10 relative z-10">
          <Button 
            size="sm" 
            variant="outline"
            onClick={pushToRoster}
            className="w-full h-11 rounded-full text-[10px] font-black uppercase tracking-widest border-primary/40 text-primary hover:bg-primary/10 shadow-lg"
          >
            <Rocket className="w-4 h-4 mr-2.5" /> Sync Roster Refresh
          </Button>
        </div>
      )}
    </div>
  )
}

export function MessageBubble({ message, isOwn, players }: MessageBubbleProps) {
  const navigate = useNavigate()
  const isJess = message.userId === JESS_IDENTITY.userId

  const meta = useMemo(() => {
    if (!message.metadata) return null
    try {
      return JSON.parse(message.metadata)
    } catch (e) {
      return null
    }
  }, [message.metadata])

  const isProposal = meta?.type === 'line_proposal'

  return (
    <div className={cn("flex items-start gap-4 group/msg", isOwn ? "flex-row-reverse" : "flex-row")}>
      {isJess ? (
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 shrink-0 mt-1 animate-pulse-subtle">
          <Sparkles className="w-5 h-5" />
        </div>
      ) : (
        <div className={cn(
          "w-10 h-10 rounded-2xl border flex items-center justify-center text-[10px] font-black uppercase shrink-0 shadow-xl transition-all duration-300 group-hover/msg:scale-105",
          isOwn 
            ? "bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 border-white ring-4 ring-white/5" 
            : "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400 ring-4 ring-emerald-500/5"
        )}>
          {message.userDisplayName?.slice(0, 2).toUpperCase() || '??'}
        </div>
      )}
      
      <div className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", isOwn ? "items-end text-right" : "items-start text-left")}>
        <div className="flex items-center gap-2 mb-2 px-1 text-left">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest italic transition-colors", 
            isOwn ? "text-primary" : isJess ? "text-indigo-400" : "text-emerald-400"
          )}>
            {isOwn ? 'You' : isJess ? 'Jess (AI Analysis)' : message.userDisplayName}
          </span>
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter opacity-60">
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>
        <div className={cn(
          "p-4 rounded-[1.75rem] text-sm leading-relaxed shadow-2xl transition-all duration-300 ring-1 text-left",
          isOwn 
            ? "bg-primary text-primary-foreground rounded-tr-none border-primary/20 ring-primary/10 group-hover/msg:shadow-primary/10" 
            : isJess
              ? "bg-indigo-950/20 border border-indigo-500/20 text-zinc-100 rounded-tl-none ring-indigo-500/10 group-hover/msg:shadow-indigo-500/5"
              : "bg-zinc-900/60 border-white/5 text-zinc-100 rounded-tl-none ring-white/5 group-hover/msg:bg-zinc-900/80"
        )}>
          <div className={cn(
            "text-left whitespace-pre-wrap", 
            isJess && "italic font-medium leading-relaxed",
            isProposal && "text-base font-black uppercase tracking-tight italic"
          )}>
            {message.content}
          </div>

          {meta && (() => {
            if (meta.type === 'jess_analysis' || meta.type === 'jess_debrief' || meta.type === 'jess_reminder') {
              const isHigh = meta.priority === 'high'
              const isDebrief = meta.type === 'jess_debrief'

              return (
                <div className={cn(
                  "mt-3 p-3 rounded-xl border flex flex-col gap-3",
                  isHigh ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/10"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isHigh ? "bg-indigo-500/20 text-indigo-400" : "bg-white/10 text-zinc-400"
                    )}>
                      {meta.type === 'jess_reminder' ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">
                        {meta.type === 'jess_analysis' ? 'Tactical Insight' : meta.type === 'jess_reminder' ? 'Strategic Alert' : 'Post-Game Debrief'}
                      </p>
                      
                      {isDebrief && meta.summaryData && (
                        <div className="mt-2 space-y-3 text-left">
                          <div className="flex items-center justify-between bg-black/40 rounded-lg p-2 border border-white/5">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Opponent</p>
                              <p className="text-xs font-black truncate uppercase italic">vs. {meta.summaryData.opponent}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Final</p>
                              <p className="text-xs font-black text-indigo-400">{meta.summaryData.score}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400/60 flex items-center gap-1.5">
                              <Target className="w-2.5 h-2.5" /> Tactical Highlights
                            </p>
                            <div className="space-y-1">
                              {meta.summaryData.tacticalHighlights.map((h: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-300 leading-tight">
                                  <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                  <span>{h}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {meta.gameId && (
                        <button 
                          onClick={() => navigate({ to: '/games/$gameId', params: { gameId: meta.gameId } })}
                          className="mt-2 text-[10px] font-bold text-indigo-400 hover:underline flex items-center gap-1 uppercase tracking-tighter"
                        >
                          View Tactical Review <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            if (meta.type === 'practice_link') {
              return (
                <button 
                  onClick={() => navigate({ to: '/practices/$practiceId', params: { practiceId: meta.practiceId } })}
                  className={cn(
                    "w-full mt-4 flex items-center justify-between p-4 rounded-2xl border transition-all text-left group/btn shadow-lg",
                    isOwn 
                      ? "bg-white/10 border-white/10 hover:bg-white/15" 
                      : "bg-primary/10 border-primary/10 hover:bg-primary/20"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-zinc-300">Linked Practice • {meta.practiceDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="h-4 px-1.5 text-[8px] font-black bg-primary text-primary-foreground border-none rounded-full shrink-0 uppercase tracking-widest italic">#{meta.practiceIndex || '?'}</Badge>
                      <p className="font-black text-sm uppercase tracking-tight group-hover/btn:translate-x-1 transition-transform text-zinc-100">{meta.practiceTitle}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shrink-0 border border-white/5 group-hover/btn:border-primary/30 transition-all">
                    <ArrowRight className="w-5 h-5 opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all text-primary" />
                  </div>
                </button>
              )
            }

            if (meta.type === 'game_link') {
              return (
                <button 
                  onClick={() => navigate({ to: '/games/$gameId', params: { gameId: meta.gameId } })}
                  className={cn(
                    "w-full mt-4 flex items-center justify-between p-4 rounded-2xl border transition-all text-left group/btn shadow-lg",
                    isOwn 
                      ? "bg-white/10 border-white/10 hover:bg-white/15" 
                      : "bg-primary/10 border-primary/10 hover:bg-primary/20"
                  )}
                >
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Swords className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 text-zinc-300">Strategic Reference • {meta.gameDate}</p>
                    </div>
                    <p className="font-black text-base italic uppercase tracking-tighter group-hover/btn:translate-x-1 transition-transform text-zinc-100">vs. {meta.opponent}</p>
                    {meta.score && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className="bg-primary/20 text-primary border-none text-[9px] h-4 font-black rounded-full px-2 uppercase tracking-widest">RESULT: {meta.score}</Badge>
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shrink-0 border border-white/5 group-hover/btn:border-primary/30 transition-all">
                    <ArrowRight className="w-5 h-5 opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all text-primary" />
                  </div>
                </button>
              )
            }

            if (meta.type === 'line_proposal') {
              return <LineProposalCard message={message} meta={meta} isOwn={isOwn} players={players} />
            }

            if (meta.type === 'strategic_poll') {
              return <PollCard messageId={message.id} options={meta.options} isOwn={isOwn} />
            }

            if (meta.type === 'voice_memo') {
              return <VoiceMemoCard audioUrl={meta.audioUrl} isOwn={isOwn} />
            }

            if (meta.type === 'post_game_report') {
              return (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Tactical Briefing</span>
                    <Badge className="bg-amber-500/20 text-amber-500 border-none text-[8px] h-4 font-black rounded-full uppercase px-2 ml-auto">Finalized</Badge>
                  </div>
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3 shadow-xl">
                    <div className="space-y-1">
                      <p className="font-black text-sm uppercase italic tracking-tighter text-zinc-100">vs. {meta.opponent}</p>
                      <p className="text-[9px] font-black opacity-60 uppercase tracking-widest text-primary">Result: {meta.score}</p>
                    </div>
                    <p className="text-[11px] italic line-clamp-4 opacity-80 border-l-2 border-primary/40 pl-3 leading-relaxed text-zinc-300">
                      {meta.summary}
                    </p>
                    <Button 
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate({ to: '/games/$gameId', params: { gameId: meta.gameId } })}
                      className="w-full justify-center gap-2 text-[9px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 hover:bg-amber-500/5 transition-all mt-2 h-8 rounded-full border border-amber-500/20"
                    >
                      Open Full Analysis <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            }

            return null
          })()}
        </div>
      </div>
    </div>
  )
}
