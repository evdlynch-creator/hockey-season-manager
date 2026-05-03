import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { 
  Button, 
  toast, 
  LoadingOverlay
} from '@blinkdotnew/ui'
import { 
  CheckCircle2
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useGame } from '@/hooks/useGames'
import { cn } from '@/lib/utils'
import { CoachsMic } from '@/components/dashboard/CoachsMic'
import { CONCEPTS, Lineup } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { usePlayers } from '@/hooks/usePlayers'
import { useQuery } from '@tanstack/react-query'

import { GameEvent, PlayerSessionStats } from './bench/types'
import { BenchModeHeader } from './bench/BenchModeHeader'
import { StatsView } from './bench/StatsView'
import { TacticsView } from './bench/TacticsView'
import { RosterView } from './bench/RosterView'
import { HistoryLog } from './bench/HistoryLog'
import { GoalCaptureDialog } from './bench/GoalCaptureDialog'

export default function BenchModePage() {
  const { gameId } = useParams({ from: '/games/$gameId/bench' })
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: game, isLoading: gameLoading } = useGame(gameId)
  const { data: players = [] } = usePlayers()

  const { data: lineups = [], isLoading: lineupsLoading } = useQuery({
    queryKey: ['lineups', gameId],
    queryFn: async () => {
      return (await blink.db.lineups.list({ where: { gameId } })) as Lineup[]
    },
    enabled: !!gameId
  })

  const isLoading = gameLoading || lineupsLoading

  const [history, setHistory] = useState<GameEvent[]>([])
  const [view, setView] = useState<'stats' | 'tactics' | 'roster'>('stats')
  
  const [onIcePlayers, setOnIcePlayers] = useState<Set<string>>(new Set())
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerSessionStats>>({})
  
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [goalData, setGoalData] = useState<{
    scorerId?: string
    assist1Id?: string
    assist2Id?: string
  }>({})

  const updatePlayerStat = (playerId: string, field: keyof PlayerSessionStats, delta: number) => {
    setPlayerStats(prev => {
      const stats = prev[playerId] || { goals: 0, assists: 0, plusMinus: 0 }
      return {
        ...prev,
        [playerId]: {
          ...stats,
          [field]: stats[field] + delta
        }
      }
    })
  }

  const toggleOnIce = (playerId: string) => {
    setOnIcePlayers(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      return next
    })
  }
  
  const toggleUnit = (playerIds: string[]) => {
    setOnIcePlayers(prev => {
      const next = new Set(prev)
      const allOn = playerIds.every(id => prev.has(id))
      
      if (allOn) {
        playerIds.forEach(id => next.delete(id))
      } else {
        playerIds.forEach(id => next.add(id))
      }
      return next
    })
  }
  
  // Tactical Pulse state
  const [tacticalPulse, setTacticalPulse] = useState<Record<string, { plus: number, minus: number }>>(() => {
    const initial: any = {}
    CONCEPTS.forEach(c => {
      initial[c] = { plus: 0, minus: 0 }
    })
    return initial
  })

  // Local state for immediate feedback, synced with DB
  const [goalsFor, setGoalsFor] = useState(0)
  const [goalsAgainst, setGoalsAgainst] = useState(0)
  const [shotsFor, setShotsFor] = useState(0)
  const [shotsAgainst, setShotsAgainst] = useState(0)

  useEffect(() => {
    if (game) {
      setGoalsFor(Number(game.goalsFor ?? 0))
      setGoalsAgainst(Number(game.goalsAgainst ?? 0))
      setShotsFor(Number(game.shotsFor ?? 0))
      setShotsAgainst(Number(game.shotsAgainst ?? 0))
    }
  }, [game])

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<typeof game>) => {
      if (!isAuthenticated) return // Skip DB sync if not authenticated (demo mode)
      await blink.db.games.update(gameId, updates)
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['game', gameId] })
        queryClient.invalidateQueries({ queryKey: ['games'] })
      }
    },
    onError: (e: any) => {
      const isAuthError = 
        e?.details?.originalError?.name === 'BlinkAuthError' || 
        e?.message?.includes('401') || 
        e?.message?.includes('Unauthorized')
      
      if (isAuthError) {
        toast.error('Session expired', { description: 'Please sign in to sync stats.' })
      } else {
        toast.error('Failed to sync', { description: e.message })
      }
    }
  })

  const handleTrackAction = (
    type: GameEvent['type'], 
    concept?: string, 
    data?: { scorerId?: string, assist1Id?: string, assist2Id?: string }
  ) => {
    if (type === 'goal_for' && !data) {
      setIsGoalDialogOpen(true)
      return
    }
    trackAction(type, concept, data)
  }

  const trackAction = (
    type: GameEvent['type'], 
    concept?: string, 
    data?: { scorerId?: string, assist1Id?: string, assist2Id?: string }
  ) => {
    let updates: any = {}
    let label = ''

    if (type === 'tactical_plus' && concept) {
      setTacticalPulse(prev => ({
        ...prev,
        [concept]: { ...prev[concept], plus: prev[concept].plus + 1 }
      }))
      label = `${concept} +`
    } else if (type === 'tactical_minus' && concept) {
      setTacticalPulse(prev => ({
        ...prev,
        [concept]: { ...prev[concept], minus: prev[concept].minus + 1 }
      }))
      label = `${concept} -`
    } else {
      switch (type) {
        case 'goal_for':
          updates.goalsFor = goalsFor + 1
          label = 'Goal Scored'
          setGoalsFor(v => v + 1)
          
          // Update player stats for goal
          if (data?.scorerId) {
            updatePlayerStat(data.scorerId, 'goals', 1)
          }
          if (data?.assist1Id) {
            updatePlayerStat(data.assist1Id, 'assists', 1)
          }
          if (data?.assist2Id) {
            updatePlayerStat(data.assist2Id, 'assists', 1)
          }
          
          // Update +/- for everyone on ice
          onIcePlayers.forEach(id => {
            updatePlayerStat(id, 'plusMinus', 1)
          })
          break
        case 'goal_against':
          updates.goalsAgainst = goalsAgainst + 1
          label = 'Goal Against'
          setGoalsAgainst(v => v + 1)
          
          // Update +/- for everyone on ice
          onIcePlayers.forEach(id => {
            updatePlayerStat(id, 'plusMinus', -1)
          })
          break
        case 'shot_for':
          updates.shotsFor = shotsFor + 1
          label = 'Shot on Goal'
          setShotsFor(v => v + 1)
          break
        case 'shot_against':
          updates.shotsAgainst = shotsAgainst + 1
          label = 'Shot Against'
          setShotsAgainst(v => v + 1)
          break
      }
    }

    const event: GameEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: Date.now(),
      label,
      concept,
      ...data,
      onIcePlayerIds: Array.from(onIcePlayers)
    }

    setHistory(prev => [event, ...prev].slice(0, 15))
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates)
    }
    
    // Haptic feedback if supported
    if ('vibrate' in navigator) navigator.vibrate(50)
  }

  const undoLast = () => {
    if (history.length === 0) return
    const last = history[0]
    let updates: any = {}

    if (last.type === 'tactical_plus' && last.concept) {
      setTacticalPulse(prev => ({
        ...prev,
        [last.concept!]: { ...prev[last.concept!], plus: Math.max(0, prev[last.concept!].plus - 1) }
      }))
    } else if (last.type === 'tactical_minus' && last.concept) {
      setTacticalPulse(prev => ({
        ...prev,
        [last.concept!]: { ...prev[last.concept!], minus: Math.max(0, prev[last.concept!].minus - 1) }
      }))
    } else {
      switch (last.type) {
        case 'goal_for':
          updates.goalsFor = Math.max(0, goalsFor - 1)
          setGoalsFor(v => Math.max(0, v - 1))
          
          // Revert player stats
          if (last.scorerId) updatePlayerStat(last.scorerId, 'goals', -1)
          if (last.assist1Id) updatePlayerStat(last.assist1Id, 'assists', -1)
          if (last.assist2Id) updatePlayerStat(last.assist2Id, 'assists', -1)
          if (last.onIcePlayerIds) {
            last.onIcePlayerIds.forEach(id => updatePlayerStat(id, 'plusMinus', -1))
          }
          break
        case 'goal_against':
          updates.goalsAgainst = Math.max(0, goalsAgainst - 1)
          setGoalsAgainst(v => Math.max(0, v - 1))
          
          // Revert +/-
          if (last.onIcePlayerIds) {
            last.onIcePlayerIds.forEach(id => updatePlayerStat(id, 'plusMinus', 1))
          }
          break
        case 'shot_for':
          updates.shotsFor = Math.max(0, shotsFor - 1)
          setShotsFor(v => Math.max(0, v - 1))
          break
        case 'shot_against':
          updates.shotsAgainst = Math.max(0, shotsAgainst - 1)
          setShotsAgainst(v => Math.max(0, v - 1))
          break
      }
    }

    setHistory(prev => prev.slice(1))
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates)
    }
    toast.success('Action undone')
  }

  const calculateAutoScore = (concept: string) => {
    const { plus, minus } = tacticalPulse[concept]
    const total = plus + minus
    if (total === 0) return 3 // Neutral baseline
    
    // Success ratio scaled to 1-5
    const ratio = plus / total
    const rawScore = 1 + (ratio * 4)
    return Math.round(rawScore * 10) / 10
  }

  const handleExit = () => {
    const scores: any = {}
    CONCEPTS.forEach(c => {
      scores[c] = calculateAutoScore(c)
    })
    
    navigate({ 
      to: '/games/$gameId', 
      params: { gameId },
      search: {
        autoScores: JSON.stringify(scores)
      }
    })
  }

  if (isLoading) return <LoadingOverlay show />
  if (!game) return <div className="p-8 text-center">Game not found</div>

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col z-[100] text-white overflow-hidden safe-area-inset">
      {/* Header / Scoreboard */}
      <BenchModeHeader 
        gameId={gameId}
        opponent={game.opponent || 'Opponent'}
        goalsFor={goalsFor}
        goalsAgainst={goalsAgainst}
        shotsFor={shotsFor}
        shotsAgainst={shotsAgainst}
        history={history}
        onUndo={undoLast}
      />

      {/* Control Grid */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
        <div className="flex p-4 pb-0 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <Button 
            variant={view === 'stats' ? 'primary' : 'ghost'} 
            className={cn("flex-1 rounded-full font-black uppercase tracking-tighter italic min-w-[80px]", view !== 'stats' && "text-zinc-500")}
            onClick={() => setView('stats')}
          >
            Stats
          </Button>
          <Button 
            variant={view === 'tactics' ? 'primary' : 'ghost'} 
            className={cn("flex-1 rounded-full font-black uppercase tracking-tighter italic min-w-[80px]", view !== 'tactics' && "text-zinc-500")}
            onClick={() => setView('tactics')}
          >
            Tactics
          </Button>
          <Button 
            variant={view === 'roster' ? 'primary' : 'ghost'} 
            className={cn("flex-1 rounded-full font-black uppercase tracking-tighter italic min-w-[80px]", view !== 'roster' && "text-zinc-500")}
            onClick={() => setView('roster')}
          >
            Roster
          </Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {view === 'stats' && (
            <StatsView onTrackAction={handleTrackAction} />
          )}
          
          {view === 'tactics' && (
            <TacticsView 
              tacticalPulse={tacticalPulse} 
              calculateAutoScore={calculateAutoScore} 
              onTrackAction={handleTrackAction} 
            />
          )}

          {view === 'roster' && (
            <RosterView 
              players={players}
              lineups={lineups}
              onIcePlayers={onIcePlayers}
              playerStats={playerStats}
              onToggleOnIce={toggleOnIce}
              onToggleUnit={toggleUnit}
            />
          )}
        </div>
      </div>

      <HistoryLog history={history} />

      <GoalCaptureDialog 
        open={isGoalDialogOpen}
        onClose={() => setIsGoalDialogOpen(false)}
        onConfirm={(data) => handleTrackAction('goal_for', undefined, data)}
        players={players}
        onIcePlayers={onIcePlayers}
      />

      {/* Footer / Done */}
      <div className="p-4 bg-zinc-950 flex gap-4 shrink-0 pb-8">
        <CoachsMic gameId={gameId} />
        <Button 
          className="flex-1 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-tighter italic text-lg rounded-full h-14 shadow-xl"
          onClick={handleExit}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" /> Exit & Auto-Review
        </Button>
      </div>
    </div>
  )
}
