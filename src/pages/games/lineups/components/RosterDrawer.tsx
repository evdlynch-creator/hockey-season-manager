import { Users, PanelRightOpen, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RosterSidebar } from '../RosterSidebar'
import type { Player } from '@/types'
import { useRef, useEffect, useState } from 'react'

interface RosterDrawerProps {
  rosterOpen: boolean
  isRosterHovered: boolean
  setIsRosterHovered: (hovered: boolean) => void
  setRosterOpen: (open: boolean) => void
  activePlayer: Player | null
  unassignedPlayers: Player[]
  reusablePlayers: Player[]
  rosterFilter: 'all' | 'forward' | 'defense' | 'goalie'
  setRosterFilter: (filter: 'all' | 'forward' | 'defense' | 'goalie') => void
  tabY: number
  setTabY: (y: number) => void
}

export function RosterDrawer({
  rosterOpen,
  isRosterHovered,
  setIsRosterHovered,
  setRosterOpen,
  activePlayer,
  unassignedPlayers,
  reusablePlayers,
  rosterFilter,
  setRosterFilter,
  tabY,
  setTabY
}: RosterDrawerProps) {
  const [isDraggingTab, setIsDraggingTab] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDraggingTab) return

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate percentage relative to viewport height
      const percentage = Math.max(10, Math.min(90, (e.clientY / window.innerHeight) * 100))
      setTabY(percentage)
    }

    const handleMouseUp = () => {
      setIsDraggingTab(false)
      document.body.style.cursor = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingTab, setTabY])

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsRosterHovered(true)}
      onMouseLeave={() => setIsRosterHovered(false)}
      className={cn(
        "fixed right-0 top-0 bottom-0 transition-all duration-500 ease-in-out z-[100] bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]",
        (rosterOpen || isRosterHovered || activePlayer) ? "w-85 translate-x-0" : "w-0 translate-x-0"
      )}
      onClick={() => !rosterOpen && !isRosterHovered && setRosterOpen(true)}
    >
      {/* Highly Noticeable Moveable Tactical Roster Tab */}
      <div 
        className={cn(
          "absolute -left-12 w-12 py-6 bg-zinc-900 border border-white/10 shadow-2xl flex flex-col items-center gap-3 rounded-l-2xl cursor-pointer transition-all duration-300 group/tab",
          (rosterOpen || isRosterHovered || activePlayer) ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0 hover:-translate-x-1"
        )}
        style={{ top: `${tabY}%`, transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          setRosterOpen(true);
        }}
      >
        {/* The Move Handle (Blue Dot from coach's image) */}
        <div 
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingTab(true);
            document.body.style.cursor = 'ns-resize';
          }}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center cursor-ns-resize group-hover/tab:scale-110 transition-transform active:scale-95"
        >
          <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_hsl(var(--primary))] ring-4 ring-primary/20 animate-pulse" />
        </div>
        
        <div className="flex flex-col items-center gap-5 mt-4">
          <div className="flex flex-col items-center gap-1 opacity-40 group-hover/tab:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3 text-zinc-500" />
          </div>
          
          <Users className="w-5 h-5 text-primary group-hover/tab:scale-110 transition-transform" />
          
          <span 
            className="[writing-mode:vertical-lr] text-[11px] font-black uppercase tracking-[0.4em] text-zinc-200 group-hover/tab:text-primary transition-colors italic select-none"
            style={{ fontFamily: 'avega, system-ui, sans-serif' }}
          >
            Roster
          </span>
        </div>
        
        <div className="mt-2 text-zinc-600 group-hover/tab:text-primary/50 transition-colors">
          <PanelRightOpen className="w-4 h-4" />
        </div>
        
        {/* Bottom Move Handle visual hint */}
        <div className="mt-1 opacity-20 group-hover/tab:opacity-100 transition-opacity">
           <div className="w-1 h-4 bg-zinc-700 rounded-full" />
        </div>
      </div>

      <div className={cn(
        "w-85 h-full overflow-hidden transition-opacity duration-300",
        (rosterOpen || isRosterHovered || activePlayer) ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <RosterSidebar 
          unassignedPlayers={unassignedPlayers}
          reusablePlayers={reusablePlayers}
          rosterFilter={rosterFilter}
          setRosterFilter={setRosterFilter}
        />
      </div>
    </div>
  )
}
