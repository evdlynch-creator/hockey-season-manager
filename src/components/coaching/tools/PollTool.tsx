import { useState } from 'react'
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Input,
  Label
} from '@blinkdotnew/ui'
import { BarChart3, Plus, X } from 'lucide-react'

interface PollToolProps {
  open: boolean
  onClose: () => void
  onShare: (question: string, options: string[]) => void
}

export function PollTool({ open, onClose, onShare }: PollToolProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleUpdateOption = (index: number, value: string) => {
    const next = [...options]
    next[index] = value
    setOptions(next)
  }

  const handleShare = () => {
    const validOptions = options.filter(o => o.trim())
    if (!question.trim() || validOptions.length < 2) return
    
    onShare(question.trim(), validOptions)
    setQuestion('')
    setOptions(['', ''])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Strategic Poll
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Question</Label>
            <Input 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are we deciding?"
              className="rounded-full bg-secondary/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Options</Label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input 
                    value={opt}
                    onChange={(e) => handleUpdateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="rounded-full bg-secondary/10"
                  />
                  {options.length > 2 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveOption(i)}
                      className="rounded-full shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 5 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAddOption}
                className="w-full rounded-full gap-2 text-xs border border-dashed border-white/10 mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button 
            onClick={handleShare} 
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
            className="rounded-full shadow-lg shadow-primary/20"
          >
            Create Poll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
