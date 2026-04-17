import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Field,
  FieldLabel,
  FieldDescription,
  Button,
  Badge,
  Switch,
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
  Separator,
} from '@blinkdotnew/ui'
import {
  Users,
  CalendarRange,
  Bell,
  UserCircle,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Archive,
  CheckCircle2,
  LogOut,
  Save,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTeam } from '../hooks/useTeam'
import { useAuth } from '../hooks/useAuth'
import { useSeasons, useCreateSeason, useUpdateSeason, useDeleteSeason, useUpdateTeamName } from '../hooks/useSeasons'
import { useTeamMembers, useRemoveMember } from '../hooks/useTeamMembers'
import {
  useTeamPreferences,
  useNotificationPreferences,
  useSeasonState,
  useRecentColors,
  type TeamPreferences,
  type NotificationPreferences,
} from '../hooks/usePreferences'
import { blink } from '../blink/client'
import { CONCEPTS, type Season } from '../types'
import { format, parseISO, isValid } from 'date-fns'
import { cn } from '@/lib/utils'

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U13', 'U14', 'U15', 'U16', 'U18', 'Junior', 'Senior', 'Adult']
const TEAM_LEVELS = ['House', 'Tier 3', 'Tier 2', 'Tier 1', 'AA', 'AAA', 'Prep', 'Junior A', 'Other']

function isValidDateStr(s: string) {
  if (!s) return false
  const d = parseISO(s)
  return isValid(d)
}

