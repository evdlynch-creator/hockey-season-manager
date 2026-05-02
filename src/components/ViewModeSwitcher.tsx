import { Tabs, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@blinkdotnew/ui'
import { Globe, Trophy, Award, Sparkles } from 'lucide-react'
import { useTeam } from '@/hooks/useTeam'
import { useViewMode } from '@/hooks/usePreferences'
import type { ViewMode } from '@/hooks/usePreferences'
import { cn } from '@/lib/utils'

const ITEMS: { value: ViewMode; label: string; short: string; icon: typeof Globe }[] = [
  { value: 'season', label: 'Whole Season', short: 'All', icon: Globe },
  { value: 'league', label: 'League', short: 'League', icon: Trophy },
  { value: 'tournament', label: 'Tournament', short: 'Tourney', icon: Award },
  { value: 'exhibition', label: 'Exhibition', short: 'Exhibit', icon: Sparkles },
]

export function ViewModeSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { data: teamData } = useTeam()
  const teamId = teamData?.team?.id
  const { mode, setMode } = useViewMode(teamId)

  if (collapsed) {
    const Active = ITEMS.find(i => i.value === mode) ?? ITEMS[0]
    const Icon = Active.icon
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => {
              const idx = ITEMS.findIndex(i => i.value === mode)
              setMode(ITEMS[(idx + 1) % ITEMS.length].value)
            }}
            className={cn(
              'mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              mode === 'tournament' && 'text-amber-400 hover:text-amber-300',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">View: {Active.label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
        View
      </p>
      <Tabs value={mode} onValueChange={v => setMode(v as ViewMode)} className="w-full">
        <TabsList className="grid grid-cols-4 h-8 w-full bg-secondary/40 border border-border p-0.5">
          {ITEMS.map(({ value, short, icon: Icon, label }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value={value}
                  className={cn(
                    'h-7 px-1 text-[10px] font-semibold gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden xl:inline">{short}</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
