import { useState } from 'react'
import {
  Card,
  CardContent,
  Button,
  toast,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@blinkdotnew/ui'
import {
  Users,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useDeleteTeam } from '../../hooks/useTeams'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'

export function TeamsSettings({
  teams,
  currentTeamId,
  onSwitch,
}: {
  teams: { id: string; name: string }[]
  currentTeamId: string
  onSwitch: (id: string) => void
}) {
  const navigate = useNavigate()
  const deleteTeam = useDeleteTeam()
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Teams</h3>
          <p className="text-sm text-muted-foreground">Manage and switch between your hockey teams.</p>
        </div>
        <Button className="gap-2 rounded-full" onClick={() => navigate({ to: '/onboarding' })}>
          <Plus className="w-4 h-4" /> Add New Team
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {teams.map((t) => {
          const isSelected = t.id === currentTeamId
          return (
            <Card key={t.id} className={cn('border-border/50', isSelected && 'border-primary/40 bg-primary/5')}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                    isSelected ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="font-semibold text-foreground truncate">{t.name}</p>
                    {isSelected && (
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">
                        Currently Selected
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isSelected ? (
                    <Button variant="outline" size="sm" onClick={() => onSwitch(t.id)} className="rounded-full">
                      Switch to Team
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled className="text-primary font-medium rounded-full">
                      Active
                    </Button>
                  )}
                  {teams.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-full"
                      onClick={() => setConfirmDelete(t)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Delete Team?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-foreground">{confirmDelete?.name}</span>{' '}
              and ALL associated data (seasons, roster, practices, games). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTeam.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteTeam.isPending}
              onClick={async (e) => {
                e.preventDefault()
                if (!confirmDelete) return
                try {
                  await deleteTeam.mutateAsync(confirmDelete.id)
                  toast.success('Team deleted')
                  setConfirmDelete(null)
                } catch {
                  toast.error('Could not delete team')
                }
              }}
            >
              {deleteTeam.isPending ? 'Deleting…' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
