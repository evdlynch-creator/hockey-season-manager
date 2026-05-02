import { 
  Card, CardHeader, CardTitle, CardContent,
  Checkbox, Badge, Avatar, AvatarFallback
} from '@blinkdotnew/ui'
import { Users } from 'lucide-react'
import type { Player } from '@/types'
import { cn } from '@/lib/utils'

interface AttendanceTableProps {
  players: Player[]
  attendance?: Record<string, boolean>
  onToggle: (playerId: string) => void
  className?: string
}

export function AttendanceTable({ players, attendance = {}, onToggle, className }: AttendanceTableProps) {
  const presentCount = Object.values(attendance).filter(Boolean).length

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Attendance</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {presentCount} of {players.length} players present
          </p>
        </div>
        <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
          {players.length > 0 ? Math.round((presentCount / players.length) * 100) : 0}% Present
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_1fr_4rem] bg-muted/50 border-b border-border text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-4 py-2">
            <div className="text-center">#</div>
            <div>Player</div>
            <div>Position</div>
            <div className="text-center">Status</div>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {players.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No players found in roster.
              </div>
            ) : (
              players.map((player) => (
                <div 
                  key={player.id} 
                  className={cn(
                    "grid grid-cols-[3rem_1fr_1fr_4rem] items-center px-4 py-3 hover:bg-muted/30 transition-colors group cursor-pointer",
                    attendance[player.id] ? "bg-primary/5" : ""
                  )}
                  onClick={() => onToggle(player.id)}
                >
                  <div className="text-center font-bold text-muted-foreground">
                    {player.number || '—'}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 border border-border shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                        {player.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {player.name}
                    </span>
                  </div>
                  <div>
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider h-5 px-1.5 font-bold">
                      {player.position || 'Player'}
                    </Badge>
                  </div>
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={!!attendance[player.id]} 
                      onCheckedChange={() => onToggle(player.id)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
