import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Button, Badge, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Textarea,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Field, FieldLabel, FieldError,
  Tabs, TabsList, TabsTrigger, TabsContent,
  EmptyState, toast, Separator,
} from '@blinkdotnew/ui'
import { Plus, Copy, Eye, Calendar, ClipboardList } from 'lucide-react'
import { blink } from '@/blink/client'
import { usePractices, usePracticeSegments } from '@/hooks/usePractices'
import { useTeam } from '@/hooks/useTeam'
import { cn } from '@/lib/utils'
import type { Practice } from '@/types'

// ── Schema ─────────────────────────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'completed', 'reviewed']),
})
type CreateForm = z.infer<typeof createSchema>

// ── Status helpers ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Practice['status'] }) {
  if (status === 'draft') return <Badge variant="secondary" className="rounded-full">Draft</Badge>
  if (status === 'scheduled') return <Badge variant="outline" className="text-primary border-primary/30 rounded-full">Scheduled</Badge>
  if (status === 'completed') return <Badge className="bg-primary text-primary-foreground rounded-full">Completed</Badge>
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border rounded-full">Reviewed</Badge>
}

// ── Segment concepts preview ────────────────────────────────────────────────────
function PracticeConceptChips({ practiceId }: { practiceId: string }) {
  const { data: segments = [] } = usePracticeSegments(practiceId)
  const concepts = [...new Set(segments.map(s => s.primaryConcept))].slice(0, 4)
  if (!concepts.length) return null
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {concepts.map(c => (
        <Badge key={c} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">{c}</Badge>
      ))}
    </div>
  )
}

// ── Practice card ───────────────────────────────────────────────────────────────
function PracticeCard({ practice, onDuplicate }: { practice: Practice; onDuplicate: (p: Practice) => void }) {
  const navigate = useNavigate()
  const dateStr = practice.date
    ? format(new Date(practice.date + 'T00:00:00'), 'MMM d, yyyy')
    : '—'

  return (
    <Card
      className="border-border bg-card hover:border-border/80 transition-all duration-200 group cursor-pointer rounded-[2rem]"
      onClick={() => navigate({ to: '/practices/$practiceId', params: { practiceId: practice.id } })}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={practice.status} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />{dateStr}
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground truncate leading-snug">
              {practice.title}
            </h3>
            {practice.notes && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{practice.notes}</p>
            )}
            <PracticeConceptChips practiceId={practice.id} />
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 hidden md:flex rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: '/practices/$practiceId', params: { practiceId: practice.id } })
              }}
            >
              <Eye className="w-3.5 h-3.5" /> View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 text-muted-foreground rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(practice)
              }}
            >
              <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Duplicate</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Create dialog ───────────────────────────────────────────────────────────────
function CreatePracticeDialog({
  open,
  onClose,
  seasonId,
}: { open: boolean; onClose: () => void; seasonId: string }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { status: 'scheduled', title: '', date: '', notes: '' },
  })

  const statusVal = watch('status')

  const mutation = useMutation({
    mutationFn: async (data: CreateForm) => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      await blink.db.practices.create({
        id: crypto.randomUUID(),
        seasonId,
        userId: user.id,
        title: data.title,
        date: data.date,
        notes: data.notes ?? '',
        status: data.status,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practices'] })
      toast.success('Practice created')
      reset()
      onClose()
    },
    onError: (e: Error) => toast.error('Failed to create practice', { description: e.message }),
  })

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>New Practice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 pt-2">
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input {...register('title')} placeholder="e.g. Thursday Ice Session" className="rounded-full" />
            {errors.title && <FieldError>{errors.title.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Date</FieldLabel>
            <Input type="date" {...register('date')} className="rounded-full" />
            {errors.date && <FieldError>{errors.date.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select value={statusVal} onValueChange={v => setValue('status', v as CreateForm['status'])}>
              <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Notes <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
            <Textarea {...register('notes')} placeholder="Focus areas, reminders…" rows={3} className="rounded-[2rem]" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="rounded-full">
              {mutation.isPending ? 'Creating…' : 'Create Practice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────────
const TABS = ['all', 'scheduled', 'completed', 'reviewed'] as const
type TabValue = typeof TABS[number]

export default function PracticesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [tab, setTab] = useState<TabValue>('all')
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const { data: practices = [], isLoading } = usePractices()

  const seasonId = teamData?.season?.id ?? ''

  const filtered = tab === 'all' ? practices : practices.filter(p => p.status === tab)

  const duplicate = useMutation({
    mutationFn: async (practice: Practice) => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      const newId = crypto.randomUUID()
      await blink.db.practices.create({
        id: newId,
        seasonId: practice.seasonId,
        userId: user.id,
        title: `Copy of ${practice.title}`,
        date: practice.date,
        notes: practice.notes ?? '',
        status: 'draft',
        createdAt: new Date().toISOString(),
      })
      const segments = await blink.db.practiceSegments.list({ where: { practiceId: practice.id } })
      await Promise.all(segments.map((s: any) =>
        blink.db.practiceSegments.create({
          id: crypto.randomUUID(),
          practiceId: newId,
          userId: user.id,
          type: s.type,
          name: s.name ?? '',
          primaryConcept: s.primaryConcept,
          secondaryConcept: s.secondaryConcept ?? '',
          notes: s.notes ?? '',
          link: s.link ?? '',
          understandingRating: s.understandingRating,
          executionRating: s.executionRating,
          transferRating: s.transferRating,
          createdAt: new Date().toISOString(),
        })
      ))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practices'] })
      toast.success('Practice duplicated')
    },
    onError: (e: Error) => toast.error('Failed to duplicate', { description: e.message }),
  })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practices</h1>
          <p className="text-muted-foreground text-sm mt-1">{teamData?.season?.name ?? ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!seasonId} className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto rounded-full">
          <Plus className="w-4 h-4" /> New Practice
        </Button>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as TabValue)}>
        <TabsList className="bg-secondary/50 border border-border w-full justify-start h-auto p-1 overflow-x-auto overflow-y-hidden flex-nowrap no-scrollbar rounded-full">
          <TabsTrigger value="all" className="flex-1 sm:flex-none rounded-full">All</TabsTrigger>
          <TabsTrigger value="scheduled" className="flex-1 sm:flex-none rounded-full">Scheduled</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 sm:flex-none rounded-full">Completed</TabsTrigger>
          <TabsTrigger value="reviewed" className="flex-1 sm:flex-none rounded-full">Reviewed</TabsTrigger>
        </TabsList>

        {TABS.map(t => (
          <TabsContent key={t} value={t} className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn("h-20 rounded-[2rem] bg-card border border-border animate-pulse", i > 0 && "opacity-60")} />
              ))
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<ClipboardList />}
                title="No practices yet"
                description={t === 'all' ? 'Create your first practice to get started.' : `No ${t} practices.`}
                action={t === 'all' ? { label: 'New Practice', onClick: () => setCreateOpen(true) } : undefined}
              />
            ) : (
              filtered.map(p => (
                <PracticeCard key={p.id} practice={p} onDuplicate={p => duplicate.mutate(p)} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreatePracticeDialog open={createOpen} onClose={() => setCreateOpen(false)} seasonId={seasonId} />
    </div>
  )
}
