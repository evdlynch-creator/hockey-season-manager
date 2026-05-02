import { useMemo, useState } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Separator, EmptyState, Badge, Button,
} from '@blinkdotnew/ui'
import { 
  TrendingUp, 
  Trophy, 
  Target, 
  Activity, 
  Lightbulb, 
  BarChart3,
  Calendar,
  Zap,
  Swords,
  ClipboardList
} from 'lucide-react'
import { format, parseISO, subMonths, isAfter } from 'date-fns'
import { useFilteredAnalytics, buildInsights } from '@/hooks/useAnalytics'
import { useTeam } from '@/hooks/useTeam'
import { useTeamPreferences } from '@/hooks/usePreferences'
import { CONCEPTS } from '@/types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, AnimatedCounter } from '@/components/Interactivity'

// Charts
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts'
import { DarkTooltip } from '@/components/analytics/AnalyticsTooltip'

const EMERALD = '#10B981'
const RED = '#EF4444'
const AMBER = '#F59E0B'
const BLUE = '#3B82F6'
const MUTED = '#8A8A8E'

export default function AnalyticsPage() {
  const { data: teamData } = useTeam()
  const { data: analytics, isLoading } = useFilteredAnalytics()
  const [timeRange, setTimeRange] = useState<'all' | '3months' | 'month'>('all')

  const filteredData = useMemo(() => {
    if (!analytics) return null
    if (timeRange === 'all') return analytics

    const cutoff = timeRange === 'month' ? subMonths(new Date(), 1) : subMonths(new Date(), 3)
    const games = analytics.games.filter(g => g.date && isAfter(parseISO(g.date), cutoff))
    
    return { ...analytics, games }
  }, [analytics, timeRange])

  // 1. Season Performance Master Data
  const performanceData = useMemo(() => {
    if (!filteredData) return []
    let totalWins = 0
    return filteredData.games
      .filter(g => g.goalsFor != null && g.goalsAgainst != null)
      .map((g, i) => {
        const gf = Number(g.goalsFor)
        const ga = Number(g.goalsAgainst)
        if (gf > ga) totalWins++
        const winRate = (totalWins / (i + 1)) * 100
        return {
          date: g.date ? format(parseISO(g.date), 'MMM d') : '',
          diff: gf - ga,
          winRate: Math.round(winRate),
          result: gf > ga ? 'W' : gf < ga ? 'L' : 'T'
        }
      })
  }, [filteredData])

  // 2. Coaching Impact (Practice Focus vs Game Rating)
  const impactData = useMemo(() => {
    if (!analytics) return []
    return CONCEPTS.map(c => {
      const summary = analytics.byConcept[c]
      return {
        concept: c,
        practices: summary.practicePoints,
        rating: summary.latestAvg ?? 0,
        trend: summary.trend
      }
    }).filter(d => d.practices > 0 || d.rating > 0)
  }, [analytics])

  const insights = useMemo(() => analytics ? buildInsights(analytics) : [], [analytics])

  if (isLoading) {
    return <div className="p-8 space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-card rounded-full" />
      <div className="grid grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-[2rem]" />)}
      </div>
      <div className="h-96 bg-card rounded-[2rem]" />
    </div>
  }

  if (!analytics || analytics.games.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <EmptyState 
          icon={<BarChart3 className="w-12 h-12 text-muted-foreground" />}
          title="Season Data Required" 
          description="Complete some games and reviews to unlock advanced analytics." 
        />
      </div>
    )
  }

  const completedGames = analytics.games.filter(g => g.goalsFor != null && g.goalsAgainst != null)
  const totalGames = completedGames.length
  const wins = completedGames.filter(g => Number(g.goalsFor) > Number(g.goalsAgainst)).length
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
  const avgDiff = totalGames > 0 ? 
    completedGames.reduce((s, g) => s + (Number(g.goalsFor) - Number(g.goalsAgainst)), 0) / totalGames : 0

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Season Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your team's tactical performance and progression.</p>
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-full border border-border/50">
          {(['all', '3months', 'month'] as const).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-full transition-all",
                timeRange === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r === 'all' ? 'Full Season' : r === '3months' ? 'Last 90d' : 'Last 30d'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Section */}
      <div id="tour-analytics-kpis" className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <motion.div variants={staggerItem}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-[2rem]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <Trophy className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Win Rate</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tighter italic">
                  <AnimatedCounter value={winRate} />%
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {wins}-{totalGames - wins}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-[2rem]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <Target className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Avg Differential</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tighter italic">
                  {avgDiff > 0 ? '+' : ''}<AnimatedCounter value={avgDiff} decimals={1} />
                </span>
                <span className="text-xs text-muted-foreground font-mono">goals / game</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-[2rem]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3 text-blue-400">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Best Concept</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight truncate max-w-full">
                  {analytics ? [...CONCEPTS].sort((a,b) => (analytics.byConcept[b].latestAvg ?? 0) - (analytics.byConcept[a].latestAvg ?? 0))[0] : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-[2rem]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3 text-amber-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Momentum</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tighter italic">
                  {analytics ? [...CONCEPTS].reduce((max, c) => Math.max(max, analytics.byConcept[c].trend), -5).toFixed(1) : '—'}
                </span>
                <span className="text-xs text-muted-foreground font-mono">pts improvement</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 1: Season Performance Chart */}
      <div id="tour-analytics-performance" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card className="bg-card border-border rounded-[2rem] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Season Performance Hub</CardTitle>
                  <CardDescription className="text-xs">Goal differential vs. Cumulative Win Rate</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Win Rate %</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500/20" /> Goal Diff</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={performanceData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke={MUTED} tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke={MUTED} tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} label={{ value: 'Diff', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke={MUTED} tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} label={{ value: 'Win %', angle: 90, position: 'insideRight', fill: MUTED, fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar yAxisId="left" dataKey="diff" radius={[4, 4, 0, 0]}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.diff >= 0 ? EMERALD : RED} fillOpacity={0.4} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="bg-card border-border rounded-[2rem] h-full">
            <CardHeader>
              <CardTitle className="text-base">Impact Analysis</CardTitle>
              <CardDescription className="text-xs">Concept Mastery vs. Practice Focus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                    <XAxis type="number" dataKey="practices" name="Practices" stroke={MUTED} tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} label={{ value: 'Practice Segments', position: 'bottom', fill: MUTED, fontSize: 10 }} />
                    <YAxis type="number" dataKey="rating" name="Rating" stroke={MUTED} tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} label={{ value: 'Rating (0-5)', angle: -90, position: 'insideLeft', fill: MUTED, fontSize: 10 }} domain={[0, 5]} />
                    <ZAxis type="number" dataKey="trend" range={[50, 400]} />
                    <Tooltip content={<DarkTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Concepts" data={impactData} fill="hsl(var(--primary))" fillOpacity={0.6}>
                      {impactData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.trend > 0 ? EMERALD : entry.trend < 0 ? RED : BLUE} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Improving</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Steady</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Sliding</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={staggerItem} className="md:col-span-2">
           <Card className="border-border bg-card rounded-[2rem]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Intelligence Signals</CardTitle>
              </div>
              <CardDescription className="text-xs">AI-driven patterns detected in your season data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.slice(0, 4).map((insight, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors">
                  <div className={cn(
                    "w-10 h-10 rounded-full shrink-0 flex items-center justify-center",
                    insight.tone === 'positive' ? "bg-emerald-500/10 text-emerald-400" : 
                    insight.tone === 'negative' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                  )}>
                    {insight.tone === 'positive' ? <Trophy className="w-5 h-5" /> : 
                     insight.tone === 'negative' ? <Activity className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground italic">{insight.headline.replace(/\{\{(.*?)\}\}/g, '$1')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-border bg-card rounded-[2rem] h-full">
             <CardHeader>
              <CardTitle className="text-base">Tactical Focus</CardTitle>
              <CardDescription className="text-xs">Practice volume by concept</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...impactData].sort((a,b) => b.practices - a.practices).slice(0, 6).map((c, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>{c.concept}</span>
                      <span className="text-foreground">{c.practices} segments</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(100, (c.practices / Math.max(...impactData.map(d => d.practices))) * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
