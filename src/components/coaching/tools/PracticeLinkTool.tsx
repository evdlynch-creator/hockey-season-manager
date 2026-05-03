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
import { Calendar, Search, Link as LinkIcon, FileText } from 'lucide-react'
import { usePractices } from '@/hooks/usePractices'
import { format } from 'date-fns'

interface PracticeLinkToolProps {
  open: boolean
  onClose: () => void
  onSelect: (practiceId: string, title: string) => void
}

export function PracticeLinkTool({ open, onClose, onSelect }: PracticeLinkToolProps) {
  const { data: practices = [], isLoading } = usePractices()
  const [search, setSearch] = useState('')

  const filtered = practices.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Link Practice Session
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search practices..."
              className="pl-10 rounded-full bg-secondary/20"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-10 text-xs text-zinc-500 italic">Loading practices...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-500 italic">No practices found</div>
              ) : (
                filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p.id, p.title)
                      onClose()
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {p.date ? format(new Date(p.date + 'T00:00:00'), 'MMM d, yyyy') : 'No date'}
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
