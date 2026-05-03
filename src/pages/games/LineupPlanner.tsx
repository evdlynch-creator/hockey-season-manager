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
  UserPlus,
  GripVertical,
  Download
} from 'lucide-react'
import { usePlayers } from '@/hooks/usePlayers'
import { useLineups, useUpdateLineup } from '@/hooks/useLineups'
import { cn } from '@/lib/utils'
import type { Player } from '@/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const UNITS = [
  'Line 1', 'Line 2', 'Line 3', 'Line 4',
  'D-Pair 1', 'D-Pair 2', 'D-Pair 3',
  'PP1', 'PP2',
  'PK1', 'PK2',
  'Goalies'
]

interface DraggablePlayerProps {
  player: Player
  unitId?: string
  isOverlay?: boolean
}

function DraggablePlayer({ player, unitId, isOverlay }: DraggablePlayerProps) {
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

interface UnitContainerProps {
  id: string
  players: Player[]
}

function UnitContainer({ id, players }: UnitContainerProps) {
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

interface LineupPlannerProps {
  gameId: string
  onImportDefaults?: () => void
}

export function LineupPlanner({ gameId, onImportDefaults }: LineupPlannerProps) {
  const { data: allPlayers = [], isLoading: playersLoading } = usePlayers()
  const { data: existingLineups = [], isLoading: lineupsLoading } = useLineups(gameId)
  const updateLineup = useUpdateLineup()
  
  const isDefaultMode = gameId === 'SEASON_DEFAULT'

  const [localLineups, setLocalLineups] = useState<Record<string, string[]>>({})
  const [activePlayer, setActivePlayer] = useState<Player | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (existingLineups.length > 0) {
      const grouped: Record<string, string[]> = {}
      UNITS.forEach(u => grouped[u] = [])
      existingLineups.forEach(l => {
        if (!grouped[l.unit]) grouped[l.unit] = []
        grouped[l.unit].push(l.playerId)
      })
      setLocalLineups(grouped)
    } else {
      const initial: Record<string, string[]> = {}
      UNITS.forEach(u => initial[u] = [])
      setLocalLineups(initial)
    }
  }, [existingLineups])

  const assignedPlayerIds = new Set(Object.values(localLineups).flat())
  const unassignedPlayers = allPlayers.filter(p => !assignedPlayerIds.has(p.id))

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const data = active.data.current
    if (data?.type === 'player') {
      setActivePlayer(data.player)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeData = active.data.current
    const overData = over.data.current

    if (activeId === overId) return

    const activeUnit = activeData?.unitId || 'roster'
    let overUnit = overData?.unitId || (overData?.type === 'unit' ? overData.unitId : null)

    // If hovering over a player in a unit, that's the overUnit
    if (!overUnit && overData?.type === 'player' && overData.unitId) {
      overUnit = overData.unitId
    }

    // If hovering over the roster container
    if (!overUnit && overId === 'roster-container') {
      overUnit = 'roster'
    }

    if (!overUnit) return
    if (activeUnit === overUnit) return

    setLocalLineups(prev => {
      const next = { ...prev }
      
      // Remove from active unit
      if (activeUnit !== 'roster') {
        next[activeUnit] = next[activeUnit].filter(id => id !== activeId)
      }

      // Add to over unit
      if (overUnit !== 'roster') {
        const overUnitPlayers = [...(next[overUnit as string] || [])]
        const overIndex = overUnitPlayers.indexOf(overId)
        if (overIndex >= 0) {
          overUnitPlayers.splice(overIndex, 0, activeId)
        } else {
          overUnitPlayers.push(activeId)
        }
        next[overUnit as string] = overUnitPlayers
      }

      return next
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActivePlayer(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeData = active.data.current
    const overData = over.data.current

    const activeUnit = activeData?.unitId || 'roster'
    const overUnit = overData?.unitId || (overData?.type === 'unit' ? overData.unitId : 'roster')

    if (activeUnit === overUnit && activeUnit !== 'roster') {
      setLocalLineups(prev => {
        const unitPlayers = prev[activeUnit]
        const oldIndex = unitPlayers.indexOf(activeId)
        const newIndex = unitPlayers.indexOf(overId)
        
        return {
          ...prev,
          [activeUnit]: arrayMove(unitPlayers, oldIndex, newIndex)
        }
      })
    }
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

  const handleClearAll = () => {
    const cleared: Record<string, string[]> = {}
    UNITS.forEach(u => cleared[u] = [])
    setLocalLineups(cleared)
    toast.success('Lineup cleared')
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
            {isDefaultMode ? 'Season Default Lines' : 'Game Lineup Planner'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isDefaultMode 
              ? 'Set your base lines for the season. These can be imported into individual games.'
              : 'Drag and drop players to create your game lines.'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isDefaultMode && onImportDefaults && assignedPlayerIds.size === 0 && (
            <Button 
              variant="outline" 
              onClick={onImportDefaults}
              className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Download className="w-4 h-4" />
              Import Defaults
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={handleClearAll}
            className="rounded-full text-zinc-500 hover:text-red-400"
          >
            Clear All
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateLineup.isPending}
            className="rounded-full gap-2 shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {updateLineup.isPending ? 'Saving...' : 'Save Lineup'}
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px]">
          {/* Left: Roster Section */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-zinc-950/40 rounded-[2rem] border border-white/5 p-6 flex flex-col h-full shadow-inner">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5" /> Available Players
                </h3>
                <Badge variant="outline" className="rounded-full border-white/10 text-[10px] text-zinc-400 px-2 py-0.5">
                  {unassignedPlayers.length}
                </Badge>
              </div>

              <ScrollArea id="roster-container" className="flex-1 -mx-2 px-2">
                <SortableContext items={unassignedPlayers.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 gap-2.5 pb-10">
                    {unassignedPlayers.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center text-center space-y-2 border-2 border-dashed border-white/5 rounded-[2rem]">
                        <Users className="w-8 h-8 text-zinc-800" />
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic">
                          All Players Assigned
                        </p>
                      </div>
                    ) : (
                      unassignedPlayers.map(player => (
                        <DraggablePlayer key={player.id} player={player} />
                      ))
                    )}
                  </div>
                </SortableContext>
              </ScrollArea>
            </div>
          </div>

          {/* Right: Units Grid */}
          <div className="lg:col-span-8">
            <ScrollArea className="h-[700px] -mx-4 px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                {UNITS.map(unit => {
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
            </ScrollArea>
          </div>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activePlayer ? (
            <DraggablePlayer player={activePlayer} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
