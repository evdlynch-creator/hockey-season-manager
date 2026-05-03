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
import { Users, Save, X, Plus, UserPlus, Rocket } from 'lucide-react'
import { usePlayers } from '@/hooks/usePlayers'
import { useGames } from '@/hooks/useGames'
import { useUpdateLineup } from '@/hooks/useLineups'
import { cn } from '@/lib/utils'
import type { Player } from '@/types'
import { toast } from 'sonner'

interface LineBuilderToolProps {
  open: boolean
  onClose: () => void
  onShare: (lines: Record<string, string[]>, note: string, pushToGameId?: string) => void
}

const BRAINSTORM_UNITS = ['Line 1', 'Line 2', 'Line 3', 'D-Pair 1', 'D-Pair 2', 'PP1', 'PK1']

export function LineBuilderTool({ open, onClose, onShare }: LineBuilderToolProps) {
  const { data: players = [], isLoading } = usePlayers()
  const { data: games = [] } = useGames()
  const updateLineup = useUpdateLineup()
  const [localLines, setLocalLines] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    BRAINSTORM_UNITS.forEach(u => initial[u] = [])
    return initial
  })
  const [note, setNote] = useState('')
  const [pushToNextGame, setPushToNextGame] = useState(false)

  const nextGame = games
    .filter(g => g.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const assignedPlayerIds = new Set(Object.values(localLines).flat())
  const availablePlayers = players.filter(p => !assignedPlayerIds.has(p.id))

  const handleAddPlayer = (unit: string, playerId: string) => {
    setLocalLines(prev => ({
      ...prev,
      [unit]: [...prev[unit], playerId]
    }))
  }

  const handleRemovePlayer = (unit: string, playerId: string) => {
    setLocalLines(prev => ({
      ...prev,
      [unit]: prev[unit].filter(id => id !== playerId)
    }))
  }

  const handleShare = async () => {
    let targetGameId: string | undefined
    
    if (pushToNextGame && nextGame) {
      targetGameId = nextGame.id
      const flatAssignments: { playerId: string, unit: string }[] = []
      Object.entries(localLines).forEach(([unit, playerIds]) => {
        playerIds.forEach(playerId => flatAssignments.push({ playerId, unit }))
      })
      
      try {
        await updateLineup.mutateAsync({ gameId: nextGame.id, playerLineups: flatAssignments })
        toast.success(`Lines pushed to game vs ${nextGame.opponent}`)
      } catch (err) {
        toast.error('Failed to push lines to game roster')
      }
    }

    onShare(localLines, note, targetGameId)
    setLocalLines(() => {
      const initial: Record<string, string[]> = {}
      BRAINSTORM_UNITS.forEach(u => initial[u] = [])
      return initial
    })
    setNote('')
    setPushToNextGame(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-4xl rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Tactical Sketchpad
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 min-h-[500px]">
          {/* Available Players */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Roster</h3>
              <Badge variant="outline" className="rounded-full text-[10px]">{availablePlayers.length}</Badge>
            </div>
            <ScrollArea className="h-[400px] border border-white/5 rounded-2xl p-2 bg-zinc-950/20 shadow-inner">
              <div className="space-y-1.5">
                {isLoading ? (
                  <div className="text-center py-10 text-[10px] italic text-zinc-600">Loading roster...</div>
                ) : availablePlayers.length === 0 ? (
                  <div className="text-center py-10 text-[10px] italic text-zinc-600">All players assigned</div>
                ) : (
                  availablePlayers.map(p => (
                    <div 
                      key={p.id} 
                      className="flex items-center justify-between p-2 rounded-xl bg-card border border-border group"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">{p.name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">#{p.number} • {p.position}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {BRAINSTORM_UNITS.slice(0, 3).map(u => (
                          <Button 
                            key={u}
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full text-[9px] hover:bg-primary/20 hover:text-primary"
                            onClick={() => handleAddPlayer(u, p.id)}
                          >
                            {u.split(' ').pop()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Lines Grid */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {BRAINSTORM_UNITS.map(unit => (
                <div key={unit} className="p-3 rounded-[1.5rem] bg-secondary/10 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{unit}</h4>
                    <Badge variant="outline" className="text-[9px] h-4 rounded-full border-primary/20 bg-primary/5 text-primary">
                      {localLines[unit].length}
                    </Badge>
                  </div>
                  <div className="min-h-[40px] flex flex-wrap gap-1.5">
                    {localLines[unit].length === 0 ? (
                      <p className="text-[9px] italic text-zinc-600 p-2">Drafting...</p>
                    ) : (
                      localLines[unit].map(pid => {
                        const p = players.find(x => x.id === pid)
                        return (
                          <Badge 
                            key={pid} 
                            className="bg-zinc-800 border-white/5 text-foreground pl-2 pr-1 h-7 rounded-full gap-1 group"
                          >
                            <span className="text-[10px] font-bold">{p?.name.split(' ').pop()}</span>
                            <button 
                              onClick={() => handleRemovePlayer(unit, pid)}
                              className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </Badge>
                        )
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Proposal Note</p>
                <Input 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's the thinking behind these lines?"
                  className="rounded-full bg-secondary/10 border-white/5"
                />
              </div>

              {nextGame && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Deploy to Roster</p>
                    <p className="text-[11px] text-muted-foreground">Official lines for next game vs <strong>{nextGame.opponent}</strong></p>
                  </div>
                  <Button 
                    variant={pushToNextGame ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPushToNextGame(!pushToNextGame)}
                    className={cn(
                      "rounded-full h-8 px-4 text-[10px] font-bold uppercase tracking-widest",
                      pushToNextGame && "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    )}
                  >
                    {pushToNextGame ? "Active" : "Deploy"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button 
            onClick={handleShare} 
            disabled={assignedPlayerIds.size === 0}
            className="rounded-full gap-2 shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            Share Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
