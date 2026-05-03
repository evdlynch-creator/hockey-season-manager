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
import { Target, ClipboardList, Swords, ShieldAlert, Sparkles, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { staggerItem } from '../../components/Interactivity'
import { HypeCard } from '../../components/HypeCard'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'

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
  const [showRematch, setShowRematch] = useState(false)

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div variants={staggerItem} className="md:col-span-2">
        <HypeCard
          nextGame={upcomingGames[0] ?? null}
          allGames={analyticsGames}
          allReviews={analyticsReviews}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="border-border/50 bg-zinc-950/40 backdrop-blur-sm rounded-[2rem] shadow-xl shadow-black/30 h-full overflow-hidden relative group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-primary" />
              Next Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!nextEvent ? (
              <EmptyState
                title="No upcoming activities"
                description="Schedule a practice or game to get started."
                className="py-4"
              />
            ) : nextEvent.kind === 'practice' ? (
              <button
                onClick={() => onNavigateToEvent('practice', nextEvent.data.id)}
                className="w-full text-left space-y-2 hover:bg-secondary/40 p-3 -m-3 rounded-[1.5rem] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Practice</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{nextEvent.data.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(nextEvent.data.date), 'EEE, MMM d')}
                </p>
              </button>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => onNavigateToEvent('game', nextEvent.data.id)}
                  className="w-full text-left space-y-2 hover:bg-secondary/40 p-3 -m-3 rounded-[1.5rem] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Game</span>
                  </div>
                  <p className="font-semibold text-sm text-foreground">vs. {nextEvent.data.opponent}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(nextEvent.data.date), 'EEE, MMM d')} · {nextEvent.data.location === 'home' ? 'Home' : 'Away'}
                  </p>
                </button>

                {rematchData && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowRematch(true)
                    }}
                    className="w-full mt-4 flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group/rematch animate-pulse hover:animate-none"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Rematch Scout</p>
                        <p className="text-xs font-semibold text-foreground">View history vs. {rematchData.opponent}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary group-hover/rematch:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            )}
          </CardContent>

          {/* Rematch Overlay Dialog */}
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
    </div>
  )
}
