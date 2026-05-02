import { Link } from '@tanstack/react-router'
import { Button, Badge } from '@blinkdotnew/ui'
import { ArrowLeft, Undo2, Target } from 'lucide-react'
import { GameEvent } from './types'

interface BenchModeHeaderProps {
  gameId: string
  opponent: string
  goalsFor: number
  goalsAgainst: number
  shotsFor: number
  shotsAgainst: number
  history: GameEvent[]
  onUndo: () => void
}

export function BenchModeHeader({
  gameId,
  opponent,
  goalsFor,
  goalsAgainst,
  shotsFor,
  shotsAgainst,
  history,
  onUndo
}: BenchModeHeaderProps) {
  return (
    <div className="bg-zinc-900 border-b border-white/10 p-4 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <Link to="/games/$gameId" params={{ gameId }}>
          <Button variant="ghost" size="icon" className="rounded-full text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-1 rounded-full uppercase tracking-tighter text-[10px] font-black">
            Live Bench Mode
          </Badge>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">vs {opponent}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-white/50"
          onClick={onUndo}
          disabled={history.length === 0}
        >
          <Undo2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center justify-around gap-8 py-2">
        <div className="text-center">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Our Team</p>
          <div className="text-6xl font-black italic tracking-tighter tabular-nums">{goalsFor}</div>
          <div className="flex items-center justify-center gap-1 mt-1 text-zinc-400">
            <Target className="w-3 h-3" />
            <span className="text-sm font-bold tabular-nums">{shotsFor} Shots</span>
          </div>
        </div>
        
        <div className="text-4xl font-black text-zinc-800 italic">VS</div>

        <div className="text-center">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{opponent}</p>
          <div className="text-6xl font-black italic tracking-tighter tabular-nums">{goalsAgainst}</div>
          <div className="flex items-center justify-center gap-1 mt-1 text-zinc-400">
            <Target className="w-3 h-3" />
            <span className="text-sm font-bold tabular-nums">{shotsAgainst} Shots</span>
          </div>
        </div>
      </div>
    </div>
  )
}
