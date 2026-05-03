import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  Input,
  Field,
  FieldLabel,
  FieldDescription,
  Button,
  Badge,
  toast,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
} from '@blinkdotnew/ui'
import {
  CalendarRange,
  Plus,
  Pencil,
  Trash2,
  Archive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useSeasons, useCreateSeason, useUpdateSeason, useDeleteSeason } from '../../hooks/useSeasons'
import { useSeasonState } from '../../hooks/usePreferences'
import { CONCEPTS, type Season } from '../../types'
import { cn } from '@/lib/utils'
import { isValidDateStr, parsePriority } from './utils'

export function SeasonsSettings({ teamId, activeSeasonId }: { teamId: string; activeSeasonId: string | null }) {
  const { data: seasons = [] } = useSeasons()
  const [seasonState, setSeasonState] = useSeasonState(teamId)
  const updateSeason = useUpdateSeason()
  const deleteSeason = useDeleteSeason()
  const queryClient = useQueryClient()

  const invalidateSeasonScoped = () => {
    queryClient.invalidateQueries({ queryKey: ['team'] })
    queryClient.invalidateQueries({ queryKey: ['practices'] })
    queryClient.invalidateQueries({ queryKey: ['games'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Season | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Season | null>(null)

  const sorted = useMemo(() => {
    return [...seasons].sort((a, b) => {
      const aActive = a.id === activeSeasonId ? 0 : 1
      const bActive = b.id === activeSeasonId ? 0 : 1
      if (aActive !== bActive) return aActive - bActive
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [seasons, activeSeasonId])

  const handleMakeActive = (id: string) => {
    setSeasonState((prev) => ({
      activeSeasonId: id,
      archivedSeasonIds: prev.archivedSeasonIds.filter((x) => x !== id),
    }))
    invalidateSeasonScoped()
    toast.success('Season set as active')
  }

  const handleArchive = (id: string) => {
    setSeasonState((prev) => ({
      activeSeasonId: prev.activeSeasonId === id ? null : prev.activeSeasonId,
      archivedSeasonIds: Array.from(new Set([...prev.archivedSeasonIds, id])),
    }))
    invalidateSeasonScoped()
    toast.success('Season archived')
  }

  const handleUnarchive = (id: string) => {
    setSeasonState((prev) => ({
      ...prev,
      archivedSeasonIds: prev.archivedSeasonIds.filter((x) => x !== id),
    }))
    invalidateSeasonScoped()
    toast.success('Season restored')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Seasons</h3>
          <p className="text-sm text-muted-foreground">One season is active at a time. Past seasons can be archived.</p>
        </div>
        <Button className="gap-2 rounded-full" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> New Season
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="border-border/50 rounded-[2rem]">
          <CardContent className="p-8">
            <EmptyState title="No seasons yet" description="Create your first season to get going." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((s) => {
            const isActive = s.id === activeSeasonId
            const isArchived = seasonState.archivedSeasonIds.includes(s.id)
            const concepts = parsePriority(s.priorityConcepts)
            return (
              <Card key={s.id} className={cn('border-border/50', isActive && 'border-primary/40 bg-primary/5')}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate">{s.name}</p>
                      {isActive && (
                        <Badge className="bg-primary/15 text-primary border-primary/30 border text-[10px] px-1.5 py-0 h-4 rounded-full">
                          Active
                        </Badge>
                      )}
                      {isArchived && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 rounded-full">Archived</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.startDate} — {s.endDate}
                    </p>
                    {concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {concepts.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px] rounded-full">{c}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {!isActive && (
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => handleMakeActive(s.id)}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Make Active
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => setEditing(s)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    {isArchived ? (
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => handleUnarchive(s.id)}>
                        <Archive className="w-3.5 h-3.5" /> Unarchive
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => handleArchive(s.id)}>
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
                      onClick={() => setConfirmDelete(s)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <SeasonFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />
      <SeasonFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        season={editing ?? undefined}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Delete this season?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-foreground">{confirmDelete?.name}</span>{' '}
              and all related practices, practice segments, games, and game reviews. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSeason.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteSeason.isPending}
              onClick={async (e) => {
                e.preventDefault()
                if (!confirmDelete) return
                try {
                  await deleteSeason.mutateAsync(confirmDelete.id)
                  toast.success('Season deleted')
                  setConfirmDelete(null)
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
    </div>
  )
}

function SeasonFormDialog({
  open,
  onOpenChange,
  mode,
  season,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: 'create' | 'edit'
  season?: Season
}) {
  const createSeason = useCreateSeason()
  const updateSeason = useUpdateSeason()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [concepts, setConcepts] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && season) {
      setName(season.name)
      setStartDate(season.startDate)
      setEndDate(season.endDate)
      setConcepts(parsePriority(season.priorityConcepts))
    } else {
      setName('')
      setStartDate('')
      setEndDate('')
      setConcepts([])
    }
  }, [open, mode, season])

  const datesValid = isValidDateStr(startDate) && isValidDateStr(endDate) && startDate <= endDate
  const conceptsValid = concepts.length >= 3 && concepts.length <= 5
  const valid = name.trim().length > 0 && datesValid && conceptsValid

  const toggleConcept = (c: string) => {
    setConcepts((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  const submit = async () => {
    if (!valid) return
    try {
      if (mode === 'create') {
        await createSeason.mutateAsync({ name: name.trim(), startDate, endDate, priorityConcepts: concepts })
        toast.success('Season created and set active')
      } else if (season) {
        await updateSeason.mutateAsync({
          id: season.id,
          name: name.trim(),
          startDate,
          endDate,
          priorityConcepts: concepts,
        })
        toast.success('Season updated')
      }
      onOpenChange(false)
    } catch {
      toast.error('Could not save season')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Season' : 'Edit Season'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Creating a new season will set it as the active season.'
              : 'Update season details and priority concepts.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field>
            <FieldLabel>Season Name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026-2027" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Start Date</FieldLabel>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>End Date</FieldLabel>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          {!datesValid && (startDate || endDate) && (
            <p className="text-xs text-red-400">End date must be on or after start date.</p>
          )}
          <Field>
            <FieldLabel>Priority Concepts (3–5)</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {CONCEPTS.map((c) => {
                const active = concepts.includes(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleConcept(c)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs border transition-colors',
                      active
                        ? 'bg-primary/15 text-primary border-primary/40'
                        : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/70',
                    )}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
            <FieldDescription>Selected: {concepts.length}</FieldDescription>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={!valid || createSeason.isPending || updateSeason.isPending} className="rounded-full">
            {mode === 'create' ? 'Create Season' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
