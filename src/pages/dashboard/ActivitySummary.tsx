import React, { useState, useMemo } from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
  Separator
} from '@blinkdotnew/ui'
import { Target, ClipboardList, Swords, ShieldAlert, Sparkles, ChevronRight, TrendingUp, TrendingDown, Inbox, Mail, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { staggerItem } from '../../components/Interactivity'
import { HypeCard } from '../../components/HypeCard'
import { useMyPendingProposals } from '@/hooks/useMyPendingProposals'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'

const CONCEPT_FIELD_MAP: Record<string, string> = {
  'Breakouts': 'breakoutsRating',
  'Forecheck': 'forecheckRating',
  'Defensive Zone': 'defensiveZoneRating',
  'Zone Entry': 'zoneEntryRating',
  'Offensive Zone': 'offensiveZoneRating',
  'Passing': 'passingRating',
  'Skating': 'skatingRating',
}

interface ActivitySummaryProps {
  upcomingGames: any[]
  analyticsGames: any[]
  analyticsReviews: any[]
  nextEvent: any
  onNavigateToEvent: (kind: string, id: string) => void
}

export const ActivitySummary = ({ 
  upcomingGames, 
  analyticsGames, 
  analyticsReviews, 
  nextEvent,
  onNavigateToEvent
}: ActivitySummaryProps) => {
  const navigate = useNavigate()
  const [showRematch, setShowRematch] = useState(false)
  const { data: mailboxData, isLoading: mailboxLoading } = useMyPendingProposals()
  const pending = mailboxData?.received || []

  const rematchData = useMemo(() => {
    if (!nextEvent || nextEvent.kind !== 'game') return null
    
    const opponent = nextEvent.data.opponent
    const pastGames = analyticsGames.filter(g => 
      g.opponent === opponent && 
      g.id !== nextEvent.data.id &&
      g.goalsFor != null
    )

    if (pastGames.length === 0) return null

    const pastReviews = analyticsReviews.filter(r => 
      pastGames.some(g => g.id === r.gameId)
    )

    const avgRatings = CONCEPTS.reduce((acc, c) => {
      const field = CONCEPT_FIELD_MAP[c]
      const vals = pastReviews.map(r => r[field]).filter(v => v != null).map(Number)
      acc[c] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      return acc
    }, {} as Record<string, number | null>)

    const wins = pastGames.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
    const losses = pastGames.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
    const ties = pastGames.length - wins - losses

    return {
      opponent,
      pastGames,
      wins,
      losses,
      ties,
      avgRatings,
      notes: pastReviews.map(r => r.opponentNotes).filter(Boolean) as string[]
    }
  }, [nextEvent, analyticsGames, analyticsReviews])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      <motion.div variants={staggerItem} className="md:col-span-2 h-full">
        <Card className="border-border/50 bg-zinc-950/40 backdrop-blur-sm rounded-[2rem] shadow-xl shadow-black/30 h-full overflow-hidden relative group">
          <CardHeader className="pb-2 p-6">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">Coach's Mailbox</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-0.5">Tactical Approvals & Staff Comms</p>
                </div>
              </div>
              {pending.length > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[9px] font-black h-5 px-3 rounded-full animate-pulse">
                  {pending.length} ACTION REQUIRED
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-6rem)] p-6 pt-2">
            <div className="flex-1 space-y-3 min-h-0 overflow-hidden mb-6">
              {mailboxLoading ? (
                <div className="space-y-3">
                  <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                  <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                  <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                </div>
              ) : pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700 shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Mailbox Clear</p>
                    <p className="text-xs text-zinc-600 mt-1 max-w-[200px]">No pending tactical proposals or strategy reviews need your attention.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {pending.slice(0, 5).map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => navigate({ to: '/coaches-board', search: (prev) => ({ ...prev, tab: 'mailbox' }) as any })}
                      className="p-4 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-primary/20 transition-all cursor-pointer group/item relative"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          {item.userDisplayName || 'Staff member'}
                        </span>
                        <span className="text-[9px] text-zinc-500 ml-auto font-medium">
                          {format(parseISO(item.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed pl-5 font-medium italic">
                        "{item.content}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={() => navigate({ to: '/coaches-board', search: (prev) => ({ ...prev, tab: 'mailbox' }) as any })}
              variant="default"
              className="w-full rounded-full gap-2 text-[11px] font-black uppercase tracking-widest italic h-12 shadow-xl shadow-primary/20"
            >
              <Mail className="w-4 h-4" />
              Open Coaching Command Center
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>

          {/* Rematch Overlay Dialog remains the same */}
          <Dialog open={showRematch} onOpenChange={setShowRematch}>
            <DialogContent className="sm:max-w-lg bg-zinc-950/90 backdrop-blur-xl border-white/10 rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl italic font-black uppercase tracking-tighter">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Rematch Prep: {rematchData?.opponent}
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Tactical history from previous meetings this season.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Record</p>
                    <p className="text-lg font-black italic">{rematchData?.wins}–{rematchData?.losses}–{rematchData?.ties}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Last Meeting</p>
                    <p className="text-sm font-bold text-foreground">
                      {rematchData?.pastGames[0] && format(parseISO(rematchData.pastGames[0].date), 'MMM d, yyyy')}
                      {' '}· {rematchData?.pastGames[0]?.goalsFor}–{rematchData?.pastGames[0]?.goalsAgainst}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Historical Concept Grades</p>
                  <div className="grid grid-cols-2 gap-2">
                    {rematchData && CONCEPTS.map(c => {
                      const val = rematchData.avgRatings[c]
                      return (
                        <div key={c} className="flex items-center justify-between p-2 rounded-full bg-white/5 border border-white/5 px-4">
                          <span className="text-[11px] font-medium text-zinc-300">{c}</span>
                          <span className={cn(
                            "text-xs font-bold tabular-nums",
                            val && val >= 3.5 ? "text-emerald-400" : val && val <= 2.5 ? "text-red-400" : "text-zinc-400"
                          )}>
                            {val ? val.toFixed(1) : '—'}/5
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {rematchData?.notes.length ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Opponent Tendencies</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {rematchData.notes.map((note, i) => (
                        <div key={i} className="p-3 rounded-[1.5rem] bg-primary/5 border border-primary/10">
                          <p className="text-xs italic text-foreground leading-relaxed">"{note}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button 
                  className="rounded-full bg-primary font-bold px-8 shadow-lg shadow-primary/20"
                  onClick={() => setShowRematch(false)}
                >
                  Got it, Coach
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} className="md:col-span-1 h-full">
        <HypeCard
          nextGame={upcomingGames[0] ?? null}
          allGames={analyticsGames}
          allReviews={analyticsReviews}
          className="h-full"
        />
      </motion.div>
    </div>
  )
}
