import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import type { Team, Season } from '../types'

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

export function useTeam() {
  const { user } = useAuth()
  const seasonStateRev = useSeasonStateRevision()

  return useQuery({
    queryKey: ['team', user?.id, seasonStateRev],
    queryFn: async () => {
      if (!user) return null

      const teams = (await blink.db.teams.list({
        where: { userId: user.id },
        limit: 1,
      })) as Team[]

      const team = teams[0] ?? null
      if (!team) return null

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

      return { team, season }
    },
    enabled: !!user,
  })
}
