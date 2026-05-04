import { useAuth } from '../hooks/useAuth'
import { useTeam } from '../hooks/useTeam'
import { usePractices } from '../hooks/usePractices'
import { useGames } from '../hooks/useGames'
import { useFilteredAnalytics, filterGamesByMode } from '../hooks/useAnalytics'
import { useGameTypes, useViewMode } from '../hooks/usePreferences'
import { isDemoMode } from '../hooks/useDemoData'

import { parseISO, format, isAfter } from 'date-fns'
import { LoadingOverlay } from '@blinkdotnew/ui'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer } from '../components/Interactivity'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { QuickStats } from './dashboard/QuickStats'
import { ActivitySummary } from './dashboard/ActivitySummary'
import { ScheduleAndSnapshot } from './dashboard/ScheduleAndSnapshot'
import { ConceptTrends } from './dashboard/ConceptTrends'
import { SeasonProgressRibbon } from '../components/dashboard/SeasonProgressRibbon'
import { CoachsMic } from '../components/dashboard/CoachsMic'
import { CONCEPTS } from '../types'
import { toast } from '@blinkdotnew/ui'
import { blink } from '@/blink/client'
import { useQueryClient } from '@tanstack/react-query'

const SNAPSHOT_FIELD: Record<string, string> = {
  'Breakouts': 'breakoutsRating',
  'Forecheck': 'forecheckRating',
  'Defensive Zone': 'defensiveZoneRating',
  'Zone Entry': 'zoneEntryRating',
  'Offensive Zone': 'offensiveZoneRating',
  'Passing': 'passingRating',
  'Skating': 'skatingRating',
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { data: teamData, isLoading, isFetching, isSuccess } = useTeam()
  const { data: practices = [] } = usePractices()
  const { data: rawGames = [] } = useGames()
  const teamId = teamData?.team?.id
  const { types: gameTypes } = useGameTypes(teamId)
  const { mode: viewMode } = useViewMode(teamId)
  const games = filterGamesByMode(rawGames, gameTypes, viewMode)
  const { data: analytics } = useFilteredAnalytics()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const demoActive = isDemoMode()

  const radarData = useMemo(() => {
    return CONCEPTS.map(c => ({
      concept: c === 'Defensive Zone' ? 'Def Zone' : c,
      rating: analytics?.byConcept[c]?.latestAvg ?? 0,
    }))
  }, [analytics])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (!authLoading && !demoActive && user && isSuccess && !isFetching && !teamData?.team) {
      navigate({ to: '/onboarding', replace: true })
    }
  }, [teamData, isSuccess, isFetching, authLoading, user, navigate, demoActive])

  if ((authLoading && !demoActive) || isLoading || !teamData?.team) return <LoadingOverlay show />

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingPractices = practices
    .filter(p => isAfterOrToday(parseISO(p.date), today))
    .filter(p => p.status !== 'completed' && p.status !== 'reviewed')
    .sort((a, b) => a.date.localeCompare(b.date))

  const upcomingGames = games
    .filter(g => isAfterOrToday(parseISO(g.date), today))
    .filter(g => g.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))

  const nextEvent = getNextEvent(upcomingPractices, upcomingGames)
  
  const completedGames = games.filter(g => g.goalsFor != null && g.goalsAgainst != null)
  const wins = completedGames.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const losses = completedGames.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
  const ties = completedGames.filter(g => Number(g.goalsFor) === Number(g.goalsAgainst)).length
  const completedPractices = practices.filter(p => p.status === 'completed' || p.status === 'reviewed').length

  const recentCompleted = [...completedGames].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const reviewsByGameId = new Map((analytics?.reviews ?? []).map((r: any) => [r.gameId, r]))
  
  const snapshotGF = recentCompleted.reduce((s, g) => s + Number(g.goalsFor ?? 0), 0)
  const snapshotGA = recentCompleted.reduce((s, g) => s + Number(g.goalsAgainst ?? 0), 0)
  const snapshotW = recentCompleted.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const snapshotL = recentCompleted.filter(g => Number(g.goalsFor) < Number(g.goalsAgainst)).length
  const snapshotT = recentCompleted.length - snapshotW - snapshotL
  
  const avgGF = recentCompleted.length ? snapshotGF / recentCompleted.length : 0
  const avgGA = recentCompleted.length ? snapshotGA / recentCompleted.length : 0

  const { working, hurting, hurtNarrative } = getConceptInsights(recentCompleted, reviewsByGameId, snapshotGA)

  const handleApplyDashboardNote = async (text: string, type: 'team' | 'opponent') => {
    const latestGame = recentCompleted[0]
    if (!latestGame) {
      toast.error('No recent games found to apply note to')
      return
    }

    try {
      const existingReview = reviewsByGameId.get(latestGame.id)
      const payload = type === 'team' 
        ? { notes: existingReview?.notes ? `${existingReview.notes}\n\n${text}` : text }
        : { opponentNotes: existingReview?.opponentNotes ? `${existingReview.opponentNotes}\n\n${text}` : text }

      if (existingReview) {
        await blink.db.gameReviews.update(existingReview.id, payload)
      } else {
        await blink.db.gameReviews.create({
          id: crypto.randomUUID(),
          gameId: latestGame.id,
          userId: user?.id,
          ...payload,
          createdAt: new Date().toISOString()
        })
      }
      
      queryClient.invalidateQueries({ queryKey: ['game-review', latestGame.id] })
      toast.success(`Note saved to game vs ${latestGame.opponent}`)
    } catch (error) {
      console.error('Failed to apply note:', error)
      toast.error('Failed to save note')
    }
  }

  return (
    <div className="relative min-h-full">
      <motion.div 
        className="pointer-events-none fixed inset-0 z-0 opacity-20 transition-opacity duration-300"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, hsla(var(--primary) / 0.15), transparent 80%)`
        }}
      />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto"
      >
        <DashboardHeader
          teamName={teamData.team.name}
          seasonName={teamData.season?.name ?? ''}
          logoUrl={teamData.team.logoUrl}
          onPracticeClick={() => navigate({ to: '/practices' })}
          onGameClick={() => navigate({ to: '/games' })}
        />

        <QuickStats
          wins={wins}
          losses={losses}
          ties={ties}
          completedPractices={completedPractices}
          completedGamesCount={completedGames.length}
          upcomingCount={upcomingPractices.length + upcomingGames.length}
        />

        <ActivitySummary
          upcomingGames={upcomingGames}
          analyticsGames={analytics?.games ?? games}
          analyticsReviews={analytics?.reviews ?? []}
          nextEvent={nextEvent}
          onNavigateToEvent={(kind, id) => navigate({ to: kind === 'practice' ? '/practices/$practiceId' : '/games/$gameId', params: { [kind === 'practice' ? 'practiceId' : 'gameId']: id } as any })}
        />

        <ScheduleAndSnapshot
          upcomingEvents={[
            ...upcomingPractices.slice(0, 5).map(p => ({ kind: 'practice', data: p })),
            ...upcomingGames.slice(0, 5).map(g => ({ kind: 'game', data: g }))
          ].sort((a, b) => a.data.date.localeCompare(b.data.date)).slice(0, 5)}
          recentCompleted={recentCompleted}
          snapshotW={snapshotW}
          snapshotL={snapshotL}
          snapshotT={snapshotT}
          avgGF={avgGF}
          avgGA={avgGA}
          snapshotGF={snapshotGF}
          snapshotGA={snapshotGA}
          working={working}
          hurting={hurting}
          hurtNarrative={hurtNarrative}
          radarData={radarData}
          onNavigateToEvent={(kind, id) => navigate({ to: kind === 'practice' ? '/practices/$practiceId' : '/games/$gameId', params: { [kind === 'practice' ? 'practiceId' : 'gameId']: id } as any })}
          onNavigateToTrends={() => navigate({ to: '/analytics' })}
        />

        <SeasonProgressRibbon
          practices={practices}
          games={games}
          onNavigate={(kind, id) => navigate({ to: kind === 'practice' ? '/practices/$practiceId' : '/games/$gameId', params: { [kind === 'practice' ? 'practiceId' : 'gameId']: id } as any })}
        />

        <ConceptTrends
          teamData={teamData}
          analytics={analytics}
          onNavigateToConcepts={() => navigate({ to: '/concepts' })}
        />
      </motion.div>

      <CoachsMic onApplyNote={handleApplyDashboardNote} />
    </div>
  )
}

function isAfterOrToday(date: Date, today: Date) {
  return date >= today
}

function getNextEvent(practices: any[], games: any[]) {
  if (!practices.length && !games.length) return null
  if (practices.length && games.length) {
    return (practices[0].date <= games[0].date)
      ? { kind: 'practice', data: practices[0] }
      : { kind: 'game', data: games[0] }
  }
  return practices.length 
    ? { kind: 'practice', data: practices[0] } 
    : { kind: 'game', data: games[0] }
}

function getConceptInsights(recentCompleted: any[], reviewsByGameId: Map<string, any>, snapshotGA: number) {
  const concepts = Object.keys(SNAPSHOT_FIELD)
  const conceptAvgs = concepts.map(c => {
    const field = SNAPSHOT_FIELD[c]
    const vals = recentCompleted
      .map(g => reviewsByGameId.get(g.id))
      .filter(r => r && r[field] != null)
      .map(r => Number(r[field]))
    return { concept: c, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null }
  }).filter((x): x is { concept: string; avg: number } => x.avg != null)

  const working = [...conceptAvgs].filter(c => c.avg >= 3.5).sort((a, b) => b.avg - a.avg).slice(0, 2)
  const hurting = [...conceptAvgs].filter(c => c.avg <= 2.7).sort((a, b) => a.avg - b.avg).slice(0, 2)
  
  let hurtNarrative = ''
  if (hurting.length && snapshotGA > 0) {
    const c = hurting[0]
    const field = SNAPSHOT_FIELD[c.concept]
    const badGames = recentCompleted.filter(g => {
      const r = reviewsByGameId.get(g.id)
      return r && r[field] != null && Number(r[field]) <= 2.5
    })
    const gaInBad = badGames.reduce((s, g) => s + Number(g.goalsAgainst ?? 0), 0)
    if (gaInBad > 0) {
      const pct = Math.round((gaInBad / snapshotGA) * 100)
      if (pct >= 30) {
        hurtNarrative = `${pct}% of goals against came in games where ${c.concept} rated 2.5 or lower.`
      }
    }
  }

  return { working, hurting, hurtNarrative }
}