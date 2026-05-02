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
              'mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors',
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
    <div className="space-y-2 px-1">
      <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
        Season Filter
      </p>
      <Tabs value={mode} onValueChange={v => setMode(v as ViewMode)} className="w-full">
        <TabsList className="grid grid-cols-4 h-12 w-full bg-secondary/50 border border-border/50 p-1.5 rounded-full">
          {ITEMS.map(({ value, short, icon: Icon, label }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value={value}
                  className={cn(
                    'h-9 rounded-full text-[10px] font-bold gap-1.5 transition-all duration-300',
                    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/40',
                    'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{short}</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-bold uppercase tracking-wider">{label}</TooltipContent>
            </Tooltip>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
