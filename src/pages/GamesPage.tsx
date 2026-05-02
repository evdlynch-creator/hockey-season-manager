import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Button, Badge, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
  Input,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Field, FieldLabel, FieldError,
  Tabs, TabsList, TabsTrigger, TabsContent,
  EmptyState, toast, Separator,
} from '@blinkdotnew/ui'
import { Plus, Eye, Pencil, Trash2, Calendar, Clock, Swords, MapPin, Trophy, Award, Sparkles } from 'lucide-react'
import { blink } from '@/blink/client'
import { useGames } from '@/hooks/useGames'
import { useTeam } from '@/hooks/useTeam'
import { useGameTypes, useViewMode } from '@/hooks/usePreferences'
import type { GameType } from '@/hooks/usePreferences'
import { filterGamesByMode } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'
import type { Game } from '@/types'

// ── Badges ──────────────────────────────────────────────────────────────────────

function GameTypeBadge({ type }: { type: GameType }) {
  if (type === 'tournament') {
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 border gap-1 rounded-full">
        <Award className="w-3 h-3" /> Tournament
      </Badge>
    )
  }
  if (type === 'exhibition') {
    return (
      <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 border gap-1 rounded-full">
        <Sparkles className="w-3 h-3" /> Exhibition
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground border-border gap-1 rounded-full">
      <Trophy className="w-3 h-3" /> League
    </Badge>
  )
}

function StatusBadge({ status }: { status: Game['status'] }) {
  if (status === 'scheduled') return <Badge variant="outline" className="text-primary border-primary/30 rounded-full">Scheduled</Badge>
  if (status === 'completed') return <Badge className="bg-primary text-primary-foreground rounded-full">Completed</Badge>
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border rounded-full">Reviewed</Badge>
}

function ResultBadge({ game }: { game: Game }) {
  if (game.status === 'scheduled' || game.goalsFor == null || game.goalsAgainst == null) return null
  const gf = Number(game.goalsFor)
  const ga = Number(game.goalsAgainst)
  if (gf > ga) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border rounded-full">W {gf}-{ga}</Badge>
  if (gf < ga) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border rounded-full">L {gf}-{ga}</Badge>
  return <Badge variant="secondary" className="rounded-full">T {gf}-{ga}</Badge>
}

// ── Shared form schema ───────────────────────────────────────────────────────────

