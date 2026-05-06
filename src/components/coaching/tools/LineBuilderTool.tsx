import { useState, useMemo } from 'react'
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  ScrollArea,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger
} from '@blinkdotnew/ui'
import { Users, Save, X, Rocket, Shield, Zap, Target } from 'lucide-react'
import { usePlayers } from '@/hooks/usePlayers'
import { useGames } from '@/hooks/useGames'
import { useUpdateLineup } from '@/hooks/useLineups'
import { useCoachingStaff } from '@/hooks/useCoachingStaff'
import { cn } from '@/lib/utils'
import type { Player } from '@/types'
import { toast } from 'sonner'
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
  Label
} from '@blinkdotnew/ui'

interface LineBuilderToolProps {
  open: boolean
  onClose: () => void
  onShare: (lines: Record<string, string[]>, note: string, pushToGameId?: string, taggedUserId?: string, taggedUserName?: string) => void
}

const UNIT_CATEGORIES = {
  forwards: ['Line 1', 'Line 2', 'Line 3'],
  defense: ['D-Pair 1', 'D-Pair 2', 'D-Pair 3'],
  special: ['PP1', 'PK1']
}

const BRAINSTORM_UNITS = [...UNIT_CATEGORIES.forwards, ...UNIT_CATEGORIES.defense, ...UNIT_CATEGORIES.special]

