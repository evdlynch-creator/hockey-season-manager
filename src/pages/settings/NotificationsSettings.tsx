import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@blinkdotnew/ui'
import {
  useNotificationPreferences,
  type NotificationPreferences,
} from '../../hooks/usePreferences'

export function NotificationsSettings({ teamId }: { teamId: string }) {
  const [prefs, setPrefs] = useNotificationPreferences(teamId)

  const items: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    { key: 'practiceReminders', label: 'Practice reminders', description: 'Email me before upcoming practices.' },
    { key: 'gameReminders', label: 'Game reminders', description: 'Email me before upcoming games.' },
    { key: 'rematchPrep', label: 'Rematch prep alerts', description: 'Notify me when an upcoming game is a rematch.' },
    { key: 'weeklySummary', label: 'Weekly summary', description: 'A short Monday recap of last week and the week ahead.' },
  ]

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Lightweight preferences saved on this device.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/40">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between py-3 gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.description}</p>
            </div>
            <Switch
              checked={prefs[it.key]}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, [it.key]: v }))}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
