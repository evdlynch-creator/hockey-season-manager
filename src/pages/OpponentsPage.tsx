import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { EmptyState, Button } from '@blinkdotnew/ui'
import { Users, Swords, Trophy, FileText } from 'lucide-react'
import { useFilteredAnalytics, filterGamesByMode, buildOpponentInsights } from '@/hooks/useAnalytics'
import { ScoutingReport } from './opponents/ScoutingReport'
import { useGames } from '@/hooks/useGames'
import { useTeam } from '@/hooks/useTeam'
import { useGameTypes, useViewMode } from '@/hooks/usePreferences'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'
import type { OpponentStats } from './opponents/types'
import { CONCEPT_FIELD_MAP, recordColor } from './opponents/utils'
import { OpponentListItem } from './opponents/OpponentListItem'
import { OpponentDetail } from './opponents/OpponentDetail'

export default function OpponentsPage() {
  const navigate = useNavigate()
  const [reportOpen, setReportOpen] = useState(false)
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const { data: analytics, isLoading } = useFilteredAnalytics()
  const { data: rawGames = [] } = useGames()
  const { types: gameTypes } = useGameTypes(teamId)
  const { mode: viewMode } = useViewMode(teamId)
  const games = filterGamesByMode(rawGames, gameTypes, viewMode)

  const search = useSearch({ from: '/opponents' }) as { opponent?: string }
  const selectedOpponent = search.opponent

  const statsByOpponent = useMemo(() => {
    if (!analytics) return new Map<string, OpponentStats>()
    const map = new Map<string, OpponentStats>()

    games.forEach(g => {
      const name = g.opponent
      let s = map.get(name)
      if (!s) {
        s = {
          name,
          games: [],
          reviews: [],
          wins: 0,
          losses: 0,
          ties: 0,
          totalGoalsFor: 0,
          totalGoalsAgainst: 0,
          avgConceptRatings: {},
          notes: [],
          lastPlayed: null,
          nextGame: null,
        }
        CONCEPTS.forEach(c => s!.avgConceptRatings[c] = null)
        map.set(name, s)
      }
      s.games.push(g)
    })

    const today = new Date().toISOString().split('T')[0]
    map.forEach(s => {
      s.games.sort((a, b) => a.date.localeCompare(b.date))
      const completed = s.games.filter(g => g.goalsFor != null && g.goalsAgainst != null)
      s.wins = completed.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
      s.losses = completed.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
      s.ties = completed.length - s.wins - s.losses
      s.totalGoalsFor = completed.reduce((sum, g) => sum + Number(g.goalsFor ?? 0), 0)
      s.totalGoalsAgainst = completed.reduce((sum, g) => sum + Number(g.goalsAgainst ?? 0), 0)
      
      const played = s.games.filter(g => g.date <= today).sort((a, b) => b.date.localeCompare(a.date))
      s.lastPlayed = played.length ? played[0].date : null
      
      const upcoming = s.games.filter(g => g.date > today).sort((a, b) => a.date.localeCompare(b.date))
      s.nextGame = upcoming.length ? upcoming[0] : null

      s.reviews = analytics.reviews.filter(r => s.games.find(g => g.id === r.gameId))
      CONCEPTS.forEach(c => {
        const field = CONCEPT_FIELD_MAP[c]
        const vals = s.reviews.map(r => r[field]).filter(v => v != null).map(Number)
        s.avgConceptRatings[c] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      })
    })

    return map
  }, [analytics, games])

  const opponentList = useMemo(() => {
    return [...statsByOpponent.values()].sort((a, b) => {
      const gDiff = b.games.length - a.games.length
      if (gDiff !== 0) return gDiff
      return a.name.localeCompare(b.name)
    })
  }, [statsByOpponent])

  const currentStats = selectedOpponent ? statsByOpponent.get(selectedOpponent) : null
  const currentInsights = useMemo(
    () => (analytics && currentStats ? buildOpponentInsights(analytics, currentStats.name) : []),
    [analytics, currentStats],
  )

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-96 bg-card rounded-[2rem]" />
          <div className="md:col-span-2 h-96 bg-card rounded-[2rem]" />
        </div>
      </div>
    )
  }

  if (!analytics || opponentList.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <EmptyState 
          icon={<Swords />} 
          title="No opponents yet" 
          description="Schedule games to see opponent tracking and coaching plans." 
          action={{ label: 'Schedule a Game', onClick: () => navigate({ to: '/games' }) }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Opponents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scout and prep for rematches based on historical performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1 mb-3">
            {opponentList.length} Opponent{opponentList.length !== 1 ? 's' : ''}
          </p>
          {opponentList.map(o => (
            <OpponentListItem
              key={o.name}
              stats={o}
              selected={(selectedOpponent ?? currentStats?.name) === o.name}
              onClick={() => navigate({ to: '/opponents', search: { opponent: o.name } })}
            />
          ))}
        </div>

        <div className="lg:col-span-8">
          {currentStats ? (
            <>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{currentStats.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {currentStats.games.length} game{currentStats.games.length !== 1 ? 's' : ''} ·{' '}
                      Record: <span className={cn('font-semibold', recordColor(currentStats.wins, currentStats.losses))}>
                        {currentStats.wins}W {currentStats.losses}L {currentStats.ties}T
                      </span>
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setReportOpen(true)}
                  className="rounded-full gap-2 shadow-lg shadow-primary/20"
                >
                  <FileText className="w-4 h-4" />
                  Rematch Briefing
                </Button>
              </div>
              <OpponentDetail stats={currentStats} analytics={analytics} />

              <ScoutingReport 
                open={reportOpen}
                onOpenChange={setReportOpen}
                opponentName={currentStats.name}
                stats={currentStats}
                insights={currentInsights}
              />
            </>
          ) : (
            <EmptyState 
              icon={<Users />} 
              title="Select an opponent" 
              description="Choose an opponent from the list to view their game history, stats, and coaching plan." 
            />
          )}
        </div>
      </div>
    </div>
  )
}
