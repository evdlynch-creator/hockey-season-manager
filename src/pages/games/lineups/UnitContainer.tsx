import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@blinkdotnew/ui'
import { DraggablePlayer } from './DraggablePlayer'
import type { Player } from '@/types'
import { cn } from '@/lib/utils'

interface UnitContainerProps {
  id: string
  players: Player[]
}

export function UnitContainer({ id, players }: UnitContainerProps) {
  const { setNodeRef, isOver } = useSortable({
    id,
    data: {
      type: 'unit',
      unitId: id
    }
  })

  const isForwards = id.includes('Line')
  const isDefense = id.includes('D-Pair')
  const isGoalies = id.includes('Goalies')

  const getPositionMarkers = () => {
    if (isForwards) return ['LW', 'C', 'RW']
    if (isDefense) return ['LD', 'RD']
    if (isGoalies) return ['G']
    return []
  }

  const markers = getPositionMarkers()

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "flex flex-col gap-3 p-4 lg:p-5 transition-all duration-300 group",
        "bg-zinc-950/40 border border-white/5 shadow-2xl relative overflow-hidden",
        isOver && "border-primary/60 bg-zinc-900/80 ring-2 ring-primary/20 shadow-primary/20 scale-[1.01] z-20",
        !isOver && "hover:border-white/10"
      )}
      style={{ borderRadius: '1rem' }}
    >
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }} />
      </div>

      <div className="flex items-center justify-between px-1 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-sm rotate-45 shrink-0",
            isForwards ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : 
            isDefense ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
            "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          )} />
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-100 italic group-hover:text-primary transition-colors">
            {id}
          </h4>
        </div>
        <Badge variant="secondary" className="text-[10px] bg-black/40 text-zinc-400 border border-white/5 rounded h-5 px-2 font-black tabular-nums">
          {players.length}
        </Badge>
      </div>
      
      <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className={cn(
          "grid gap-2 lg:gap-3 min-h-[60px] relative z-10",
          isForwards ? "grid-cols-3" : 
          isDefense ? "grid-cols-2" : 
          "grid-cols-1"
        )}>
          {players.length === 0 ? (
            <div className={cn(
              "col-span-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl transition-all min-h-[100px] bg-black/20 group/empty hover:border-primary/30",
            )}>
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic group-hover:text-primary/50 transition-colors">
                Drop Players Here
              </p>
            </div>
          ) : (
            <>
              {players.map((player, idx) => (
                <div key={player.id} className="relative group/player-wrapper min-w-0">
                  {markers[idx] && (
                    <div className="absolute -top-2 left-2 bg-zinc-950 px-1 rounded-sm border border-white/10 text-[7px] lg:text-[8px] font-black text-zinc-500 select-none uppercase tracking-tighter z-20 group-hover/player-wrapper:text-primary transition-colors whitespace-nowrap">
                      {markers[idx]}
                    </div>
                  )}
                  <DraggablePlayer player={player} unitId={id} />
                </div>
              ))}
              
              {/* Show ghost slots for remaining markers */}
              {players.length < markers.length && markers.slice(players.length).map((marker, i) => (
                <div key={`ghost-${marker}`} className="relative opacity-10 pointer-events-none group/ghost min-w-0">
                   <div className="absolute -top-2 left-2 bg-zinc-950 px-1 rounded-sm border border-white/10 text-[7px] lg:text-[8px] font-black text-zinc-500 uppercase tracking-tighter z-20">
                      {marker}
                    </div>
                    <div className="h-[54px] lg:h-[60px] border border-dashed border-white/10 rounded-lg flex items-center justify-center bg-black/20">
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700 italic">{marker}</span>
                    </div>
                </div>
              ))}
            </>
          )}
        </div>
      </SortableContext>
    </div>
  )
}