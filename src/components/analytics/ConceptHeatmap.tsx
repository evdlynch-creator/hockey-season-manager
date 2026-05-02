import React from 'react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@blinkdotnew/ui'
import { cn } from '@/lib/utils'

interface HeatmapCell {
  date: string
  value: number | null
}

interface HeatmapRow {
  concept: string
  cells: HeatmapCell[]
  dates: string[]
}

interface ConceptHeatmapProps {
  rows: HeatmapRow[]
}

function heatmapColor(value: number | null): string {
  if (value == null) return 'hsl(0 0% 12%)'
  // 0 = red-ish, 5 = emerald
  if (value < 2) return 'rgba(239, 68, 68, 0.6)'
  if (value < 3) return 'rgba(245, 158, 11, 0.5)'
  if (value < 4) return 'rgba(245, 158, 11, 0.85)'
  return 'rgba(16, 185, 129, 0.85)'
}

export function ConceptHeatmap({ rows }: ConceptHeatmapProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">Concept × Session Heatmap</CardTitle>
        <CardDescription className="text-xs">
          Last 12 sessions with ratings. Greener = stronger execution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows[0]?.cells.length === 0 ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-sm text-muted-foreground italic">No ratings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex items-center gap-1 pl-[140px] mb-2">
                {rows[0]?.dates.map(d => (
                  <div key={d} className="w-10 text-center text-[9px] text-muted-foreground font-medium tabular-nums">
                    {format(parseISO(d), 'M/d')}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {rows.map(row => (
                  <div key={row.concept} className="flex items-center gap-1">
                    <div className="w-[132px] shrink-0 pr-2 text-right">
                      <span className="text-xs font-medium text-foreground">{row.concept}</span>
                    </div>
                    {row.cells.map(c => (
                      <div
                        key={c.date}
                        className={cn(
                          'w-10 h-10 rounded flex items-center justify-center text-[10px] font-semibold transition-transform hover:scale-110',
                          c.value == null ? 'text-muted-foreground/40' : 'text-white'
                        )}
                        style={{ backgroundColor: heatmapColor(c.value) }}
                        title={`${row.concept} · ${format(parseISO(c.date), 'MMM d')}: ${c.value?.toFixed(1) ?? 'No rating'}`}
                      >
                        {c.value != null ? c.value.toFixed(1) : '—'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pl-[140px] text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }} />
                  &lt; 2.0
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.5)' }} />
                  2.0 – 3.0
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.85)' }} />
                  3.0 – 4.0
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.85)' }} />
                  ≥ 4.0
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
