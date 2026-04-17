import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  toast,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@blinkdotnew/ui'
import { Rocket, RefreshCw, ShieldAlert, CheckCircle2, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  useOrphanTeams,
  useClaimTeam,
  useDeleteEmptyTeam,
  type OrphanTeamCandidate,
} from '../hooks/useTeamRecovery'
import { format, parseISO, isValid } from 'date-fns'

function shortHash(input: string): string {
  if (!input) return '—'
  const trimmed = input.replace(/^[a-z]+_/i, '')
  return trimmed.length <= 10 ? trimmed : `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`
}

function formatLastActivity(iso: string | null): string {
  if (!iso) return 'no activity yet'
  try {
    const d = parseISO(iso)
    if (!isValid(d)) return 'no activity yet'
    return format(d, "MMM d, yyyy")
  } catch {
    return 'no activity yet'
  }
}

interface OrphanRowProps {
  candidate: OrphanTeamCandidate
  busyTeamId: string | null
  setBusyTeamId: (id: string | null) => void
}

function OrphanRow({ candidate, busyTeamId, setBusyTeamId }: OrphanRowProps) {
  const claim = useClaimTeam()
  const remove = useDeleteEmptyTeam()
  const isBusy = busyTeamId === candidate.team.id

  const handleClaim = async () => {
    setBusyTeamId(candidate.team.id)
    try {
      await claim.mutateAsync(candidate.team.id)
      toast.success(`Reattached "${candidate.team.name}" to your account.`)
    } catch (err) {
      console.error('[claimTeam] failed', err)
      toast.error("Couldn't claim that team. Try again.")
    } finally {
      setBusyTeamId(null)
    }
  }

  const handleDelete = async () => {
    setBusyTeamId(candidate.team.id)
    try {
      await remove.mutateAsync(candidate.team.id)
      toast.success(`Deleted empty team "${candidate.team.name}".`)
    } catch (err) {
      console.error('[deleteEmptyTeam] failed', err)
      toast.error(err instanceof Error ? err.message : "Couldn't delete that team.")
    } finally {
      setBusyTeamId(null)
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-foreground truncate">{candidate.team.name}</h4>
            {candidate.isEmpty && (
              <Badge variant="outline" className="text-xs">Empty</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Team id: <span className="font-mono">{shortHash(candidate.team.id)}</span>
            {' · '}Last activity: {formatLastActivity(candidate.lastActivity)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{candidate.seasonCount} season{candidate.seasonCount === 1 ? '' : 's'}</span>
        <span>·</span>
        <span>{candidate.practiceCount} practice{candidate.practiceCount === 1 ? '' : 's'}</span>
        <span>·</span>
        <span>{candidate.gameCount} game{candidate.gameCount === 1 ? '' : 's'}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {candidate.evidence !== 'already_owned_empty' && (
          <Button size="sm" onClick={handleClaim} disabled={isBusy} className="gap-2">
            {isBusy && claim.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            This is mine — claim it
          </Button>
        )}
        {candidate.isEmpty && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={isBusy} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete (empty)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this empty team?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{candidate.team.name}" and any seasons it
                  owns. It has no practices or games, so nothing meaningful will be lost.
                  This action can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete team</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

/**
 * Shown whenever `useTeam` resolves to no team for the current identity.
 *
 * Recovery flow:
 *  1. The email-based reclaim in `resolveMemberships` automatically re-attaches
 *     any team-member row whose email matches mine — so most "lost team"
 *     incidents heal on the next page load.
 *  2. For incidents the email match can't fix (orphan team rows whose
 *     owner-membership is missing or points at someone else's email), we
 *     list every team the SDK can see that I have no membership for, and
 *     give the user an explicit "claim it" / "delete (empty)" action.
 */
export function NoTeamScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orphanQuery = useOrphanTeams()
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null)

  const orphans = orphanQuery.data ?? []
  const hasOrphans = orphans.length > 0

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['team'] })
    queryClient.invalidateQueries({ queryKey: ['myTeams'] })
    queryClient.invalidateQueries({ queryKey: ['teamMembers'] })
    queryClient.invalidateQueries({ queryKey: ['orphanTeams'] })
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
                identity. We've already tried to re-link any team owned by your email
                automatically. If your team is in the list below, click{' '}
                <span className="font-medium text-foreground">This is mine — claim it</span>.
                Don't create a new team unless you're certain you want a fresh start;
                that won't bring your old data back.
              </p>
            </div>
          </div>

          {orphanQuery.isLoading && (
            <div className="flex items-center justify-center text-sm text-muted-foreground py-6 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Looking for orphan teams…
            </div>
          )}

          {!orphanQuery.isLoading && hasOrphans && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Possible matches ({orphans.length})
                </h3>
              </div>
              <div className="space-y-3">
                {orphans.map((c) => (
                  <OrphanRow
                    key={c.team.id}
                    candidate={c}
                    busyTeamId={busyTeamId}
                    setBusyTeamId={setBusyTeamId}
                  />
                ))}
              </div>
            </div>
          )}

          {!orphanQuery.isLoading && !hasOrphans && (
            <div className="rounded-md border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground text-center">
              No orphan teams visible from this account. If you're certain a team
              should be here, click "Try recovery again" — otherwise start fresh below.
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try recovery again
            </Button>
            <Button onClick={() => navigate({ to: '/onboarding' })} className="gap-2">
              <Rocket className="w-4 h-4" />
              Set up a brand new team instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
