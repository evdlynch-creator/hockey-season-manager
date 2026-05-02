/**
 * Reusable Add/Edit Practice Segment dialog.
 * Kept separate to stay under the 200-line limit for PracticeDetailPage.
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Field, FieldLabel, FieldError,
  Input, Textarea,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@blinkdotnew/ui'
import { CONCEPTS, SEGMENT_TYPES } from '@/types'
import type { PracticeSegment } from '@/types'

const segmentSchema = z.object({
  type: z.enum(['Skating', 'Skill', 'Systems', 'Small Area']),
  name: z.string().optional(),
  primaryConcept: z.string().min(1, 'Primary concept is required'),
  secondaryConcept: z.string().optional(),
  notes: z.string().optional(),
  link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type SegmentFormData = z.infer<typeof segmentSchema>

interface SegmentDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: SegmentFormData) => Promise<void>
  editTarget?: PracticeSegment | null
  isPending?: boolean
}

export function SegmentDialog({ open, onClose, onSubmit, editTarget, isPending }: SegmentDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      type: 'Skill',
      name: '',
      primaryConcept: '',
      secondaryConcept: '',
      notes: '',
      link: '',
    },
  })

  const typeVal = watch('type')
  const primaryVal = watch('primaryConcept')
  const secondaryVal = watch('secondaryConcept')

  // Populate form when editing
  useEffect(() => {
    if (editTarget) {
      reset({
        type: editTarget.type,
        name: editTarget.name ?? '',
        primaryConcept: editTarget.primaryConcept,
        secondaryConcept: editTarget.secondaryConcept ?? '',
        notes: editTarget.notes ?? '',
        link: editTarget.link ?? '',
      })
    } else {
      reset({ type: 'Skill', name: '', primaryConcept: '', secondaryConcept: '', notes: '', link: '' })
    }
  }, [editTarget, open, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFormSubmit = async (data: SegmentFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>{editTarget ? 'Edit Segment' : 'Add Segment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <Field>
            <FieldLabel>Drill Name <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
            <Input {...register('name')} placeholder="e.g. 2-on-1 Rush, Neutral Zone Regroup…" autoFocus className="rounded-full" />
          </Field>

          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select value={typeVal} onValueChange={v => setValue('type', v as SegmentFormData['type'])}>
              <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEGMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.type && <FieldError>{errors.type.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Primary Concept</FieldLabel>
            <Select value={primaryVal} onValueChange={v => setValue('primaryConcept', v, { shouldValidate: true })}>
              <SelectTrigger className="rounded-full"><SelectValue placeholder="Select concept…" /></SelectTrigger>
              <SelectContent>
                {CONCEPTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.primaryConcept && <FieldError>{errors.primaryConcept.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Secondary Concept <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
            <Select
              value={secondaryVal || '__none__'}
              onValueChange={v => setValue('secondaryConcept', v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="rounded-full"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {CONCEPTS.filter(c => c !== primaryVal).map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Notes <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
            <Textarea {...register('notes')} placeholder="Drill details, cues, coaching points…" rows={3} className="rounded-[2rem]" />
          </Field>

          <Field>
            <FieldLabel>Link <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
            <Input {...register('link')} placeholder="https://…" className="rounded-full" />
            {errors.link && <FieldError>{errors.link.message}</FieldError>}
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={isPending} className="rounded-full">
              {isPending ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Segment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
