import React from 'react'

export interface DarkTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
}

export function DarkTooltip({ active, payload, label }: DarkTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums">
            {typeof p.value === 'number' ? p.value.toFixed?.(1) ?? p.value : p.value ?? '—'}
          </span>
        </p>
      ))}
    </div>
  )
}
