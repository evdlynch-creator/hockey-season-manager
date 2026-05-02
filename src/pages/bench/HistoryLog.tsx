import { History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameEvent } from './types'

interface HistoryLogProps {
  history: GameEvent[]
}

export function HistoryLog({ history }: HistoryLogProps) {
  return (
    <div className="h-40 bg-zinc-900 border-t border-white/10 p-4 overflow-y-auto shrink-0">
      <div className="flex items-center gap-2 mb-3 text-zinc-500">
        <History className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Live Action Log</span>
      </div>
      <div className="space-y-2">
        {history.length === 0 ? (
          <p className="text-xs text-zinc-600 italic text-center py-4">Game in progress... tap above to record actions.</p>
        ) : (
          history.map((event) => (
            <div key={event.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {event.type.includes('goal') ? (
                  <div className={cn("w-1.5 h-1.5 rounded-full", event.type === 'goal_for' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]')} />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                )}
                <span className={cn("font-bold", event.type.includes('for') ? 'text-white' : 'text-zinc-400')}>
                  {event.type.includes('for') ? 'Team' : 'Opponent'} {event.label}
                </span>
              </div>
              <span className="text-zinc-600 tabular-nums">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
