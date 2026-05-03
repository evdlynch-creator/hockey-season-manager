import { useMemo } from 'react'
import { Button, Card, CardContent, Badge } from '@blinkdotnew/ui'
import { Calendar, Trophy, MessageSquare, ArrowRight, Zap } from 'lucide-react'
import { useGames } from '@/hooks/useGames'
import { usePractices } from '@/hooks/usePractices'
import { useNavigate } from '@tanstack/react-router'
import { format, differenceInDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export function NextEventBanner() {
  const navigate = useNavigate()
  const { data: games = [] } = useGames()
  const { data: practices = [] } = usePractices()

  const nextEvent = useMemo(() => {
    const all = [
      ...games.filter(g => g.status === 'scheduled').map(g => ({ ...g, type: 'game' as const })),
      ...practices.filter(p => p.status !== 'completed').map(p => ({ ...p, type: 'practice' as const }))
    ].sort((a, b) => a.date.localeCompare(b.date))

    return all[0]
  }, [games, practices])

  if (!nextEvent) return null

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
          Enter {nextEvent.type === 'game' ? 'Game' : 'Practice'} Chat
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </div>
  )
}
