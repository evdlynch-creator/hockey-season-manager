import React, { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { Trophy, ClipboardList, Swords } from 'lucide-react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@blinkdotnew/ui'

interface RibbonItem {
  id: string
  kind: 'practice' | 'game'
  date: string
  status: string
  label: string
  result?: 'W' | 'L' | 'T'
}

interface SeasonProgressRibbonProps {
  practices: any[]
  games: any[]
  onNavigate: (kind: string, id: string) => void
}

export function SeasonProgressRibbon({ practices, games, onNavigate }: SeasonProgressRibbonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const all: RibbonItem[] = [
      ...practices.map(p => ({
        id: p.id,
        kind: 'practice' as const,
        date: p.date,
        status: p.status,
        label: p.title
      })),
      ...games.map(g => ({
        id: g.id,
        kind: 'game' as const,
        date: g.date,
        status: g.status,
        label: `vs. ${g.opponent}`,
        result: g.goalsFor != null && g.goalsAgainst != null
          ? (Number(g.goalsFor) > Number(g.goalsAgainst) ? 'W' : Number(g.goalsFor) < Number(g.goalsAgainst) ? 'L' : 'T')
          : undefined
      }))
    ]
    return all.sort((a, b) => a.date.localeCompare(b.date))
  }, [practices, games])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="w-full py-8 mt-12 border-t border-white/5">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Season Life-Line</h3>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Wins</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Losses</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Practices</div>
        </div>
      </div>

      <div className="relative overflow-hidden group">
        <div 
          ref={containerRef}
          className="flex items-center gap-8 overflow-x-auto pb-6 pt-2 scrollbar-hide px-4 mask-fade-edges"
        >
          <TooltipProvider>
            {items.map((item, idx) => {
              const isPast = item.date < today
              const isToday = item.date === today
              
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => onNavigate(item.kind, item.id)}
                      className="relative flex flex-col items-center shrink-0 group/node"
                    >
                      {/* Node */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative z-10",
                        isPast ? "opacity-60 grayscale-[0.5]" : "opacity-100",
                        item.kind === 'game' 
                          ? (item.result === 'W' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : item.result === 'L' ? "bg-red-500/10 border-red-500 text-red-500" : "bg-zinc-500/10 border-zinc-500 text-zinc-500")
                          : "bg-primary/10 border-primary text-primary",
                        isToday && "scale-125 shadow-[0_0_20px_hsla(var(--primary)/0.4)] ring-4 ring-primary/20",
                        "hover:scale-110 hover:shadow-lg"
                      )}>
                        {item.kind === 'game' ? <Swords className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                      </div>

                      {/* Label */}
                      <div className="mt-3 text-center">
                        <p className={cn(
                          "text-[10px] font-black italic uppercase tracking-tighter transition-colors whitespace-nowrap",
                          isPast ? "text-zinc-500" : "text-white"
                        )}>
                          {format(parseISO(item.date), 'MMM d')}
                        </p>
                      </div>

                      {/* Connector Line (drawn before nodes) */}
                      {idx < items.length - 1 && (
                        <div className="absolute left-[calc(100%-8px)] top-[20px] w-8 h-[2px] bg-white/5 -z-0" />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-950/90 backdrop-blur-xl border-white/10 p-3 rounded-2xl shadow-2xl">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-70">{item.kind}</p>
                      <p className="text-sm font-bold text-white leading-tight max-w-[200px]">{item.label}</p>
                      {item.result && (
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-wider",
                          item.result === 'W' ? "text-emerald-500" : "text-red-500"
                        )}>
                          {item.result === 'W' ? 'Won' : item.result === 'L' ? 'Lost' : 'Tied'}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
