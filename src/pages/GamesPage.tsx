import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
  Button, Card, CardContent,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
  Tabs, TabsList, TabsTrigger, TabsContent,
  EmptyState, toast, Separator,
} from '@blinkdotnew/ui'
import { Plus, Swords, Trophy, FileUp } from 'lucide-react'
import { blink } from '@/blink/client'
import { useGames } from '@/hooks/useGames'
import { useTeam } from '@/hooks/useTeam'
import { useGameTypes, useViewMode } from '@/hooks/usePreferences'
import { filterGamesByMode } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'
import type { Game } from '@/types'
import { GameCard } from './games/GameCard'
import { CreateGameDialog } from './games/CreateGameDialog'
import { EditGameDialog } from './games/EditGameDialog'
import { ImportScheduleDialog } from './games/ImportScheduleDialog'

const TABS = ['all', 'scheduled', 'completed', 'reviewed'] as const
type TabValue = typeof TABS[number]

export default function GamesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
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
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            disabled={!seasonId}
            className="gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-full"
          >
            <FileUp className="w-4 h-4" /> Import CSV
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!seasonId}
            className="gap-2 shadow-lg shadow-primary/20 rounded-full"
          >
            <Plus className="w-4 h-4" /> New Game
          </Button>
        </div>
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

      {/* Import */}
      <ImportScheduleDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
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
