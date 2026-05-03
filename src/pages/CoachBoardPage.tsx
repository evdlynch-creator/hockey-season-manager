import { CoachChat } from '@/components/coaching/CoachChat'
import { PinnedTopic } from '@/components/coaching/PinnedTopic'
import { NextEventBanner } from '@/components/coaching/NextEventBanner'
import { TalkingPointsSidebar } from '@/components/coaching/TalkingPointsSidebar'
import { RematchBriefingSidebar } from '@/components/coaching/RematchBriefingSidebar'
import { TrendingAnalyticsSidebar } from '@/components/coaching/TrendingAnalyticsSidebar'
import { MiniScheduleSidebar } from '@/components/coaching/MiniScheduleSidebar'
import { MessageSquare, Info, Bell, Sparkles, Brain } from 'lucide-react'
import { Card, CardContent, Button, toast, Badge } from '@blinkdotnew/ui'
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in space-y-8">
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

      <NextEventBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <PinnedTopic />
          <CoachChat contextType="general" title="Strategic Discussion" className="h-[750px]" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <MiniScheduleSidebar />
          <RematchBriefingSidebar />
          <TrendingAnalyticsSidebar />
          <TalkingPointsSidebar />
          
          <div className="bg-primary/5 rounded-[2rem] border border-primary/10 p-6 space-y-3 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 p-8 opacity-5 text-primary rotate-12">
              <Brain size={100} />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Intelligence Engine</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                Strategic insights are updated in real-time based on game reviews and practice execution data. Use these talking points to align the staff before next session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
