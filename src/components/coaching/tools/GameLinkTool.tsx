import { useState } from 'react'
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  ScrollArea,
  Badge,
  Input
} from '@blinkdotnew/ui'
import { Swords, Search, Link as LinkIcon } from 'lucide-react'
import { useGames } from '@/hooks/useGames'
import { format } from 'date-fns'

interface GameLinkToolProps {
  open: boolean
  onClose: () => void
  onSelect: (gameId: string, opponent: string, date: string, score?: string) => void
}

export function GameLinkTool({ open, onClose, onSelect }: GameLinkToolProps) {
  const { data: games = [], isLoading } = useGames()
  const [search, setSearch] = useState('')

  const filtered = [...games]
    .filter(g => 
      g.opponent.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.date.localeCompare(a.date)) // Latest games first
    .slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Link Game Reference
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search opponents..."
              className="pl-10 rounded-full bg-secondary/20"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-10 text-xs text-zinc-500 italic">Loading games...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-500 italic">No games found</div>
              ) : (
                filtered.map(g => (
                  <button
                    key={g.id}
                    onClick={() => {
                      const score = g.goalsFor !== undefined ? `${g.goalsFor}-${g.goalsAgainst}` : undefined
                      onSelect(g.id, g.opponent, g.date, score)
                      onClose()
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">vs. {g.opponent}</p>
                          {g.status === 'completed' || g.status === 'reviewed' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] h-4 font-black uppercase rounded-full">Final</Badge>
                          ) : (
                            <Badge className="bg-zinc-500/10 text-zinc-400 border-none text-[8px] h-4 font-black uppercase rounded-full">Scheduled</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {format(new Date(g.date + 'T00:00:00'), 'EEEE, MMM do')}
                          {g.goalsFor !== undefined && ` • Result: ${g.goalsFor}-${g.goalsAgainst}`}
                        </p>
                      </div>
                      <LinkIcon className="w-4 h-4 text-zinc-500 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
