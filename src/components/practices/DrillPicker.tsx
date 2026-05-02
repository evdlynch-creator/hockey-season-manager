import { useState } from 'react'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Badge, Card, CardContent, EmptyState
} from '@blinkdotnew/ui'
import { Search, BookOpen, Plus, ExternalLink } from 'lucide-react'
import { useDrills } from '@/hooks/useDrills'
import type { Drill } from '@/types'
import { cn } from '@/lib/utils'

interface DrillPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (drill: Drill) => void
}

export function DrillPicker({ open, onClose, onSelect }: DrillPickerProps) {
  const { data: drills = [], isLoading } = useDrills()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDrills = drills.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.primaryConcept.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2rem]">
        <DialogHeader className="p-6 pb-2 border-b border-border bg-muted/20">
          <DialogTitle>Drill Library</DialogTitle>
          <DialogDescription>
            Choose a drill from your library to add as a practice segment.
          </DialogDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, concept, or notes..."
              className="pl-10 h-10 bg-background rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-secondary/5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground font-medium">Loading library...</p>
            </div>
          ) : filteredDrills.length === 0 ? (
            <div className="py-12">
              <EmptyState 
                icon={<BookOpen />} 
                title={searchQuery ? "No drills match your search" : "Your library is empty"} 
                description={searchQuery ? "Try a different search term." : "Start adding drills to your library first."} 
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDrills.map((drill) => (
                <Card 
                  key={drill.id} 
                  className="border-border/40 bg-card hover:border-primary/50 transition-all cursor-pointer group flex flex-col rounded-[2rem] overflow-hidden"
                  onClick={() => onSelect(drill)}
                >
                  {drill.fileUrl && (
                    <div className="h-32 overflow-hidden border-b border-border/40 bg-muted/30">
                      <img 
                        src={drill.fileUrl} 
                        alt={drill.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm truncate leading-snug group-hover:text-primary transition-colors">{drill.name}</h3>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider shrink-0 h-5 px-1.5 font-bold rounded-full">
                        {drill.type}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20 border text-[9px] h-5 px-1.5 font-bold rounded-full">
                        {drill.primaryConcept}
                      </Badge>
                      {drill.secondaryConcept && (
                        <Badge variant="secondary" className="text-[9px] h-5 px-1.5 font-bold rounded-full">
                          {drill.secondaryConcept}
                        </Badge>
                      )}
                    </div>

                    {drill.notes && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-4 italic flex-1">
                        "{drill.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/20 mt-auto">
                      {drill.link ? (
                        <div className="text-[10px] text-primary/60 flex items-center gap-1 font-bold uppercase tracking-wider">
                          <ExternalLink className="w-2.5 h-2.5" /> Has Source
                        </div>
                      ) : <div />}
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 font-bold uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary rounded-full">
                        <Plus className="w-3 h-3" /> Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter className="p-4 border-t border-border/40 bg-muted/20">
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
