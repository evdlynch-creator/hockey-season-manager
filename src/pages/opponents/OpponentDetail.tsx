import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge,
} from '@blinkdotnew/ui'
import {
  Swords, ChevronRight, Calendar,
  Lightbulb,
} from 'lucide-react'
import {
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip,
} from 'recharts'
import { format, parseISO, isAfter } from 'date-fns'
import { buildOpponentInsights } from '@/hooks/useAnalytics'
import { InsightsStrip } from '@/components/InsightsStrip'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'
import type { OpponentStats } from './types'
import { recordColor, resultBadge, DarkTooltip, AMBER, MUTED } from './utils'
import { CoachingPlan } from './CoachingPlan'

interface OpponentDetailProps {
  stats: OpponentStats
  analytics: import('@/hooks/useAnalytics').SeasonAnalytics | null | undefined
}

export function OpponentDetail({ stats, analytics }: OpponentDetailProps) {
  const insights = useMemo(
    () => (analytics ? buildOpponentInsights(analytics, stats.name) : []),
    [analytics, stats.name],
  )

  const navigate = useNavigate()

  const radarData = CONCEPTS.map(c => ({
    concept: c === 'Defensive Zone' ? 'Def Zone' : c,
    rating: stats.avgConceptRatings[c] ?? 0,
  }))

  const hasConceptData = Object.values(stats.avgConceptRatings).some(v => v != null)
  const gamesWithScore = stats.games.filter(g => g.goalsFor != null && g.goalsAgainst != null)
  const avgGF = gamesWithScore.length ? stats.totalGoalsFor / gamesWithScore.length : null
  const avgGA = gamesWithScore.length ? stats.totalGoalsAgainst / gamesWithScore.length : null

  return (
    <div className="space-y-6 animate-fade-in">
      {stats.nextGame && (
        <div className="rounded-[2rem] border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Swords className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary mb-0.5">Rematch upcoming</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(stats.nextGame.date), 'EEEE, MMM d')} ·{' '}
              {stats.nextGame.location === 'home' ? 'Home' : 'Away'}
            </p>
          </div>
          <button
            onClick={() => navigate({ to: '/games/$gameId', params: { gameId: stats.nextGame!.id } })}
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            Open <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 rounded-[2rem]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Record vs.</p>
            <p className={cn('text-xl font-bold tabular-nums', recordColor(stats.wins, stats.losses))}>
              {stats.wins}–{stats.losses}–{stats.ties}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 rounded-[2rem]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Avg Goals</p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {avgGF != null ? avgGF.toFixed(1) : '—'}
              <span className="text-muted-foreground text-sm"> – </span>
              {avgGA != null ? avgGA.toFixed(1) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 rounded-[2rem]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Meetings</p>
            <p className="text-xl font-bold tabular-nums text-foreground">{stats.games.length}</p>
          </CardContent>
        </Card>
      </div>

      {insights.length > 0 ? (
        <InsightsStrip insights={insights} limit={3} title={`Top Insights vs. ${stats.name}`} />
      ) : (
        <Card className="border-border/50 bg-card rounded-[2rem]">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Lightbulb className="w-4 h-4" />
              <p className="text-sm italic">
                Review at least one game vs. {stats.name} to see tailored insights.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <CoachingPlan stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-sm">Concept Performance vs. {stats.name}</CardTitle>
            <CardDescription className="text-xs">Average ratings from all reviewed games.</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasConceptData ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground italic">No reviewed games yet.</p>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius={75}>
                    <PolarGrid stroke="hsl(0 0% 18%)" />
                    <PolarAngleAxis dataKey="concept" tick={{ fontSize: 9, fill: MUTED }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 8, fill: MUTED }} stroke="hsl(0 0% 18%)" />
                    <Radar name="Avg Rating" dataKey="rating" stroke={AMBER} fill={AMBER} fillOpacity={0.3} />
                    <Tooltip content={<DarkTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-sm">Concept Breakdown</CardTitle>
            <CardDescription className="text-xs">How each concept fared in your games against {stats.name}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {CONCEPTS.map(c => {
              const val = stats.avgConceptRatings[c]
              const pct = val != null ? (val / 5) * 100 : 0
              return (
                <div key={c} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{c}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {val != null ? val.toFixed(1) : '—'}/5
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Game History vs. {stats.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.games.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">No completed games.</p>
          ) : (
            [...stats.games]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(g => {
                const gf = g.goalsFor != null ? Number(g.goalsFor) : null
                const ga = g.goalsAgainst != null ? Number(g.goalsAgainst) : null
                const result = gf != null && ga != null
                  ? (gf > ga ? 'W' : gf < ga ? 'L' : 'T') as 'W' | 'L' | 'T'
                  : null
                const review = stats.reviews.find(r => r.gameId === g.id)
                return (
                  <button
                    key={g.id}
                    onClick={() => navigate({ to: '/games/$gameId', params: { gameId: g.id } })}
                    className="w-full flex items-center gap-3 p-2.5 rounded-full bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="shrink-0">{result ? resultBadge(result) : <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 rounded-full">TBD</Badge>}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {format(parseISO(g.date), 'EEE, MMM d, yyyy')} · {g.location === 'home' ? 'Home' : 'Away'}
                      </p>
                      {gf != null && ga != null && (
                        <p className="text-[11px] text-muted-foreground">{gf} – {ga}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {review && <Badge variant="secondary" className="text-[9px] h-4 px-1 rounded-full">Reviewed</Badge>}
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </button>
                )
              })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
