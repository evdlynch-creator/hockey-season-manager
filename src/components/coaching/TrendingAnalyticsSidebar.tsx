import { useMemo } from 'react'
import { Card, CardContent, Badge } from '@blinkdotnew/ui'
import { TrendingUp, TrendingDown, Target, Activity, Zap, BarChart3 } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

export function TrendingAnalyticsSidebar() {
  const { data: analytics, isLoading } = useAnalytics()

  const stats = useMemo(() => {
    if (!analytics) return []
    
    const gf = analytics.totalGoalsFor / (analytics.games.length || 1)
    const ga = analytics.totalGoalsAgainst / (analytics.games.length || 1)
    const winRate = (analytics.wins / (analytics.games.length || 1)) * 100

    return [
      { label: 'Scoring', value: gf.toFixed(1), trend: 'up', icon: <Target className="w-4 h-4" /> },
      { label: 'Defense', value: ga.toFixed(1), trend: 'down', icon: <Activity className="w-4 h-4" /> },
      { label: 'Win Rate', value: `${Math.round(winRate)}%`, trend: 'neutral', icon: <TrendingUp className="w-4 h-4" /> }
    ]
  }, [analytics])

  if (isLoading || !analytics) return null

  return (
    <div className="space-y-4">
      <div className="bg-zinc-950/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/5 bg-zinc-900/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-widest italic">Trending Stats</h3>
          </div>
          <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-emerald-500/30 text-emerald-500 uppercase font-black rounded-full">Season Avg</Badge>
        </div>
        <div className="p-4 grid grid-cols-1 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {s.icon}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-tighter">{s.label}</p>
                  <p className="text-lg font-black italic tracking-tighter text-white leading-none">{s.value}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "h-5 rounded-full text-[8px] font-bold border-none",
                s.trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : 
                s.trend === 'down' ? "bg-red-500/10 text-red-400" : "bg-zinc-500/10 text-zinc-400"
              )}>
                {s.trend.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
