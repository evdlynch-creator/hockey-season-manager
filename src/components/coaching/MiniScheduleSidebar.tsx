import { useMemo } from 'react'
import { Button, Badge } from '@blinkdotnew/ui'
import { Calendar, ArrowRight, Swords } from 'lucide-react'
import { useGames } from '@/hooks/useGames'
import { usePractices } from '@/hooks/usePractices'
import { useNavigate } from '@tanstack/react-router'
import { format, parseISO, isAfter, startOfDay } from 'date-fns'

export function MiniScheduleSidebar() {
  const navigate = useNavigate()
  const { data: games = [] } = useGames()
  const { data: practices = [] } = usePractices()

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date())
    
    const all = [
      ...games.map(g => ({ ...g, type: 'game' as const })),
      ...practices.map(p => ({ ...p, type: 'practice' as const }))
    ]
    .filter(e => !isAfter(today, parseISO(e.date))) // Show today and future
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

    return all
  }, [games, practices])

  if (upcomingEvents.length === 0) return null

  return (
    <div className="bg-zinc-950/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-white/5 bg-zinc-900/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Calendar className="w-4 h-4" />
          <h3 className="text-[10px] font-black uppercase tracking-widest italic">Upcoming Schedule</h3>
        </div>
        <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-primary/20 text-primary uppercase font-black rounded-full">Sync</Badge>
      </div>
      <div className="p-4 space-y-3">
        {upcomingEvents.map((event) => {
          const date = parseISO(event.date)
          const isGame = event.type === 'game'
          
          return (
            <button
              key={`${event.type}-${event.id}`}
              onClick={() => navigate({ 
                to: isGame ? '/games/$gameId' : '/practices/$practiceId', 
                params: isGame ? { gameId: event.id } : { practiceId: event.id } 
              })}
              className="w-full flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 transition-all text-left group"
            >
              <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors text-center px-1 shadow-inner">
                <p className="text-[8px] font-black uppercase text-zinc-500 leading-none mb-0.5">{format(date, 'MMM')}</p>
                <p className="text-sm font-black italic tracking-tighter leading-none text-zinc-200 group-hover:text-primary transition-colors">{format(date, 'd')}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isGame ? (
                    <Swords className="w-2.5 h-2.5 text-amber-500" />
                  ) : (
                    <Calendar className="w-2.5 h-2.5 text-primary" />
                  )}
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate">
                    {isGame ? 'Game' : 'Practice'}
                  </p>
                </div>
                <h4 className="text-xs font-bold text-zinc-300 truncate">
                  {isGame ? `vs. ${(event as any).opponent}` : (event as any).title}
                </h4>
              </div>
              <ArrowRight className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 mr-1" />
            </button>
          )
        })}
      </div>
      <div className="p-3 bg-zinc-900/40 border-t border-white/5">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate({ to: '/calendar' })}
          className="w-full h-8 rounded-full text-[9px] uppercase font-black tracking-widest gap-2 text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all"
        >
          View Full Calendar <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
