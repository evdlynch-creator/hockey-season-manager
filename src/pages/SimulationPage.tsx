import { useState, useEffect } from 'react'
import { 
  Page, 
  PageHeader, 
  PageTitle, 
  PageBody, 
  Card, 
  CardContent, 
  Button, 
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  toast,
  LoadingOverlay
} from '@blinkdotnew/ui'
import { 
  Play, 
  Activity, 
  Target, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Lightbulb,
  History,
  ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGames } from '@/hooks/useGames'
import { usePlayers } from '@/hooks/usePlayers'
import { useLineups } from '@/hooks/useLineups'
import { useFormations } from '@/hooks/useFormations'
import { blink } from '@/blink/client'
import { useNavigate } from '@tanstack/react-router'
import { useTeam } from '@/hooks/useTeam'
import { CONCEPTS, Lineup, GameReview, PracticeSegment } from '@/types'
import { simulateScenario, SimulationEvent, SimulationResult } from '@/lib/simulation-engine'

export default function SimulationPage() {
  const navigate = useNavigate()
  const { data: teamData } = useTeam()
  const { data: games = [], isLoading: gamesLoading } = useGames()
  const { data: allPlayers = [] } = usePlayers()
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const { data: lineups = [], isLoading: lineupsLoading } = useLineups(selectedGameId)
  
  const [scenario, setScenario] = useState('Opening puck drop. Team needs to set the tone early with a strong forecheck.')
  const [concept, setConcept] = useState(CONCEPTS[0])
  const [isSimulating, setIsSimulating] = useState(false)
  const [events, setEvents] = useState<SimulationEvent[]>([])
  const [result, setResult] = useState<SimulationResult | null>(null)

  const [historicalData, setHistoricalData] = useState<{
    reviews: GameReview[],
    practices: PracticeSegment[]
  }>({ reviews: [], practices: [] })

  useEffect(() => {
    if (selectedGameId) {
      const fetchHistory = async () => {
        try {
          const [reviews, practices] = await Promise.all([
            blink.db.game_reviews.list({ limit: 10 }),
            blink.db.practice_segments.list({ limit: 10 })
          ])
          setHistoricalData({ 
            reviews: reviews as GameReview[], 
            practices: practices as PracticeSegment[] 
          })
        } catch (e) {
          console.error('Failed to fetch historical data', e)
        }
      }
      fetchHistory()
    }
  }, [selectedGameId])

  const handleStartSim = async () => {
    if (!selectedGameId) {
      toast.error('Select a game/lineup first')
      return
    }

    setIsSimulating(true)
    setEvents([])
    setResult(null)

    try {
      const simResult = await simulateScenario({
        lineup: lineups,
        players: allPlayers,
        concept,
        scenario,
        historicalData
      }, (event) => {
        setEvents(prev => [...prev, event])
      })
      
      setResult(simResult)
      toast.success('Simulation complete')
    } catch (e: any) {
      toast.error('Simulation failed', { description: e.message })
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <PageTitle>Tactical Simulator</PageTitle>
            <p className="text-sm text-muted-foreground italic uppercase tracking-tighter">Hypothetical Game Scenario Engine</p>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card className="bg-zinc-950 border-white/5">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Select Lineup (from Game)</label>
                  <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                    <SelectTrigger className="bg-black/40 border-white/10 rounded-none">
                      <SelectValue placeholder="Choose a game..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 rounded-none">
                      {games.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          {new Date(g.date).toLocaleDateString()} vs {g.opponent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Tactical Focus</label>
                  <Select value={concept} onValueChange={setConcept}>
                    <SelectTrigger className="bg-black/40 border-white/10 rounded-none">
                      <SelectValue placeholder="Select concept..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 rounded-none">
                      {CONCEPTS.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Scenario Description</label>
                  <Input 
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="e.g. Down by 1, 2:00 left, Offensive Zone Draw"
                    className="bg-black/40 border-white/10 rounded-none italic"
                  />
                </div>

                <Button 
                  onClick={handleStartSim} 
                  disabled={isSimulating || !selectedGameId}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter italic text-lg rounded-none"
                >
                  {isSimulating ? (
                    <Activity className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2 fill-current" />
                  )}
                  {isSimulating ? 'Simulating...' : 'Run Simulation'}
                </Button>
              </CardContent>
            </Card>

            {lineups.length > 0 && (
              <Card className="bg-zinc-950 border-white/5">
                <CardContent className="p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary italic mb-4">Current Unit Preview</h3>
                  <div className="space-y-3">
                    {Object.entries(
                      lineups.reduce((acc, l) => {
                        if (!acc[l.unit]) acc[l.unit] = []
                        acc[l.unit].push(l)
                        return acc
                      }, {} as Record<string, Lineup[]>)
                    ).map(([unit, players]) => (
                      <div key={unit} className="flex items-center justify-between p-2 bg-white/5 border border-white/5">
                        <span className="text-[10px] font-bold text-zinc-400">{unit}</span>
                        <div className="flex gap-1">
                          {players.map(p => (
                            <div key={p.id} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Simulation Feed */}
          <div className="flex flex-col min-h-[600px] bg-black/40 border border-white/5 rounded-none relative overflow-hidden">
            {/* Tactical Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
              <div className="w-full h-full" style={{ 
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />
            </div>

            <div className="p-6 flex-1 flex flex-col space-y-6 relative z-10">
              {events.length === 0 && !isSimulating && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="p-4 rounded-full bg-zinc-900 border border-white/5 mb-4">
                    <Target className="w-12 h-12 text-zinc-700" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic text-zinc-500 mb-2">Tactical Simulation Idle</h2>
                  <p className="text-sm text-zinc-600 max-w-md">Configure your lineup and tactical focus, then click "Run Simulation" to see how your team performs in real-time scenarios.</p>
                </div>
              )}

              {/* Event Log */}
              <div className="space-y-4">
                {events.map((event, idx) => (
                  <div 
                    key={event.id}
                    className={cn(
                      "flex gap-4 p-4 bg-zinc-900/50 border-l-4 transition-all animate-in slide-in-from-left duration-500",
                      event.outcome === 'success' ? "border-primary" : 
                      event.outcome === 'failure' ? "border-destructive" : "border-zinc-700"
                    )}
                  >
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-primary">
                        {event.type === 'shot' ? <Target className="w-4 h-4" /> :
                         event.type === 'goal' ? <Activity className="w-4 h-4 text-emerald-500" /> :
                         <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-black/40 rounded-none">
                          {event.type}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                          <Clock className="w-3 h-3" /> {event.timestamp}s
                        </div>
                      </div>
                      <p className="text-sm text-zinc-100 font-bold tracking-tight italic">{event.description}</p>
                    </div>
                  </div>
                ))}
                {isSimulating && (
                  <div className="flex items-center gap-2 p-4 text-zinc-500 italic animate-pulse">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Processing tactical movements...</span>
                  </div>
                )}
              </div>

              {/* Results Summary */}
              {result && (
                <div className="mt-8 space-y-6 animate-in fade-in zoom-in duration-700">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-primary/10 border-primary/20 rounded-none">
                      <CardContent className="p-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2 italic">Simulated Score</h4>
                        <div className="text-4xl font-black italic tracking-tighter flex items-baseline gap-2">
                          {result.scoreFor} <span className="text-xl opacity-30">-</span> {result.scoreAgainst}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-none">
                      <CardContent className="p-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2 italic">Confidence Level</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${result.confidenceScore * 100}%` }} />
                          </div>
                          <span className="text-xl font-black italic">{Math.round(result.confidenceScore * 100)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2 italic">
                        <History className="w-4 h-4" /> Analyst Summary
                      </h4>
                      <p className="text-lg font-bold text-zinc-100 italic leading-snug">{result.summary}</p>
                    </div>

                    <div className="p-6 bg-zinc-900 border border-white/5 rounded-none relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Lightbulb className="w-24 h-24" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3 italic">Key Tactical Observation</h4>
                      <p className="text-sm text-zinc-300 italic">{result.keyTakeaway}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 italic">Suggested Practice Focus</h4>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {result.drillSuggestions.map(s => (
                          <Badge key={s} className="bg-primary/20 text-primary border-primary/30 rounded-none font-black px-4 py-1 italic uppercase">
                            {s}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const suggestedConcepts = result.drillSuggestions.join(', ')
                          navigate({ 
                            to: '/practices',
                            search: { 
                              autoTitle: `Simulator Follow-up: ${concept}`,
                              autoNotes: `Concepts identified for improvement in tactical simulation: ${suggestedConcepts}. \n\nScenario: ${scenario}`,
                              autoConcepts: result.drillSuggestions
                            } 
                          })
                        }}
                        className="w-full border-primary/30 text-primary hover:bg-primary/10 font-black uppercase tracking-widest italic rounded-none"
                      >
                        <ClipboardList className="w-4 h-4 mr-2" /> Generate Practice Plan from Results
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
