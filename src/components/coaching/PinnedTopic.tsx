import { useState } from 'react'
import { 
  Button, 
  Card, 
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Badge
} from '@blinkdotnew/ui'
import { Pin, Edit2, Sparkles, X } from 'lucide-react'
import { usePinnedTopic } from '@/hooks/usePinnedTopic'
import { useCanEdit } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'

export function PinnedTopic() {
  const { topic, isLoading, updateTopic } = usePinnedTopic()
  const canEdit = useCanEdit()
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')

  const handleUpdate = async () => {
    if (!content.trim()) return
    await updateTopic(content.trim())
    setIsEditing(false)
    setContent('')
  }

  if (isLoading && !topic) return null

  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-amber-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
        <Card className="relative bg-zinc-950/40 border-white/5 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner">
                <Pin className="w-5 h-5 text-primary -rotate-45" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Pinned Priority</span>
                  <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-amber-500/30 text-amber-500 uppercase font-black rounded-full">Active</Badge>
                </div>
                <p className="text-sm font-bold text-foreground leading-tight tracking-tight">
                  {topic ? topic.content : "No priority pinned yet. Set a thematic focus for the staff."}
                </p>
              </div>
            </div>

            {canEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setContent(topic?.content || '')
                  setIsEditing(true)
                }}
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-primary" />
              Set Staff Priority
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-[11px] text-zinc-500 italic leading-relaxed">
              This topic will be pinned to the top of the Locker Room Talk for all coaches to see. Perfect for weekly themes or tactical focus.
            </p>
            <Input 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g., Hard on pucks, quick transitions"
              className="rounded-full bg-secondary/10"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleUpdate} className="rounded-full shadow-lg shadow-primary/20">
              Update Pin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}