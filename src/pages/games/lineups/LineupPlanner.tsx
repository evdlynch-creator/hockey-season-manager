import { useState, useEffect } from 'react'
import { 
  toast,
} from '@blinkdotnew/ui'
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
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { UNITS } from './constants'
import { PlayerCard } from './DraggablePlayer'
import { LineupHeader } from './components/LineupHeader'
import { TacticalCanvas } from './components/TacticalCanvas'
import { RosterDrawer } from './components/RosterDrawer'
import { customCollisionDetectionStrategy } from './utils/collisionDetection'
import type { Player, FormationAssignment, Formation } from '@/types'

interface LineupPlannerProps {
  gameId?: string
  formationId?: string
  onImportDefaults?: () => void
}

export function LineupPlanner({ gameId, formationId, onImportDefaults }: LineupPlannerProps) {
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
  
  const [localLineups, setLocalLineups] = useState<Record<string, string[]>>({})
  const [activePlayer, setActivePlayer] = useState<Player | null>(null)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [isRosterHovered, setIsRosterHovered] = useState(false)
  const [rosterTabY, setRosterTabY] = useState(50) // Percentage from top
  const [rosterFilter, setRosterFilter] = useState<'all' | 'forward' | 'defense' | 'goalie'>('all')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

  // Players in BASE unit (Line 1-4, D-Pair 1-3, Goalies)
  const baseUnits = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'D-Pair 1', 'D-Pair 2', 'D-Pair 3', 'Goalies']
  const baseAssignedIds = new Set(
    baseUnits.flatMap(u => localLineups[u] || [])
  )

  // Filter available players:
  const filteredPlayers = allPlayers
    .filter(p => {
      // Position filter
      if (rosterFilter === 'forward') return p.position?.toLowerCase().includes('forward') || p.position?.toLowerCase().includes('center') || p.position?.toLowerCase().includes('wing')
      if (rosterFilter === 'defense') return p.position?.toLowerCase().includes('defense')
      if (rosterFilter === 'goalie') return p.position?.toLowerCase().includes('goalie')
      return true
    })

  // Group players for the sidebar
  const unassignedPlayers = filteredPlayers.filter(p => !baseAssignedIds.has(p.id))
  const reusablePlayers = filteredPlayers.filter(p => baseAssignedIds.has(p.id))

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
    
    let overUnit: string | null = null
    
    if (overData?.type === 'unit') {
      overUnit = overData.unitId
    } 
    else if (overData?.type === 'roster' || overId === 'roster') {
      overUnit = 'roster'
    } 
    else if (overData?.type === 'player') {
      overUnit = overData.unitId || 'roster'
    }

    if (!overUnit) return
    if (activeUnit === overUnit) return

    setLocalLineups(prev => {
      const next = { ...prev }
      if (activeUnit !== 'roster') {
        next[activeUnit] = (next[activeUnit] || []).filter(id => id !== activeId)
      }

      if (overUnit !== 'roster') {
        const overUnitPlayers = [...(next[overUnit as string] || [])]
        const overIndex = overData?.type === 'player' ? overUnitPlayers.indexOf(overId) : -1
        
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
    const overUnit = overData?.unitId || (overData?.type === 'unit' ? overData.unitId : (overData?.type === 'roster' ? 'roster' : 'roster'))

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

  const handleSaveGroup = async (units: string[], groupLabel: string) => {
    const groupAssignments: { playerId: string, unit: string }[] = []
    units.forEach(unit => {
      const playerIds = localLineups[unit] || []
      playerIds.forEach(playerId => {
        groupAssignments.push({ playerId, unit })
      })
    })

    const mergedAssignments = [
      ...existingAssignments.filter(a => !units.includes(a.unit)),
      ...groupAssignments
    ]

    try {
      if (mode === 'formation') {
        await updateFormationAssignments.mutateAsync({ formationId: targetId, assignments: mergedAssignments })
      } else {
        await updateLineup.mutateAsync({ gameId: targetId, playerLineups: mergedAssignments })
      }
      toast.success(`${groupLabel} saved successfully`)
    } catch (err: any) {
      toast.error(`Failed to save ${groupLabel}`, { description: err.message })
    }
  }

  const handleClearAll = () => {
    const cleared: Record<string, string[]> = {}
    UNITS.forEach(u => cleared[u] = [])
    setLocalLineups(cleared)
    toast.success('Lines cleared')
  }

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">Loading data...</div>
  }

  const isPending = mode === 'formation' ? updateFormationAssignments.isPending : updateLineup.isPending

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-zinc-950 overflow-hidden relative">
        <LineupHeader 
          mode={mode}
          handleClearAll={handleClearAll}
          handleSave={handleSave}
          isPending={isPending}
          rosterOpen={rosterOpen}
          isRosterHovered={isRosterHovered}
          setRosterOpen={setRosterOpen}
        />

        <div className="flex-1 relative flex overflow-hidden min-h-0">
          <TacticalCanvas 
            localLineups={localLineups}
            allPlayers={allPlayers}
            handleSaveGroup={handleSaveGroup}
          />

          <RosterDrawer 
            rosterOpen={rosterOpen}
            isRosterHovered={isRosterHovered}
            setIsRosterHovered={setIsRosterHovered}
            setRosterOpen={setRosterOpen}
            activePlayer={activePlayer}
            unassignedPlayers={unassignedPlayers}
            reusablePlayers={reusablePlayers}
            rosterFilter={rosterFilter}
            setRosterFilter={setRosterFilter}
            tabY={rosterTabY}
            setTabY={setRosterTabY}
          />
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activePlayer ? (
            <PlayerCard player={activePlayer} isOverlay />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
