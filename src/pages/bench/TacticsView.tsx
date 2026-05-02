import { Badge } from '@blinkdotnew/ui'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONCEPTS } from '@/types'
import { GameEvent } from './types'

interface TacticsViewProps {
  tacticalPulse: Record<string, { plus: number, minus: number }>
  calculateAutoScore: (concept: string) => number
  onTrackAction: (type: GameEvent['type'], concept: string) => void
}

export function TacticsView({ tacticalPulse, calculateAutoScore, onTrackAction }: TacticsViewProps) {
  return (
    <div className="space-y-3 pb-4">
      {CONCEPTS.map(concept => {
        const score = calculateAutoScore(concept)
        const { plus, minus } = tacticalPulse[concept]
        return (
          <div key={concept} className="bg-zinc-900 border border-white/5 rounded-[2rem] p-3 pl-5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">{concept}</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xl font-black italic tracking-tighter",
                  score >= 4 ? "text-emerald-400" : score <= 2 ? "text-red-400" : "text-white"
                )}>
                  {score.toFixed(1)}
                </span>
                <div className="flex gap-1">
                  <Badge variant="ghost" className="text-[9px] px-1.5 h-4 bg-emerald-500/10 text-emerald-400 border-none rounded-full">{plus}</Badge>
                  <Badge variant="ghost" className="text-[9px] px-1.5 h-4 bg-red-500/10 text-red-400 border-none rounded-full">{minus}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onTrackAction('tactical_minus', concept)}
                className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-red-500/20 border border-white/5 flex items-center justify-center active:scale-90 transition-all"
              >
                <AlertCircle className="w-6 h-6 text-red-400" />
              </button>
              <button
                onClick={() => onTrackAction('tactical_plus', concept)}
                className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-emerald-500/20 border border-white/5 flex items-center justify-center active:scale-90 transition-all"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