const gameSchema = z.object({
  opponent: z.string().min(1, 'Opponent is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.enum(['home', 'away']),
  status: z.enum(['scheduled', 'completed', 'reviewed']),
  gameType: z.enum(['league', 'tournament', 'exhibition']),
  tournamentName: z.string().optional(),
})
type GameForm = z.infer<typeof gameSchema>

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

// ── Game Card ───────────────────────────────────────────────────────────────────

function GameCard({
  game,
  type,
  tournamentName,
  onEdit,
  onDelete,
}: {
  game: Game
  type: GameType
  tournamentName: string
  onEdit: (g: Game) => void
  onDelete: (g: Game) => void
}) {
  const navigate = useNavigate()
  const dateStr = game.date ? format(new Date(game.date + 'T00:00:00'), 'MMM d, yyyy') : '—'

  return (
    <Card
      className="border-border bg-card hover:border-border/80 transition-all duration-200 group cursor-pointer rounded-[2rem]"
      onClick={() => navigate({ to: '/games/$gameId', params: { gameId: game.id } })}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <GameTypeBadge type={type} />
              {type === 'tournament' && tournamentName && (
                <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 border text-xs rounded-full">
                  {tournamentName}
                </Badge>
              )}
              <StatusBadge status={game.status} />
              <ResultBadge game={game} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />{dateStr}
              </span>
              {game.gameTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatTime(game.gameTime)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground truncate">
                vs. {game.opponent}
              </h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {game.location === 'home' ? 'Home' : 'Away'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 rounded-full"
              onClick={e => { e.stopPropagation(); navigate({ to: '/games/$gameId', params: { gameId: game.id } }) }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 rounded-full"
              onClick={e => { e.stopPropagation(); onEdit(game) }}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 text-destructive hover:text-destructive"
              onClick={e => { e.stopPropagation(); onDelete(game) }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Create Dialog ────────────────────────────────────────────────────────────────

function CreateGameDialog({
  open,
  onClose,
  seasonId,
  onSetType,
}: {
  open: boolean
  onClose: () => void
  seasonId: string
  onSetType: (id: string, type: GameType, tournamentName?: string) => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GameForm>({
    resolver: zodResolver(gameSchema),
    defaultValues: { opponent: '', date: '', time: '', location: 'home', status: 'scheduled', gameType: 'league', tournamentName: '' },
  })

  const locationVal = watch('location')
  const statusVal = watch('status')
  const gameTypeVal = watch('gameType')

  const mutation = useMutation({
    mutationFn: async (data: GameForm) => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      const id = crypto.randomUUID()
      await blink.db.games.create({
        id,
        seasonId,
        userId: user.id,
        opponent: data.opponent,
        date: data.date,
        gameTime: data.time ?? '',
        location: data.location,
        status: data.status,
        createdAt: new Date().toISOString(),
      })
      onSetType(id, data.gameType, data.tournamentName)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      toast.success('Game scheduled')
      reset()
      onClose()
    },
    onError: (e: Error) => toast.error('Failed to create game', { description: e.message }),
  })

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>New Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 pt-2">
          <Field>
            <FieldLabel>Opponent</FieldLabel>
            <Input {...register('opponent')} placeholder="e.g. Bulldogs" className="rounded-full" />
            {errors.opponent && <FieldError>{errors.opponent.message}</FieldError>}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Date</FieldLabel>
              <Input type="date" {...register('date')} className="rounded-full" />
              {errors.date && <FieldError>{errors.date.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Time <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
              <Input type="time" {...register('time')} className="rounded-full" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Game Type</FieldLabel>
            <Select value={gameTypeVal} onValueChange={v => setValue('gameType', v as GameForm['gameType'])}>
              <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="league">League</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="exhibition">Exhibition</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {gameTypeVal === 'tournament' && (
            <Field>
              <FieldLabel>Tournament Name <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
              <Input {...register('tournamentName')} placeholder="e.g. Spring Classic, City Cup…" className="rounded-full" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Location</FieldLabel>
              <Select value={locationVal} onValueChange={v => setValue('location', v as 'home' | 'away')}>
                <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusVal} onValueChange={v => setValue('status', v as GameForm['status'])}>
                <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="rounded-full">
              {mutation.isPending ? 'Creating…' : 'Schedule Game'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Dialog ──────────────────────────────────────────────────────────────────

function EditGameDialog({
  game,
  currentType,
  currentTournamentName,
  onClose,
  onSetType,
}: {
  game: Game | null
  currentType: GameType
  currentTournamentName: string
  onClose: () => void
  onSetType: (id: string, type: GameType, tournamentName?: string) => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GameForm>({
    resolver: zodResolver(gameSchema),
    values: game
      ? {
          opponent: game.opponent,
          date: game.date,
          time: game.gameTime ?? '',
          location: game.location as 'home' | 'away',
          status: game.status as GameForm['status'],
          gameType: currentType,
          tournamentName: currentTournamentName,
        }
      : { opponent: '', date: '', time: '', location: 'home', status: 'scheduled', gameType: 'league', tournamentName: '' },
  })

  const locationVal = watch('location')
  const statusVal = watch('status')
  const gameTypeVal = watch('gameType')

  const mutation = useMutation({
    mutationFn: async (data: GameForm) => {
      if (!game) return
      await blink.db.games.update(game.id, {
        opponent: data.opponent,
        date: data.date,
        gameTime: data.time ?? '',
        location: data.location,
        status: data.status,
      })
      onSetType(game.id, data.gameType, data.tournamentName)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      queryClient.invalidateQueries({ queryKey: ['game', game?.id] })
      toast.success('Game updated')
      reset()
      onClose()
    },
    onError: (e: Error) => toast.error('Failed to update game', { description: e.message }),
  })

  return (
    <Dialog open={!!game} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 pt-2">
          <Field>
            <FieldLabel>Opponent</FieldLabel>
            <Input {...register('opponent')} placeholder="e.g. Bulldogs" className="rounded-full" />
            {errors.opponent && <FieldError>{errors.opponent.message}</FieldError>}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Date</FieldLabel>
              <Input type="date" {...register('date')} className="rounded-full" />
              {errors.date && <FieldError>{errors.date.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Time <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
              <Input type="time" {...register('time')} className="rounded-full" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Game Type</FieldLabel>
            <Select value={gameTypeVal} onValueChange={v => setValue('gameType', v as GameForm['gameType'])}>
              <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="league">League</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="exhibition">Exhibition</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {gameTypeVal === 'tournament' && (
            <Field>
              <FieldLabel>Tournament Name <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
              <Input {...register('tournamentName')} placeholder="e.g. Spring Classic, City Cup…" className="rounded-full" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Location</FieldLabel>
              <Select value={locationVal} onValueChange={v => setValue('location', v as 'home' | 'away')}>
                <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusVal} onValueChange={v => setValue('status', v as GameForm['status'])}>
                <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="rounded-full">
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────────

const TABS = ['all', 'scheduled', 'completed', 'reviewed'] as const
type TabValue = typeof TABS[number]

export default function GamesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editGame, setEditGame] = useState<Game | null>(null)
  const [deleteGame, setDeleteGame] = useState<Game | null>(null)
  const [tab, setTab] = useState<TabValue>('all')
  const queryClient = useQueryClient()

  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const { data: rawGames = [], isLoading } = useGames()
  const { types: gameTypes, getType, getTournamentName, setType } = useGameTypes(teamId)
  const { mode } = useViewMode(teamId)

  const seasonId = teamData?.season?.id ?? ''

  const games = filterGamesByMode(rawGames, gameTypes, mode)
  const filtered = tab === 'all' ? games : games.filter(g => g.status === tab)

  // Stats
  const completed = games.filter(g => g.goalsFor != null && g.goalsAgainst != null)
  const wins = completed.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const losses = completed.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
  const ties = completed.filter(g => Number(g.goalsFor) === Number(g.goalsAgainst)).length

  const deleteMutation = useMutation({
    mutationFn: async (gameId: string) => {
      // Cascade delete reviews first
      const reviews = await blink.db.gameReviews.list({ where: { gameId } })
      await Promise.all((reviews as { id: string }[]).map(r => blink.db.gameReviews.delete(r.id)))
      await blink.db.games.delete(gameId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      toast.success('Game deleted')
      setDeleteGame(null)
    },
    onError: (e: Error) => toast.error('Failed to delete game', { description: e.message }),
  })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Games</h1>
          <p className="text-muted-foreground text-sm mt-1">{teamData?.season?.name ?? ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!seasonId} className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto rounded-full">
          <Plus className="w-4 h-4" /> New Game
        </Button>
      </div>

      {/* Record strip */}
      {completed.length > 0 && (
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-6">
            <Trophy className="w-5 h-5 text-primary" />
            <div className="flex items-center gap-6 text-sm">
              <span><span className="font-bold text-foreground">{wins}</span> <span className="text-muted-foreground">W</span></span>
              <span><span className="font-bold text-foreground">{losses}</span> <span className="text-muted-foreground">L</span></span>
              <span><span className="font-bold text-foreground">{ties}</span> <span className="text-muted-foreground">T</span></span>
              <span className="text-muted-foreground">· {completed.length} played</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <Tabs value={tab} onValueChange={v => setTab(v as TabValue)}>
        <TabsList className="bg-secondary/50 border border-border w-full justify-start h-auto p-1 overflow-x-auto overflow-y-hidden flex-nowrap no-scrollbar rounded-full">
          <TabsTrigger value="all" className="flex-1 sm:flex-none rounded-full">All</TabsTrigger>
          <TabsTrigger value="scheduled" className="flex-1 sm:flex-none rounded-full">Scheduled</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 sm:flex-none rounded-full">Completed</TabsTrigger>
          <TabsTrigger value="reviewed" className="flex-1 sm:flex-none rounded-full">Reviewed</TabsTrigger>
        </TabsList>

        {TABS.map(t => (
          <TabsContent key={t} value={t} className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn('h-20 rounded-[2rem] bg-card border border-border animate-pulse', i > 0 && 'opacity-60')} />
              ))
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Swords />}
                title="No games yet"
                description={t === 'all' ? 'Schedule your first game to start tracking performance.' : `No ${t} games.`}
                action={t === 'all' ? { label: 'New Game', onClick: () => setCreateOpen(true) } : undefined}
              />
            ) : (
              filtered.map(g => (
                <GameCard
                  key={g.id}
                  game={g}
                  type={getType(g.id)}
                  tournamentName={getTournamentName(g.id)}
                  onEdit={setEditGame}
                  onDelete={setDeleteGame}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create */}
      <CreateGameDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        seasonId={seasonId}
        onSetType={setType}
      />

      {/* Edit */}
      <EditGameDialog
        game={editGame}
        currentType={editGame ? getType(editGame.id) : 'league'}
        currentTournamentName={editGame ? getTournamentName(editGame.id) : ''}
        onClose={() => setEditGame(null)}
        onSetType={setType}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteGame} onOpenChange={v => { if (!v) setDeleteGame(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the game vs. <strong>{deleteGame?.opponent}</strong> and any attached review. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGame && deleteMutation.mutate(deleteGame.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Game'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