export function LineBuilderTool({ open, onClose, onShare }: LineBuilderToolProps) {
  const { data: players = [], isLoading } = usePlayers()
  const { data: games = [] } = useGames()
  const { data: staff } = useCoachingStaff()
  const updateLineup = useUpdateLineup()
  const [activeTab, setActiveTab] = useState<'all' | 'forwards' | 'defense' | 'special'>('all')
  const [localLines, setLocalLines] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    BRAINSTORM_UNITS.forEach(u => initial[u] = [])
    return initial
  })
  const [note, setNote] = useState('')
  const [pushToNextGame, setPushToNextGame] = useState(false)
  const [taggedUserId, setTaggedUserId] = useState<string | null>(null)

  const visibleUnits = useMemo(() => {
    if (activeTab === 'all') return BRAINSTORM_UNITS
    return UNIT_CATEGORIES[activeTab as keyof typeof UNIT_CATEGORIES]
  }, [activeTab])

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

    const taggedCoach = staff?.members.find(m => m.userId === taggedUserId)
    onShare(localLines, note, nextGame?.id, taggedUserId || undefined, taggedCoach?.displayName || taggedCoach?.email)
    
    setLocalLines(() => {
      const initial: Record<string, string[]> = {}
      BRAINSTORM_UNITS.forEach(u => initial[u] = [])
      return initial
    })
    setNote('')
    setPushToNextGame(false)
    setTaggedUserId(null)
    setActiveTab('all')
    onClose()
  }

  const getQuickAddUnits = (player: Player) => {
    if (activeTab === 'forwards') return UNIT_CATEGORIES.forwards
    if (activeTab === 'defense') return UNIT_CATEGORIES.defense
    if (activeTab === 'special') return UNIT_CATEGORIES.special
    
    const pos = player.position?.toLowerCase() || ''
    if (pos.includes('defense')) return UNIT_CATEGORIES.defense
    if (pos.includes('forward') || pos.includes('center') || pos.includes('wing')) return UNIT_CATEGORIES.forwards
    return BRAINSTORM_UNITS.slice(0, 3)
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

        <div className="flex flex-col gap-6 py-4 min-h-[550px]">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList className="w-full max-w-md bg-secondary/20 p-1 rounded-full">
              <TabsTrigger value="all" className="rounded-full flex-1 gap-2">
                <Target className="w-3.5 h-3.5" /> All
              </TabsTrigger>
              <TabsTrigger value="forwards" className="rounded-full flex-1 gap-2">
                <Zap className="w-3.5 h-3.5" /> Forwards
              </TabsTrigger>
              <TabsTrigger value="defense" className="rounded-full flex-1 gap-2">
                <Shield className="w-3.5 h-3.5" /> Defense
              </TabsTrigger>
              <TabsTrigger value="special" className="rounded-full flex-1 gap-2">
                <Rocket className="w-3.5 h-3.5" /> Special
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
            <div className="lg:col-span-4 space-y-4 flex flex-col h-[520px]">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Available Players</h3>
                <Badge variant="outline" className="rounded-full text-[10px] font-black">{availablePlayers.length}</Badge>
              </div>
              <div className="flex-1 border border-white/10 rounded-xl bg-zinc-950/40 shadow-2xl overflow-hidden flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-2">
                    {isLoading ? (
                      <div className="text-center py-10 text-[10px] italic text-zinc-600">Loading roster...</div>
                    ) : availablePlayers.length === 0 ? (
                      <div className="text-center py-10 text-[10px] italic text-zinc-600">All players assigned</div>
                    ) : (
                      availablePlayers
                        .filter(p => {
                          if (activeTab === 'defense') return p.position?.toLowerCase().includes('defense')
                          if (activeTab === 'forwards') return p.position?.toLowerCase().includes('forward') || p.position?.toLowerCase().includes('center') || p.position?.toLowerCase().includes('wing')
                          return true
                        })
                        .map(p => (
                          <div 
                            key={p.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/80 border border-white/5 group hover:border-primary/40 hover:bg-zinc-800 transition-all shadow-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[13px] truncate text-zinc-100">{p.name}</p>
                              <p className="text-[9px] text-zinc-400 uppercase font-black tracking-tight flex items-center gap-1.5 mt-0.5">
                                <span className="text-primary/70">#{p.number}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                {p.position}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                              {getQuickAddUnits(p).map(u => (
                                <Button 
                                  key={u}
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-md text-[9px] font-black hover:bg-primary/20 hover:text-primary border border-white/5 hover:border-primary/20"
                                  onClick={() => handleAddPlayer(u, p.id)}
                                >
                                  {u.split(' ').map(s => s[0]).join('')}{u.split(' ').pop()?.match(/\d+/) || ''}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {visibleUnits.map(unit => (
                  <div key={unit} className="p-4 rounded-xl bg-zinc-900/40 border border-white/10 space-y-3 relative group/unit shadow-xl">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                          unit.includes('Line') ? "bg-blue-500 shadow-blue-500/40" : 
                          unit.includes('D-Pair') ? "bg-emerald-500 shadow-emerald-500/40" : "bg-primary shadow-primary/40"
                        )} />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-300">{unit}</h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black h-5 rounded-full border-primary/20 bg-primary/5 text-primary">
                        {localLines[unit].length}
                      </Badge>
                    </div>
                    <div className="min-h-[50px] flex flex-wrap gap-2">
                      {localLines[unit].length === 0 ? (
                        <p className="text-[10px] italic text-zinc-700 p-2 font-medium">Drafting unit...</p>
                      ) : (
                        localLines[unit].map(pid => {
                          const p = players.find(x => x.id === pid)
                          return (
                            <Badge 
                              key={pid} 
                              className="bg-zinc-800 border-white/10 text-foreground pl-3 pr-1.5 h-8 rounded-lg gap-2 group/player shadow-lg"
                            >
                              <span className="text-xs font-bold">{p?.name.split(' ').pop()}</span>
                              <button 
                                onClick={() => handleRemovePlayer(unit, pid)}
                                className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all shadow-inner"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-4 border-t border-white/5 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Proposal Note</p>
                    <Input 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Thinking behind these lines?"
                      className="rounded-xl bg-secondary/10 border-white/5 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Request Review From</p>
                    <Select value={taggedUserId || "none"} onValueChange={(v) => setTaggedUserId(v === "none" ? null : v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-secondary/10 border-white/5 text-xs">
                        <SelectValue placeholder="Select a coach" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-white/10">
                        <SelectItem value="none">No review requested</SelectItem>
                        {staff?.members.map(m => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.displayName || m.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {nextGame && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Rocket className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Deploy to Roster</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">Official lines for next game vs <strong>{nextGame.opponent}</strong></p>
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
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button 
            onClick={handleShare} 
            disabled={assignedPlayerIds.size === 0}
            className="rounded-full gap-2 shadow-lg shadow-primary/20 px-6"
          >
            <Save className="w-4 h-4" />
            Share Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
