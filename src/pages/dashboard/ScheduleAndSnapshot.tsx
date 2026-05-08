import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@blinkdotnew/ui'
import { Calendar as CalendarIcon, Activity, ClipboardList, Swords, ChevronRight, TrendingUp, TrendingDown, Brain } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { staggerItem, AnimatedCounter } from '../../components/Interactivity'
import { ConceptRadarChart } from '../../components/analytics/ConceptRadarChart'

interface ScheduleAndSnapshotProps {
  upcomingEvents: any[]
  recentCompleted: any[]
  snapshotW: number
  snapshotL: number
  snapshotT: number
  avgGF: number
  avgGA: number
  snapshotGF: number
  snapshotGA: number
  working: any[]
  hurting: any[]
  hurtNarrative: string
  radarData: any[]
  onNavigateToEvent: (kind: string, id: string) => void
  onNavigateToTrends: () => void
}

export const ScheduleAndSnapshot = ({
  upcomingEvents,
  recentCompleted,
  snapshotW,
  snapshotL,
  snapshotT,
  avgGF,
  avgGA,
  snapshotGF,
  snapshotGA,
  working,
  hurting,
  hurtNarrative,
  radarData,
  onNavigateToEvent,
  onNavigateToTrends
}: ScheduleAndSnapshotProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-stretch">
      <motion.div variants={staggerItem} className="h-full">
        <Card className="border-border/50 rounded-[2rem] shadow-xl shadow-black/30 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nothing scheduled.</p>
            ) : (
              upcomingEvents.map(ev => (
                <button
                  key={`${ev.kind}-${ev.data.id}`}
                  onClick={() => onNavigateToEvent(ev.kind, ev.data.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-full bg-secondary/40 hover:bg-secondary/60 transition-colors text-left"
                >
                  {ev.kind === 'practice' ? (
                    <ClipboardList className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Swords className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ev.kind === 'practice' ? ev.data.title : `vs. ${ev.data.opponent}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(ev.data.date), 'EEE, MMM d')}
                      {ev.kind === 'game' && ` · ${ev.data.location === 'home' ? 'Home' : 'Away'}`}
                    </p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} id="tour-snapshot" className="h-full">
        <Card className="border-border/50 rounded-[2rem] shadow-xl shadow-black/30 h-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-primary" />
                  Team Snapshot
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Rolling form over the last {recentCompleted.length || 'few'} game{recentCompleted.length === 1 ? '' : 's'}.
                </CardDescription>
              </div>
              <button
                onClick={onNavigateToTrends}
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5 shrink-0 mt-1"
              >
                Full trends <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCompleted.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Play and review a game to see your rolling form here.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-full bg-secondary/40 border border-border/40 p-4 sm:p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Record</p>
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xl font-bold tabular-nums text-emerald-400"><AnimatedCounter value={snapshotW} /></span>
                      <span className="text-xs text-muted-foreground">W</span>
                      <span className="text-xl font-bold tabular-nums text-red-400"><AnimatedCounter value={snapshotL} /></span>
                      <span className="text-xs text-muted-foreground">L</span>
                      {snapshotT > 0 && (
                        <>
                          <span className="text-xl font-bold tabular-nums text-muted-foreground"><AnimatedCounter value={snapshotT} /></span>
                          <span className="text-xs text-muted-foreground">T</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1.5 flex gap-0.5">
                      {recentCompleted.slice().reverse().map(g => {
                        const gf = Number(g.goalsFor)
                        const ga = Number(g.goalsAgainst)
                        const r = gf > ga ? 'W' : gf < ga ? 'L' : 'T'
                        return (
                          <span
                            key={g.id}
                            title={`${g.opponent}: ${gf}–${ga}`}
                            className={cn(
                              'flex-1 h-1.5 rounded-full',
                              r === 'W' && 'bg-emerald-500',
                              r === 'L' && 'bg-red-500',
                              r === 'T' && 'bg-muted-foreground/40',
                            )}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-full bg-secondary/40 border border-border/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Goals (avg)</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold tabular-nums text-foreground"><AnimatedCounter value={avgGF} decimals={1} /></span>
                      <span className="text-xs text-muted-foreground">for</span>
                      <span className="text-xl font-bold tabular-nums text-foreground"><AnimatedCounter value={avgGA} decimals={1} /></span>
                      <span className="text-xs text-muted-foreground">against</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                      Total: <AnimatedCounter value={snapshotGF} />–<AnimatedCounter value={snapshotGA} /> ({snapshotGF - snapshotGA >= 0 ? '+' : ''}{snapshotGF - snapshotGA})
                    </p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">What's working</p>
                  </div>
                  {working.length ? (
                    <ul className="space-y-1">
                      {working.map(c => (
                        <li key={c.concept} className="text-xs text-foreground flex items-center justify-between gap-2">
                          <span className="font-medium">{c.concept}</span>
                          <span className="text-emerald-400 tabular-nums font-semibold">
                            {c.avg.toFixed(1)}/5
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No concept is consistently grading 3.5+ yet.
                    </p>
                  )}
                </div>

                <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-400">What's hurting you</p>
                  </div>
                  {hurting.length ? (
                    <>
                      <ul className="space-y-1">
                        {hurting.map(c => (
                          <li key={c.concept} className="text-xs text-foreground flex items-center justify-between gap-2">
                            <span className="font-medium">{c.concept}</span>
                            <span className="text-red-400 tabular-nums font-semibold">
                              {c.avg.toFixed(1)}/5
                            </span>
                          </li>
                        ))}
                      </ul>
                      {hurtNarrative && (
                        <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
                          {hurtNarrative}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No clear weak spot in the recent window.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} className="h-full">
        <ConceptRadarChart data={radarData} />
      </motion.div>
    </div>
  )
}
