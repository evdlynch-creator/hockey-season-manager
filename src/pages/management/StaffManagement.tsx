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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  toast,
  EmptyState,
} from '@blinkdotnew/ui'
import { Users, UserPlus, Trash2, Mail, Clock, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTeam } from '@/hooks/useTeam'
import { useCoachingStaff, useInviteCoach, useRemoveMember, useCancelInvitation, useUpdateMemberRole } from '@/hooks/useCoachingStaff'
import { useIsOwner } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'
import type { SeasonRole } from '@/types'

export function StaffManagement() {
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

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading coaching staff...</div>

  const members = staff?.members ?? []
  const invitations = staff?.invitations ?? []

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Coaching Staff</h2>
          <p className="text-muted-foreground text-sm">
            {teamData?.team
              ? `Manage the coaching team for ${teamData.team.name}.`
              : 'Set up a season to manage your staff.'}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)} className="gap-2 w-full sm:w-auto rounded-full shadow-lg shadow-primary/20">
            <UserPlus className="w-4 h-4" />
            Invite Coach
          </Button>
        )}
      </div>

      <div className="grid gap-8">
        <Card className="border-border/50 bg-sidebar/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="px-6 py-6 border-b border-white/5">
            <CardTitle className="text-lg">Active Members</CardTitle>
            <CardDescription>Coaches with access to this season.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {members.length === 0 ? (
                <EmptyState icon={<Users />} title="No members found" description="Invite your first coach to get started." />
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[1.5rem] bg-secondary/10 border border-border/40 hover:border-primary/30 transition-all gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 border border-primary/20 shadow-inner">
                        {member.displayName?.slice(0, 2).toUpperCase() || member.email?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground truncate">{member.displayName || 'Coach'}</p>
                          <Badge variant="outline" className={cn(
                            "gap-1.5 text-[10px] uppercase font-black tracking-widest rounded-full h-5 border-none bg-zinc-900",
                            member.role === 'owner' ? "text-primary" : "text-zinc-500"
                          )}>
                            {roleIcon(member.role)}
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email || member.userId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner && member.userId !== user?.id && (
                        <div className="flex items-center gap-2 justify-end">
                          <Select
                            value={member.role}
                            onValueChange={(v) => updateRoleMutation.mutate({ memberId: member.id, role: v as SeasonRole })}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-[10px] uppercase font-bold tracking-widest rounded-full bg-zinc-900 border-white/5">
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
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={() => removeMutation.mutate(member.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {member.userId === user?.id && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full font-bold px-3">You</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {invitations.length > 0 && (
          <Card className="border-border/50 bg-amber-500/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="px-6 py-6 border-b border-amber-500/10">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-500">
                <Clock className="w-5 h-5" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[1.5rem] border border-dashed border-amber-500/20 bg-amber-500/5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{invite.email}</p>
                        <p className="text-[10px] text-amber-500/70 uppercase font-black tracking-widest">{invite.role}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-bold text-amber-500 hover:bg-amber-500/10 rounded-full h-8"
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
                          className="h-8 w-8 text-amber-500 hover:text-destructive hover:bg-destructive/10 rounded-full"
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
        <DialogContent className="max-w-md rounded-[2rem] border-white/10 bg-zinc-950 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Invite a Coach</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Enter the email address of the coach you'd like to invite to this season.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</p>
              <Input
                type="email"
                placeholder="coach@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="rounded-full bg-zinc-900 border-white/5 h-12 px-6"
              />
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Season Role</p>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as SeasonRole)}>
                <SelectTrigger className="rounded-full bg-zinc-900 border-white/5 h-12 px-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10">
                  <SelectItem value="owner">Owner (Full Control)</SelectItem>
                  <SelectItem value="assistant">Assistant (Edit Access)</SelectItem>
                  <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-8 gap-3">
            <Button variant="ghost" onClick={() => setInviteOpen(false)} className="rounded-full flex-1">Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviteMutation.isPending} className="rounded-full flex-1 shadow-lg shadow-primary/20">
              {inviteMutation.isPending ? 'Generating...' : 'Invite Coach'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
