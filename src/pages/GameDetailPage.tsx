import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Badge, Card,
  EmptyState, toast,
  Tabs, TabsList, TabsTrigger, TabsContent
} from '@blinkdotnew/ui'
import { Swords, CheckCircle, ClipboardList, LayoutList, MessageSquare } from 'lucide-react'
import { blink } from '@/blink/client'
import { useGame, useGameReview } from '@/hooks/useGames'
import { useTeam } from '@/hooks/useTeam'
import { useGameTypes } from '@/hooks/usePreferences'
import type { GameType } from '@/hooks/usePreferences'
import { LineupPlanner } from './games/lineups/LineupPlanner'
import { CoachChat } from '@/components/coaching/CoachChat'
import { GameSummaryHeader } from './games/components/GameSummaryHeader'
import { GameScorePanel } from './games/components/GameScorePanel'
import { GameReviewPanel } from './games/components/GameReviewPanel'
import { GameConfigSidebar } from './games/components/GameConfigSidebar'
import { CONCEPT_FIELDS } from './games/schema'

export default function GameDetailPage() {
  const { gameId } = useParams({ from: '/games/$gameId' })
  const search: any = useSearch({ from: '/games/$gameId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: game, isLoading: gameLoading } = useGame(gameId)
  const { data: review } = useGameReview(gameId)
  const { data: teamData } = useTeam()
  const { getType, setType } = useGameTypes(teamData?.team?.id)
  const gameType: GameType = getType(gameId)
  
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
    onError: (e: Error) => toast.error('Failed to save score', { description: e.message }),
  })

  const saveReport = useMutation({
    mutationFn: async (summary: string) => {
      if (review) {
        await blink.db.gameReviews.update(review.id, { summary })
      } else {
        const user = await blink.auth.me()
        if (!user) throw new Error('Not authenticated')
        await blink.db.gameReviews.create({
          id: crypto.randomUUID(),
          gameId,
          userId: user.id,
          summary,
          createdAt: new Date().toISOString(),
        })
      }
      await blink.db.games.update(gameId, { status: 'reviewed' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['game-review', gameId] })
      toast.success('Post-game report shared to staff board')
    },
    onError: (e: Error) => toast.error('Failed to save report', { description: e.message }),
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
      <GameSummaryHeader 
        game={game} 
        gameId={gameId}
        resultLabel={resultLabel} 
        gf={gf} 
        ga={ga} 
        dateStr={dateStr} 
        gameType={gameType} 
        formatTime={formatTime} 
        onApplyMicNote={handleApplyMicNote}
      />

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
            <TabsTrigger value="chat" className="rounded-full gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="w-4 h-4" />
              Coaches Chat
            </TabsTrigger>
            <TabsTrigger value="review" className="rounded-full gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CheckCircle className="w-4 h-4" />
              Game Review & Report
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
              <GameScorePanel 
                goalsFor={goalsFor} setGoalsFor={setGoalsFor} 
                goalsAgainst={goalsAgainst} setGoalsAgainst={setGoalsAgainst} 
                shotsFor={shotsFor} setShotsFor={setShotsFor} 
                shotsAgainst={shotsAgainst} setShotsAgainst={setShotsAgainst} 
                penalties={penalties} setPenalties={setPenalties} 
                onSave={() => saveScore.mutate()} 
                isSaving={saveScore.isPending} 
              />
            </div>

            <GameConfigSidebar 
              gameId={gameId} 
              gameType={gameType} 
              teamId={teamData?.team?.id}
              setType={setType} 
              onTabChange={setActiveTab} 
            />
          </div>
        </TabsContent>

        <TabsContent value="lineup" className="mt-0">
          <Card className="border-border bg-card rounded-[2rem] overflow-hidden p-6 md:p-10">
            <LineupPlanner gameId={gameId} />
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-0">
          <CoachChat contextType="game" contextId={gameId} className="h-[600px]" />
        </TabsContent>

        <TabsContent value="review" className="space-y-6 mt-0">
          <GameReviewPanel 
            game={game} 
            review={review} 
            ratings={ratings} 
            onRatingChange={(key, val) => setRatings(prev => ({ ...prev, [key]: val }))}
            notes={notes} 
            setNotes={setNotes} 
            opponentNotes={opponentNotes} 
            setOpponentNotes={setOpponentNotes} 
            onSave={() => saveReview.mutate()} 
            isSaving={saveReview.isPending}
            onSaveReport={(summary) => saveReport.mutate(summary)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
