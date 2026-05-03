import { Card, CardHeader, CardTitle, CardContent, Field, FieldLabel, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Button, toast } from '@blinkdotnew/ui'
import { LayoutList, CheckCircle } from 'lucide-react'
import type { GameType } from '@/hooks/usePreferences'

interface GameConfigSidebarProps {
  gameType: GameType
  gameId: string
  teamId?: string
  setType: (gameId: string, type: GameType) => void
  onTabChange: (tab: string) => void
}

export function GameConfigSidebar({
  gameType,
  gameId,
  teamId,
  setType,
  onTabChange
}: GameConfigSidebarProps) {
  return (
    <Card className="border-border bg-sidebar/20 rounded-[2rem] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Game Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Match Type</FieldLabel>
          <Select
            value={gameType}
            disabled={!teamId}
            onValueChange={(v) => {
              if (!teamId) return
              setType(gameId, v as GameType)
              toast.success(`Tagged as ${v}`)
            }}
          >
            <SelectTrigger className="rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="league">League</SelectItem>
              <SelectItem value="tournament">Tournament</SelectItem>
              <SelectItem value="exhibition">Exhibition</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {gameType === 'tournament' && (
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
            <p className="text-[10px] font-black uppercase text-amber-500/80">Tournament View Active</p>
            <p className="text-xs text-muted-foreground">This game will contribute to tournament-specific analytics.</p>
          </div>
        )}

        <div className="pt-4 flex flex-col gap-2">
          <Button
            variant="ghost"
            className="w-full justify-start rounded-full gap-2 text-zinc-500 hover:text-white"
            onClick={() => onTabChange('lineup')}
          >
            <LayoutList className="w-4 h-4" />
            Plan Game Lineup
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start rounded-full gap-2 text-zinc-500 hover:text-white"
            onClick={() => onTabChange('review')}
          >
            <CheckCircle className="w-4 h-4" />
            Post-Game Review
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
