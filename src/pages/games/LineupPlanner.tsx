import { useState, useEffect } from 'react'
import { 
  Button, 
  Card, 
  CardContent, 
  Avatar, 
  Badge, 
  toast,
  ScrollArea
} from '@blinkdotnew/ui'
import { 
  Plus, 
  Trash2, 
  Save, 
  Users, 
  ChevronRight,
  UserPlus
} from 'lucide-react'
import { usePlayers } from '@/hooks/usePlayers'
import { useLineups, useUpdateLineup } from '@/hooks/useLineups'
import { cn } from '@/lib/utils'
import type { Player } from '@/types'

const UNITS = [
  'Line 1', 'Line 2', 'Line 3', 'Line 4',
  'D-Pair 1', 'D-Pair 2', 'D-Pair 3',
  'PP1', 'PP2',
  'PK1', 'PK2',
  'Goalies'
]

interface LineupPlannerProps {
  gameId: string
}

export function LineupPlanner({ gameId }: LineupPlannerProps) {
  const { data: players = [], isLoading: playersLoading } = usePlayers()
  const { data: existingLineups = [], isLoading: lineupsLoading } = useLineups(gameId)
  const updateLineup = useUpdateLineup()

  const [selectedUnit, setSelectedUnit] = useState(UNITS[0])
  const [localLineups, setLocalLineups] = useState<Record<string, string[]>>({})

  // Initialize local state from DB
  useEffect(() => {
    if (existingLineups.length > 0) {
      const grouped: Record<string, string[]> = {}
      existingLineups.forEach(l => {
        if (!grouped[l.unit]) grouped[l.unit] = []
        grouped[l.unit].push(l.playerId)
      })
      setLocalLineups(grouped)
    }
  }, [existingLineups])

  const togglePlayerInUnit = (playerId: string) => {
    setLocalLineups(prev => {
      const currentUnitPlayers = prev[selectedUnit] ?? []
      const isAlreadyIn = currentUnitPlayers.includes(playerId)
      
      const next = { ...prev }
      if (isAlreadyIn) {
        next[selectedUnit] = currentUnitPlayers.filter(id => id !== playerId)
      } else {
        next[selectedUnit] = [...currentUnitPlayers, playerId]
      }
      return next
    })
  }

  const handleSave = async () => {
    const flatLineups: { playerId: string, unit: string }[] = []
    Object.entries(localLineups).forEach(([unit, playerIds]) => {
      playerIds.forEach(playerId => {
        flatLineups.push({ playerId, unit })
      })
    })

    try {
      await updateLineup.mutateAsync({ gameId, playerLineups: flatLineups })
      toast.success('Lineup saved successfully')
    } catch (err: any) {
      toast.error('Failed to save lineup', { description: err.message })
    }
  }

  if (playersLoading || lineupsLoading) {
    return <div className="p-8 text-center animate-pulse">Loading lineup data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Game Lineup Planner
          </h2>
          <p className="text-xs text-muted-foreground">
            Organize your players into units for this game.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateLineup.isPending}
          className="rounded-full gap-2 shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          {updateLineup.isPending ? 'Saving...' : 'Save Lineup'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
        {/* Left: Unit Selector */}
        <div className="md:col-span-3 space-y-2 overflow-y-auto pr-2">
          {UNITS.map(unit => {
            const count = (localLineups[unit] ?? []).length
            return (
              <button
                key={unit}
                onClick={() => setSelectedUnit(unit)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-sm font-bold italic uppercase tracking-tighter",
                  selectedUnit === unit 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "bg-card border-border hover:bg-secondary/50 text-muted-foreground"
                )}
              >
                <span>{unit}</span>
                {count > 0 && (
                  <Badge className={cn(
                    "rounded-full h-5 px-1.5 min-w-[20px] flex items-center justify-center",
                    selectedUnit === unit ? "bg-white text-primary" : "bg-primary/10 text-primary"
                  )}>
                    {count}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Middle: Player Roster */}
        <div className="md:col-span-4 bg-zinc-950/40 rounded-[2rem] border border-white/5 p-4 flex flex-col min-h-0">
          <div className="mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 px-2">
              <UserPlus className="w-3 h-3" /> Team Roster
            </h3>
          </div>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2">
              {players.map(player => {
                const isSelected = (localLineups[selectedUnit] ?? []).includes(player.id)
                // Find if player is in ANY other unit
                const otherUnits = Object.entries(localLineups)
                  .filter(([u, ids]) => u !== selectedUnit && ids.includes(player.id))
                  .map(([u]) => u)

                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayerInUnit(player.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-xl border transition-all active:scale-[0.98] text-left",
                      isSelected 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                        : "bg-secondary/10 border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {player.number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{player.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {otherUnits.map(u => (
                            <span key={u} className="text-[8px] uppercase font-black text-zinc-500 bg-white/5 px-1 rounded">
                              {u}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Active Unit View */}
        <div className="md:col-span-5 bg-card rounded-[2rem] border border-border p-6 flex flex-col min-h-0 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">
                {selectedUnit}
              </h3>
              <p className="text-xs text-muted-foreground">
                {(localLineups[selectedUnit] ?? []).length} Players Assigned
              </p>
            </div>
          </div>
          
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="grid grid-cols-1 gap-3">
              {(localLineups[selectedUnit] ?? []).length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2 border-2 border-dashed border-white/5 rounded-[2rem]">
                  <Users className="w-8 h-8 text-zinc-800" />
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest italic">
                    Unit is Empty
                  </p>
                </div>
              ) : (
                (localLineups[selectedUnit] ?? []).map(pid => {
                  const player = players.find(p => p.id === pid)
                  if (!player) return null
                  return (
                    <div 
                      key={pid} 
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-zinc-800">
                          <div className="bg-zinc-800 w-full h-full flex items-center justify-center font-bold text-zinc-500">
                            {player.number}
                          </div>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-white">{player.name}</p>
                          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">
                            {player.position}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePlayerInUnit(pid)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
