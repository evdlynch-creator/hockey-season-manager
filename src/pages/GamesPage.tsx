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
  Input,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Field, FieldLabel, FieldError,
  Tabs, TabsList, TabsTrigger, TabsContent,
  EmptyState, toast, Separator,
} from '@blinkdotnew/ui'
import { Plus, Eye, Calendar, Swords, MapPin, Trophy, Award, Sparkles } from 'lucide-react'
import { blink } from '@/blink/client'
import { useGames } from '@/hooks/useGames'
import { useTeam } from '@/hooks/useTeam'
import { useGameTypes, useViewMode } from '@/hooks/usePreferences'
import type { GameType } from '@/hooks/usePreferences'
import { filterGamesByMode } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'
import type { Game } from '@/types'

function GameTypeBadge({ type }: { type: GameType }) {
  if (type === 'tournament') {
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 border gap-1">
        <Award className="w-3 h-3" /> Tournament
      </Badge>
    )
  }
  if (type === 'exhibition') {
    return (
      <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 border gap-1">
        <Sparkles className="w-3 h-3" /> Exhibition
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground border-border gap-1">
      <Trophy className="w-3 h-3" /> League
    </Badge>
  )
}

const createSchema = z.object({
  opponent: z.string().min(1, 'Opponent is required'),
  date: z.string().min(1, 'Date is required'),
  location: z.enum(['home', 'away']),
  status: z.enum(['scheduled', 'completed', 'reviewed']),
})
type CreateForm = z.infer<typeof createSchema>

function StatusBadge({ status }: { status: Game['status'] }) {
  if (status === 'scheduled') return <Badge variant="outline" className="text-primary border-primary/30">Scheduled</Badge>
  if (status === 'completed') return <Badge className="bg-primary text-primary-foreground">Completed</Badge>
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border">Reviewed</Badge>
}

function ResultBadge({ game }: { game: Game }) {
  if (game.status === 'scheduled' || game.goalsFor == null || game.goalsAgainst == null) return null
  const gf = Number(game.goalsFor)
  const ga = Number(game.goalsAgainst)
  if (gf > ga) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border">W {gf}-{ga}</Badge>
  if (gf < ga) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border">L {gf}-{ga}</Badge>
  return <Badge variant="secondary">T {gf}-{ga}</Badge>
}

function GameCard({ game, type }: { game: Game; type: GameType }) {
  const navigate = useNavigate()
  const dateStr = game.date ? format(new Date(game.date + 'T00:00:00'), 'MM/dd/yyyy') : '—'

  return (
    <Card className="border-border bg-card hover:border-border/80 transition-all duration-200 group cursor-pointer"
      onClick={() => navigate({ to: '/games/$gameId', params: { gameId: game.id } })}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <GameTypeBadge type={type} />
              <StatusBadge status={game.status} />
              <ResultBadge game={game} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />{dateStr}
              </span>
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <Eye className="w-3.5 h-3.5" /> Open
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateGameDialog({
  open,
  onClose,
  seasonId,
}: { open: boolean; onClose: () => void; seasonId: string }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { opponent: '', date: '', location: 'home', status: 'scheduled' },
  })

  const locationVal = watch('location')
  const statusVal = watch('status')

  const mutation = useMutation({
    mutationFn: async (data: CreateForm) => {
      await blink.db.games.create({
        id: crypto.randomUUID(),
        seasonId,
        opponent: data.opponent,
        date: data.date,
        location: data.location,
        status: data.status,
        createdAt: new Date().toISOString(),
      })
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 pt-2">
          <Field>
            <FieldLabel>Opponent</FieldLabel>
            <Input {...register('opponent')} placeholder="e.g. Bulldogs" />
            {errors.opponent && <FieldError>{errors.opponent.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Date</FieldLabel>
            <Input type="date" {...register('date')} />
            {errors.date && <FieldError>{errors.date.message}</FieldError>}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Location</FieldLabel>
              <Select value={locationVal} onValueChange={v => setValue('location', v as 'home' | 'away')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusVal} onValueChange={v => setValue('status', v as CreateForm['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Schedule Game'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const TABS = ['all', 'scheduled', 'completed', 'reviewed'] as const
type TabValue = typeof TABS[number]

export default function GamesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [tab, setTab] = useState<TabValue>('all')
  const { data: teamData } = useTeam()
  const teamId = teamData?.team.id
  const { data: rawGames = [], isLoading } = useGames()
  const { types: gameTypes, getType } = useGameTypes(teamId)
  const { mode } = useViewMode(teamId)

  const seasonId = teamData?.season?.id ?? ''

  const games = filterGamesByMode(rawGames, gameTypes, mode)
  const filtered = tab === 'all' ? games : games.filter(g => g.status === tab)

  // Stats
  const completed = games.filter(g => g.goalsFor != null && g.goalsAgainst != null)
  const wins = completed.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const losses = completed.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
  const ties = completed.filter(g => Number(g.goalsFor) === Number(g.goalsAgainst)).length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Games</h1>
          <p className="text-muted-foreground text-sm mt-1">{teamData?.season?.name ?? ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!seasonId} className="gap-2 shadow-lg shadow-primary/20">
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
        <TabsList className="bg-secondary/50 border border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>

        {TABS.map(t => (
          <TabsContent key={t} value={t} className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn('h-20 rounded-lg bg-card border border-border animate-pulse', i > 0 && 'opacity-60')} />
              ))
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Swords />}
                title="No games yet"
                description={t === 'all' ? 'Schedule your first game to start tracking performance.' : `No ${t} games.`}
                action={t === 'all' ? { label: 'New Game', onClick: () => setCreateOpen(true) } : undefined}
              />
            ) : (
              filtered.map(g => <GameCard key={g.id} game={g} type={getType(g.id)} />)
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateGameDialog open={createOpen} onClose={() => setCreateOpen(false)} seasonId={seasonId} />
    </div>
  )
}
