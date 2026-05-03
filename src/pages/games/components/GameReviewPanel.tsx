import { Card, CardHeader, CardTitle, CardContent, Textarea, Field, FieldLabel, Button } from '@blinkdotnew/ui'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONCEPT_FIELDS } from '@/pages/games/schema'
import { PostGameReportGenerator } from '@/components/coaching/PostGameReportGenerator'

interface RatingRowProps {
  label: string
  value?: number
  onChange: (v: number) => void
}

function RatingRow({ label, value, onChange }: RatingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
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
        <div className="lg:col-span-1">
          <Card className="border-border bg-card rounded-[2rem] overflow-hidden h-full">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Tactical Assessment</CardTitle>
              <p className="text-xs text-muted-foreground">Rate performance across core concepts.</p>
            </CardHeader>
            <CardContent className="space-y-1 divide-y divide-border">
              {CONCEPT_FIELDS.map(({ key, label }) => (
                <RatingRow
                  key={key}
                  label={label}
                  value={ratings[key]}
                  onChange={v => onRatingChange(key, v)}
                />
              ))}
            </CardContent>
          </Card>
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
