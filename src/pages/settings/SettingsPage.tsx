import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  EmptyState,
} from '@blinkdotnew/ui'
import {
  Users,
  CalendarRange,
  Bell,
  UserCircle,
  AlertTriangle,
} from 'lucide-react'
import { useTeam } from '../../hooks/useTeam'
import { useAuth } from '../../hooks/useAuth'
import { TeamSettings } from './TeamSettings'
import { TeamsSettings } from './TeamsSettings'
import { SeasonsSettings } from './SeasonsSettings'
import { NotificationsSettings } from './NotificationsSettings'
import { AccountSettings } from './AccountSettings'
import { DangerZone } from './DangerZone'

export default function SettingsPage() {
  const { user } = useAuth()
  const { data: teamData, isLoading, switchTeam } = useTeam()
  const team = teamData?.team
  const activeSeason = teamData?.season
  const teams = teamData?.teams ?? []

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <EmptyState
          title="No team yet"
          description="Finish onboarding to access settings."
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team, seasons, preferences, and account.
        </p>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-secondary/40 p-1 rounded-full">
          <TabsTrigger value="team" className="gap-2 rounded-full"><Users className="w-4 h-4" /> Active Team</TabsTrigger>
          <TabsTrigger value="teams" className="gap-2 rounded-full"><Users className="w-4 h-4" /> Manage Teams</TabsTrigger>
          <TabsTrigger value="seasons" className="gap-2 rounded-full"><CalendarRange className="w-4 h-4" /> Seasons</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 rounded-full"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="account" className="gap-2 rounded-full"><UserCircle className="w-4 h-4" /> Account</TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 text-red-400 data-[state=active]:text-red-300 rounded-full">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <TeamSettings team={team} activeSeason={activeSeason ?? null} />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamsSettings teams={teams} currentTeamId={team.id} onSwitch={switchTeam} />
        </TabsContent>

        <TabsContent value="seasons" className="mt-6">
          <SeasonsSettings teamId={team.id} activeSeasonId={activeSeason?.id ?? null} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsSettings teamId={team.id} />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountSettings user={user} />
        </TabsContent>

        <TabsContent value="danger" className="mt-6">
          <DangerZone teamId={team.id} activeSeason={activeSeason ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
