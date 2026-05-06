import { useMemo } from 'react'
import { Card, CardContent, Badge } from '@blinkdotnew/ui'
import { Brain, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'

export function TalkingPointsSidebar() {
  const { data: analytics, isLoading } = useAnalytics()

  const points = useMemo(() => {
    if (!analytics) return []
    const results: any[] = []

    // 1. Find struggling concepts
    CONCEPTS.forEach(c => {
      const summary = analytics.byConcept[c]
      if (!summary) return
      
      const rating = summary.latestAvg
      if (rating !== null && rating < 3.0) {
        results.push({
          type: 'struggle',
          concept: c,
          text: `Practice ratings for ${c} are dipping (${rating.toFixed(1)}/5.0). Needs dedicated session time.`,
          icon: <TrendingDown className="w-3 h-3 text-red-400" />
        })
      }
    })

    // 2. Find high potential concepts
    CONCEPTS.forEach(c => {
      const summary = analytics.byConcept[c]
      if (!summary) return

      const rating = summary.latestAvg
      if (rating !== null && rating >= 4.0) {
        results.push({
          type: 'strength',
          concept: c,
          text: `Staff is seeing elite execution in ${c}. Build on this momentum.`,
          icon: <TrendingUp className="w-3 h-3 text-emerald-400" />
        })
      }
    })

    return results.slice(0, 3)
  }, [analytics])

  if (isLoading) return (
    <div className="bg-zinc-950/40 rounded-[2rem] border border-white/5 p-5 space-y-3">
      <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
      <div className="space-y-4 pt-4">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-white/5" />
            <div className="space-y-2 flex-1">
              <div className="h-2 w-12 bg-white/5 rounded" />
              <div className="h-8 w-full bg-white/5 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (!analytics || points.length === 0) return (
    <div className="bg-zinc-950/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl p-5 text-center space-y-2 opacity-60 italic">
      <Brain className="w-8 h-8 text-zinc-600 mx-auto" />
      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">No Talking Points</p>
      <p className="text-[11px] text-zinc-400">Add ratings to practice segments or game reviews to generate coach talking points.</p>
    </div>
  )

  return (
    <div className="bg-zinc-950/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-inner">
      <div className="p-5 border-b border-white/5 bg-zinc-900/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Brain className="w-4 h-4" />
          <h3 className="text-[10px] font-black uppercase tracking-widest italic">Coach Talking Points</h3>
        </div>
        <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-primary/20 text-primary uppercase font-black rounded-full">AI Sync</Badge>
      </div>
      <div className="p-4 space-y-4">
        {points.map((p, i) => (
          <div key={i} className="flex gap-3 items-start group">
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-primary/10 transition-colors">
              {p.icon}
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-zinc-500 tracking-tighter">{p.concept}</p>
              <p className="text-[11px] text-zinc-400 leading-snug group-hover:text-zinc-200 transition-colors">{p.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}