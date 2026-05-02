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
import { Library, Plus, Trash2, Pencil, Search, BookOpen, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { useDrills, useCreateDrill, useUpdateDrill, useDeleteDrill } from '../hooks/useDrills'
import { useTeam } from '../hooks/useTeam'
import { useTeamPreferences } from '../hooks/usePreferences'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { CONCEPTS, SEGMENT_TYPES, Drill } from '../types'

const drillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(SEGMENT_TYPES),
  primaryConcept: z.string().min(1, 'Primary concept is required'),
  secondaryConcept: z.string().optional(),
  notes: z.string().optional(),
  fileUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  link: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
})

type DrillFormData = z.infer<typeof drillSchema>

export default function DrillLibraryPage() {
  const { data: teamData } = useTeam()
  const [teamPrefs] = useTeamPreferences(teamData?.team?.id)
  const { data: drills = [], isLoading } = useDrills()
  const createDrill = useCreateDrill()
  const updateDrill = useUpdateDrill()
  const deleteDrill = useDeleteDrill()

  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Drill | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DrillFormData>({
    resolver: zodResolver(drillSchema),
  })

  const typeVal = watch('type')
  const primaryVal = watch('primaryConcept')
  const secondaryVal = watch('secondaryConcept')

  const filteredDrills = drills.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.primaryConcept.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenAdd = () => {
    setEditTarget(null)
    reset({ name: '', type: 'Skill', primaryConcept: '', secondaryConcept: '', notes: '', fileUrl: '', link: '' })
    setDialogOpen(true)
  }

  const handleOpenEdit = (drill: Drill) => {
    setEditTarget(drill)
    reset({ 
      name: drill.name, 
      type: drill.type, 
      primaryConcept: drill.primaryConcept, 
      secondaryConcept: drill.secondaryConcept || '', 
      notes: drill.notes || '',
      fileUrl: drill.fileUrl || '',
      link: drill.link || ''
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: DrillFormData) => {
    try {
      if (editTarget) {
        await updateDrill.mutateAsync({ id: editTarget.id, ...data })
        toast.success('Drill updated')
      } else {
        await createDrill.mutateAsync(data)
        toast.success('Drill added to library')
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast.error('Failed to save drill', { description: err.message })
    }
  }

  if (isLoading) return <div className="p-8">Loading drill library...</div>

  if (!teamPrefs.enableAttendance) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <EmptyState
          icon={<Library className="w-12 h-12 text-muted-foreground/40" />}
          title="Drill Library Disabled"
          description="The Drill Library is currently disabled. You can enable it by turning on 'Player Participation Tracking' in team settings."
          action={{ label: 'Go to Settings', onClick: () => window.location.hash = '#/settings' }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Library className="w-8 h-8 text-primary" />
            Drill Library
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Save and organize your favorite drills to reuse in practice plans.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 w-full sm:w-auto shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Add Drill
        </Button>
      </div>

      <Card className="border-border/50 bg-sidebar/30 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, concept, or notes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredDrills.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title={searchQuery ? "No drills match your search" : "Your library is empty"}
              description={searchQuery ? "Try a different search term." : "Start building your personal coaching library."}
              action={!searchQuery ? { label: 'Add First Drill', onClick: handleOpenAdd } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrills.map((drill) => (
                <Card key={drill.id} className="border-border/40 bg-card hover:border-primary/30 transition-all group overflow-hidden flex flex-col">
                  {drill.fileUrl && (
                    <div className="h-40 overflow-hidden border-b border-border/50 bg-secondary/10 relative">
                      <img 
                        src={drill.fileUrl} 
                        alt={drill.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Badge className="bg-black/60 backdrop-blur-md border-white/20 text-[10px] uppercase">{drill.type}</Badge>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4 flex-1 flex flex-col">
                    {!drill.fileUrl && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{drill.type}</Badge>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-foreground truncate leading-snug">{drill.name}</h3>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(drill)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteDrill.mutate(drill.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <Badge className="bg-primary/10 text-primary border-primary/20 border text-[10px]">{drill.primaryConcept}</Badge>
                      {drill.secondaryConcept && (
                        <Badge variant="secondary" className="text-[10px]">{drill.secondaryConcept}</Badge>
                      )}
                    </div>

                    {drill.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {drill.notes}
                      </p>
                    )}

                    {drill.link && (
                      <div className="pt-3 border-t border-border/40 mt-auto">
                        <a 
                          href={drill.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold uppercase tracking-wider"
                        >
                          <ExternalLink className="w-3 h-3" /> View Source
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Drill' : 'Add Drill to Library'}</DialogTitle>
            <DialogDescription>Fill out the details below to save this drill for future practice plans.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <Field>
              <FieldLabel>Drill Name</FieldLabel>
              <Input {...register('name')} placeholder="e.g. D-to-D Controlled Breakout" />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Segment Type</FieldLabel>
                <Select value={typeVal} onValueChange={(v) => setValue('type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Primary Concept</FieldLabel>
                <Select value={primaryVal} onValueChange={(v) => setValue('primaryConcept', v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CONCEPTS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Secondary Concept (optional)</FieldLabel>
                <Select value={secondaryVal} onValueChange={(v) => setValue('secondaryConcept', v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {CONCEPTS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Source Link (YouTube/Web)</FieldLabel>
                <Input {...register('link')} placeholder="https://..." />
                {errors.link && <FieldError>{errors.link.message}</FieldError>}
              </Field>
            </div>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                Image URL (Diagram/Sketch)
              </FieldLabel>
              <Input {...register('fileUrl')} placeholder="https://images.unsplash.com/..." />
              {errors.fileUrl && <FieldError>{errors.fileUrl.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Coaching Notes</FieldLabel>
              <textarea 
                {...register('notes')} 
                rows={3}
                placeholder="Key teaching points, common mistakes, variations..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </Field>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDrill.isPending || updateDrill.isPending}>
                {editTarget ? 'Save Changes' : 'Add to Library'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
