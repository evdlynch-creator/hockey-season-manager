import { useQueryClient } from '@tanstack/react-query'
import {
  Button, Badge, Card, CardHeader, CardContent, Tooltip, TooltipTrigger, TooltipContent
} from '@blinkdotnew/ui'
import { Pencil, Trash2, Users } from 'lucide-react'
import { blink } from '@/blink/client'
import { cn } from '@/lib/utils'
import { usePracticeRatings } from '@/hooks/usePractices'
import type { PracticeSegment } from '@/types'

// ── Rating field ───────────────────────────────────────────────────────────────
function RatingField({ 
  label, 
  value, 
  consensusValue,
  onChange 
}: { 
  label: string; 
  value?: number; 
  consensusValue?: number;
  onChange: (v: number) => void 
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">{label}</p>
      {consensusValue !== undefined && consensusValue !== value && (
        <p className="text-[8px] font-black uppercase text-primary/60 mb-1 leading-none">Consensus: {consensusValue.toFixed(1)}</p>
      )}
      <div className="flex gap-0.5 justify-center">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'w-7 h-7 rounded-full text-xs font-bold transition-all',
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

interface SegmentCardProps {
  segment: PracticeSegment
  practiceId: string
  onEdit: (s: PracticeSegment) => void
  onDelete: (id: string) => void
}

export function SegmentCard({
  segment,
  practiceId,
  onEdit,
  onDelete,
}: SegmentCardProps) {
  const { myRating, consensus, saveRating, isSaving } = usePracticeRatings(segment.id)

  const handleRatingChange = (field: string, value: number) => {
    saveRating({ [field]: value })
  }

  return (
    <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
      <CardHeader className="flex-row items-start justify-between pb-2 pt-4 px-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {segment.name && (
              <h3 className="text-sm font-semibold text-foreground leading-snug break-words">
                {segment.name}
              </h3>
            )}
            {consensus && consensus.count > 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="h-5 rounded-full px-1.5 text-[9px] bg-primary/5 text-primary border-primary/20 gap-1">
                    <Users className="w-3 h-3" /> {consensus.count}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[10px] font-bold">Consensus across {consensus.count} coaches</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-medium rounded-full">{segment.type}</Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 border rounded-full">{segment.primaryConcept}</Badge>
            {segment.secondaryConcept && <Badge variant="secondary" className="rounded-full">{segment.secondaryConcept}</Badge>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0 ml-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full" onClick={() => onEdit(segment)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-full" onClick={() => onDelete(segment.id)}>
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
          <RatingField 
            label="Understanding" 
            value={myRating?.understandingRating ?? segment.understandingRating} 
            consensusValue={consensus?.understandingRating}
            onChange={v => handleRatingChange('understandingRating', v)} 
          />
          <RatingField 
            label="Execution" 
            value={myRating?.executionRating ?? segment.executionRating} 
            consensusValue={consensus?.executionRating}
            onChange={v => handleRatingChange('executionRating', v)} 
          />
          <RatingField 
            label="Game Transfer" 
            value={myRating?.transferRating ?? segment.transferRating} 
            consensusValue={consensus?.transferRating}
            onChange={v => handleRatingChange('transferRating', v)} 
          />
        </div>
      </CardContent>
    </Card>
  )
}
