import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Field,
  FieldLabel,
  FieldDescription,
  Button,
  Switch,
  toast,
  Separator,
} from '@blinkdotnew/ui'
import { Save, Upload, X, ImageIcon } from 'lucide-react'
import { useUpdateSeason, useUpdateTeamName, useUpdateTeamLogo } from '../../hooks/useSeasons'
import {
  useTeamPreferences,
  useRecentColors,
  type TeamPreferences,
} from '../../hooks/usePreferences'
import { type Season } from '../../types'
import { AGE_GROUPS, TEAM_LEVELS, PRESET_COLORS, isValidDateStr } from './utils'
import { ColorSwatch } from './components/ColorSwatch'
import { blink } from '../../blink/client'

export function TeamSettings({ team, activeSeason }: { team: { id: string; name: string; logoUrl?: string }; activeSeason: Season | null }) {
  const [teamPrefs, setTeamPrefs] = useTeamPreferences(team.id)
  const [recentColors, setRecentColors] = useRecentColors(team.id)
  const updateTeamName = useUpdateTeamName()
  const updateTeamLogo = useUpdateTeamLogo()
  const updateSeason = useUpdateSeason()

  const [name, setName] = useState(team.name)
  const [logoUrl, setLogoUrl] = useState(team.logoUrl ?? '')
  const [isUploading, setIsUploading] = useState(false)
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
    logoUrl !== (team.logoUrl ?? '') ||
    prefs.ageGroup !== teamPrefs.ageGroup ||
    prefs.teamLevel !== teamPrefs.teamLevel ||
    prefs.primaryColor !== teamPrefs.primaryColor ||
    prefs.enableAttendance !== teamPrefs.enableAttendance ||
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
      if (logoUrl !== (team.logoUrl ?? '')) {
        promises.push(updateTeamLogo.mutateAsync(logoUrl || null))
      }
      if (
        activeSeason &&
        (seasonStart !== activeSeason.startDate || seasonEnd !== activeSeason.endDate)
      ) {
        promises.push(updateSeason.mutateAsync({ id: activeSeason.id, startDate: seasonStart, endDate: seasonEnd }))
      }
      await Promise.all(promises)
      setTeamPrefs(prefs)
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB')
      return
    }

    try {
      setIsUploading(true)
      const path = `teams/${team.id}/logo-${Date.now()}.${file.name.split('.').pop()}`
      const { publicUrl } = await blink.storage.upload(file, path)
      setLogoUrl(publicUrl)
      toast.success('Logo uploaded')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="border-border/50 rounded-[2rem]">
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>Identifying details for your team and the current season window.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Logo Section */}
          <div className="shrink-0 space-y-3">
            <FieldLabel>Team Logo</FieldLabel>
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2rem] border-2 border-dashed border-border flex items-center justify-center bg-secondary/5 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Team Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full text-xs font-bold shadow-lg hover:bg-background transition-colors flex items-center gap-2">
                  <Upload className="w-3 h-3" />
                  <span>{logoUrl ? 'Change' : 'Upload'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                </label>
              </div>
              {logoUrl && (
                <button
                  onClick={() => setLogoUrl('')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">PNG, JPG up to 2MB</p>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Team Name</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riverside Hawks U14" />
            </Field>
            <Field>
              <FieldLabel>Age Group</FieldLabel>
              <select
                value={prefs.ageGroup}
                onChange={(e) => setPrefs((p) => ({ ...p, ageGroup: e.target.value }))}
                className="flex h-9 w-full rounded-full border border-input bg-background px-3 py-1 text-sm shadow-xs"
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
                className="flex h-9 w-full rounded-full border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="">—</option>
                {TEAM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field className="md:col-span-2">
              <div className="flex items-center justify-between gap-4 p-4 rounded-[2rem] border border-border/50 bg-secondary/10">
                <div className="space-y-0.5">
                  <FieldLabel className="text-base">Practice Attendance Tracking</FieldLabel>
                  <FieldDescription>
                    Enable this to log player attendance during practices and view participation analytics. This does not affect roster management or game lines.
                  </FieldDescription>
                </div>
                <Switch
                  checked={prefs.enableAttendance}
                  onCheckedChange={(checked) => setPrefs((p) => ({ ...p, enableAttendance: checked }))}
                />
              </div>
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
                      className="h-9 w-14 rounded-full border border-input bg-background cursor-pointer"
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
                        className="inline-block h-5 w-12 rounded-full"
                        style={{ backgroundColor: prefs.primaryColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Field>
          </div>
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
          <Button onClick={handleSave} disabled={!dirty || updateTeamName.isPending || updateSeason.isPending || updateTeamLogo.isPending} className="gap-2 rounded-full">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
