import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@blinkdotnew/ui'
import { DraggablePlayer } from './DraggablePlayer'
import type { Player } from '@/types'

interface UnitContainerProps {
  id: string
  players: Player[]
}

export function UnitContainer({ id, players }: UnitContainerProps) {
  const { setNodeRef } = useSortable({
    id,
    data: {
      type: 'unit',
      unitId: id
    }
  })

  return (
    <div ref={setNodeRef} className="space-y-2 min-h-[100px] p-4 rounded-[2rem] bg-zinc-950/40 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80 italic">
          {id}
        </h4>
        <Badge variant="ghost" className="text-[10px] bg-primary/10 text-primary border-none rounded-full h-5 px-2">
          {players.length}
        </Badge>
      </div>
      
      <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {players.length === 0 ? (
            <div className="h-16 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">
                Drop players here
              </p>
            </div>
          ) : (
            players.map(player => (
              <DraggablePlayer key={player.id} player={player} unitId={id} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
