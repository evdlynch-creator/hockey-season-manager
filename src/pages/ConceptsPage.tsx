import { useState } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Separator, EmptyState,
} from '@blinkdotnew/ui'
import { BarChart3, TrendingUp, TrendingDown, Minus, ClipboardList, Swords } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from 'recharts'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { ConceptSummary } from '@/hooks/useAnalytics'
import { useTeam } from '@/hooks/useTeam'
import { CONCEPTS } from '@/types'
import type { Concept } from '@/types'
import { cn } from '@/lib/utils'

// Theme colors (HSL values matching our design system)
const AMBER = '#F59E0B'
const BLUE = '#3B82F6'
const MUTED = '#8A8A8E'

// ── Chart tooltip (dark themed) ──────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums">{p.value?.toFixed?.(1) ?? '—'}</span>
        </p>
      ))}
    </div>
  )
}

// ── Trend indicator ──────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  if (Math.abs(value) < 0.2) {
    return (
      <Badge variant="secondary" className="gap-1 font-mono">
        <Minus className="w-3 h-3" /> steady
      </Badge>
    )
  }
  if (value > 0) {
    return (
      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border gap-1 font-mono">
        <TrendingUp className="w-3 h-3" /> +{value.toFixed(1)}
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border gap-1 font-mono">
      <TrendingDown className="w-3 h-3" /> {value.toFixed(1)}
    </Badge>
  )
}

// ── Concept card ─────────────────────────────────────────────────────────────

function ConceptCard({
  summary,
  selected,
  onClick,
}: {
  summary: ConceptSummary
  selected: boolean
  onClick: () => void
}) {
  const hasData = summary.timeline.length > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left rounded-lg border transition-all duration-200 p-4 w-full',
        selected
          ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border bg-card hover:border-border/80'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">{summary.concept}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {summary.practicePoints} practice ratings · {summary.gamePoints} games
          </p>
        </div>
        <TrendBadge value={summary.trend} />
      </div>

      {/* Sparkline */}
      <div className="h-10 -mx-1">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.timeline}>
              <YAxis domain={[0, 5]} hide />
              <Line
                type="monotone"
                dataKey="practiceAvg"
                stroke={AMBER}
                strokeWidth={1.5}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="gameRating"
                stroke={BLUE}
                strokeWidth={1.5}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground italic">No data yet</p>
          </div>
        )}
      </div>

      {/* Latest */}
      <div className="flex items-baseline justify-between mt-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          Latest
        </span>
        <span className="text-xl font-bold tabular-nums text-foreground">
          {summary.latestAvg != null ? summary.latestAvg.toFixed(1) : '—'}
          <span className="text-xs font-normal text-muted-foreground">/5</span>
        </span>
      </div>
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ConceptsPage() {
  const { data: teamData } = useTeam()
  const { data: analytics, isLoading } = useAnalytics()
  const [selected, setSelected] = useState<Concept>(CONCEPTS[0])

  const priorityConcepts: string[] =
    teamData?.season?.priorityConcepts
      ? JSON.parse(teamData.season.priorityConcepts)
      : []

  const selectedSummary = analytics?.byConcept[selected]

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-md" />
        <div className="h-4 w-64 bg-card rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <EmptyState icon={<BarChart3 />} title="No season data" description="Set up a season to start tracking concept progress." />
      </div>
    )
  }

  // Separate practice vs game data for bar chart
  const barData = selectedSummary?.timeline.map(p => ({
    label: p.label,
    'Practice': p.practiceAvg ? Number(p.practiceAvg.toFixed(2)) : null,
    'Game': p.gameRating ? Number(p.gameRating.toFixed(2)) : null,
  })) ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Concepts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track how each core concept is progressing across practices and games.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: AMBER }} />
            Practice
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BLUE }} />
            Game
          </div>
        </div>
      </div>

      <Separator />

      {/* Concept grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {CONCEPTS.map(c => {
          const summary = analytics.byConcept[c]
          const isPriority = priorityConcepts.includes(c)
          return (
            <div key={c} className="relative">
              <ConceptCard
                summary={summary}
                selected={selected === c}
                onClick={() => setSelected(c)}
              />
              {isPriority && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] px-1.5 py-0 h-5 shadow-lg shadow-primary/20">
                  PRIORITY
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail section */}
      {selectedSummary && (
        <>
          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line chart */}
            <Card className="lg:col-span-2 border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  {selected} — Progress Over Time
                </CardTitle>
                <CardDescription className="text-xs">
                  Combined signal from practice segment ratings and post-game reviews.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSummary.timeline.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground italic">
                      No ratings yet for {selected}. Add segments or review games tagged with this concept.
                    </p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedSummary.timeline} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke={MUTED}
                          tick={{ fontSize: 11, fill: MUTED }}
                          tickLine={false}
                          axisLine={{ stroke: 'hsl(0 0% 15%)' }}
                        />
                        <YAxis
                          domain={[0, 5]}
                          stroke={MUTED}
                          tick={{ fontSize: 11, fill: MUTED }}
                          tickLine={false}
                          axisLine={{ stroke: 'hsl(0 0% 15%)' }}
                          width={28}
                        />
                        <Tooltip content={<DarkTooltip />} cursor={{ stroke: MUTED, strokeDasharray: 3 }} />
                        <Line
                          name="Practice"
                          type="monotone"
                          dataKey="practiceAvg"
                          stroke={AMBER}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: AMBER }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                        <Line
                          name="Game"
                          type="monotone"
                          dataKey="gameRating"
                          stroke={BLUE}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: BLUE }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="space-y-4">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    Current Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums text-foreground">
                      {selectedSummary.latestAvg != null ? selectedSummary.latestAvg.toFixed(1) : '—'}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
                  <div className="mt-3">
                    <TrendBadge value={selectedSummary.trend} />
                    <p className="text-[11px] text-muted-foreground mt-1">since season start</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <div className="flex-1 flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Practice ratings</span>
                      <span className="text-sm font-semibold tabular-nums">{selectedSummary.practicePoints}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Swords className="w-4 h-4 text-primary" />
                    <div className="flex-1 flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Games reviewed</span>
                      <span className="text-sm font-semibold tabular-nums">{selectedSummary.gamePoints}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bar chart — per-session detail */}
          {barData.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Session-by-Session Detail</CardTitle>
                <CardDescription className="text-xs">
                  Every practice or game where {selected} was rated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                      <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke={MUTED}
                        tick={{ fontSize: 11, fill: MUTED }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(0 0% 15%)' }}
                      />
                      <YAxis
                        domain={[0, 5]}
                        stroke={MUTED}
                        tick={{ fontSize: 11, fill: MUTED }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(0 0% 15%)' }}
                        width={28}
                      />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: 'hsl(0 0% 10%)' }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} iconType="circle" />
                      <Bar dataKey="Practice" fill={AMBER} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Game" fill={BLUE} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
