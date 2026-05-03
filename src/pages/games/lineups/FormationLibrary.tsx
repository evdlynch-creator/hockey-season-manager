import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  Card,
  CardContent
} from '@blinkdotnew/ui'
import { Library, LayoutGrid, ChevronRight } from 'lucide-react'
import type { Formation } from '@/types'

interface FormationLibraryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formations: Formation[]
  onApply: (formation: Formation) => void
}

export function FormationLibrary({ open, onOpenChange, formations, onApply }: FormationLibraryProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            Formation Library
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {formations.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto opacity-50">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">No templates saved</p>
                <p className="text-xs text-muted-foreground">Manage your formation library in Team Management.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formations.map(f => (
                <Card 
                  key={f.id} 
                  className="border-border/50 bg-secondary/10 hover:border-primary/30 transition-all cursor-pointer group rounded-2xl overflow-hidden"
                  onClick={() => onApply(f)}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm truncate">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Template</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
