import { format, parseISO } from 'date-fns'
import { Badge } from '@blinkdotnew/ui'
import { cn } from '@/lib/utils'
import type { OpponentStats } from './types'
import { recordColor } from './utils'

interface OpponentListItemProps {
  stats: OpponentStats
  selected: boolean
  onClick: () => void
}

export function OpponentListItem({
  stats,
  selected,
  onClick,
}: OpponentListItemProps) {
  const total = stats.wins + stats.losses + stats.ties
  const winPct = total > 0 ? stats.wins / total : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-[2rem] border p-4 transition-all duration-200',
        selected
          ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border bg-card hover:border-border/80 hover:bg-card/80'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm text-foreground truncate">{stats.name}</p>
            {stats.nextGame && stats.lastPlayed && (
              <Badge className="bg-primary/15 text-primary border-primary/25 border text-[9px] px-1.5 py-0 h-4 shrink-0 rounded-full">
                Rematch
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {stats.games.length} game{stats.games.length !== 1 ? 's' : ''}
            {stats.lastPlayed && ` · Last: ${format(parseISO(stats.lastPlayed), 'MMM d')}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-base font-bold tabular-nums', recordColor(stats.wins, stats.losses))}>
            {stats.wins}–{stats.losses}–{stats.ties}
          </p>
          {winPct != null && (
            <p className="text-[10px] text-muted-foreground">{Math.round(winPct * 100)}% win</p>
          )}
        </div>
      </div>
    </button>
  )
}
