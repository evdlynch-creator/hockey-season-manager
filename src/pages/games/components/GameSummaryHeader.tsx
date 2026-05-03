import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@blinkdotnew/ui'
import { ArrowLeft, Swords, MapPin, Tag, Clock, Calendar } from 'lucide-react'
import { CoachsMic } from '@/components/dashboard/CoachsMic'
import { Card, CardContent } from '@blinkdotnew/ui'
import { cn } from '@/lib/utils'

interface GameSummaryHeaderProps {
  game: any
  gameId: string
  resultLabel: string | null
  gf: number | null
  ga: number | null
  dateStr: string
  gameType: string
  formatTime: (t: string) => string
  onApplyMicNote: (text: string, type: 'team' | 'opponent') => void
}

export function GameSummaryHeader({
  game,
  gameId,
  resultLabel,
  gf,
  ga,
  dateStr,
  gameType,
  formatTime,
  onApplyMicNote
}: GameSummaryHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/games" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="text-xl font-bold tracking-tight truncate hidden sm:block">vs. {game.opponent}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <CoachsMic onApplyNote={onApplyMicNote} gameId={gameId} />
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate({ to: '/games/$gameId/bench', params: { gameId } })}
          >
            <Swords className="w-4 h-4" />
            Enter Bench Mode
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Swords className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight italic uppercase tracking-tighter">vs. {game.opponent}</h2>
                {resultLabel && (
                  <p className={cn(
                    'text-sm font-semibold',
                    resultLabel === 'Win' && 'text-emerald-400',
                    resultLabel === 'Loss' && 'text-red-400',
                    resultLabel === 'Tie' && 'text-muted-foreground',
                  )}>
                    {resultLabel} — {gf}-{ga}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {dateStr}
              </div>
              {game.gameTime && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(game.gameTime)}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {game.location === 'home' ? 'Home Ice' : 'On the Road'}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="w-3.5 h-3.5" />
                {gameType.charAt(0).toUpperCase() + gameType.slice(1)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
