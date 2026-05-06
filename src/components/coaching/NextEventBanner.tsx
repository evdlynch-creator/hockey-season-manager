import { useMemo } from 'react'
import { Button, Card, CardContent, Badge } from '@blinkdotnew/ui'
import { Calendar, Trophy, MessageSquare, ArrowRight, Zap, ClipboardCheck, Sparkles } from 'lucide-react'
import { useGames } from '@/hooks/useGames'
import { usePractices } from '@/hooks/usePractices'
import { useNavigate } from '@tanstack/react-router'
import { format, differenceInDays, parseISO, isAfter, subDays } from 'date-fns'
import { cn } from '@/lib/utils'

export function NextEventBanner() {
  const navigate = useNavigate()
  const { data: games = [] } = useGames()
  const { data: practices = [] } = usePractices()

  const { nextEvent, lastCompletedGame } = useMemo(() => {
    const scheduledGames = games.filter(g => g.status === 'scheduled').map(g => ({ ...g, type: 'game' as const }))
    const scheduledPractices = practices.filter(p => p.status !== 'completed').map(p => ({ ...p, type: 'practice' as const }))
    
    const allScheduled = [...scheduledGames, ...scheduledPractices].sort((a, b) => a.date.localeCompare(b.date))

    const completedGames = games.filter(g => g.status === 'completed' || g.status === 'reviewed')
      .sort((a, b) => b.date.localeCompare(a.date))

    return {
      nextEvent: allScheduled[0],
      lastCompletedGame: completedGames[0]
    }
  }, [games, practices])

  if (!nextEvent && !lastCompletedGame) return null

  // If there's a recently completed game that hasn't been reviewed or needs a report
  if (lastCompletedGame && (lastCompletedGame.status === 'completed')) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/20 bg-amber-500/5 shadow-2xl shadow-amber-500/10 group cursor-pointer animate-fade-in"
        onClick={() => navigate({ to: '/games/$gameId', params: { gameId: lastCompletedGame.id } })}>
        <div className="absolute top-0 right-0 p-8 opacity-10 text-amber-500">
          <ClipboardCheck size={120} />
        </div>
        <CardContent className="p-6 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-inner">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest italic text-amber-500">Post-Game Action Needed</span>
                <Badge className="bg-amber-500 text-black border-none text-[8px] h-4 uppercase font-black rounded-full">Pending Review</Badge>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter leading-none italic text-foreground">
                Review Game vs. {lastCompletedGame.opponent}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Generate report and finalize tactical notes
              </p>
            </div>
          </div>
          <Button variant="default" className="bg-amber-500 hover:bg-amber-600 text-black rounded-full gap-2 px-6 shadow-xl shadow-amber-500/20">
            <Sparkles className="w-4 h-4" />
            Generate Post-Game Report
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </div>
    )
  }

  // If next event is imminent, show it
  if (nextEvent) {
    const daysToEvent = differenceInDays(parseISO(nextEvent.date), new Date())
    const isImminent = daysToEvent <= 3

    const handleClick = () => {
      if (nextEvent.type === 'game') {
        navigate({ to: '/games/$gameId', params: { gameId: nextEvent.id } })
      } else {
        navigate({ to: '/practices/$practiceId', params: { practiceId: nextEvent.id } })
      }
    }

    return (
      <div className={cn(
        "relative overflow-hidden rounded-[2rem] border transition-all duration-500 group cursor-pointer",
        isImminent 
          ? "bg-primary border-primary/20 shadow-2xl shadow-primary/20" 
          : "bg-zinc-950/40 border-white/5"
      )} onClick={handleClick}>
        <div className={cn(
          "absolute top-0 right-0 p-8 transition-transform duration-1000 group-hover:scale-110 group-hover:-translate-x-2 group-hover:translate-y-2 opacity-10",
          isImminent ? "text-white" : "text-primary"
        )}>
          {nextEvent.type === 'game' ? <Trophy size={120} /> : <Calendar size={120} />}
        </div>

        <CardContent className="p-6 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border shadow-inner",
              isImminent ? "bg-white/20 border-white/30" : "bg-primary/10 border-primary/20 text-primary"
            )}>
              {nextEvent.type === 'game' ? <Trophy className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest italic",
                  isImminent ? "text-white/80" : "text-primary"
                )}>Next Up: {nextEvent.type === 'game' ? 'Game Day' : 'Practice'}</span>
                {isImminent && (
                  <Badge className="bg-amber-500 text-black border-none text-[8px] h-4 uppercase font-black rounded-full animate-pulse">
                    <Zap className="w-2 h-2 mr-1 fill-current" /> High Alert
                  </Badge>
                )}
              </div>
              <h3 className={cn(
                "text-lg font-black uppercase tracking-tighter leading-none italic",
                isImminent ? "text-white" : "text-foreground"
              )}>
                {nextEvent.type === 'game' ? (nextEvent as any).opponent : (nextEvent as any).title}
              </h3>
              <p className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                isImminent ? "text-white/60" : "text-zinc-500"
              )}>
                {format(parseISO(nextEvent.date), 'EEEE, MMM do')} • {daysToEvent === 0 ? 'Today' : `In ${daysToEvent} day${daysToEvent === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          <Button 
            variant={isImminent ? "secondary" : "default"}
            className="rounded-full gap-2 px-6 shadow-xl active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Enter {nextEvent.type === 'game' ? 'Game' : 'Practice'} Hub
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </div>
    )
  }
}