function parsePriority(json: string | undefined | null): string[] {
  if (!json) return []
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { data: teamData, isLoading } = useTeam()
  const team = teamData?.team
  const activeSeason = teamData?.season

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <EmptyState
          title="No team yet"
          description="Finish onboarding to access settings."
        />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team, seasons, preferences, and account.
        </p>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-secondary/40 p-1">
          <TabsTrigger value="team" className="gap-2"><Users className="w-4 h-4" /> Team</TabsTrigger>
          <TabsTrigger value="seasons" className="gap-2"><CalendarRange className="w-4 h-4" /> Seasons</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="account" className="gap-2"><UserCircle className="w-4 h-4" /> Account</TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 text-red-400 data-[state=active]:text-red-300">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <TeamSettings team={team} activeSeason={activeSeason ?? null} />
        </TabsContent>

        <TabsContent value="seasons" className="mt-6">
          <SeasonsSettings teamId={team.id} activeSeasonId={activeSeason?.id ?? null} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsSettings teamId={team.id} />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountSettings email={(user as any)?.email ?? ''} />
        </TabsContent>

        <TabsContent value="danger" className="mt-6">
          <DangerZone teamId={team.id} activeSeason={activeSeason ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ---------------- Team ---------------- */

const PRESET_COLORS: { name: string; value: string }[] = [
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Crimson', value: '#b91c1c' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Forest', value: '#15803d' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Navy', value: '#1d4ed8' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Black', value: '#111827' },
]

function ColorSwatch({
  color,
  selected,
  onClick,
  title,
}: {
  color: string
  selected?: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? color}
      style={{ backgroundColor: color }}
      className={cn(
        'h-7 w-7 rounded-md border transition-all hover:scale-110',
        selected ? 'border-foreground ring-2 ring-foreground/20' : 'border-border/60',
      )}
      aria-label={title ?? color}
    />
  )
}

function TeamSettings({ team, activeSeason }: { team: { id: string; name: string }; activeSeason: Season | null }) {
  const [teamPrefs, setTeamPrefs] = useTeamPreferences(team.id)
  const [recentColors, setRecentColors] = useRecentColors(team.id)
  const updateTeamName = useUpdateTeamName()
  const updateSeason = useUpdateSeason()

  const [name, setName] = useState(team.name)
  const [prefs, setPrefs] = useState<TeamPreferences>(teamPrefs)
  const [seasonStart, setSeasonStart] = useState(activeSeason?.startDate ?? '')
  const [seasonEnd, setSeasonEnd] = useState(activeSeason?.endDate ?? '')

  useEffect(() => setName(team.name), [team.name])
  useEffect(() => setPrefs(teamPrefs), [teamPrefs])
  useEffect(() => {
    setSeasonStart(activeSeason?.startDate ?? '')
    setSeasonEnd(activeSeason?.endDate ?? '')
  }, [activeSeason?.id, activeSeason?.startDate, activeSeason?.endDate])

  const dirty =
    name !== team.name ||
    prefs.ageGroup !== teamPrefs.ageGroup ||
    prefs.teamLevel !== teamPrefs.teamLevel ||
    prefs.primaryColor !== teamPrefs.primaryColor ||
    seasonStart !== (activeSeason?.startDate ?? '') ||
    seasonEnd !== (activeSeason?.endDate ?? '')

  const seasonDatesValid =
    !activeSeason ||
    (isValidDateStr(seasonStart) && isValidDateStr(seasonEnd) && seasonStart <= seasonEnd)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Team name is required')
      return
    }
    if (activeSeason && !seasonDatesValid) {
      toast.error('Season end date must be on or after the start date')
      return
    }
    try {
      const promises: Promise<unknown>[] = []
      if (name.trim() !== team.name) {
        promises.push(updateTeamName.mutateAsync(name.trim()))
      }
      if (
        activeSeason &&
        (seasonStart !== activeSeason.startDate || seasonEnd !== activeSeason.endDate)
      ) {
        promises.push(updateSeason.mutateAsync({ id: activeSeason.id, startDate: seasonStart, endDate: seasonEnd }))
      }
      await Promise.all(promises)
      setTeamPrefs(prefs)
      // Track the chosen color in recents (skip if it's a preset, dedup, max 8).
      const chosen = prefs.primaryColor.toLowerCase()
      const isPreset = PRESET_COLORS.some((p) => p.value.toLowerCase() === chosen)
      if (chosen && !isPreset) {
        setRecentColors((prev) => ({
          colors: [chosen, ...prev.colors.filter((c) => c.toLowerCase() !== chosen)].slice(0, 8),
        }))
      }
      toast.success('Team settings saved')
    } catch {
      toast.error('Could not save team settings')
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>Identifying details for your team and the current season window.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Team Name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riverside Hawks U14" />
          </Field>
          <Field>
            <FieldLabel>Age Group</FieldLabel>
            <select
              value={prefs.ageGroup}
              onChange={(e) => setPrefs((p) => ({ ...p, ageGroup: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
            >
              <option value="">—</option>
              {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel>Team Level</FieldLabel>
            <select
              value={prefs.teamLevel}
              onChange={(e) => setPrefs((p) => ({ ...p, teamLevel: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
            >
              <option value="">—</option>
              {TEAM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>Primary Team Color</FieldLabel>
            <FieldDescription>Used as a visual accent across the app.</FieldDescription>

            <div className="mt-2 space-y-3">
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1.5">
                  Presets
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <ColorSwatch
                      key={c.value}
                      color={c.value}
                      title={c.name}
                      selected={prefs.primaryColor.toLowerCase() === c.value.toLowerCase()}
                      onClick={() => setPrefs((p) => ({ ...p, primaryColor: c.value }))}
                    />
                  ))}
                </div>
              </div>

              {recentColors.colors.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1.5">
                    Recently used
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentColors.colors.map((c) => (
                      <ColorSwatch
                        key={c}
                        color={c}
                        selected={prefs.primaryColor.toLowerCase() === c.toLowerCase()}
                        onClick={() => setPrefs((p) => ({ ...p, primaryColor: c }))}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground mb-1.5">
                  Custom
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={prefs.primaryColor}
                    onChange={(e) => setPrefs((p) => ({ ...p, primaryColor: e.target.value }))}
                    className="h-9 w-14 rounded-md border border-input bg-background cursor-pointer"
                  />
                  <Input
                    value={prefs.primaryColor}
                    onChange={(e) => setPrefs((p) => ({ ...p, primaryColor: e.target.value }))}
                    className="font-mono text-xs max-w-[140px]"
                    placeholder="#000000"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Preview</span>
                    <span
                      className="inline-block h-5 w-12 rounded"
                      style={{ backgroundColor: prefs.primaryColor }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Field>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-3">Active Season Window</h4>
          {!activeSeason ? (
            <p className="text-sm text-muted-foreground">No active season. Create one in the Seasons tab.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Season Start Date</FieldLabel>
                <Input type="date" value={seasonStart} onChange={(e) => setSeasonStart(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Season End Date</FieldLabel>
                <Input type="date" value={seasonEnd} onChange={(e) => setSeasonEnd(e.target.value)} />
                {!seasonDatesValid && (
                  <p className="text-xs text-red-400 mt-1">End date must be on or after start date.</p>
                )}
              </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!dirty || updateTeamName.isPending || updateSeason.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------------- Seasons ---------------- */

function SeasonsSettings({ teamId, activeSeasonId }: { teamId: string; activeSeasonId: string | null }) {
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
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> New Season
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="border-border/50">
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
                        <Badge className="bg-primary/15 text-primary border-primary/30 border text-[10px] px-1.5 py-0 h-4">
                          Active
                        </Badge>
                      )}
                      {isArchived && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Archived</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.startDate} — {s.endDate}
                    </p>
                    {concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {concepts.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {!isActive && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleMakeActive(s.id)}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Make Active
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(s)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    {isArchived ? (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleUnarchive(s.id)}>
                        <Archive className="w-3.5 h-3.5" /> Unarchive
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleArchive(s.id)}>
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || createSeason.isPending || updateSeason.isPending}>
            {mode === 'create' ? 'Create Season' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- Notifications ---------------- */

function NotificationsSettings({ teamId }: { teamId: string }) {
  const [prefs, setPrefs] = useNotificationPreferences(teamId)

  const items: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    { key: 'practiceReminders', label: 'Practice reminders', description: 'Email me before upcoming practices.' },
    { key: 'gameReminders', label: 'Game reminders', description: 'Email me before upcoming games.' },
    { key: 'rematchPrep', label: 'Rematch prep alerts', description: 'Notify me when an upcoming game is a rematch.' },
    { key: 'weeklySummary', label: 'Weekly summary', description: 'A short Monday recap of last week and the week ahead.' },
  ]

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Lightweight preferences saved on this device.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/40">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between py-3 gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.description}</p>
            </div>
            <Switch
              checked={prefs[it.key]}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, [it.key]: v }))}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ---------------- Account ---------------- */

function AccountSettings({ email }: { email: string }) {
  const handleLogout = async () => {
    try {
      await blink.auth.logout()
    } catch {
      toast.error('Could not log out')
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your sign-in details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={email} disabled />
              <FieldDescription>Managed by your sign-in provider.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Button variant="outline" disabled className="justify-start">
                Change password (managed by sign-in)
              </Button>
              <FieldDescription>Use your identity provider to change your password.</FieldDescription>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Sign out</p>
            <p className="text-xs text-muted-foreground">End your session on this device.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- Danger Zone ---------------- */

function DangerZone({ teamId, activeSeason }: { teamId: string; activeSeason: Season | null }) {
  const [, setSeasonState] = useSeasonState(teamId)
  const deleteSeason = useDeleteSeason()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const { user } = useAuth()
  const { data: members = [] } = useTeamMembers(teamId)
  const myEmail = (user?.email ?? '').toLowerCase()
  const myMembership =
    members.find((m) => m.userId === user?.id) ??
    members.find((m) => m.email.toLowerCase() === myEmail) ??
    null
  const isOwner = myMembership?.role === 'owner'
  const removeMember = useRemoveMember()

  const handleLeave = async () => {
    if (!myMembership) return
    try {
      await removeMember.mutateAsync(myMembership)
      toast.success('You left the team')
      setConfirmLeave(false)
      // Force the team scope to re-resolve and pick up another team (or land on onboarding).
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['myTeams'] })
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : 'Could not leave team'
      toast.error(msg)
    }
  }

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
        <div className="rounded-md border border-red-500/20 bg-background/30 p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Archive active season</p>
            <p className="text-xs text-muted-foreground">
              Marks the current active season as archived. Data is preserved.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleArchive} disabled={!activeSeason}>
            <Archive className="w-4 h-4" /> Archive
          </Button>
        </div>

        <div className="rounded-md border border-red-500/30 bg-background/30 p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Delete active season</p>
            <p className="text-xs text-muted-foreground">
              Permanently deletes the active season and all related practices, segments, games, and reviews.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
            onClick={() => setConfirmDelete(true)}
            disabled={!activeSeason}
          >
            <Trash2 className="w-4 h-4" /> Delete season
          </Button>
        </div>

        {isOwner ? (
          <div className="rounded-md border border-border/40 bg-background/30 p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Manage coach access</p>
              <p className="text-xs text-muted-foreground">
                Invite, resend, revoke, or remove coaches from the Coaching Staff page.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/team">Open Coaching Staff</a>
            </Button>
          </div>
        ) : myMembership ? (
          <div className="rounded-md border border-red-500/30 bg-background/30 p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Leave this team</p>
              <p className="text-xs text-muted-foreground">
                You'll lose access to this team's data immediately. Anything
                you've already entered stays on the team.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
              onClick={() => setConfirmLeave(true)}
            >
              <Trash2 className="w-4 h-4" /> Leave team
            </Button>
          </div>
        ) : null}
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

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Leave this team?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose access to this team's practices, games, and analytics
              immediately. The team owner can re-invite you any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMember.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={removeMember.isPending}
              onClick={(e) => {
                e.preventDefault()
                handleLeave()
              }}
            >
              {removeMember.isPending ? 'Leaving…' : 'Leave team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
