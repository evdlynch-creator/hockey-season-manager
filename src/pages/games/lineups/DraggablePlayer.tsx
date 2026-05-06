import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Player } from '@/types'

interface PlayerCardProps {
  player: Player
  isOverlay?: boolean
  isDragging?: boolean
  className?: string
  compact?: boolean
}

export function PlayerCard({ player, isOverlay, isDragging, className, compact }: PlayerCardProps) {
  return (
    <div
      className={cn(
        "flex items-center rounded-lg border transition-all duration-300 group relative overflow-hidden",
        "bg-zinc-900/60 border-white/5 shadow-xl backdrop-blur-md",
        compact ? "h-[38px]" : "h-[54px] lg:h-[60px]",
        "w-full min-w-0", // min-w-0 allows flex shrinking
        isDragging && "opacity-20 scale-95",
        isOverlay && "shadow-2xl bg-zinc-800 border-primary/50 shadow-primary/20 scale-105 z-50 cursor-grabbing ring-2 ring-primary/40",
        !isOverlay && !isDragging && "cursor-grab active:cursor-grabbing hover:bg-zinc-800/80 hover:border-white/20 hover:shadow-primary/5",
        className
      )}
    >
      {/* Jersey Number Box (Scaled Tactical Square) */}
      <div className={cn(
        "h-full flex items-center justify-center font-black text-white shrink-0 border-r border-white/10",
        "bg-gradient-to-br from-zinc-800 to-black",
        compact ? "w-10 text-sm" : "w-12 lg:w-14 text-lg lg:text-xl"
      )}>
        {player.number}
      </div>

      {/* Player Identity Section */}
      <div className="flex-1 min-w-0 px-2 lg:px-3 flex flex-col justify-center">
        <p className={cn(
          "font-black tracking-tight text-zinc-100 uppercase italic leading-none truncate",
          compact ? "text-[11px]" : "text-[13px] lg:text-[15px]"
        )} style={{ fontFamily: 'avega, system-ui, sans-serif' }}>
          {player.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 lg:mt-1 opacity-60">
          <span className={cn(
            "text-[7px] lg:text-[8px] font-black uppercase tracking-widest leading-none px-1 py-0.5 rounded",
            player.position?.toLowerCase().includes('forward') ? "bg-blue-500/20 text-blue-400" :
            player.position?.toLowerCase().includes('defense') ? "bg-emerald-500/20 text-emerald-400" :
            "bg-amber-500/20 text-amber-400"
          )}>
            {player.position}
          </span>
        </div>
      </div>
      
      {!compact && (
        <div className="flex items-center gap-1 shrink-0 opacity-10 group-hover:opacity-100 transition-opacity pr-2">
          <GripVertical className="w-4 h-4 text-zinc-500" />
        </div>
      )}

      {/* Position Accent Strip */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-1",
        player.position?.toLowerCase().includes('forward') ? "bg-blue-500" :
        player.position?.toLowerCase().includes('defense') ? "bg-emerald-500" :
        "bg-amber-500"
      )} />
    </div>
  )
}

interface DraggablePlayerProps {
  player: Player
  unitId?: string
  compact?: boolean
}

export function DraggablePlayer({ player, unitId, compact }: DraggablePlayerProps) {
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
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PlayerCard player={player} isDragging={isDragging} compact={compact} />
    </div>
  )
}