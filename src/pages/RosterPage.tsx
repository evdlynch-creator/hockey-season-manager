import { useState, useEffect } from 'react'
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@blinkdotnew/ui'
import { Users, UserPlus, Trash2, Pencil, Search, Hash, PersonStanding, LayoutList, UserCog, Plus, MoreVertical, LayoutGrid, ChevronRight, Activity } from 'lucide-react'
import { usePlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer } from '../hooks/usePlayers'
import { useTeam } from '../hooks/useTeam'
import { useTeamPreferences } from '../hooks/usePreferences'
import { useCanEdit } from '../hooks/usePermissions'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import type { Player } from '../types'
import { useNavigate } from '@tanstack/react-router'
import { LineupPlanner } from './games/lineups/LineupPlanner'
import { StaffManagement } from './management/StaffManagement'
import { 
  useFormations, 
  useCreateFormation, 
  useUpdateFormation, 
  useDeleteFormation 
} from '../hooks/useFormations'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@blinkdotnew/ui'

const playerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  number: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
})

type PlayerFormData = z.infer<typeof playerSchema>

const POSITIONS = ['Goalie', 'Defense', 'Forward', 'Center', 'Left Wing', 'Right Wing']

export default function RosterPage() {
  const { data: teamData } = useTeam()
  const [teamPrefs] = useTeamPreferences(teamData?.team?.id)
  const { data: players = [], isLoading: playersLoading } = usePlayers()
  const { data: formations = [], isLoading: formationsLoading } = useFormations()
  
  const createPlayer = useCreatePlayer()
  const updatePlayer = useUpdatePlayer()
  const deletePlayer = useDeletePlayer()
  
  const createFormation = useCreateFormation()
  const updateFormation = useUpdateFormation()
  const deleteFormation = useDeleteFormation()
  
  const canEdit = useCanEdit()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Player | null>(null)
  const [activeTab, setActiveTab] = useState('players')
  
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null)
  const [plannerOpen, setPlannerOpen] = useState(false)
  const [formationDialogOpen, setFormationDialogOpen] = useState(false)
  const [formationEditName, setFormationName] = useState('')
  const [formationEditId, setFormationEditId] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
  })

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.number?.includes(searchQuery) ||
    p.position?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    if (formations.length > 0 && !selectedFormationId) {
      setSelectedFormationId(formations[0].id)
    }
  }, [formations, selectedFormationId])

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

  const handleOpenPlanner = (id: string) => {
    setSelectedFormationId(id)
    setPlannerOpen(true)
  }

  const handleOpenAddFormation = () => {
    setFormationEditId(null)
    setFormationName('')
    setFormationDialogOpen(true)
  }

  const handleOpenEditFormation = (f: any) => {
    setFormationEditId(f.id)
    setFormationName(f.name)
    setFormationDialogOpen(true)
  }

  const onFormationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formationEditName.trim()) return
    try {
      if (formationEditId) {
        await updateFormation.mutateAsync({ id: formationEditId, name: formationEditName })
        toast.success('Formation renamed')
      } else {
        const newF = await createFormation.mutateAsync(formationEditName)
        setSelectedFormationId(newF.id)
        toast.success('Formation created')
      }
      setFormationDialogOpen(false)
    } catch (err: any) {
      toast.error('Failed to save formation')
    }
  }

  if (playersLoading || formationsLoading) return <div className="p-8">Loading roster...</div>

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Team Management
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage your roster and plan your default season lines.
          </p>
        </div>
        {activeTab === 'players' && canEdit && (
          <Button onClick={handleOpenAdd} className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 rounded-full">
            <UserPlus className="w-4 h-4" />
            Add Player
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary/10 p-1 rounded-full border border-white/5 mb-8">
          <TabsTrigger value="players" className="rounded-full gap-2 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="lineups" className="rounded-full gap-2 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <LayoutList className="w-4 h-4" />
            Lineup Planner
          </TabsTrigger>
          <TabsTrigger value="staff" className="rounded-full gap-2 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <UserCog className="w-4 h-4" />
            Coaching Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-8 mt-0">
          <Card className="border-border/50 bg-sidebar/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, number, or position..."
                  className="pl-10 rounded-full"
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
                    <Card key={player.id} className="border-border/40 bg-secondary/10 hover:border-primary/30 transition-colors group rounded-[2rem] overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0 border border-primary/20">
                              {player.number || '—'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{player.name}</p>
                              <Badge variant="secondary" className="mt-1 text-[10px] uppercase tracking-wider font-bold rounded-full">
                                {player.position || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                                onClick={() => handleOpenEdit(player)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
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
        </TabsContent>

        <TabsContent value="lineups" className="mt-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Tactical Blueprints</h3>
                <p className="text-xs text-muted-foreground">Reusable line combinations for your season.</p>
              </div>
              {canEdit && (
                <Button onClick={handleOpenAddFormation} className="gap-2 rounded-full shadow-lg shadow-primary/10">
                  <Plus className="w-4 h-4" />
                  New Blueprint
                </Button>
              )}
            </div>

            {formations.length === 0 ? (
              <Card className="border-border/50 bg-sidebar/30 backdrop-blur-sm rounded-[2rem] h-[300px] flex items-center justify-center">
                <EmptyState 
                  icon={<LayoutGrid />} 
                  title="No Blueprints Yet" 
                  description="Create your first tactical formation to start planning your lines."
                  action={canEdit ? { label: 'Create First Blueprint', onClick: handleOpenAddFormation } : undefined}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formations.map(f => (
                  <Card 
                    key={f.id} 
                    className="border-border/40 bg-sidebar/30 hover:border-primary/40 transition-all group rounded-[2rem] overflow-hidden cursor-pointer relative"
                    onClick={() => handleOpenPlanner(f.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <LayoutGrid className="w-6 h-6" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEditFormation(f); }}>
                              <Pencil className="w-3 h-3 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400" onClick={(e) => { e.stopPropagation(); deleteFormation.mutate(f.id); }}>
                              <Trash2 className="w-3 h-3 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-lg uppercase tracking-tight truncate group-hover:text-primary transition-colors">{f.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Activity className="w-3 h-3 text-primary/60" />
                          Active Template
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full text-[10px] font-black uppercase tracking-widest h-8 px-4 bg-primary/5 hover:bg-primary hover:text-primary-foreground"
                        >
                          Launch Builder
                        </Button>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Sheet open={plannerOpen} onOpenChange={setPlannerOpen}>
            <SheetContent 
              side="right" 
              className="w-full sm:max-w-none h-full p-0 border-none bg-zinc-950 flex flex-col"
            >
              <div className="sr-only">
                <SheetHeader>
                  <SheetTitle>Lineup Planner Builder</SheetTitle>
                </SheetHeader>
              </div>
              <div className="h-full flex flex-col min-h-0">
                <div className="shrink-0 h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-xl z-50">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPlannerOpen(false)}
                      className="rounded-full h-10 w-10 p-0 text-zinc-400 hover:text-white"
                    >
                      <ChevronRight className="w-6 h-6 rotate-180" />
                    </Button>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-white italic">
                        {formations.find(f => f.id === selectedFormationId)?.name || 'Formation Builder'}
                      </h2>
                      <p className="text-[10px] font-bold text-primary/60 uppercase tracking-tighter">Tactical Blueprint Studio</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  {selectedFormationId && (
                    <LineupPlanner formationId={selectedFormationId} />
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </TabsContent>

        <TabsContent value="staff" className="mt-0">
          <StaffManagement />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Player' : 'Add Player'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <Input {...register('name')} placeholder="e.g. Connor McDavid" className="rounded-full" />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  Jersey #
                </FieldLabel>
                <Input {...register('number')} placeholder="97" className="rounded-full" />
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
                  <SelectTrigger className="rounded-full">
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
              <Input {...register('notes')} placeholder="Handedness, line, style..." className="rounded-full" />
            </Field>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={createPlayer.isPending || updatePlayer.isPending} className="rounded-full">
                {editTarget ? 'Save Changes' : 'Add Player'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={formationDialogOpen} onOpenChange={setFormationDialogOpen}>
        <DialogContent className="max-w-sm rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>{formationEditId ? 'Rename Formation' : 'New Formation'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onFormationSubmit} className="space-y-4 pt-4">
            <Field>
              <FieldLabel>Formation Name</FieldLabel>
              <Input 
                value={formationEditName} 
                onChange={e => setFormationName(e.target.value)} 
                placeholder="e.g. Standard, Defensive, PP Lines..." 
                className="rounded-full"
                autoFocus
              />
            </Field>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setFormationDialogOpen(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={createFormation.isPending || updateFormation.isPending} className="rounded-full">
                {formationEditId ? 'Rename' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
