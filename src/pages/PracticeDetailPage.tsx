import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Button, Badge, Card, CardHeader, CardContent,
  EmptyState, toast, Separator,
} from '@blinkdotnew/ui'
import {
  ArrowLeft, Plus, Pencil, Trash2, CheckCircle, ClipboardList,
} from 'lucide-react'
import { blink } from '@/blink/client'
import { usePractice, usePracticeSegments } from '@/hooks/usePractices'
import { SegmentDialog } from './SegmentDialog'
import type { SegmentFormData } from './SegmentDialog'
import { cn } from '@/lib/utils'
import type { PracticeSegment } from '@/types'

// ── Rating field ───────────────────────────────────────────────────────────────
function RatingField({ label, value, onChange }: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1.5">{label}</p>
      <div className="flex gap-0.5 justify-center">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'w-7 h-7 rounded text-xs font-bold transition-all',
              (value ?? 0) >= n
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'draft') return <Badge variant="secondary">Draft</Badge>
  if (status === 'scheduled') return <Badge variant="outline" className="text-primary border-primary/30">Scheduled</Badge>
  if (status === 'completed') return <Badge className="bg-primary text-primary-foreground">Completed</Badge>
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border">Reviewed</Badge>
}

// ── Segment card ───────────────────────────────────────────────────────────────
function SegmentCard({
  segment,
  practiceId,
  onEdit,
  onDelete,
}: { segment: PracticeSegment; practiceId: string; onEdit: (s: PracticeSegment) => void; onDelete: (id: string) => void }) {
  const queryClient = useQueryClient()

  const updateRating = async (field: 'understandingRating' | 'executionRating' | 'transferRating', value: number) => {
    await blink.db.practiceSegments.update(segment.id, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['practice-segments', practiceId] })
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex-row items-start justify-between pb-2 pt-4 px-4">
        <div className="flex-1 min-w-0">
          {segment.name && (
            <h3 className="text-sm font-semibold text-foreground leading-snug mb-2 break-words">
              {segment.name}
            </h3>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-medium">{segment.type}</Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 border">{segment.primaryConcept}</Badge>
            {segment.secondaryConcept && <Badge variant="secondary">{segment.secondaryConcept}</Badge>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0 ml-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(segment)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(segment.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {segment.fileUrl && (
          <div className="mb-4 -mx-4 -mt-2 overflow-hidden border-b border-border/50">
            <img 
              src={segment.fileUrl} 
              alt={segment.name || 'Segment drill'} 
              className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        {segment.notes && <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{segment.notes}</p>}
        {segment.link && (
          <a href={segment.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block mb-3 truncate">
            {segment.link}
          </a>
        )}
        <div className="grid grid-cols-3 gap-4 pt-1">
          <RatingField label="Understanding" value={segment.understandingRating} onChange={v => updateRating('understandingRating', v)} />
          <RatingField label="Execution" value={segment.executionRating} onChange={v => updateRating('executionRating', v)} />
          <RatingField label="Game Transfer" value={segment.transferRating} onChange={v => updateRating('transferRating', v)} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PracticeDetailPage() {
  const { practiceId } = useParams({ from: '/practices/$practiceId' })
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PracticeSegment | null>(null)

  const { data: practice, isLoading: practiceLoading } = usePractice(practiceId)
  const { data: segments = [], isLoading: segsLoading } = usePracticeSegments(practiceId)

  const dateStr = practice?.date
    ? format(new Date(practice.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
    : '—'

  // Mark complete
  const markComplete = useMutation({
    mutationFn: () => blink.db.practices.update(practiceId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice', practiceId] })
      queryClient.invalidateQueries({ queryKey: ['practices'] })
      toast.success('Marked as completed')
    },
  })

  // Mark reviewed (after ratings entered)
  const markReviewed = useMutation({
    mutationFn: () => blink.db.practices.update(practiceId, { status: 'reviewed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice', practiceId] })
      queryClient.invalidateQueries({ queryKey: ['practices'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      toast.success('Practice marked as reviewed', { description: 'Ratings will now appear in concept trends.' })
    },
  })

  // Add / edit segment
  const saveSegment = useMutation({
    mutationFn: async (data: SegmentFormData) => {
      if (editTarget) {
        await blink.db.practiceSegments.update(editTarget.id, {
          type: data.type,
          name: data.name ?? '',
          primaryConcept: data.primaryConcept,
          secondaryConcept: data.secondaryConcept ?? '',
          notes: data.notes ?? '',
          link: data.link ?? '',
        })
      } else {
        await blink.db.practiceSegments.create({
          id: crypto.randomUUID(),
          practiceId,
          type: data.type,
          name: data.name ?? '',
          primaryConcept: data.primaryConcept,
          secondaryConcept: data.secondaryConcept ?? '',
          notes: data.notes ?? '',
          link: data.link ?? '',
          createdAt: new Date().toISOString(),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-segments', practiceId] })
      toast.success(editTarget ? 'Segment updated' : 'Segment added')
      setDialogOpen(false)
      setEditTarget(null)
    },
    onError: (e: Error) => toast.error('Failed to save segment', { description: e.message }),
  })

  // Delete segment
  const deleteSegment = useMutation({
    mutationFn: (id: string) => blink.db.practiceSegments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-segments', practiceId] })
      toast.success('Segment removed')
    },
    onError: (e: Error) => toast.error('Failed to delete', { description: e.message }),
  })

  const openAdd = () => { setEditTarget(null); setDialogOpen(true) }
  const openEdit = (s: PracticeSegment) => { setEditTarget(s); setDialogOpen(true) }

  if (practiceLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-md" />
        <div className="h-4 w-32 bg-card rounded-md" />
        <div className="h-32 bg-card rounded-lg" />
      </div>
    )
  }

  if (!practice) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <EmptyState icon={<ClipboardList />} title="Practice not found" description="This practice may have been deleted." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back nav */}
      <Link to="/practices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Practices
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={practice.status} />
            <span className="text-xs text-muted-foreground">{dateStr}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight truncate">{practice.title}</h1>
          {practice.notes && <p className="text-sm text-muted-foreground">{practice.notes}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {practice.status === 'draft' || practice.status === 'scheduled' ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => markComplete.mutate()}
              disabled={markComplete.isPending}
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </Button>
          ) : practice.status === 'completed' ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => markReviewed.mutate()}
              disabled={markReviewed.isPending || segments.length === 0}
              title={segments.length === 0 ? 'Add segments with ratings first' : 'Mark as reviewed once all ratings are entered'}
            >
              <CheckCircle className="w-4 h-4" />
              Mark Reviewed
            </Button>
          ) : null}
          <Button size="sm" className="gap-1.5 shadow-lg shadow-primary/20" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Segment
          </Button>
        </div>
      </div>

      <Separator />

      {/* Segments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Segments <span className="ml-1 text-foreground">{segments.length}</span>
          </h2>
        </div>

        {segsLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-card border border-border animate-pulse" />
          ))
        ) : segments.length === 0 ? (
          <EmptyState
            icon={<ClipboardList />}
            title="No segments yet"
            description="Break this practice into skating, skill, systems or small area segments."
            action={{ label: 'Add First Segment', onClick: openAdd }}
          />
        ) : (
          segments.map(s => (
            <SegmentCard
              key={s.id}
              segment={s}
              practiceId={practiceId}
              onEdit={openEdit}
              onDelete={id => deleteSegment.mutate(id)}
            />
          ))
        )}
      </div>

      <SegmentDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditTarget(null) }}
        onSubmit={data => saveSegment.mutateAsync(data)}
        editTarget={editTarget}
        isPending={saveSegment.isPending}
      />
    </div>
  )
}