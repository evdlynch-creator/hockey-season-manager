import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { 
  Button, 
  Card, 
  CardContent, 
  Badge, 
  toast, 
  Separator,
  LoadingOverlay
} from '@blinkdotnew/ui'
import { 
  ArrowLeft, 
  Swords, 
  Trophy, 
  Target, 
  AlertCircle, 
  History,
  Undo2,
  CheckCircle2,
  Mic
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useGame } from '@/hooks/useGames'
import { cn } from '@/lib/utils'
import { CoachsMic } from '@/components/dashboard/CoachsMic'
import { CONCEPTS } from '@/types'

interface GameEvent {
  id: string
  type: 'goal_for' | 'goal_against' | 'shot_for' | 'shot_against' | 'tactical_plus' | 'tactical_minus'
  timestamp: number
  label: string
  concept?: string
}

export default function BenchModePage() {
  const { gameId } = useParams({ from: '/games/$gameId/bench' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: game, isLoading } = useGame(gameId)

  const [history, setHistory] = useState<GameEvent[]>([])
  const [view, setView] = useState<'stats' | 'tactics'>('stats')
  
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
      await blink.db.games.update(gameId, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
    onError: (e: any) => toast.error('Failed to sync', { description: e.message })
  })

  const trackAction = (type: GameEvent['type'], concept?: string) => {
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
          break
        case 'goal_against':
          updates.goalsAgainst = goalsAgainst + 1
          label = 'Goal Against'
          setGoalsAgainst(v => v + 1)
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
      concept
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
          break
        case 'goal_against':
          updates.goalsAgainst = Math.max(0, goalsAgainst - 1)
          setGoalsAgainst(v => Math.max(0, v - 1))
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
      <div className="bg-zinc-900 border-b border-white/10 p-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Link to="/games/$gameId" params={{ gameId }}>
            <Button variant="ghost" size="icon" className="rounded-full text-white/50 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col items-center">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-1 rounded-full uppercase tracking-tighter text-[10px] font-black">
              Live Bench Mode
            </Badge>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">vs {game.opponent}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-white/50"
            onClick={undoLast}
            disabled={history.length === 0}
          >
            <Undo2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center justify-around gap-8 py-2">
          <div className="text-center">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Our Team</p>
            <div className="text-6xl font-black italic tracking-tighter tabular-nums">{goalsFor}</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-zinc-400">
              <Target className="w-3 h-3" />
              <span className="text-sm font-bold tabular-nums">{shotsFor} Shots</span>
            </div>
          </div>
          
          <div className="text-4xl font-black text-zinc-800 italic">VS</div>

          <div className="text-center">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{game.opponent}</p>
            <div className="text-6xl font-black italic tracking-tighter tabular-nums">{goalsAgainst}</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-zinc-400">
              <Target className="w-3 h-3" />
              <span className="text-sm font-bold tabular-nums">{shotsAgainst} Shots</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Grid */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
        <div className="flex p-4 pb-0 gap-2 shrink-0">
          <Button 
            variant={view === 'stats' ? 'primary' : 'ghost'} 
            className={cn("flex-1 rounded-full font-black uppercase tracking-tighter italic", view !== 'stats' && "text-zinc-500")}
            onClick={() => setView('stats')}
          >
            Stats
          </Button>
          <Button 
            variant={view === 'tactics' ? 'primary' : 'ghost'} 
            className={cn("flex-1 rounded-full font-black uppercase tracking-tighter italic", view !== 'tactics' && "text-zinc-500")}
            onClick={() => setView('tactics')}
          >
            Tactics
          </Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {view === 'stats' ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Our Team Controls */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => trackAction('goal_for')}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all rounded-[2.5rem] flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Trophy className="w-8 h-8" />
                  <span className="font-black uppercase tracking-tighter italic text-xl">Goal</span>
                </button>
                <button
                  onClick={() => trackAction('shot_for')}
                  className="h-28 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all rounded-[2rem] flex flex-col items-center justify-center gap-1 border border-white/5"
                >
                  <Target className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold uppercase tracking-widest text-xs">Shot</span>
                </button>
              </div>

              {/* Opponent Controls */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => trackAction('goal_against')}
                  className="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 transition-all rounded-[2.5rem] flex flex-col items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  <AlertCircle className="w-8 h-8" />
                  <span className="font-black uppercase tracking-tighter italic text-xl">Goal</span>
                </button>
                <button
                  onClick={() => trackAction('shot_against')}
                  className="h-28 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all rounded-[2rem] flex flex-col items-center justify-center gap-1 border border-white/5"
                >
                  <Target className="w-6 h-6 text-red-400" />
                  <span className="font-bold uppercase tracking-widest text-xs">Shot</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {CONCEPTS.map(concept => {
                const score = calculateAutoScore(concept)
                const { plus, minus } = tacticalPulse[concept]
                return (
                  <div key={concept} className="bg-zinc-900 border border-white/5 rounded-[2rem] p-3 pl-5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">{concept}</p>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xl font-black italic tracking-tighter",
                          score >= 4 ? "text-emerald-400" : score <= 2 ? "text-red-400" : "text-white"
                        )}>
                          {score.toFixed(1)}
                        </span>
                        <div className="flex gap-1">
                          <Badge variant="ghost" className="text-[9px] px-1.5 h-4 bg-emerald-500/10 text-emerald-400 border-none rounded-full">{plus}</Badge>
                          <Badge variant="ghost" className="text-[9px] px-1.5 h-4 bg-red-500/10 text-red-400 border-none rounded-full">{minus}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => trackAction('tactical_minus', concept)}
                        className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-red-500/20 border border-white/5 flex items-center justify-center active:scale-90 transition-all"
                      >
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </button>
                      <button
                        onClick={() => trackAction('tactical_plus', concept)}
                        className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-emerald-500/20 border border-white/5 flex items-center justify-center active:scale-90 transition-all"
                      >
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* History Log */}
      <div className="h-40 bg-zinc-900 border-t border-white/10 p-4 overflow-y-auto shrink-0">
        <div className="flex items-center gap-2 mb-3 text-zinc-500">
          <History className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Live Action Log</span>
        </div>
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-zinc-600 italic text-center py-4">Game in progress... tap above to record actions.</p>
          ) : (
            history.map((event) => (
              <div key={event.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {event.type.includes('goal') ? (
                    <div className={cn("w-1.5 h-1.5 rounded-full", event.type === 'goal_for' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]')} />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  )}
                  <span className={cn("font-bold", event.type.includes('for') ? 'text-white' : 'text-zinc-400')}>
                    {event.type.includes('for') ? 'Team' : 'Opponent'} {event.label}
                  </span>
                </div>
                <span className="text-zinc-600 tabular-nums">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

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
