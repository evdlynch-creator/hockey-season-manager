import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import type { Team, Season } from '../types'
import { DEMO_TEAM, DEMO_SEASON, isDemoMode } from './useDemoData'

interface SeasonStateRaw {
  activeSeasonId: string | null
  archivedSeasonIds: string[]
}

function readSeasonState(teamId: string | null): SeasonStateRaw {
  const empty: SeasonStateRaw = { activeSeasonId: null, archivedSeasonIds: [] }
  if (!teamId || typeof window === 'undefined') return empty
  try {
    const raw = window.localStorage.getItem(`season-state:${teamId}`)
    if (!raw) return empty
    const parsed = JSON.parse(raw)
    return {
      activeSeasonId: parsed?.activeSeasonId ?? null,
      archivedSeasonIds: Array.isArray(parsed?.archivedSeasonIds) ? parsed.archivedSeasonIds : [],
    }
  } catch {
    return empty
  }
}

// Bumps a counter on any localStorage write to a `season-state:*` key so that
// React Query callers (whose queryKey includes the counter) re-run.
function useSeasonStateRevision() {
  const [rev, setRev] = useState(0)
  useEffect(() => {
    const onChange = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith('season-state:')) {
        setRev((r) => r + 1)
      }
    }
    window.addEventListener('storage', onChange)
    return () => window.removeEventListener('storage', onChange)
  }, [])
  return rev
}

const SELECTED_TEAM_KEY = 'selected_team_id'

function getSelectedTeamId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SELECTED_TEAM_KEY)
}

function setSelectedTeamId(teamId: string | null) {
  if (typeof window === 'undefined') return
  if (teamId) {
    localStorage.setItem(SELECTED_TEAM_KEY, teamId)
  } else {
    localStorage.removeItem(SELECTED_TEAM_KEY)
  }
}

export function useTeam() {
  const { user } = useAuth()
  const seasonStateRev = useSeasonStateRevision()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['team', user?.id, seasonStateRev, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode()) {
        return { teams: [DEMO_TEAM], team: DEMO_TEAM, season: DEMO_SEASON }
      }
      if (!user) return null

      const teams = (await blink.db.teams.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })) as Team[]

      if (teams.length === 0) return { teams: [], team: null, season: null }

      let selectedId = getSelectedTeamId()
      let team = teams.find((t) => t.id === selectedId) ?? teams[0]

      // Update stored ID if it was missing or stale
      if (team.id !== selectedId) {
        setSelectedTeamId(team.id)
      }

      const seasons = (await blink.db.seasons.list({
        where: { teamId: team.id },
        orderBy: { createdAt: 'desc' },
      })) as Season[]

      const { activeSeasonId, archivedSeasonIds } = readSeasonState(team.id)
      let season: Season | null = null

      if (activeSeasonId) {
        const candidate = seasons.find((s) => s.id === activeSeasonId)
        if (candidate && !archivedSeasonIds.includes(candidate.id)) {
          season = candidate
        }
      }
      if (!season) {
        season = seasons.find((s) => !archivedSeasonIds.includes(s.id)) ?? null
      }

      return { teams, team, season }
    },
    enabled: !!user || isDemoMode(),
  })

  const switchTeam = async (teamId: string) => {
    setSelectedTeamId(teamId)
    await queryClient.invalidateQueries({ queryKey: ['team'] })
    await queryClient.invalidateQueries({ queryKey: ['practices'] })
    await queryClient.invalidateQueries({ queryKey: ['games'] })
    await queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }

  return { ...query, switchTeam }
}