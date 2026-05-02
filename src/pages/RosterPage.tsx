import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  toast,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Field,
  FieldLabel,
  FieldError,
  Badge,
} from '@blinkdotnew/ui'
import { Users, UserPlus, Trash2, Pencil, Search, Hash, PersonStanding } from 'lucide-react'
import { usePlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer } from '../hooks/usePlayers'
import { useCanEdit } from '../hooks/usePermissions'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import type { Player } from '../types'

const playerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  number: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
})

type PlayerFormData = z.infer<typeof playerSchema>

const POSITIONS = ['Goalie', 'Defense', 'Forward', 'Center', 'Left Wing', 'Right Wing']

export default function RosterPage() {
  const { data: players = [], isLoading } = usePlayers()
  const createPlayer = useCreatePlayer()
  const updatePlayer = useUpdatePlayer()
  const deletePlayer = useDeletePlayer()
  const canEdit = useCanEdit()

  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Player | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
  })

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.number?.includes(searchQuery) ||
    p.position?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenAdd = () => {
    setEditTarget(null)
    reset({ name: '', number: '', position: '', notes: '' })
    setDialogOpen(true)
  }

  const handleOpenEdit = (player: Player) => {
    setEditTarget(player)
    reset({ 
      name: player.name, 
      number: player.number || '', 
      position: player.position || '', 
      notes: player.notes || '' 
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: PlayerFormData) => {
    try {
      if (editTarget) {
        await updatePlayer.mutateAsync({ id: editTarget.id, ...data })
        toast.success('Player updated')
      } else {
        await createPlayer.mutateAsync(data)
        toast.success('Player added to roster')
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast.error('Failed to save player', { description: err.message })
    }
  }

  if (isLoading) return <div className="p-8">Loading roster...</div>

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Team Roster
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage your players, positions, and jersey numbers.
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleOpenAdd} className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/20">
            <UserPlus className="w-4 h-4" />
            Add Player
          </Button>
        )}
      </div>

      <Card className="border-border/50 bg-sidebar/30 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, number, or position..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredPlayers.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title={searchQuery ? "No players match your search" : "Your roster is empty"}
              description={searchQuery ? "Try a different search term." : "Start adding players to your team."}
              action={!searchQuery && canEdit ? { label: 'Add Player', onClick: handleOpenAdd } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map((player) => (
                <Card key={player.id} className="border-border/40 bg-secondary/10 hover:border-primary/30 transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0 border border-primary/20">
                          {player.number || '—'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{player.name}</p>
                          <Badge variant="secondary" className="mt-1 text-[10px] uppercase tracking-wider font-bold">
                            {player.position || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(player)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deletePlayer.mutate(player.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {player.notes && (
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 italic border-t border-border/20 pt-2">
                        "{player.notes}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Player' : 'Add Player'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <Input {...register('name')} placeholder="e.g. Connor McDavid" />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  Jersey #
                </FieldLabel>
                <Input {...register('number')} placeholder="97" />
              </Field>
              
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <PersonStanding className="w-3 h-3" />
                  Position
                </FieldLabel>
                <Select 
                  value={setValue ? undefined : ''} 
                  onValueChange={(v) => setValue('position', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Coach Notes</FieldLabel>
              <Input {...register('notes')} placeholder="Handedness, line, style..." />
            </Field>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createPlayer.isPending || updatePlayer.isPending}>
                {editTarget ? 'Save Changes' : 'Add Player'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
