import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Avatar, AvatarFallback, Badge } from '@blinkdotnew/ui'
import { Users } from 'lucide-react'

interface Player {
  id: string
  name: string
  number?: string
  position?: string
}

interface PlayerAttendanceListProps {
  players: Player[]
}

export function PlayerAttendanceList({ players }: PlayerAttendanceListProps) {
  return (
    <Card className="border-border bg-card rounded-[2rem]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <CardTitle className="text-base">Player Participation</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Participation across practices and games in this window.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No players found in this season.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.slice(0, 6).map((player) => (
              <div key={player.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                      {player.number || player.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {player.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
                      {player.position || 'Player'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-foreground">100%</span>
                    <span className="text-[9px] text-muted-foreground">Attendance</span>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] h-5 rounded-full">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
            {players.length > 6 && (
              <p className="text-center text-[11px] text-muted-foreground pt-2 border-t border-border/40 italic">
                + {players.length - 6} more players
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
