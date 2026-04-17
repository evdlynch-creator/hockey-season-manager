import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Input,
  Field,
  FieldLabel,
  FieldDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
} from '@blinkdotnew/ui'
import {
  Users,
  UserPlus,
  Crown,
  Mail,
  RotateCw,
  X,
  Trash2,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTeam } from '../hooks/useTeam'
import {
  useTeamMembers,
  useMyMembership,
  useTeamPlan,
  useInviteCoach,
  useResendInvite,
  useRevokeInvite,
  useRemoveMember,
} from '../hooks/useTeamMembers'
import { NoTeamScreen } from '../components/NoTeamScreen'
import type { TeamMember } from '../types'

function initialsOf(email: string): string {
  return (email || '?').slice(0, 2).toUpperCase()
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export default function TeamMembersPage() {
  const { user } = useAuth()
  const { data: teamData, isLoading: teamLoading } = useTeam()
  const teamId = teamData?.team.id
  const { data: members = [], isLoading: membersLoading } = useTeamMembers(teamId)
  const { isOwner } = useMyMembership(teamId)
  const { plan, seatLimit, seatsUsed } = useTeamPlan(teamId)

  const [inviteEmail, setInviteEmail] = useState('')
  const invite = useInviteCoach()
  const resend = useResendInvite()
  const revoke = useRevokeInvite()
  const remove = useRemoveMember()
  const [pendingRemove, setPendingRemove] = useState<TeamMember | null>(null)

  const myEmail = (user?.email ?? '').toLowerCase()

  if (teamLoading || membersLoading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!teamData?.team) {
    return <NoTeamScreen />
  }

  const owner = members.find((m) => m.role === 'owner') ?? null
  const activeCoaches = members.filter((m) => m.role === 'coach' && m.status === 'active')
  const pendingInvites = members.filter((m) => m.status === 'pending')

  const handleInvite = async () => {
    if (!teamId) return
    try {
      const cleaned = await invite.mutateAsync({ teamId, email: inviteEmail })
      setInviteEmail('')
      toast.success('Invite added', {
        description: `${cleaned} will join the team the next time they sign in.`,
      })
    } catch (err) {
      toast.error(errorMessage(err, 'Could not add invite'))
    }
  }

  const handleResend = async (m: TeamMember) => {
    try {
      await resend.mutateAsync(m)
      toast.success('Reminder noted', {
        description: 'Tell them to sign in with this email to join the team.',
      })
    } catch {
      toast.error('Could not refresh invite')
    }
  }

  const handleRevoke = async (m: TeamMember) => {
    try {
      await revoke.mutateAsync(m)
      toast.success('Invite revoked')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not revoke invite'))
    }
  }

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return
    try {
      await remove.mutateAsync(pendingRemove)
      toast.success('Coach removed from team')
      setPendingRemove(null)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove coach'))
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Coaching Staff
        </h1>
        <p className="text-muted-foreground mt-2">
          {isOwner
            ? `Manage the staff for ${teamData.team.name}.`
            : `You're a coach on ${teamData.team.name}.`}
        </p>
      </div>

      {/* Invite form (owner only) */}
      {isOwner ? (
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Invite a coach
            </CardTitle>
            <CardDescription>
              Add their email and they'll join automatically the next time they sign in
              with that address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleInvite()
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <Field className="flex-1">
                <FieldLabel className="sr-only">Coach email</FieldLabel>
                <Input
                  type="email"
                  placeholder="coach@team.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Button
                type="submit"
                className="gap-2 shrink-0 self-start sm:self-auto"
                disabled={!inviteEmail.trim() || invite.isPending}
              >
                <UserPlus className="w-4 h-4" />
                {invite.isPending ? 'Adding…' : 'Send invite'}
              </Button>
            </form>
            <FieldDescription className="mt-2">
              No email is sent yet — invites are claimed at sign-in. Email delivery comes
              with the licensed plan.
            </FieldDescription>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-border/50 bg-secondary/30">
          <CardContent className="p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Only the team owner can invite or remove coaches. Ask{' '}
              <span className="text-foreground font-medium">{owner?.email ?? 'the owner'}</span>{' '}
              if you need a change.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Owner card */}
      {owner && (
        <Card className="mb-4 border-border/50">
          <CardHeader>
            <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
              Head Coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MemberRow
              member={owner}
              isMe={owner.userId === user?.id || owner.email.toLowerCase() === myEmail}
            />
          </CardContent>
        </Card>
      )}

      {/* Active coaches */}
      <Card className="mb-4 border-border/50">
        <CardHeader>
          <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
            Coaches{' '}
            <span className="text-muted-foreground/60 normal-case font-normal">
              ({activeCoaches.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeCoaches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No assistant coaches yet.
            </p>
          ) : (
            <div className="space-y-2">
              {activeCoaches.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isMe={m.userId === user?.id || m.email.toLowerCase() === myEmail}
                  canManage={isOwner}
                  onRemove={() => setPendingRemove(m)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {(isOwner || pendingInvites.length > 0) && (
        <Card className="mb-4 border-border/50">
          <CardHeader>
            <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
              Pending Invites{' '}
              <span className="text-muted-foreground/60 normal-case font-normal">
                ({pendingInvites.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No pending invites.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingInvites.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    pending
                    canManage={isOwner}
                    onResend={() => handleResend(m)}
                    onRevoke={() => handleRevoke(m)}
                    busy={resend.isPending || revoke.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan footer */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span>
          {plan === 'beta_free'
            ? `Beta — unlimited seats (${seatsUsed} used)`
            : `${plan} plan — ${seatsUsed} of ${seatLimit ?? '∞'} seats used`}
        </span>
      </div>

      {/* Remove confirmation */}
      <AlertDialog
        open={!!pendingRemove}
        onOpenChange={(o) => !o && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Remove this coach?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{pendingRemove?.email}</span>{' '}
              will lose access to {teamData.team.name} immediately. Their previous edits
              stay on the team's records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmRemove()
              }}
            >
              {remove.isPending ? 'Removing…' : 'Remove coach'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface MemberRowProps {
  member: TeamMember
  isMe?: boolean
  pending?: boolean
  canManage?: boolean
  busy?: boolean
  onRemove?: () => void
  onResend?: () => void
  onRevoke?: () => void
}

function MemberRow({
  member,
  isMe,
  pending,
  canManage,
  busy,
  onRemove,
  onResend,
  onRevoke,
}: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/30 border border-border/40">
      <div
        className={
          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ' +
          (member.role === 'owner'
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground')
        }
      >
        {pending ? <Mail className="w-4 h-4" /> : initialsOf(member.email)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{member.email}</p>
          {member.role === 'owner' && (
            <Badge className="bg-primary/15 text-primary border-primary/25 border text-[10px] px-1.5 py-0 h-4 gap-1">
              <Crown className="w-3 h-3" />
              Owner
            </Badge>
          )}
          {member.role === 'coach' && !pending && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 border-border/60"
            >
              Coach
            </Badge>
          )}
          {pending && (
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 border text-[10px] px-1.5 py-0 h-4">
              Pending
            </Badge>
          )}
          {isMe && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              You
            </Badge>
          )}
        </div>
      </div>
      {canManage && pending && (
        <div className="flex gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 gap-1.5"
            onClick={onResend}
            disabled={busy}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resend</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={onRevoke}
            disabled={busy}
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Revoke</span>
          </Button>
        </div>
      )}
      {canManage && !pending && member.role === 'coach' && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Remove</span>
        </Button>
      )}
    </div>
  )
}
