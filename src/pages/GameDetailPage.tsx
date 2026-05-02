import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Button, Badge, Card, CardHeader, CardTitle, CardContent,
  Input, Textarea, Field, FieldLabel,
  EmptyState, toast, Separator,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@blinkdotnew/ui'
import { ArrowLeft, Swords, CheckCircle, Save, MapPin, Tag, Clock, Mic } from 'lucide-react'
import { blink } from '@/blink/client'
import { useGame, useGameReview } from '@/hooks/useGames'
import { useTeam } from '@/hooks/useTeam'
import { useGameTypes } from '@/hooks/usePreferences'
import type { GameType } from '@/hooks/usePreferences'
import { cn } from '@/lib/utils'
import { CoachsMic } from '@/components/dashboard/CoachsMic'

const CONCEPT_FIELDS: { key: string; label: string }[] = [
  { key: 'breakoutsRating', label: 'Breakouts' },
  { key: 'forecheckRating', label: 'Forecheck' },
  { key: 'defensiveZoneRating', label: 'Defensive Zone' },
  { key: 'transitionRating', label: 'Transition' },
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
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to="/games" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </Link>
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

      <CoachsMic onApplyNote={handleApplyMicNote} gameId={gameId} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-primary/10 text-primary border-primary/20 border rounded-full">{game.status}</Badge>
            {gameType === 'tournament' && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 border rounded-full">Tournament</Badge>
            )}
            {gameType === 'tournament' && tournamentName && (
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 border rounded-full">{tournamentName}</Badge>
            )}
            {gameType === 'exhibition' && (
              <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 border rounded-full">Exhibition</Badge>
            )}
            {gameType === 'league' && (
              <Badge variant="outline" className="text-muted-foreground border-border rounded-full">League</Badge>
            )}
            <span className="text-xs text-muted-foreground">{dateStr}</span>
            {game.gameTime && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />{formatTime(game.gameTime)}
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {game.location === 'home' ? 'Home' : 'Away'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight truncate">vs. {game.opponent}</h1>
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

      <Separator />

      {/* Game Type Selector */}
      <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Game Type</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              · used to filter dashboards & analytics
            </span>
          </div>
          <Select
            value={gameType}
            disabled={!teamData?.team?.id}
            onValueChange={(v) => {
              if (!teamData?.team?.id) return
              setType(gameId, v as GameType)
              toast.success(`Tagged as ${v}`)
            }}
          >
            <SelectTrigger className="w-44 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="league">League</SelectItem>
              <SelectItem value="tournament">Tournament</SelectItem>
              <SelectItem value="exhibition">Exhibition</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Score Panel */}
      <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Game Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Goals For</FieldLabel>
              <Input type="number" min="0" value={goalsFor} onChange={e => setGoalsFor(e.target.value)} placeholder="0" className="rounded-full" />
            </Field>
            <Field>
              <FieldLabel>Goals Against</FieldLabel>
              <Input type="number" min="0" value={goalsAgainst} onChange={e => setGoalsAgainst(e.target.value)} placeholder="0" className="rounded-full" />
            </Field>
            <Field>
              <FieldLabel>Shots For</FieldLabel>
              <Input type="number" min="0" value={shotsFor} onChange={e => setShotsFor(e.target.value)} placeholder="0" className="rounded-full" />
            </Field>
            <Field>
              <FieldLabel>Shots Against</FieldLabel>
              <Input type="number" min="0" value={shotsAgainst} onChange={e => setShotsAgainst(e.target.value)} placeholder="0" className="rounded-full" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Penalties <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
            <Input value={penalties} onChange={e => setPenalties(e.target.value)} placeholder="e.g. 4 minor · 2 major" className="rounded-full" />
          </Field>
          <div className="flex justify-end">
            <Button onClick={() => saveScore.mutate()} disabled={saveScore.isPending} className="gap-2 rounded-full">
              <CheckCircle className="w-4 h-4" />
              {saveScore.isPending ? 'Saving…' : 'Save Score'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Review Panel */}
      <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Concept Review</CardTitle>
          <p className="text-xs text-muted-foreground">Rate how each core concept performed during the game (1 = poor, 5 = excellent).</p>
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

      {/* Notes Panel */}
      <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>Team Notes</FieldLabel>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What worked? What needs work?" rows={3} className="rounded-[2rem]" />
          </Field>
          <Field>
            <FieldLabel>Opponent Notes <span className="text-muted-foreground text-xs">(for rematch prep)</span></FieldLabel>
            <Textarea value={opponentNotes} onChange={e => setOpponentNotes(e.target.value)} placeholder="Their tendencies, key players, strategies..." rows={3} className="rounded-[2rem]" />
          </Field>
          <div className="flex justify-end">
            <Button onClick={() => saveReview.mutate()} disabled={saveReview.isPending} className="gap-2 shadow-lg shadow-primary/20 rounded-full">
              <Save className="w-4 h-4" />
              {saveReview.isPending ? 'Saving…' : 'Save Review'}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
