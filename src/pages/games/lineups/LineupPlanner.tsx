import { useState, useEffect } from 'react'
import { 
  Button, 
  Badge, 
  toast,
  ScrollArea
} from '@blinkdotnew/ui'
import { 
  Save, 
  Users, 
  UserPlus,
  Library
} from 'lucide-react'
import { blink } from '@/blink/client'
import { usePlayers } from '@/hooks/usePlayers'
import { useLineups, useUpdateLineup } from '@/hooks/useLineups'
import { 
  useFormations, 
  useFormationAssignments, 
  useUpdateFormationAssignments 
} from '@/hooks/useFormations'
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
} from '@dnd-kit/sortable'
import { UNITS } from './constants'
import { DraggablePlayer } from './DraggablePlayer'
import { UnitContainer } from './UnitContainer'
import { FormationLibrary } from './FormationLibrary'
import type { Player, FormationAssignment, Formation } from '@/types'

interface LineupPlannerProps {
  gameId?: string
  formationId?: string
  onImportDefaults?: () => void
}

export function LineupPlanner({ gameId, formationId }: LineupPlannerProps) {
  const mode = formationId ? 'formation' : 'game'
  const targetId = (mode === 'formation' ? formationId : gameId) as string

  const { data: allPlayers = [], isLoading: playersLoading } = usePlayers()
  const { data: formations = [] } = useFormations()
  
  const { data: gameLineups = [], isLoading: lineupsLoading } = useLineups(gameId || '')
  const { data: formationAssignments = [], isLoading: formationAssignmentsLoading } = useFormationAssignments(formationId || null)
  
  const updateLineup = useUpdateLineup()
  const updateFormationAssignments = useUpdateFormationAssignments()
  
  const existingAssignments = mode === 'formation' ? formationAssignments : gameLineups
  const isLoading = playersLoading || (mode === 'formation' ? formationAssignmentsLoading : lineupsLoading)
  
  const isDefaultMode = gameId === 'SEASON_DEFAULT'

  const [localLineups, setLocalLineups] = useState<Record<string, string[]>>({})
  const [activePlayer, setActivePlayer] = useState<Player | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)

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
    if (existingAssignments.length > 0) {
      const grouped: Record<string, string[]> = {}
      UNITS.forEach(u => grouped[u] = [])
      existingAssignments.forEach(l => {
        if (!grouped[l.unit]) grouped[l.unit] = []
        grouped[l.unit].push(l.playerId)
      })
      setLocalLineups(grouped)
    } else {
      const initial: Record<string, string[]> = {}
      UNITS.forEach(u => initial[u] = [])
      setLocalLineups(initial)
    }
  }, [existingAssignments])

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

    if (!overUnit && overData?.type === 'player' && overData.unitId) {
      overUnit = overData.unitId
    }

    if (!overUnit && overId === 'roster-container') {
      overUnit = 'roster'
    }

    if (!overUnit) return
    if (activeUnit === overUnit) return

    setLocalLineups(prev => {
      const next = { ...prev }
      
      if (activeUnit !== 'roster') {
        next[activeUnit] = next[activeUnit].filter(id => id !== activeId)
      }

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
    const flatAssignments: { playerId: string, unit: string }[] = []
    Object.entries(localLineups).forEach(([unit, playerIds]) => {
      playerIds.forEach(playerId => {
        flatAssignments.push({ playerId, unit })
      })
    })

    try {
      if (mode === 'formation') {
        await updateFormationAssignments.mutateAsync({ formationId: targetId, assignments: flatAssignments })
      } else {
        await updateLineup.mutateAsync({ gameId: targetId, playerLineups: flatAssignments })
      }
      toast.success(mode === 'formation' ? 'Formation saved' : 'Lineup saved successfully')
    } catch (err: any) {
      toast.error('Failed to save', { description: err.message })
    }
  }

  const handleClearAll = () => {
    const cleared: Record<string, string[]> = {}
    UNITS.forEach(u => cleared[u] = [])
    setLocalLineups(cleared)
    toast.success('Lines cleared')
  }

  const handleApplyFormation = async (formation: Formation) => {
    try {
      const assignments = await blink.db.formationAssignments.list({
        where: { formationId: formation.id }
      }) as FormationAssignment[]

      if (assignments.length === 0) {
        toast.error('This formation is empty')
        return
      }

      const grouped: Record<string, string[]> = {}
      UNITS.forEach(u => grouped[u] = [])
      assignments.forEach(a => {
        if (!grouped[a.unit]) grouped[a.unit] = []
        grouped[a.unit].push(a.playerId)
      })

      setLocalLineups(grouped)
      setLibraryOpen(false)
      toast.success(`Applied formation: ${formation.name}`)
    } catch (err: any) {
      toast.error('Failed to load formation')
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">Loading data...</div>
  }

  const isPending = mode === 'formation' ? updateFormationAssignments.isPending : updateLineup.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {mode === 'formation' ? 'Formation Template' : (isDefaultMode ? 'Season Default Lines' : 'Game Lineup Planner')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {mode === 'formation' 
              ? 'Define a reusable lineup template. Drag and drop players to create your units.'
              : (isDefaultMode 
                ? 'Set your base lines for the season. These can be imported into individual games.'
                : 'Drag and drop players to create your game lines.')}
          </p>
        </div>
        <div className="flex gap-2">
          {mode === 'game' && (
            <Button 
              variant="outline" 
              onClick={() => setLibraryOpen(true)}
              className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Library className="w-4 h-4" />
              Formation Library
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
            disabled={isPending}
            className="rounded-full gap-2 shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Saving...' : (mode === 'formation' ? 'Save Formation' : 'Save Lineup')}
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

      <FormationLibrary 
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        formations={formations}
        onApply={handleApplyFormation}
      />
    </div>
  )
}
