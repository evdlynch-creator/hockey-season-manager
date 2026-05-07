import { Card, CardHeader, CardTitle, CardContent, Textarea, Field, FieldLabel, Button, Badge } from '@blinkdotnew/ui'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONCEPT_FIELDS } from '@/pages/games/schema'
import { PostGameReportGenerator } from '@/components/coaching/PostGameReportGenerator'

interface RatingRowProps {
  label: string
  value?: number
  consensusValue?: number
  onChange: (v: number) => void
}

function RatingRow({ label, value, consensusValue, onChange }: RatingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {consensusValue !== undefined && consensusValue !== value && (
          <span className="text-[10px] text-primary/60 font-bold uppercase tracking-tight">
            Staff Consensus: {consensusValue.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'w-8 h-8 rounded-full text-xs font-bold transition-all',
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

interface GameReviewPanelProps {
  game: any
  review: any
  consensus?: any
  allReviews?: any[]
  ratings: Record<string, number | undefined>
  onRatingChange: (key: string, value: number) => void
  notes: string
  setNotes: (v: string) => void
  opponentNotes: string
  setOpponentNotes: (v: string) => void
  onSave: () => void
  isSaving: boolean
  onSaveReport: (summary: string) => void
}

export function GameReviewPanel({
  game,
  review,
  consensus,
  allReviews = [],
  ratings,
  onRatingChange,
  notes,
  setNotes,
  opponentNotes,
  setOpponentNotes,
  onSave,
  isSaving,
  onSaveReport
}: GameReviewPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Tactical Assessment</CardTitle>
                  <p className="text-xs text-muted-foreground">My personal ratings.</p>
                </div>
                {consensus?.count > 1 && (
                  <Badge variant="outline" className="h-5 rounded-full text-[9px] bg-primary/10 text-primary border-primary/20">
                    {consensus.count} Coaches
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-1 divide-y divide-border">
              {CONCEPT_FIELDS.map(({ key, label }) => (
                <RatingRow
                  key={key}
                  label={label}
                  value={ratings[key]}
                  consensusValue={consensus?.[key]}
                  onChange={v => onRatingChange(key, v)}
                />
              ))}
            </CardContent>
          </Card>

          {allReviews.length > 1 && (
            <Card className="border-border bg-card/50 rounded-[2rem] overflow-hidden">
              <CardHeader className="py-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Other Submissions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {allReviews.filter(r => r.userId !== review?.userId).map((r: any) => (
                    <div key={r.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300">{r.userDisplayName || 'Assistant Coach'}</span>
                        <span className="text-[10px] text-zinc-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.notes && (
                        <p className="text-[11px] text-muted-foreground italic line-clamp-2">"{r.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Coaching Journal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field>
                <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Our Performance</FieldLabel>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What worked? What needs work?" rows={5} className="rounded-[1.5rem] bg-white/[0.02] italic" />
              </Field>
              <Field>
                <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Opponent Intel <span className="text-muted-foreground lowercase font-normal italic">(for rematch prep)</span></FieldLabel>
                <Textarea value={opponentNotes} onChange={e => setOpponentNotes(e.target.value)} placeholder="Their tendencies, key players, strategies..." rows={5} className="rounded-[1.5rem] bg-white/[0.02] italic" />
              </Field>
              <div className="flex justify-end">
                <Button onClick={onSave} disabled={isSaving} className="gap-2 shadow-lg shadow-primary/20 rounded-full px-8 font-black uppercase italic tracking-tighter text-[10px]">
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving…' : 'Save Tactical Journal'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(game.status === 'completed' || game.status === 'reviewed') && (
            <PostGameReportGenerator
              game={game}
              review={review}
              onSave={onSaveReport}
            />
          )}
        </div>
      </div>
    </div>
  )
}
