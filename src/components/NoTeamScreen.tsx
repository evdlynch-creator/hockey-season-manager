import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blinkdotnew/ui'
import { Rocket, RefreshCw, ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function shortHash(input: string): string {
  if (!input) return '—'
  const trimmed = input.replace(/^[a-z]+_/i, '')
  return trimmed.length <= 10 ? trimmed : `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`
}

/**
 * Shown whenever `useTeam` resolves to no team for the current identity.
 *
 * Two paths from here:
 *  - "Try recovery again" — re-runs the team query. Useful right after a
 *    silent identity reissue: the email-based reclaim in `resolveMemberships`
 *    will pick up any orphan owner row on the next fetch.
 *  - "Set up your first team" — explicit user action that takes them into
 *    onboarding. Replaces the previous silent auto-redirect, which could
 *    accidentally create a duplicate empty team during a transient empty
 *    result.
 */
export function NoTeamScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['team'] })
    queryClient.invalidateQueries({ queryKey: ['myTeams'] })
    queryClient.invalidateQueries({ queryKey: ['teamMembers'] })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 animate-fade-in">
      <Card className="w-full max-w-2xl border-primary/10 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg shadow-primary/20">
            <Rocket className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl">No team on this account</CardTitle>
          <CardDescription className="text-base">
            We couldn't find a team linked to your sign-in. If you previously had a team,
            try recovery first — your data may just need to be re-attached to your current
            session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border border-border bg-secondary/40 p-4 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Signed in as</span>
              <span className="font-medium text-foreground">{user?.email ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Session id</span>
              <span className="font-mono text-xs text-muted-foreground">
                {shortHash(user?.id ?? '')}
              </span>
            </div>
          </div>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Lost your team?</p>
              <p className="text-muted-foreground">
                If you had data here before, the workspace may have issued a new session
                identity. Click <span className="font-medium text-foreground">Try recovery again</span>{' '}
                — we'll re-link any team owned by your email to this session. Don't create
                a new team unless you're certain you want a fresh start; that won't bring
                your old data back.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try recovery again
            </Button>
            <Button onClick={() => navigate({ to: '/onboarding' })} className="gap-2">
              <Rocket className="w-4 h-4" />
              Set up your first team
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
