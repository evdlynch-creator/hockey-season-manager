import { CoachChat } from '@/components/coaching/CoachChat'
import { CoachMailbox } from '@/components/coaching/CoachMailbox'
import { PinnedTopic } from '@/components/coaching/PinnedTopic'
import { NextEventBanner } from '@/components/coaching/NextEventBanner'
import { TalkingPointsSidebar } from '@/components/coaching/TalkingPointsSidebar'
import { RematchBriefingSidebar } from '@/components/coaching/RematchBriefingSidebar'
import { TrendingAnalyticsSidebar } from '@/components/coaching/TrendingAnalyticsSidebar'
import { MiniScheduleSidebar } from '@/components/coaching/MiniScheduleSidebar'
import { MessageSquare, Info, Bell, Sparkles, Brain, Inbox, MessageCircle } from 'lucide-react'
import { Card, CardContent, Button, toast, Badge, Tabs, TabsList, TabsTrigger } from '@blinkdotnew/ui'
import { useState, useEffect } from 'react'
import { useMyPendingProposals } from '@/hooks/useMyPendingProposals'
import { useUnreadCoachMessages } from '@/hooks/useUnreadCoachMessages'
import { useSearch } from '@tanstack/react-router'

export default function CoachBoardPage() {
  const search = useSearch({ from: '/coaches-board' }) as { tab?: 'discussion' | 'mailbox' }
  const [activeTab, setActiveTab] = useState<'discussion' | 'mailbox'>(search.tab || 'discussion')
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const { data: mailboxData } = useMyPendingProposals()
  const pendingCount = mailboxData?.received?.length || 0
  const { hasUnread, markSeen } = useUnreadCoachMessages()

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'discussion') {
      markSeen()
    }
  }, [activeTab, markSeen])

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
        <div className="flex items-center gap-3">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="bg-secondary/20 p-1 rounded-full">
            <TabsList className="bg-transparent p-0">
              <TabsTrigger value="discussion" className="rounded-full gap-2 px-6 relative">
                <MessageCircle className="w-4 h-4" /> Chat
                {hasUnread && activeTab !== 'discussion' && (
                  <span className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                )}
              </TabsTrigger>
              <TabsTrigger value="mailbox" className="rounded-full gap-2 px-6 relative">
                <Inbox className="w-4 h-4" /> Mailbox
                {pendingCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-[8px] font-black rounded-full">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-6">
          {activeTab === 'discussion' ? (
            <>
              <PinnedTopic />
              <CoachChat contextType="general" title="Strategic Discussion" className="h-[750px]" />
            </>
          ) : (
            <CoachMailbox />
          )}
        </div>
      </div>
    </div>
  )
}