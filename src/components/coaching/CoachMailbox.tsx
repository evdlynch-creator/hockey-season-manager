import { useMyPendingProposals } from '@/hooks/useMyPendingProposals'
import { MessageBubble } from './chat/MessageBubble'
import { usePlayers } from '@/hooks/usePlayers'
import { useAuth } from '@/hooks/useAuth'
import { Inbox, LayoutDashboard, Search, Filter, Send } from 'lucide-react'
import { 
  Card, 
  ScrollArea, 
  Skeleton, 
  EmptyState,
  Badge,
  Input,
  Button,
  Tabs,
  TabsList,
  TabsTrigger
} from '@blinkdotnew/ui'
import { useState } from 'react'

export function CoachMailbox() {
  const { data: players = [] } = usePlayers()
  const { data: mailboxData, isLoading } = useMyPendingProposals()
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState<'received' | 'sent'>('received')

  const items = activeView === 'received' ? (mailboxData?.received || []) : (mailboxData?.sent || [])

  const filtered = items.filter(m => 
    m.content.toLowerCase().includes(search.toLowerCase()) ||
    m.userDisplayName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 h-[750px]">
      <Card className="flex-1 flex flex-col border-border bg-card/30 backdrop-blur-[20px] rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-zinc-950/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Coach's Mailbox</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="h-7 bg-white/5 p-0.5 rounded-full border border-white/5">
                  <TabsList className="bg-transparent h-full p-0">
                    <TabsTrigger value="received" className="rounded-full h-full px-4 text-[9px] font-black uppercase tracking-widest gap-2">
                      <Inbox className="w-2.5 h-2.5" /> Inbox
                      {mailboxData?.received?.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="rounded-full h-full px-4 text-[9px] font-black uppercase tracking-widest gap-2">
                      <Send className="w-2.5 h-2.5" /> Outbox
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-tight ml-2 hidden sm:inline">Direct tagging & Review</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search proposals..."
                className="pl-9 h-9 rounded-full bg-zinc-900 border-white/5 text-xs focus:ring-primary/20"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-zinc-500 hover:text-foreground hover:bg-white/5 border border-transparent hover:border-white/5">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-10">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-40 w-full rounded-2xl" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="py-20">
                <EmptyState 
                  icon={activeView === 'received' ? <Inbox className="w-12 h-12 text-zinc-700" /> : <Send className="w-12 h-12 text-zinc-700" />}
                  title={activeView === 'received' ? "Your mailbox is clear" : "No sent proposals"}
                  description={activeView === 'received' ? "No pending line proposals or strategy reviews tagged to you." : "When you send tactical proposals to other coaches, they'll appear here."}
                />
              </div>
            ) : (
              filtered.map((msg) => (
                <div key={msg.id} className="relative">
                  <MessageBubble 
                    message={msg} 
                    isOwn={activeView === 'sent'} 
                    players={players} 
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-zinc-950/40 border-t border-white/5 flex items-center justify-center backdrop-blur-lg">
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
            <LayoutDashboard className="w-3 h-3" /> End-to-end tactical collaboration enabled
          </p>
        </div>
      </Card>
    </div>
  )
}