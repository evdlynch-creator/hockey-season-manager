import { Trophy, Target, AlertCircle } from 'lucide-react'
import { GameEvent } from './types'

interface StatsViewProps {
  onTrackAction: (type: GameEvent['type']) => void
}

export function StatsView({ onTrackAction }: StatsViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Our Team Controls */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => onTrackAction('goal_for')}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all rounded-[2.5rem] flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Trophy className="w-8 h-8" />
          <span className="font-black uppercase tracking-tighter italic text-xl">Goal</span>
        </button>
        <button
          onClick={() => onTrackAction('shot_for')}
          className="h-28 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all rounded-[2rem] flex flex-col items-center justify-center gap-1 border border-white/5"
        >
          <Target className="w-6 h-6 text-emerald-400" />
          <span className="font-bold uppercase tracking-widest text-xs">Shot</span>
        </button>
      </div>

      {/* Opponent Controls */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => onTrackAction('goal_against')}
          className="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 transition-all rounded-[2.5rem] flex flex-col items-center justify-center gap-2 shadow-lg shadow-red-500/20"
        >
          <AlertCircle className="w-8 h-8" />
          <span className="font-black uppercase tracking-tighter italic text-xl">Goal</span>
        </button>
        <button
          onClick={() => onTrackAction('shot_against')}
          className="h-28 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all rounded-[2rem] flex flex-col items-center justify-center gap-1 border border-white/5"
        >
          <Target className="w-6 h-6 text-red-400" />
          <span className="font-bold uppercase tracking-widest text-xs">Shot</span>
        </button>
      </div>
    </div>
  )
}
