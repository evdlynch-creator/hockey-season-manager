import { useCallback, useEffect, useState } from 'react'

export interface TeamPreferences {
  ageGroup: string
  teamLevel: string
  primaryColor: string
  enableAttendance: boolean
}

export interface NotificationPreferences {
  practiceReminders: boolean
  gameReminders: boolean
  rematchPrep: boolean
  weeklySummary: boolean
  coachMessages: boolean
}

export interface SeasonState {
  activeSeasonId: string | null
  archivedSeasonIds: string[]
}

const DEFAULT_TEAM_PREFS: TeamPreferences = {
  ageGroup: '',
  teamLevel: '',
  primaryColor: '#5b8def',
  enableAttendance: false,
}

const DEFAULT_NOTIFS: NotificationPreferences = {
  practiceReminders: true,
  gameReminders: true,
  rematchPrep: true,
  weeklySummary: false,
  coachMessages: true,
}

const DEFAULT_SEASON_STATE: SeasonState = {
  activeSeasonId: null,
  archivedSeasonIds: [],
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new StorageEvent('storage', { key }))
  } catch {
    // ignore quota errors
  }
}

function usePersistedJson<T>(key: string | null, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => (key ? readJson(key, fallback) : fallback))

  useEffect(() => {
    if (!key) {
      setValue(fallback)
      return
    }
    setValue(readJson(key, fallback))

    const onChange = (e: StorageEvent) => {
      if (e.key === key) setValue(readJson(key, fallback))
    }
    window.addEventListener('storage', onChange)
    return () => window.removeEventListener('storage', onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      if (!key) return
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        writeJson(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, update]
}

export function useTeamPreferences(teamId?: string) {
  return usePersistedJson<TeamPreferences>(teamId ? `team-prefs:${teamId}` : null, DEFAULT_TEAM_PREFS)
}

export function useNotificationPreferences(teamId?: string) {
  return usePersistedJson<NotificationPreferences>(
    teamId ? `notif-prefs:${teamId}` : null,
    DEFAULT_NOTIFS,
  )
}

export function useRecentColors(teamId?: string) {
  return usePersistedJson<{ colors: string[] }>(
    teamId ? `recent-colors:${teamId}` : null,
    { colors: [] },
  )
}

export function useSeasonState(teamId?: string) {
  return usePersistedJson<SeasonState>(teamId ? `season-state:${teamId}` : null, DEFAULT_SEASON_STATE)
}

// ── Game classification (exhibition / tournament / league) ────────────────────

export type GameType = 'league' | 'tournament' | 'exhibition'
export type ViewMode = 'season' | GameType

export const GAME_TYPE_LABEL: Record<GameType, string> = {
  league: 'League',
  tournament: 'Tournament',
  exhibition: 'Exhibition',
}

export const VIEW_MODE_LABEL: Record<ViewMode, string> = {
  season: 'Season',
  league: 'League',
  tournament: 'Tournament',
  exhibition: 'Exhibition',
}

interface GameTypesMap {
  byId: Record<string, GameType>
  nameById: Record<string, string>  // tournament name per game id
}

const DEFAULT_GAME_TYPES: GameTypesMap = { byId: {}, nameById: {} }

interface ViewModeState {
  mode: ViewMode
}

const DEFAULT_VIEW_MODE: ViewModeState = { mode: 'season' }

export function useGameTypes(teamId?: string) {
  const [state, setState] = usePersistedJson<GameTypesMap>(
    teamId ? `game-types:${teamId}` : null,
    DEFAULT_GAME_TYPES,
  )
  const getType = useCallback(
    (gameId: string): GameType => state.byId[gameId] ?? 'league',
    [state.byId],
  )
  const getTournamentName = useCallback(
    (gameId: string): string => state.nameById?.[gameId] ?? '',
    [state.nameById],
  )
  const setType = useCallback(
    (gameId: string, type: GameType, tournamentName?: string) => {
      setState((prev) => ({
        byId: { ...prev.byId, [gameId]: type },
        nameById: {
          ...(prev.nameById ?? {}),
          [gameId]: type === 'tournament' ? (tournamentName ?? prev.nameById?.[gameId] ?? '') : '',
        },
      }))
    },
    [setState],
  )
  return { types: state.byId, nameById: state.nameById ?? {}, getType, getTournamentName, setType }
}

export function useViewMode(teamId?: string) {
  const [state, setState] = usePersistedJson<ViewModeState>(
    teamId ? `view-mode:${teamId}` : null,
    DEFAULT_VIEW_MODE,
  )
  const setMode = useCallback((mode: ViewMode) => setState({ mode }), [setState])
  return { mode: state.mode, setMode }
}