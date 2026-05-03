import { Badge } from '@blinkdotnew/ui'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatHeaderProps {
  title?: string
  isConnected: boolean
  messageCount: number
}

export function ChatHeader({ title, isConnected, messageCount }: ChatHeaderProps) {
  return (
    <div className="p-6 border-b border-white/5 bg-zinc-900/40 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner rotate-3">
          <MessageSquare className="w-6 h-6 -rotate-3" />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter italic italic-700 leading-none">
            {title || 'Coaches Chat'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full", 
              isConnected ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-zinc-600"
            )} />
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
              {isConnected ? 'Realtime Operational' : 'Offline'}
            </p>
          </div>
        </div>
      </div>
      <Badge variant="outline" className="rounded-full text-[10px] font-black border-white/10 bg-white/5 text-zinc-400 px-3 py-1">
        {messageCount} LITS
      </Badge>
    </div>
  )
}
