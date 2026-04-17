import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@blinkdotnew/ui'
import { Users, Info, ExternalLink } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTeam } from '../hooks/useTeam'

export default function TeamMembersPage() {
  const { user } = useAuth()
  const { data: teamData } = useTeam()

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Coaching Staff
        </h1>
        <p className="text-muted-foreground mt-2">
          {teamData?.team
            ? `Currently signed in as the head coach of ${teamData.team.name}.`
            : 'Set up a season to see your staff details.'}
        </p>
      </div>

      <Card className="mb-6 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Head Coach</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/30 border border-border/40">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 bg-primary/15 text-primary">
              {((user as any)?.email ?? '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {(user as any)?.email ?? 'You'}
                </p>
                <Badge className="bg-primary/15 text-primary border-primary/25 border text-[10px] px-1.5 py-0 h-4">
                  Owner
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-amber-300">
            <Info className="w-4 h-4" />
            Inviting more coaches
          </CardTitle>
          <CardDescription className="text-amber-200/70">
            Multi-coach access needs a small database change before it can be turned on.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-amber-100/80 space-y-3">
          <p>
            This project's database doesn't currently have a place to store extra staff members. To
            invite other coaches, the <code className="text-xs px-1 py-0.5 rounded bg-amber-500/15">teams</code> table
            needs a new column called <code className="text-xs px-1 py-0.5 rounded bg-amber-500/15">members</code> (text),
            which will hold the staff list as JSON.
          </p>
          <p>
            You can add the column from your project dashboard at{' '}
            <a
              href="https://blink.new"
              target="_blank"
              rel="noreferrer"
              className="text-amber-300 underline inline-flex items-center gap-1"
            >
              blink.new <ExternalLink className="w-3 h-3" />
            </a>
            . Once it exists, let me know and I'll switch this page over to a real invite/manage flow.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
