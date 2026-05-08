import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, EmptyState, Badge } from '@blinkdotnew/ui'
import { BarChart3, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { staggerItem } from '../../components/Interactivity'

interface ConceptTrendsProps {
  teamData: any
  analytics: any
  onNavigateToConcepts: () => void
}

export const ConceptTrends = ({ teamData, analytics, onNavigateToConcepts }: ConceptTrendsProps) => {
  const priorityList: string[] = teamData.season?.priorityConcepts
    ? JSON.parse(teamData.season.priorityConcepts)
    : []
  const allSummaries = analytics
    ? Object.values(analytics.byConcept)
    : []
  const sorted = [...allSummaries].sort((a: any, b: any) => {
    const ap = priorityList.includes(a.concept) ? 0 : 1
    const bp = priorityList.includes(b.concept) ? 0 : 1
    if (ap !== bp) return ap - bp
    return (b.latestAvg ?? 0) - (a.latestAvg ?? 0)
  })

  if (!sorted.length) {
    return (
      <motion.div variants={staggerItem}>
        <Card className="mt-6 border-border/50 rounded-[2rem] shadow-xl shadow-black/30">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading concept analytics…
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const hasAnyData = sorted.some((s: any) => s.latestAvg != null)

  return (
    <motion.div variants={staggerItem}>
      <Card className="mt-6 border-border/50 rounded-[2rem] shadow-xl shadow-black/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-primary" />
                Concept Trends
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Latest combined practice + game ratings, sorted by priority.
              </CardDescription>
            </div>
            <button
              onClick={onNavigateToConcepts}
              className="text-[11px] text-primary hover:underline flex items-center gap-0.5 shrink-0 mt-1"
            >
              View all concepts <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasAnyData ? (
            <EmptyState
              title="No ratings yet"
              description="Rate practice segments or game performance to populate trends."
              className="py-4"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sorted.map((s: any) => {
                const isPriority = priorityList.includes(s.concept)
                const trendUp = s.trend > 0.2
                const trendDown = s.trend < -0.2
                return (
                  <button
                    key={s.concept}
                    onClick={onNavigateToConcepts}
                    className={cn(
                      'text-left rounded-[2rem] border p-3 transition-colors hover:bg-secondary/40',
                      isPriority ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-background'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">{s.concept}</p>
                          {isPriority && (
                            <Badge className="bg-primary/15 text-primary border-primary/25 border text-[9px] px-1.5 py-0 h-4 rounded-full">
                              P
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {s.practicePoints} prac · {s.gamePoints} games
                        </p>
                      </div>
                      <span className="text-lg font-bold tabular-nums text-foreground">
                        {s.latestAvg != null ? s.latestAvg.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px]">
                      {trendUp && <><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 font-mono">+{s.trend.toFixed(1)}</span></>}
                      {trendDown && <><TrendingDown className="w-3 h-3 text-red-400" /><span className="text-red-400 font-mono">{s.trend.toFixed(1)}</span></>}
                      {!trendUp && !trendDown && <><Minus className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground font-mono">steady</span></>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
