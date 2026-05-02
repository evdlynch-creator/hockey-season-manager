import { useMemo } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, toast,
} from '@blinkdotnew/ui'
import {
  TrendingUp, TrendingDown, Minus,
  ClipboardCopy, Sparkles,
  ShieldAlert, ShieldCheck,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { OpponentStats } from './types'
import { buildCoachingPlan, planToText } from './utils'

interface CoachingPlanProps {
  stats: OpponentStats
}

export function CoachingPlan({ stats }: CoachingPlanProps) {
  const plan = useMemo(() => buildCoachingPlan(stats), [stats])
  const hasAnyData =
    plan.reinforce.length || plan.address.length || plan.mixed.length || plan.observations.length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(planToText(stats, plan))
      toast.success('Coaching plan copied to clipboard')
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  const trendIcon =
    plan.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
    : plan.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-red-400" />
    : plan.trend === 'steady' ? <Minus className="w-3.5 h-3.5 text-muted-foreground" />
    : null

  const trendLabel =
    plan.trend === 'up' ? `Improving (+${plan.trendDelta.toFixed(2)})`
    : plan.trend === 'down' ? `Declining (${plan.trendDelta.toFixed(2)})`
    : plan.trend === 'steady' ? 'Steady'
    : null

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent rounded-[2rem]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Coaching Plan vs. {stats.name}
            </CardTitle>
            <CardDescription className="text-xs">
              Built from {plan.reviewedCount} reviewed game{plan.reviewedCount !== 1 ? 's' : ''}.
              Use it to shape the next practice and pre-game talk.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {trendLabel && (
              <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 h-5 rounded-full">
                {trendIcon}
                {trendLabel}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs rounded-full"
              onClick={handleCopy}
              disabled={!hasAnyData}
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              Copy
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyData ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Review at least one game against this opponent to generate a plan.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-[2rem] border border-emerald-600/30 bg-emerald-600/5 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">Reinforce</p>
                </div>
                {plan.reinforce.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No clear strengths yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {plan.reinforce.map((t) => (
                      <li key={t.concept} className="flex items-start justify-between gap-2 text-xs">
                        <span className="text-foreground">{t.concept}</span>
                        <span className="font-semibold text-emerald-400 tabular-nums shrink-0">
                          {t.avg.toFixed(1)}/5
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-[2rem] border border-red-600/30 bg-red-600/5 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-red-300">Address</p>
                </div>
                {plan.address.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No major weak spots yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {plan.address.map((t) => (
                      <li key={t.concept} className="flex items-start justify-between gap-2 text-xs">
                        <span className="text-foreground">{t.concept}</span>
                        <span className="font-semibold text-red-400 tabular-nums shrink-0">
                          {t.avg.toFixed(1)}/5
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {plan.mixed.length > 0 && (
              <div className="rounded-[2rem] border border-border/50 bg-secondary/20 p-3">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">
                  Watch — mixed results
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.mixed.map((t) => (
                    <Badge key={t.concept} variant="secondary" className="text-[10px] gap-1 rounded-full">
                      {t.concept} <span className="tabular-nums opacity-70">{t.avg.toFixed(1)}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[2rem] border border-border/50 bg-secondary/10 p-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">
                Style of play — running notes
              </p>
              {plan.observations.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Add opponent notes in your game reviews to start tracking their tendencies.
                </p>
              ) : (
                <ul className="space-y-2">
                  {plan.observations.map((o) => (
                    <li key={o.gameId} className="text-xs">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                        {format(parseISO(o.date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-foreground leading-relaxed">{o.note}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
