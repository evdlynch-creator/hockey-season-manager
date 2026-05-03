import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Button, Badge, Card, CardHeader, CardTitle, CardContent,
  Input, Textarea, Field, FieldLabel,
  EmptyState, toast, Separator,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tabs, TabsList, TabsTrigger, TabsContent
} from '@blinkdotnew/ui'
import { ArrowLeft, Swords, CheckCircle, Save, MapPin, Tag, Clock, Mic, ClipboardList, LayoutList, Calendar } from 'lucide-react'
import { blink } from '@/blink/client'
import { useGame, useGameReview } from '@/hooks/useGames'
import { useTeam } from '@/hooks/useTeam'
import { useGameTypes } from '@/hooks/usePreferences'
import type { GameType } from '@/hooks/usePreferences'
import { cn } from '@/lib/utils'
import { CoachsMic } from '@/components/dashboard/CoachsMic'
import { LineupPlanner } from './games/LineupPlanner'

const CONCEPT_FIELDS: { key: string; label: string }[] = [
  { key: 'breakoutsRating', label: 'Breakouts' },
  { key: 'forecheckRating', label: 'Forecheck' },
  { key: 'defensiveZoneRating', label: 'Defensive Zone' },
  { key: 'zoneEntryRating', label: 'Zone Entry' },
  { key: 'offensiveZoneRating', label: 'Offensive Zone' },
  { key: 'passingRating', label: 'Passing' },
  { key: 'skatingRating', label: 'Skating' },
]

