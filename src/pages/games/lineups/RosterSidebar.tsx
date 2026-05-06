import { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Users, UserPlus, RefreshCw } from 'lucide-react'
import { Badge, ScrollArea } from '@blinkdotnew/ui'
import { cn } from '@/lib/utils'
import { DraggablePlayer } from './DraggablePlayer'
import type { Player } from '@/types'

interface RosterContainerProps {
  players: Player[]
  view: 'unassigned' | 'reusable'
}

function RosterContainer({ players, view }: RosterContainerProps) {
  const { setNodeRef } = useSortable({
    id: 'roster',
    data: {
      type: 'roster',
      unitId: 'roster'
    }
  })

  return (
    <div ref={setNodeRef} className="min-h-[400px]">
      <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 pb-10">
          {players.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-md bg-white/[0.02]">
              <div className="p-3 rounded-md bg-zinc-900 border border-white/5">
                <Users className="w-6 h-6 text-zinc-700" />
              </div>
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic">
                {view === 'unassigned' ? 'Roster Fully Assigned' : 'No Players to Reuse'}
              </p>
            </div>
          ) : (
            players.map(player => (
              <DraggablePlayer key={player.id} player={player} compact />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface RosterSidebarProps {
  unassignedPlayers: Player[]
  reusablePlayers: Player[]
  rosterFilter: 'all' | 'forward' | 'defense' | 'goalie'
  setRosterFilter: (filter: 'all' | 'forward' | 'defense' | 'goalie') => void
}

export function RosterSidebar({ 
  unassignedPlayers, 
  reusablePlayers,
  rosterFilter, 
  setRosterFilter 
}: RosterSidebarProps) {
  const [view, setView] = useState<'unassigned' | 'reusable'>('unassigned')
  const activeList = view === 'unassigned' ? unassignedPlayers : reusablePlayers

  return (
    <div className="h-full flex flex-col bg-zinc-950/80 backdrop-blur-xl border-l border-white/10 shadow-2xl relative overflow-hidden">
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 italic">
              <Users className="w-4 h-4 text-primary" /> Roster
            </h3>
            <Badge variant="outline" className="rounded-none border-white/10 text-[10px] text-zinc-400 px-2 py-0.5 font-black bg-white/5">
              {activeList.length}
            </Badge>
          </div>

          <div className="flex p-1 bg-black/40 rounded-none mb-5 border border-white/5 shadow-inner">
            <button
              onClick={() => setView('unassigned')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-none text-[10px] font-black uppercase tracking-widest transition-all",
                view === 'unassigned' ? "bg-primary text-primary-foreground shadow-lg italic" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Available
            </button>
            <button
              onClick={() => setView('reusable')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-none text-[10px] font-black uppercase tracking-widest transition-all",
                view === 'reusable' ? "bg-primary text-primary-foreground shadow-lg italic" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Special
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['all', 'forward', 'defense', 'goalie'] as const).map(f => (
              <button
                key={f}
                onClick={() => setRosterFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-[0.1em] transition-all border",
                  rosterFilter === f 
                    ? "bg-primary/20 border-primary/40 text-primary" 
                    : "bg-transparent border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2 custom-scrollbar">
          <RosterContainer players={activeList} view={view} />
        </ScrollArea>
      </div>
      
      <div className="p-6 bg-black/40 border-t border-white/5">
        <div className="p-4 rounded-none bg-primary/5 border border-primary/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
          <p className="text-[10px] text-primary/70 font-bold leading-relaxed italic uppercase tracking-tighter">
            {view === 'unassigned' 
              ? "Assign players to base lines first. They'll then unlock for Special Teams reuse."
              : "Drag assigned players into PP/PK units to reuse them across multiple units."}
          </p>
        </div>
      </div>
    </div>
  )
}