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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  toast,
  EmptyState,
} from '@blinkdotnew/ui'
import { Users, UserPlus, Trash2, Mail, CheckCircle2, Clock, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTeam } from '../hooks/useTeam'
import { useCoachingStaff, useInviteCoach, useRemoveMember, useCancelInvitation, useUpdateMemberRole } from '../hooks/useCoachingStaff'
import { useIsOwner } from '../hooks/usePermissions'
import { cn } from '@/lib/utils'
import type { SeasonRole } from '../types'

export default function TeamMembersPage() {
  const { user } = useAuth()
  const { data: teamData } = useTeam()
  const { data: staff, isLoading } = useCoachingStaff()
  const isOwner = useIsOwner()
  
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<SeasonRole>('assistant')

  const inviteMutation = useInviteCoach()
  const removeMutation = useRemoveMember()
  const cancelMutation = useCancelInvitation()
  const updateRoleMutation = useUpdateMemberRole()

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    try {
      const { token } = await inviteMutation.mutateAsync({ email: inviteEmail, role: inviteRole })
      const inviteUrl = `${window.location.origin}/onboarding?invite=${token}`
      
      // In a real app, we'd send an email. For now, we'll copy to clipboard and show success.
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Invitation generated!', {
        description: 'The invite link has been copied to your clipboard.'
      })
      setInviteOpen(false)
      setInviteEmail('')
    } catch (err: any) {
      toast.error('Failed to invite coach', { description: err.message })
    }
  }

  const roleIcon = (role: string) => {
    if (role === 'owner') return <ShieldAlert className="w-4 h-4 text-primary" />
    if (role === 'assistant') return <ShieldCheck className="w-4 h-4 text-emerald-400" />
    return <Shield className="w-4 h-4 text-muted-foreground" />
  }

  if (isLoading) return <div className="p-8">Loading coaching staff...</div>

  const members = staff?.members ?? []
  const invitations = staff?.invitations ?? []

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Coaching Staff
          </h1>
          <p className="text-muted-foreground mt-2">
            {teamData?.team
              ? `Manage the coaching team for ${teamData.team.name} — ${teamData.season?.name}.`
              : 'Set up a season to manage your staff.'}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Coach
          </Button>
        )}
      </div>

      <div className="grid gap-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Active Members</CardTitle>
            <CardDescription>Coaches with access to this season.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.length === 0 ? (
                <EmptyState icon={<Users />} title="No members found" description="Invite your first coach to get started." />
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/40">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {member.displayName?.slice(0, 2).toUpperCase() || member.email?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{member.displayName || 'Coach'}</p>
                          <Badge variant="outline" className={cn(
                            "gap-1.5 text-[10px] uppercase font-bold",
                            member.role === 'owner' ? "text-primary border-primary/30" : "text-muted-foreground"
                          )}>
                            {roleIcon(member.role)}
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email || member.userId}</p>
                      </div>
                    </div>

                    {isOwner && member.userId !== user?.id && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(v) => updateRoleMutation.mutate({ memberId: member.id, role: v as SeasonRole })}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="assistant">Assistant</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeMutation.mutate(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {member.userId === user?.id && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">You</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {invitations.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 rounded-lg border border-dashed border-border/60 bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{invite.role}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={async () => {
                            const inviteUrl = `${window.location.origin}/onboarding?invite=${invite.token}`
                            await navigator.clipboard.writeText(inviteUrl)
                            toast.success('Invite link copied')
                          }}
                        >
                          Copy Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => cancelMutation.mutate(invite.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a Coach</DialogTitle>
            <DialogDescription>
              Enter the email address of the coach you'd like to invite to this season.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Email Address</p>
              <Input
                type="email"
                placeholder="coach@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Season Role</p>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as SeasonRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner (Full Control)</SelectItem>
                  <SelectItem value="assistant">Assistant (Edit Access)</SelectItem>
                  <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Generating...' : 'Generate Invite Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
