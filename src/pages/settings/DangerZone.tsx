import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  toast,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@blinkdotnew/ui'
import {
  Archive,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteSeason } from '../../hooks/useSeasons'
import { useSeasonState } from '../../hooks/usePreferences'
import { type Season } from '../../types'

export function DangerZone({ teamId, activeSeason }: { teamId: string; activeSeason: Season | null }) {
  const [, setSeasonState] = useSeasonState(teamId)
  const deleteSeason = useDeleteSeason()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleArchive = () => {
    if (!activeSeason) return
    setSeasonState((prev) => ({
      activeSeasonId: null,
      archivedSeasonIds: Array.from(new Set([...prev.archivedSeasonIds, activeSeason.id])),
    }))
    queryClient.invalidateQueries({ queryKey: ['team'] })
    queryClient.invalidateQueries({ queryKey: ['practices'] })
    queryClient.invalidateQueries({ queryKey: ['games'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
    toast.success('Active season archived')
  }

  return (
    <Card className="border-red-500/30 bg-red-500/5">
      <CardHeader>
        <CardTitle className="text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </CardTitle>
        <CardDescription className="text-red-200/70">
          These actions affect your data. Read carefully before continuing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-[2rem] border border-red-500/20 bg-background/30 p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Archive active season</p>
            <p className="text-xs text-muted-foreground">
              Marks the current active season as archived. Data is preserved.
            </p>
          </div>
          <Button variant="outline" className="gap-2 rounded-full" onClick={handleArchive} disabled={!activeSeason}>
            <Archive className="w-4 h-4" /> Archive
          </Button>
        </div>

        <div className="rounded-[2rem] border border-red-500/30 bg-background/30 p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Delete active season</p>
            <p className="text-xs text-muted-foreground">
              Permanently deletes the active season and all related practices, segments, games, and reviews.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 rounded-full"
            onClick={() => setConfirmDelete(true)}
            disabled={!activeSeason}
          >
            <Trash2 className="w-4 h-4" /> Delete season
          </Button>
        </div>

        <div className="rounded-[2rem] border border-border/40 bg-background/30 p-4 flex flex-col md:flex-row md:items-center gap-3 opacity-70">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Remove coach access</p>
            <p className="text-xs text-muted-foreground">
              Multi-coach access isn't enabled yet — see the Coaching Staff page for details.
            </p>
          </div>
          <Button variant="outline" disabled>Remove coach</Button>
        </div>
      </CardContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Delete the active season?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <span className="font-semibold text-foreground">{activeSeason?.name}</span> and
              all related practices, practice segments, games, and game reviews. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSeason.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteSeason.isPending}
              onClick={async (e) => {
                e.preventDefault()
                if (!activeSeason) return
                try {
                  await deleteSeason.mutateAsync(activeSeason.id)
                  toast.success('Season deleted')
                  setConfirmDelete(false)
                } catch {
                  toast.error('Could not delete season')
                }
              }}
            >
              {deleteSeason.isPending ? 'Deleting…' : 'Delete season'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
