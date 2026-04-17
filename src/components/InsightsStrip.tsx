import { TrendingUp, TrendingDown, Target, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react'
import type { Insight } from '@/hooks/useAnalytics'

export function renderHighlighted(text: string) {
  const parts = text.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, i) => {
    const m = part.match(/^\{\{(.+)\}\}$/)
    if (m) {
      return (
        <span key={i} className="text-primary font-bold">{m[1]}</span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function insightIcon(insight: Insight) {
  switch (insight.kind) {
    case 'trending-up':
    case 'best-lever':
      return <TrendingUp className="w-4 h-4 text-emerald-400" />
    case 'trending-down':
      return <TrendingDown className="w-4 h-4 text-red-400" />
    case 'weakest-concept':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />
    case 'goal-differential':
      return <Sparkles className="w-4 h-4 text-primary" />
    case 'concept-correlation':
    default:
      return <Target className="w-4 h-4 text-primary" />
  }
}

interface InsightsListProps {
  insights: Insight[]
  showDetail?: boolean
}

export function InsightsList({ insights, showDetail = true }: InsightsListProps) {
  return (
    <ul className="divide-y divide-border/60">
      {insights.map(insight => (
        <li key={insight.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <div className="mt-0.5 shrink-0">{insightIcon(insight)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground leading-snug">
              {renderHighlighted(insight.headline)}
            </p>
            {showDetail && (
              <p className="text-xs text-muted-foreground mt-1">{insight.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

interface InsightsStripProps {
  insights: Insight[]
  limit?: number
  onViewAll?: () => void
}

export function InsightsStrip({ insights, limit = 3, onViewAll }: InsightsStripProps) {
  const top = insights.slice(0, limit)
  if (!top.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Top Insights</p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[11px] text-primary hover:underline shrink-0"
          >
            See all
          </button>
        )}
      </div>
      <InsightsList insights={top} showDetail={false} />
    </div>
  )
}
