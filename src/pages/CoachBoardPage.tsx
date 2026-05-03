import { CoachChat } from '@/components/coaching/CoachChat'
import { MessageSquare, Info } from 'lucide-react'
import { Card, CardContent } from '@blinkdotnew/ui'

export default function CoachBoardPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Coaches Messaging Board
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Centralized strategic discussions and team-wide planning.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CoachChat contextType="general" title="Strategic Discussion" className="h-[700px]" />
        </div>
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Info className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-widest text-xs">About this board</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This is a private space for the coaching staff to discuss season goals, line combinations, and overall team progress.
              </p>
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] uppercase font-black text-zinc-400">Realtime Updates</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] uppercase font-black text-zinc-400">Private to Coaches</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] uppercase font-black text-zinc-400">Persisted History</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-zinc-950/40 rounded-[2rem] border border-white/5 p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Chat Contexts</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Messages posted here are general. You can also find contextual chat boards inside each Practice and Game detail page to discuss specific event planning.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
