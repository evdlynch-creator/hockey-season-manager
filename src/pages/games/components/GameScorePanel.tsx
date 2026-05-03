import { Card, CardHeader, CardTitle, CardContent, Input, Field, FieldLabel, Button } from '@blinkdotnew/ui'
import { CheckCircle } from 'lucide-react'

interface GameScorePanelProps {
  goalsFor: string
  setGoalsFor: (v: string) => void
  goalsAgainst: string
  setGoalsAgainst: (v: string) => void
  shotsFor: string
  setShotsFor: (v: string) => void
  shotsAgainst: string
  setShotsAgainst: (v: string) => void
  penalties: string
  setPenalties: (v: string) => void
  onSave: () => void
  isSaving: boolean
}

export function GameScorePanel({
  goalsFor,
  setGoalsFor,
  goalsAgainst,
  setGoalsAgainst,
  shotsFor,
  setShotsFor,
  shotsAgainst,
  setShotsAgainst,
  penalties,
  setPenalties,
  onSave,
  isSaving
}: GameScorePanelProps) {
  return (
    <Card className="border-border bg-card rounded-[2rem] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Game Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Field>
            <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Goals For</FieldLabel>
            <Input type="number" min="0" value={goalsFor} onChange={e => setGoalsFor(e.target.value)} placeholder="0" className="rounded-2xl h-12 text-xl font-black italic" />
          </Field>
          <Field>
            <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Goals Against</FieldLabel>
            <Input type="number" min="0" value={goalsAgainst} onChange={e => setGoalsAgainst(e.target.value)} placeholder="0" className="rounded-2xl h-12 text-xl font-black italic" />
          </Field>
          <Field>
            <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Shots For</FieldLabel>
            <Input type="number" min="0" value={shotsFor} onChange={e => setShotsFor(e.target.value)} placeholder="0" className="rounded-2xl h-12 text-xl font-black italic" />
          </Field>
          <Field>
            <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Shots Against</FieldLabel>
            <Input type="number" min="0" value={shotsAgainst} onChange={e => setShotsAgainst(e.target.value)} placeholder="0" className="rounded-2xl h-12 text-xl font-black italic" />
          </Field>
        </div>
        
        <Field>
          <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Penalties / Discipline</FieldLabel>
          <Input value={penalties} onChange={e => setPenalties(e.target.value)} placeholder="e.g. 4 minor · 2 major" className="rounded-2xl" />
        </Field>

        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={isSaving} className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20 font-bold uppercase italic tracking-tighter">
            <CheckCircle className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Scoreboard'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
