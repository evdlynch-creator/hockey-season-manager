import { cn } from '@/lib/utils'
import { UNIT_GROUPS } from './constants'
import { UnitContainer } from './UnitContainer'
import { Save } from 'lucide-react'
import type { Player } from '@/types'

interface LineupUnitsGridProps {
  localLineups: Record<string, string[]>
  allPlayers: Player[]
  onSaveGroup: (units: string[], label: string) => void
}

export function LineupUnitsGrid({ localLineups, allPlayers, onSaveGroup }: LineupUnitsGridProps) {
  return (
    <div className="w-full min-h-screen">
      <div className="space-y-10 lg:space-y-16 pb-40 px-3 lg:px-6">
        {UNIT_GROUPS.map(group => (
          <div key={group.label} className="space-y-6 lg:space-y-8">
            {/* High-Contrast Section Header */}
            <div className="flex items-center justify-between gap-4 bg-zinc-900 border-l-4 border-primary py-2 lg:py-3 px-4 lg:px-6 rounded-r-xl shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="space-y-0.5">
                  <h3 className="text-lg lg:text-xl font-black uppercase tracking-[0.2em] text-white italic leading-none">
                    {group.label}
                  </h3>
                  <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-zinc-500 italic leading-none opacity-60">Tactical Blueprint System</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 relative z-10">
                <button
                  onClick={() => onSaveGroup(group.units, group.label)}
                  className="flex items-center gap-2 lg:gap-2.5 px-4 lg:px-6 py-1.5 lg:py-2 rounded-full bg-primary/10 border border-primary/20 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-xl shadow-primary/5 active:scale-95 shrink-0 italic"
                >
                  <Save className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  Save {group.label}
                </button>
              </div>

              {/* Header Shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            </div>
            
            {/* Stack units vertically to allow full horizontal nameplates */}
            <div className={cn(
              "grid gap-8",
              group.label === 'Goaltenders' 
                ? "grid-cols-1 md:grid-cols-2" 
                : "grid-cols-1" // Lines and D-Pairs now stack vertically but layout horizontally internally
            )}>
              {group.units.map(unit => {
                const unitPlayerIds = localLineups[unit] || []
                const unitPlayers = unitPlayerIds
                  .map(id => allPlayers.find(p => p.id === id))
                  .filter((p): p is Player => p !== undefined)
                
                return (
                  <UnitContainer 
                    key={unit} 
                    id={unit} 
                    players={unitPlayers} 
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
