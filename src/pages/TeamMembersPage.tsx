import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Button, Input, Label, Badge, EmptyState, toast,
} from '@blinkdotnew/ui'
import { Users, Mail, Shield, UserPlus, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { useTeam, useTeamMembers } from '../hooks/useTeam'
import type { TeamMember } from '../types'
import { format, parseISO } from 'date-fns'
import { cn } from '../lib/utils'

export default function TeamMembersPage() {
  const { user } = useAuth()
  const { data: teamData } = useTeam()
  const queryClient = useQueryClient()
  const teamId = teamData?.team.id
  const { data: members = [], isLoading } = useTeamMembers(teamId)

  const [inviteEmail, setInviteEmail] = useState('')

  const myMembership = members.find((m) => m.userId === user?.id)
  const isOwner = myMembership?.role === 'owner'

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!teamId || !user) throw new Error('No team')
      const normalized = email.trim().toLowerCase()
      if (!normalized || !normalized.includes('@')) {
        throw new Error('Please enter a valid email')
      }
      const existing = members.find((m) => m.email.toLowerCase() === normalized)
      if (existing) {
        throw new Error(
          existing.status === 'active'
            ? 'That coach is already on the team'
            : 'An invite is already pending for that email',
        )
      }
      await blink.db.teamMembers.create({
        id: `tm_${crypto.randomUUID().slice(0, 8)}`,
        teamId,
        userId: null,
        email: normalized,
        role: 'coach',
        status: 'pending',
        invitedBy: user.id,
        invitedByName: (user as any).email ?? null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      setInviteEmail('')
      toast.success('Invite sent', {
        description: 'They will join the team automatically when they sign in with this email.',
      })
    },
    onError: (e: any) => {
      toast.error('Could not send invite', { description: e?.message ?? 'Unknown error' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (member: TeamMember) => {
      await blink.db.teamMembers.delete(member.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
      toast.success('Member removed')
    },
    onError: (e: any) => {
      toast.error('Could not remove member', { description: e?.message ?? 'Unknown error' })
    },
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate(inviteEmail)
  }

  if (!teamData) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <EmptyState
          title="No team yet"
          description="Set up a season first to manage your coaching staff."
        />
      </div>
    )
  }

  const activeMembers = members.filter((m) => m.status === 'active')
  const pendingMembers = members.filter((m) => m.status === 'pending')

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Coaching Staff
        </h1>
        <p className="text-muted-foreground mt-2">
          Invite other coaches to {teamData.team.name}. Everyone on the staff can add practices, games,
          ratings, and reviews.
        </p>
      </div>

      <Card className="mb-6 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-4 h-4 text-primary" />
            Invite a coach
          </CardTitle>
          <CardDescription>
            Send an invite to their email. When they sign in with that email, they'll automatically join the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOwner ? (
            <p className="text-sm text-muted-foreground italic">
              Only the team owner can invite new coaches.
            </p>
          ) : (
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="coach@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="gap-2 self-end shadow-lg shadow-primary/20"
                disabled={inviteMutation.isPending}
              >
                <Mail className="w-4 h-4" />
                {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Active coaches
            <Badge variant="secondary" className="ml-1">{activeMembers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : activeMembers.length === 0 ? (
            <EmptyState title="No active coaches" description="Invite someone to get started." className="py-4" />
          ) : (
            <div className="space-y-2">
              {activeMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isMe={m.userId === user?.id}
                  canRemove={isOwner && m.role !== 'owner' && m.userId !== user?.id}
                  onRemove={() => removeMutation.mutate(m)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingMembers.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pending invites
              <Badge variant="secondary" className="ml-1">{pendingMembers.length}</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              These coaches will join automatically when they sign in with this email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isMe={false}
                  canRemove={isOwner}
                  onRemove={() => removeMutation.mutate(m)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MemberRow({
  member,
  isMe,
  canRemove,
  onRemove,
}: {
  member: TeamMember
  isMe: boolean
  canRemove: boolean
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/30 border border-border/40">
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
        member.status === 'active'
          ? 'bg-primary/15 text-primary'
          : 'bg-muted text-muted-foreground',
      )}>
        {member.email.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{member.email}</p>
          {isMe && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">You</Badge>
          )}
          {member.role === 'owner' ? (
            <Badge className="bg-primary/15 text-primary border-primary/25 border text-[10px] px-1.5 py-0 h-4 gap-1">
              <Shield className="w-2.5 h-2.5" /> Owner
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Coach</Badge>
          )}
          {member.status === 'pending' && (
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 border text-[10px] px-1.5 py-0 h-4">
              Pending
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {member.status === 'active'
            ? `Joined ${format(parseISO(member.createdAt), 'MMM d, yyyy')}`
            : `Invited ${format(parseISO(member.createdAt), 'MMM d, yyyy')}`}
        </p>
      </div>
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
