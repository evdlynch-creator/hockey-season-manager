import { LineupUnitsGrid } from '../LineupUnitsGrid'
import type { Player } from '@/types'

interface TacticalCanvasProps {
  localLineups: Record<string, string[]>
  allPlayers: Player[]
  handleSaveGroup: (units: string[], groupLabel: string) => void
}

export function TacticalCanvas({
  localLineups,
  allPlayers,
  handleSaveGroup
}: TacticalCanvasProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/20 w-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-0">
        {/* Background Tactical Grid Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
          <div className="w-full h-full" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="p-4 md:p-8 lg:p-12 pb-40 relative z-10 w-full">
          <div className="max-w-[1500px] mx-auto">
            <LineupUnitsGrid 
              localLineups={localLineups}
              allPlayers={allPlayers}
              onSaveGroup={handleSaveGroup}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