function RatingRow({ label, value, onChange }: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'w-8 h-8 rounded-full text-xs font-bold transition-all',
              (value ?? 0) >= n
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GameDetailPage() {
  const { gameId } = useParams({ from: '/games/$gameId' })
  const search: any = useSearch({ from: '/games/$gameId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: game, isLoading: gameLoading } = useGame(gameId)
  const { data: review } = useGameReview(gameId)
  const { data: teamData } = useTeam()
  const { getType, getTournamentName, setType } = useGameTypes(teamData?.team?.id)
  const gameType: GameType = getType(gameId)
  const tournamentName = getTournamentName(gameId)

  const [activeTab, setActiveTab] = useState('summary')

  // Score form state
  const [goalsFor, setGoalsFor] = useState<string>('')
  const [goalsAgainst, setGoalsAgainst] = useState<string>('')
  const [shotsFor, setShotsFor] = useState<string>('')
  const [shotsAgainst, setShotsAgainst] = useState<string>('')
  const [penalties, setPenalties] = useState<string>('')

  // Review form state
  const [ratings, setRatings] = useState<Record<string, number | undefined>>({})
  const [notes, setNotes] = useState('')
  const [opponentNotes, setOpponentNotes] = useState('')

  const handleApplyMicNote = (text: string, type: 'team' | 'opponent') => {
    if (type === 'team') {
      setNotes(prev => prev ? `${prev}\n\n${text}` : text)
    } else {
      setOpponentNotes(prev => prev ? `${prev}\n\n${text}` : text)
    }
  }

  useEffect(() => {
    if (game) {
      setGoalsFor(game.goalsFor?.toString() ?? '')
      setGoalsAgainst(game.goalsAgainst?.toString() ?? '')
      setShotsFor(game.shotsFor?.toString() ?? '')
      setShotsAgainst(game.shotsAgainst?.toString() ?? '')
      setPenalties(game.penalties ?? '')
    }
  }, [game])

  useEffect(() => {
    if (review) {
      setRatings({
        breakoutsRating: review.breakoutsRating,
        forecheckRating: review.forecheckRating,
        defensiveZoneRating: review.defensiveZoneRating,
        transitionRating: review.transitionRating,
        passingRating: review.passingRating,
        skatingRating: review.skatingRating,
      })
      setNotes(review.notes ?? '')
      setOpponentNotes(review.opponentNotes ?? '')
    } else if (search.autoScores) {
      try {
        const scores = JSON.parse(search.autoScores)
        const newRatings: any = {}
        CONCEPT_FIELDS.forEach(({ key, label }) => {
          if (scores[label]) {
            newRatings[key] = Math.round(scores[label])
          }
        })
        setRatings(newRatings)
        setActiveTab('review')
        toast.info('Ratings pre-populated from Bench Mode')
      } catch (e) {
        console.error('Failed to parse auto-scores', e)
      }
    }
  }, [review, search.autoScores])

  const dateStr = game?.date ? format(new Date(game.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy') : '—'

  function formatTime(t: string): string {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`
  }

  const saveScore = useMutation({
    mutationFn: async () => {
      await blink.db.games.update(gameId, {
        goalsFor: goalsFor === '' ? null : Number(goalsFor),
        goalsAgainst: goalsAgainst === '' ? null : Number(goalsAgainst),
        shotsFor: shotsFor === '' ? null : Number(shotsFor),
        shotsAgainst: shotsAgainst === '' ? null : Number(shotsAgainst),
        penalties,
        status: game?.status === 'scheduled' ? 'completed' : game?.status,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      toast.success('Game score saved')
    },
    onError: (e: Error) => toast.error('Failed to save', { description: e.message }),
  })

  const saveReview = useMutation({
    mutationFn: async () => {
      const payload = {
        ...ratings,
        notes,
        opponentNotes,
      }
      if (review) {
        await blink.db.gameReviews.update(review.id, payload)
      } else {
        const user = await blink.auth.me()
        if (!user) throw new Error('Not authenticated')

        await blink.db.gameReviews.create({
          id: crypto.randomUUID(),
          gameId,
          userId: user.id,
          ...payload,
          createdAt: new Date().toISOString(),
        })
      }
      await blink.db.games.update(gameId, { status: 'reviewed' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['game-review', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      toast.success('Review saved')
    },
    onError: (e: Error) => toast.error('Failed to save review', { description: e.message }),
  })

  if (gameLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-full" />
        <div className="h-4 w-32 bg-card rounded-full" />
        <div className="h-32 bg-card rounded-[2rem]" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <EmptyState icon={<Swords />} title="Game not found" description="This game may have been deleted." />
      </div>
    )
  }

  const gf = goalsFor === '' ? null : Number(goalsFor)
  const ga = goalsAgainst === '' ? null : Number(goalsAgainst)
  const resultLabel = gf != null && ga != null
    ? (gf > ga ? 'Win' : gf < ga ? 'Loss' : 'Tie')
    : null

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/games" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="text-xl font-bold tracking-tight truncate hidden sm:block">vs. {game.opponent}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <CoachsMic onApplyNote={handleApplyMicNote} gameId={gameId} />
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate({ to: '/games/$gameId/bench', params: { gameId } })}
          >
            <Swords className="w-4 h-4" />
            Enter Bench Mode
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <TabsList className="bg-secondary/10 p-1 rounded-full border border-white/5">
            <TabsTrigger value="summary" className="rounded-full gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="lineup" className="rounded-full gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutList className="w-4 h-4" />
              Lineup
            </TabsTrigger>
            <TabsTrigger value="review" className="rounded-full gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CheckCircle className="w-4 h-4" />
              Game Review
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 border rounded-full">{game.status}</Badge>
            <span className="text-xs text-muted-foreground">{dateStr}</span>
          </div>
        </div>

        <TabsContent value="summary" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Header Info */}
              <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Swords className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight italic uppercase tracking-tighter">vs. {game.opponent}</h2>
                        {resultLabel && (
                          <p className={cn(
                            'text-sm font-semibold',
                            resultLabel === 'Win' && 'text-emerald-400',
                            resultLabel === 'Loss' && 'text-red-400',
                            resultLabel === 'Tie' && 'text-muted-foreground',
                          )}>
                            {resultLabel} — {gf}-{ga}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </div>
                      {game.gameTime && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(game.gameTime)}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {game.location === 'home' ? 'Home Ice' : 'On the Road'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Tag className="w-3.5 h-3.5" />
                        {gameType.charAt(0).toUpperCase() + gameType.slice(1)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Panel */}
              <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Game Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <Field>
                      <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Goals For</FieldLabel>
                      <Input type="number" min="0" value={goalsFor} onChange={e => setGoalsFor(e.target.value)} placeholder="0" className="rounded-2xl h-12 text-xl font-black italic" />
                    </Field>
                    <Field>
                      <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Goals Against</FieldLabel>
                      <Input type="number" min="0" value={goalsAgainst} onChange={e => setGoalsAgainst(e.target.value)} placeholder="0" className="rounded-2xl h-12 text-xl font-black italic" />
                    </Field>
                    <Field>
                      <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Shots For</FieldLabel>
                      <Input type="number" min="0" value={shotsFor} onChange={e => setShotsFor(e.target.value)} placeholder="0" className="rounded-2xl h-12 text-xl font-black italic" />
                    </Field>
                    <Field>
                      <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Shots Against</FieldLabel>
                      <Input type="number" min="0" value={shotsAgainst} onChange={e => setShotsAgainst(e.target.value)} placeholder="0" className="rounded-2xl h-12 text-xl font-black italic" />
                    </Field>
                  </div>
                  
                  <Field>
                    <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Penalties / Discipline</FieldLabel>
                    <Input value={penalties} onChange={e => setPenalties(e.target.value)} placeholder="e.g. 4 minor · 2 major" className="rounded-2xl" />
                  </Field>

                  <div className="flex justify-end pt-2">
                    <Button onClick={() => saveScore.mutate()} disabled={saveScore.isPending} className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20 font-bold uppercase italic tracking-tighter">
                      <CheckCircle className="w-4 h-4" />
                      {saveScore.isPending ? 'Saving…' : 'Save Scoreboard'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Game Settings */}
              <Card className="border-border bg-sidebar/20 rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Game Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Match Type</FieldLabel>
                    <Select
                      value={gameType}
                      disabled={!teamData?.team?.id}
                      onValueChange={(v) => {
                        if (!teamData?.team?.id) return
                        setType(gameId, v as GameType)
                        toast.success(`Tagged as ${v}`)
                      }}
                    >
                      <SelectTrigger className="rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="league">League</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="exhibition">Exhibition</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {gameType === 'tournament' && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                      <p className="text-[10px] font-black uppercase text-amber-500/80">Tournament View Active</p>
                      <p className="text-xs text-muted-foreground">This game will contribute to tournament-specific analytics.</p>
                    </div>
                  )}

                  <div className="pt-4 flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-full gap-2 text-zinc-500 hover:text-white"
                      onClick={() => setActiveTab('lineup')}
                    >
                      <LayoutList className="w-4 h-4" />
                      Plan Game Lineup
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-full gap-2 text-zinc-500 hover:text-white"
                      onClick={() => setActiveTab('review')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Post-Game Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lineup" className="mt-0">
          <Card className="border-border bg-card rounded-[2rem] overflow-hidden p-6 md:p-10">
            <LineupPlanner gameId={gameId} />
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-border bg-card rounded-[2rem] overflow-hidden h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Tactical Assessment</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate performance across core concepts.</p>
                </CardHeader>
                <CardContent className="space-y-1 divide-y divide-border">
                  {CONCEPT_FIELDS.map(({ key, label }) => (
                    <RatingRow
                      key={key}
                      label={label}
                      value={ratings[key]}
                      onChange={v => setRatings(prev => ({ ...prev, [key]: v }))}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Coaching Journal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Field>
                    <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Our Performance</FieldLabel>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What worked? What needs work?" rows={5} className="rounded-[1.5rem] bg-white/[0.02] italic" />
                  </Field>
                  <Field>
                    <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Opponent Intel <span className="text-muted-foreground lowercase font-normal italic">(for rematch prep)</span></FieldLabel>
                    <Textarea value={opponentNotes} onChange={e => setOpponentNotes(e.target.value)} placeholder="Their tendencies, key players, strategies..." rows={5} className="rounded-[1.5rem] bg-white/[0.02] italic" />
                  </Field>
                  <div className="flex justify-end">
                    <Button onClick={() => saveReview.mutate()} disabled={saveReview.isPending} className="gap-2 shadow-lg shadow-primary/20 rounded-full px-8 font-black uppercase italic tracking-tighter">
                      <Save className="w-4 h-4" />
                      {saveReview.isPending ? 'Saving…' : 'Finalize Review'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
