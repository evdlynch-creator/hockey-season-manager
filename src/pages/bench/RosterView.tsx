import { Player } from '@/types'
import { Badge, Avatar, ScrollArea } from '@blinkdotnew/ui'
import { UserPlus, UserMinus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlayerSessionStats } from './types'

interface RosterViewProps {
  players: Player[]
  lineups: Lineup[]
  onIcePlayers: Set<string>
  playerStats: Record<string, PlayerSessionStats>
  onToggleOnIce: (playerId: string) => void
}

export function RosterView({
  players,
  lineups,
  onIcePlayers,
  playerStats,
  onToggleOnIce
}: RosterViewProps) {
  // Map player ID to lineup info
  const playerLineups = new Map(lineups.map(l => [l.playerId, l]))

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Active Line Builder</h3>
        <Badge variant="outline" className="rounded-full border-white/10 text-[10px] text-zinc-400">
          {onIcePlayers.size} on ice
        </Badge>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="grid grid-cols-1 gap-2 pb-4">
          {players.map(player => {
            const stats = playerStats[player.id] || { goals: 0, assists: 0, plusMinus: 0 }
            const isOnIce = onIcePlayers.has(player.id)
            const lineup = playerLineups.get(player.id)
            
            return (
              <button
                key={player.id}
                onClick={() => onToggleOnIce(player.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.98]",
                  isOnIce 
                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                    : "bg-zinc-900 border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10 border-2 border-zinc-800">
                      <div className="bg-zinc-800 w-full h-full flex items-center justify-center font-bold text-zinc-500">
                        {player.number}
                      </div>
                    </Avatar>
                    {isOnIce && (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-zinc-950">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className={cn("font-bold text-sm", isOnIce ? "text-emerald-400" : "text-white")}>
                      {player.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-zinc-500">#{player.number}</span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{player.position}</span>
                      {lineup && (
                        <Badge variant="secondary" className="bg-white/5 border-none text-[9px] h-4 rounded-full px-1.5 text-zinc-400 font-bold uppercase tracking-tighter">
                          {lineup.unit}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pr-2">
                  <div className="flex gap-3 text-center">
                    <div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase">G</p>
                      <p className="text-sm font-black italic tabular-nums">{stats.goals}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase">A</p>
                      <p className="text-sm font-black italic tabular-nums">{stats.assists}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase">+/-</p>
                      <p className={cn(
                        "text-sm font-black italic tabular-nums",
                        stats.plusMinus > 0 ? "text-emerald-400" : stats.plusMinus < 0 ? "text-red-400" : "text-zinc-500"
                      )}>
                        {stats.plusMinus > 0 ? `+${stats.plusMinus}` : stats.plusMinus}
                      </p>
                    </div>
                  </div>
                  {isOnIce ? (
                    <UserMinus className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-zinc-700" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
