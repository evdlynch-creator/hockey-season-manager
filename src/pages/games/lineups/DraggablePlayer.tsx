import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Player } from '@/types'

interface DraggablePlayerProps {
  player: Player
  unitId?: string
  isOverlay?: boolean
}

export function DraggablePlayer({ player, unitId, isOverlay }: DraggablePlayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: player.id,
    data: {
      type: 'player',
      player,
      unitId
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 rounded-2xl border bg-white/5 border-white/5 transition-all group",
        isOverlay && "shadow-2xl bg-zinc-900 border-primary/50 scale-105 z-50 cursor-grabbing",
        !isOverlay && "cursor-grab active:cursor-grabbing"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[10px] shrink-0">
          {player.number}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate">{player.name}</p>
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">
            {player.position}
          </p>
        </div>
      </div>
      <GripVertical className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
    </div>
  )
}
