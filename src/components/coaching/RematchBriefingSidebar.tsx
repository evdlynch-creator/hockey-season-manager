import { useMemo } from 'react'
import { Card, CardContent, Badge, Button } from '@blinkdotnew/ui'
import { ShieldAlert, Trophy, ArrowRight, History } from 'lucide-react'
import { useGames } from '@/hooks/useGames'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function RematchBriefingSidebar() {
  const navigate = useNavigate()
  const { data: games = [] } = useGames()
  const { data: analytics } = useAnalytics()

  const rematch = useMemo(() => {
    const next = games
      .filter(g => g.status === 'scheduled')
      .sort((a, b) => a.date.localeCompare(b.date))[0]

    if (!next) return null

    // Find previous games against this opponent
    const previous = games
      .filter(g => g.opponent === next.opponent && g.status !== 'scheduled')
      .sort((a, b) => b.date.localeCompare(a.date))

    if (previous.length === 0) return null

    return {
      next,
      previous: previous[0],
      count: previous.length
    }
  }, [games])

  if (!rematch) return null

  const prev = rematch.previous
  const result = prev.goalsFor !== undefined && prev.goalsAgainst !== undefined
    ? (prev.goalsFor > prev.goalsAgainst ? 'win' : prev.goalsFor < prev.goalsAgainst ? 'loss' : 'tie')
    : 'unknown'

  return (
    <div className="bg-primary/5 rounded-[2rem] border border-primary/10 overflow-hidden shadow-2xl shadow-primary/5">
      <div className="p-5 border-b border-primary/10 bg-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <ShieldAlert className="w-4 h-4" />
          <h3 className="text-[10px] font-black uppercase tracking-widest italic">Rematch Briefing</h3>
        </div>
        <Badge className="h-4 px-1.5 text-[8px] bg-primary text-primary-foreground uppercase font-black rounded-full">Scouting</Badge>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-tighter">Opponent</p>
          <h4 className="text-sm font-black uppercase italic tracking-tighter text-white">{rematch.next.opponent}</h4>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <History className="w-3 h-3 text-zinc-500" />
              <span className="text-[9px] font-black uppercase text-zinc-500">Last Meeting</span>
            </div>
            <Badge variant="outline" className={cn(
              "h-4 text-[8px] uppercase font-black rounded-full",
              result === 'win' ? "border-emerald-500/30 text-emerald-400" : 
              result === 'loss' ? "border-red-500/30 text-red-400" : "border-zinc-500/30 text-zinc-400"
            )}>
              {result.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black italic tracking-tighter">{prev.goalsFor} - {prev.goalsAgainst}</span>
            <span className="text-[10px] text-zinc-500 font-medium">Head-to-Head Record</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-zinc-400 leading-snug italic">
            "Opponent showed aggressive forecheck on the last meeting. Need to focus on quick D-to-D transitions."
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate({ to: '/opponents' })} // Could deep link to opponent detail
            className="w-full h-8 rounded-full text-[9px] uppercase font-black tracking-widest gap-2 bg-white/5 hover:bg-white/10"
          >
            Review Scouting Report <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
