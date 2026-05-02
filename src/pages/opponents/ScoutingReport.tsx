import React, { useMemo } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  Badge, 
  Separator,
  Button,
  Card,
  CardContent
} from '@blinkdotnew/ui'
import { 
  FileText, 
  Printer, 
  Trophy, 
  Users, 
  Brain, 
  ShieldAlert, 
  Sparkles, 
  MessageSquare,
  TrendingUp,
  Target
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'

interface ScoutingReportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opponentName: string
  stats: any
  insights: any[]
}

export function ScoutingReport({ open, onOpenChange, opponentName, stats, insights }: ScoutingReportProps) {
  const handlePrint = () => {
    window.print()
  }

  const teamNotes = useMemo(() => {
    return stats.reviews
      .filter((r: any) => (r.notes ?? '').trim())
      .map((r: any) => {
        const game = stats.games.find((g: any) => g.id === r.gameId)
        return {
          date: game?.date ?? '',
          note: r.notes!.trim()
        }
      })
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
  }, [stats])

  const opponentScouting = useMemo(() => {
    return stats.reviews
      .filter((r: any) => (r.opponentNotes ?? '').trim())
      .map((r: any) => {
        const game = stats.games.find((g: any) => g.id === r.gameId)
        return {
          date: game?.date ?? '',
          note: r.opponentNotes!.trim()
        }
      })
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
  }, [stats])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-[2rem] border-border/50 bg-zinc-950 print:bg-white print:text-black print:max-w-none print:h-auto print:static print:border-none">
        {/* Actions Bar - Hidden on print */}
        <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-bold uppercase tracking-widest text-xs">Opponent Scouting Report</span>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-full gap-2 border-white/10 hover:bg-white/5">
            <Printer className="w-4 h-4" /> Print Briefing
          </Button>
        </div>

        <div className="p-8 space-y-10 print:p-0">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <Badge className="bg-primary/20 text-primary border-primary/30 rounded-full uppercase tracking-tighter text-[10px] font-black px-3">
                  Rematch Briefing
                </Badge>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white print:text-black leading-none">
                  {opponentName}
                </h1>
                <p className="text-zinc-400 print:text-zinc-600 font-medium italic">
                  Head-to-Head Tactical Analysis · {stats.games.length} Meetings
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Lifetime Record</p>
                <div className="text-3xl font-black italic tracking-tighter text-white print:text-black">
                  {stats.wins}W {stats.losses}L {stats.ties}T
                </div>
              </div>
            </div>
            <Separator className="bg-white/10 print:bg-zinc-200" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-3 h-3" /> Scoring Power
              </p>
              <p className="text-xl font-black text-white print:text-black italic">
                {(stats.totalGoalsFor / (stats.games.length || 1)).toFixed(1)} <span className="text-xs not-italic font-medium text-zinc-500 uppercase tracking-widest">GF/G</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Brain className="w-3 h-3" /> Average Grade
              </p>
              <p className="text-xl font-black text-white print:text-black italic">
                {(Object.values(stats.avgConceptRatings).filter(v => v !== null).reduce((a: any, b: any) => a + b, 0) as number / (CONCEPTS.length || 1)).toFixed(1)} / 5.0
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                <TrendingUp className="w-3 h-3" /> Win Rate
              </p>
              <p className="text-xl font-black text-white print:text-black italic">
                {Math.round((stats.wins / (stats.games.length || 1)) * 100)}%
              </p>
            </div>
          </div>

          {/* Tactical Pulse - The "Pulse" of the rematch */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <h2 className="text-lg font-black uppercase tracking-tighter italic text-white print:text-black">Tactical Pulse Breakdown</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {CONCEPTS.map(concept => {
                const val = stats.avgConceptRatings[concept]
                const pct = val != null ? (val / 5) * 100 : 0
                return (
                  <div key={concept} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-zinc-400 print:text-zinc-500">{concept}</span>
                      <span className={cn(
                        "tabular-nums italic",
                        val >= 4 ? "text-emerald-400" : val <= 2 ? "text-red-400" : "text-white print:text-black"
                      )}>
                        {val != null ? val.toFixed(1) : '—'}/5
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 print:bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Aggregated Insights */}
          {insights.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-primary shrink-0" />
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-white print:text-black">Key Tactical Observations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, i) => (
                  <Card key={i} className="bg-zinc-900/50 border-white/5 rounded-[1.5rem] overflow-hidden">
                    <CardContent className="p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {insight.type === 'strength' ? <Trophy className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{insight.concept}</p>
                        <p className="text-xs font-medium text-white print:text-black leading-relaxed">{insight.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Aggregated Mic Notes - Team & Opponent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Opponent Scouting */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-white print:text-black">Opponent Scouting</h2>
              </div>
              <div className="space-y-6">
                {opponentScouting.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">No specific opponent notes recorded.</p>
                ) : (
                  opponentScouting.map((o: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          {format(parseISO(o.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 print:text-zinc-700 leading-relaxed italic">
                        "{o.note}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Our Performance Insights */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-white print:text-black">Our Execution Notes</h2>
              </div>
              <div className="space-y-6">
                {teamNotes.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">No execution notes recorded.</p>
                ) : (
                  teamNotes.map((o: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          {format(parseISO(o.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 print:text-zinc-700 leading-relaxed italic">
                        "{o.note}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Footer - Branding */}
          <div className="flex items-center justify-between border-t border-white/10 pt-8 mt-12 opacity-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center font-black text-white text-[10px]">IQ</div>
              <span className="font-bold text-xs uppercase tracking-tighter">Blue Line IQ</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Scouting Briefing · Confidential Staff Only · Generated {format(new Date(), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
