import { Player } from '@/types'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  Button,
  Avatar,
  ScrollArea
} from '@blinkdotnew/ui'
import { Check, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface GoalCaptureDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: { scorerId?: string, assist1Id?: string, assist2Id?: string }) => void
  players: Player[]
  onIcePlayers: Set<string>
}

export function GoalCaptureDialog({
  open,
  onClose,
  onConfirm,
  players,
  onIcePlayers
}: GoalCaptureDialogProps) {
  const [scorerId, setScorerId] = useState<string>()
  const [assist1Id, setAssist1Id] = useState<string>()
  const [assist2Id, setAssist2Id] = useState<string>()

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setScorerId(undefined)
      setAssist1Id(undefined)
      setAssist2Id(undefined)
    }
  }, [open])

  const handleConfirm = () => {
    onConfirm({ scorerId, assist1Id, assist2Id })
    onClose()
  }

  // Filter players to prioritize on-ice players, but allow all
  const sortedPlayers = [...players].sort((a, b) => {
    const aOnIce = onIcePlayers.has(a.id)
    const bOnIce = onIcePlayers.has(b.id)
    if (aOnIce && !bOnIce) return -1
    if (!aOnIce && bOnIce) return 1
    return 0
  })

  const renderPlayerList = (
    currentId: string | undefined, 
    onSelect: (id: string) => void,
    excludeIds: (string | undefined)[] = []
  ) => (
    <div className="grid grid-cols-2 gap-2">
      {sortedPlayers
        .filter(p => !excludeIds.includes(p.id))
        .map(player => {
          const isOnIce = onIcePlayers.has(player.id)
          const isSelected = currentId === player.id
          
          return (
            <button
              key={player.id}
              onClick={() => onSelect(player.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-xl border transition-all text-left",
                isSelected 
                  ? "bg-emerald-500/20 border-emerald-500/50" 
                  : "bg-zinc-900 border-white/5 hover:border-white/10"
              )}
            >
              <Avatar className="w-8 h-8">
                <div className="bg-zinc-800 w-full h-full flex items-center justify-center text-[10px] font-bold">
                  {player.number}
                </div>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[11px] font-bold truncate">{player.name}</p>
                {isOnIce && <span className="text-[9px] text-emerald-400 font-bold">On Ice</span>}
              </div>
              {isSelected && <Check className="w-3 h-3 ml-auto text-emerald-500" />}
            </button>
          )
        })}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-zinc-950 border-white/10 rounded-[2.5rem] p-0 overflow-hidden">
        <div className="sr-only">
          <DialogTitle>Goal Attribution</DialogTitle>
          <DialogDescription>Select the scorer and any assists for this goal.</DialogDescription>
        </div>
        <DialogHeader className="p-6 pb-0">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-emerald-500" />
          </div>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
            Goal Attribution
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Select the scorer and any assists for this goal.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-6 pt-4">
          <div className="space-y-6">
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                <Trophy className="w-3 h-3" /> Scorer
              </h4>
              {renderPlayerList(scorerId, setScorerId)}
            </section>

            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                <Users className="w-3 h-3" /> Assist 1
              </h4>
              {renderPlayerList(assist1Id, (id) => setAssist1Id(id === assist1Id ? undefined : id), [scorerId])}
            </section>

            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                <Users className="w-3 h-3" /> Assist 2
              </h4>
              {renderPlayerList(assist2Id, (id) => setAssist2Id(id === assist2Id ? undefined : id), [scorerId, assist1Id])}
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-zinc-900/50">
          <Button variant="ghost" onClick={onClose} className="rounded-full">
            Skip Attribution
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold px-8"
          >
            Confirm Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
