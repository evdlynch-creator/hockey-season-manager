import { useState } from 'react'
import { Button, Input } from '@blinkdotnew/ui'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => void
  isSending: boolean
}

export function ChatInput({ onSend, isSending }: ChatInputProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return
    onSend(content.trim())
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <Input 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your coaching note..."
        className="flex-1 rounded-full bg-zinc-900 border-white/10 h-12 px-6 focus:ring-primary/20 text-sm"
        disabled={isSending}
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={!content.trim() || isSending}
        className="w-12 h-12 rounded-full shrink-0 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform"
      >
        {isSending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </Button>
    </form>
  )
}
