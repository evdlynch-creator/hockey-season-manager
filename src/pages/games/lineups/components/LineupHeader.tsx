import { 
  Button, 
} from '@blinkdotnew/ui'
import { 
  Save, 
  Users, 
  Settings2,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'

interface LineupHeaderProps {
  mode: 'formation' | 'game'
  handleClearAll: () => void
  handleSave: () => void
  isPending: boolean
  rosterOpen: boolean
  isRosterHovered: boolean
  setRosterOpen: (open: boolean) => void
}

export function LineupHeader({
  mode,
  handleClearAll,
  handleSave,
  isPending,
  rosterOpen,
  isRosterHovered,
  setRosterOpen
}: LineupHeaderProps) {
  return (
    <div className="shrink-0 h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary">
            <Settings2 className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none">
              {mode === 'formation' ? 'Template' : 'Game'} Mode
            </p>
            <p className="text-xs font-black uppercase tracking-tight text-white italic">
              {mode === 'formation' ? 'Blueprint Editor' : 'Live Rotation'}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-white/5" />

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClearAll}
            className="rounded-none text-zinc-500 hover:text-red-400 h-9 px-3 font-black uppercase tracking-widest text-[10px]"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Clear
          </Button>
          <Button 
            size="sm"
            onClick={handleSave} 
            disabled={isPending}
            className="rounded-none gap-2 shadow-lg shadow-primary/20 h-9 px-6 font-black uppercase tracking-widest italic text-[10px]"
          >
            <Save className="w-3.5 h-3.5" />
            {isPending ? 'Syncing...' : 'Deploy'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={rosterOpen || isRosterHovered ? "secondary" : "outline"}
          onClick={() => setRosterOpen(!rosterOpen)}
          className="rounded-none h-9 px-4 gap-2 font-black uppercase tracking-widest text-[10px]"
        >
          <Users className="w-3.5 h-3.5" />
          Roster {(rosterOpen || isRosterHovered) ? <PanelRightClose className="w-3.5 h-3.5 ml-1" /> : <PanelRightOpen className="w-3.5 h-3.5 ml-1" />}
        </Button>
      </div>
    </div>
  )
}
