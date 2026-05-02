import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  Button, Badge, Card, CardContent,
} from '@blinkdotnew/ui'
import { Eye, Pencil, Trash2, Calendar, Clock, MapPin, Trophy, Award, Sparkles, Swords } from 'lucide-react'
import type { Game } from '@/types'
import type { GameType } from '@/hooks/usePreferences'

function GameTypeBadge({ type }: { type: GameType }) {
  if (type === 'tournament') {
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 border gap-1 rounded-full">
        <Award className="w-3 h-3" /> Tournament
      </Badge>
    )
  }
  if (type === 'exhibition') {
    return (
      <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 border gap-1 rounded-full">
        <Sparkles className="w-3 h-3" /> Exhibition
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground border-border gap-1 rounded-full">
      <Trophy className="w-3 h-3" /> League
    </Badge>
  )
}

function StatusBadge({ status }: { status: Game['status'] }) {
  if (status === 'scheduled') return <Badge variant="outline" className="text-primary border-primary/30 rounded-full">Scheduled</Badge>
  if (status === 'completed') return <Badge className="bg-primary text-primary-foreground rounded-full">Completed</Badge>
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border rounded-full">Reviewed</Badge>
}

function ResultBadge({ game }: { game: Game }) {
  if (game.status === 'scheduled' || game.goalsFor == null || game.goalsAgainst == null) return null
  const gf = Number(game.goalsFor)
  const ga = Number(game.goalsAgainst)
  if (gf > ga) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border rounded-full">W {gf}-{ga}</Badge>
  if (gf < ga) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border rounded-full">L {gf}-{ga}</Badge>
  return <Badge variant="secondary" className="rounded-full">T {gf}-{ga}</Badge>
}

function formatTime(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

interface GameCardProps {
  game: Game
  type: GameType
  tournamentName: string
  onEdit: (g: Game) => void
  onDelete: (g: Game) => void
}

export function GameCard({
  game,
  type,
  tournamentName,
  onEdit,
  onDelete,
}: GameCardProps) {
  const navigate = useNavigate()
  const dateStr = game.date ? format(new Date(game.date + 'T00:00:00'), 'MMM d, yyyy') : '—'

  return (
    <Card
      className="border-border bg-card hover:border-border/80 transition-all duration-200 group cursor-pointer rounded-[2rem]"
      onClick={() => navigate({ to: '/games/$gameId', params: { gameId: game.id } })}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <GameTypeBadge type={type} />
              {type === 'tournament' && tournamentName && (
                <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 border text-xs rounded-full">
                  {tournamentName}
                </Badge>
              )}
              <StatusBadge status={game.status} />
              <ResultBadge game={game} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />{dateStr}
              </span>
              {game.gameTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatTime(game.gameTime)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground truncate">
                vs. {game.opponent}
              </h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {game.location === 'home' ? 'Home' : 'Away'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 rounded-full"
              onClick={e => { e.stopPropagation(); navigate({ to: '/games/$gameId', params: { gameId: game.id } }) }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 rounded-full"
              onClick={e => { e.stopPropagation(); onEdit(game) }}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 text-destructive hover:text-destructive"
              onClick={e => { e.stopPropagation(); onDelete(game) }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 rounded-full text-primary hover:text-primary hover:bg-primary/10"
              onClick={e => { e.stopPropagation(); navigate({ to: '/games/$gameId/bench', params: { gameId: game.id } }) }}
            >
              <Swords className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bench</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
