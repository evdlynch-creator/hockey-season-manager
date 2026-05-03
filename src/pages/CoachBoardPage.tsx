import { CoachChat } from '@/components/coaching/CoachChat'
import { MessageSquare, Info, Bell } from 'lucide-react'
import { Card, CardContent, Button, toast } from '@blinkdotnew/ui'
import { useState, useEffect } from 'react'

export default function CoachBoardPage() {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser')
      return
    }
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
    if (permission === 'granted') {
      toast.success('Desktop alerts enabled!')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Locker Room Talk
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Centralized strategic discussions and team-wide planning.
          </p>
        </div>
        {notifPermission !== 'granted' && (
          <Button 
            onClick={requestPermission} 
            variant="outline" 
            className="rounded-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Bell className="w-4 h-4" />
            Enable Desktop Alerts
          </Button>
        )}
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
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Locker Room Rules</h4>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">1</div>
                <p className="text-[11px] text-zinc-500 leading-tight">What's said in the room, stays in the room.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-500 text-[10px] font-bold">2</div>
                <p className="text-[11px] text-zinc-500 leading-tight">Focus on technical feedback and player growth.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 text-amber-500 text-[10px] font-bold">3</div>
                <p className="text-[11px] text-zinc-500 leading-tight">Use rich links to keep tactical plans centralized.</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-[2rem] border border-primary/10 p-6 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Pro Tip</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Use the <strong>Draft Lines</strong> tool to quickly visualize new combinations without affecting your actual game rosters. Perfect for brainstorming.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}