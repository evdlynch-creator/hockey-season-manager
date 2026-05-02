import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Button, Badge, Card, CardHeader, CardContent,
  EmptyState, toast, Separator,
} from '@blinkdotnew/ui'
import {
  ArrowLeft, Plus, Pencil, Trash2, CheckCircle, ClipboardList, BookOpen,
} from 'lucide-react'
import { blink } from '@/blink/client'
import { usePractice, usePracticeSegments } from '@/hooks/usePractices'
import { usePlayers } from '@/hooks/usePlayers'
import { useTeam } from '@/hooks/useTeam'
import { useTeamPreferences } from '@/hooks/usePreferences'
import { SegmentDialog } from './SegmentDialog'
import type { SegmentFormData } from './SegmentDialog'
import { SegmentCard } from '@/components/practices/SegmentCard'
import { AttendanceTable } from '@/components/practices/AttendanceTable'
import { DrillPicker } from '@/components/practices/DrillPicker'
import { cn } from '@/lib/utils'
import type { PracticeSegment } from '@/types'

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'draft') return <Badge variant="secondary">Draft</Badge>
  if (status === 'scheduled') return <Badge variant="outline" className="text-primary border-primary/30">Scheduled</Badge>
  if (status === 'completed') return <Badge className="bg-primary text-primary-foreground">Completed</Badge>
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border">Reviewed</Badge>
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PracticeDetailPage() {
  const { practiceId } = useParams({ from: '/practices/$practiceId' })
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PracticeSegment | null>(null)
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})

  const { data: teamData } = useTeam()
  const [teamPrefs] = useTeamPreferences(teamData?.team?.id)
  const { data: practice, isLoading: practiceLoading } = usePractice(practiceId)
  const { data: segments = [], isLoading: segsLoading } = usePracticeSegments(practiceId)
  const { data: players = [] } = usePlayers()

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
        const user = await blink.auth.me()
        if (!user) throw new Error('Not authenticated')

        await blink.db.practiceSegments.create({
          id: crypto.randomUUID(),
          practiceId,
          userId: user.id,
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

  const toggleAttendance = (playerId: string) => {
    setAttendance(prev => ({ ...prev, [playerId]: !prev[playerId] }))
  }

  if (practiceLoading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-card rounded-md" />
        <div className="h-4 w-32 bg-card rounded-md" />
        <div className="h-32 bg-card rounded-lg" />
      </div>
    )
  }

  if (!practice) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <EmptyState icon={<ClipboardList />} title="Practice not found" description="This practice may have been deleted." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back nav */}
      <Link to="/practices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Practices
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={practice.status} />
            <span className="text-xs text-muted-foreground">{dateStr}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{practice.title}</h1>
          {practice.notes && <p className="text-sm text-muted-foreground">{practice.notes}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {practice.status === 'draft' || practice.status === 'scheduled' ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 flex-1 sm:flex-none"
              onClick={() => markComplete.mutate()}
              disabled={markComplete.isPending}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Mark Complete</span>
              <span className="xs:hidden">Complete</span>
            </Button>
          ) : practice.status === 'completed' ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 flex-1 sm:flex-none"
              onClick={() => markReviewed.mutate()}
              disabled={markReviewed.isPending || segments.length === 0}
              title={segments.length === 0 ? 'Add segments with ratings first' : 'Mark as reviewed once all ratings are entered'}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Mark Reviewed</span>
              <span className="xs:hidden">Review</span>
            </Button>
          ) : null}
          <Button size="sm" className="gap-1.5 shadow-lg shadow-primary/20 flex-1 sm:flex-none" onClick={openAdd}>
            <Plus className="w-4 h-4" /> <span className="hidden xs:inline">Add Segment</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Attendance Section */}
      {teamPrefs.enableAttendance && (
        <AttendanceTable
          players={players}
          attendance={attendance}
          onToggle={toggleAttendance}
          className="print:hidden"
        />
      )}

      {/* Segments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Segments <span className="ml-1 text-foreground">{segments.length}</span>
          </h2>
          {teamPrefs.enableAttendance && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/10"
              onClick={() => setPickerOpen(true)}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Pick from Library
            </Button>
          )}
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

      <DrillPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(drill) => {
          saveSegment.mutate({
            type: drill.type,
            name: drill.name,
            primaryConcept: drill.primaryConcept,
            secondaryConcept: drill.secondaryConcept,
            notes: drill.notes,
            link: drill.link
          })
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
