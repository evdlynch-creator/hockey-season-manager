import { useMemo } from 'react'
import { Button, Card, CardContent, Badge } from '@blinkdotnew/ui'
import { Calendar, Trophy, MessageSquare, ArrowRight, Zap, Swords } from 'lucide-react'
import { useGames } from '@/hooks/useGames'
import { usePractices } from '@/hooks/usePractices'
import { useNavigate } from '@tanstack/react-router'
import { format, differenceInDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export function ChatEventPrompt() {
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
  
  // Show prompt if event is within 3 days
  if (daysToEvent > 3) return null

  const handleClick = () => {
    if (nextEvent.type === 'game') {
      navigate({ to: '/games/$gameId', params: { gameId: nextEvent.id } })
    } else {
      navigate({ to: '/practices/$practiceId', params: { practiceId: nextEvent.id } })
    }
  }

  return (
    <div className="mb-8 px-2">
      <Card className="bg-zinc-900/50 border-primary/20 rounded-2xl overflow-hidden shadow-xl border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              {nextEvent.type === 'game' ? <Swords className="w-5 h-5 text-primary" /> : <Calendar className="w-5 h-5 text-primary" />}
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Active Event Chat</p>
              <h4 className="text-sm font-bold text-foreground">
                {nextEvent.type === 'game' ? (nextEvent as any).opponent : (nextEvent as any).title}
              </h4>
              <p className="text-[10px] text-zinc-500 uppercase font-medium">
                {daysToEvent === 0 ? 'Today' : `In ${daysToEvent} day${daysToEvent === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={handleClick}
            className="rounded-full gap-2 text-xs px-4 h-9 shadow-lg shadow-primary/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Enter {nextEvent.type === 'game' ? 'Game' : 'Practice'} Room
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
