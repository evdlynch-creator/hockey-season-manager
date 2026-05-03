import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  BarChart3, 
  Activity, 
  Layers, 
  Target, 
  ClipboardList, 
  Swords, 
  Users 
} from 'lucide-react'
import logoUrl from '@/assets/blue-line-iq-logo.svg'
import { OverviewView } from './OverviewView'
import { TrendsView } from './TrendsView'
import { ConceptsView } from './ConceptsView'

interface DashboardPreviewProps {
  onEnterDemo: () => void
}

export function DashboardPreview({ onEnterDemo }: DashboardPreviewProps) {
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'concepts'>('overview')

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveView(current => {
        if (current === 'overview') return 'trends'
        if (current === 'trends') return 'concepts'
        return 'overview'
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative group">
      {/* Background Glow for Preview */}
      <div 
        className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" 
        style={{ transform: "translateZ(0)", willChange: "opacity" }}
      />
      
      {/* Dashboard Preview Container */}
      <div 
        className="relative rounded-[2rem] border border-white/10 bg-[#0c0c0e] shadow-2xl shadow-black/80 overflow-hidden transition-colors duration-500 group-hover:border-primary/20 cursor-pointer"
        style={{ transform: "translateZ(0)", willChange: "border-color" }}
        onClick={onEnterDemo}
      >
        {/* Browser Shell Mock */}
        <div className="h-11 border-b border-white/5 bg-white/[0.03] flex items-center px-4 justify-between shrink-0">
          <div className="flex gap-1.5 items-center">
            <div className="w-3 h-3 rounded-full bg-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-amber-500/20" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
            <div className="ml-4 flex items-center gap-2">
              <div className="h-5 w-48 bg-white/5 rounded-full flex items-center px-2">
                <div className="h-1.5 w-full bg-white/10 rounded-full" />
              </div>
              <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] font-bold text-primary uppercase tracking-tighter">Sandbox Mode: Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              {(['overview', 'trends', 'concepts'] as const).map((view) => (
                <button
                  key={view}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveView(view);
                  }}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    activeView === view ? 'text-primary' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
            <div className="w-6 h-6 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="relative aspect-[16/10] bg-zinc-950 flex">
          {/* Mock Sidebar */}
          <div className="hidden md:flex w-56 border-r border-white/5 bg-white/[0.01] p-6 flex-col gap-8 shrink-0">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Blue Line IQ" className="h-4 w-auto grayscale brightness-200 opacity-50" />
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Main Menu</div>
                <div className={`h-9 w-full rounded-full flex items-center px-3 gap-2 transition-all duration-300 ${activeView === 'overview' ? 'bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'hover:bg-white/5'}`}>
                  <TrendingUp className={`w-3.5 h-3.5 ${activeView === 'overview' ? 'text-primary' : 'text-zinc-500'}`} />
                  <span className={`text-[10px] font-bold ${activeView === 'overview' ? 'text-primary' : 'text-zinc-500'}`}>Overview</span>
                </div>
                <div className={`h-9 w-full rounded-full flex items-center px-3 gap-2 transition-all duration-300 ${activeView === 'trends' ? 'bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'hover:bg-white/5'}`}>
                  <BarChart3 className={`w-3.5 h-3.5 ${activeView === 'trends' ? 'text-primary' : 'text-zinc-500'}`} />
                  <span className={`text-[10px] font-bold ${activeView === 'trends' ? 'text-primary' : 'text-zinc-500'}`}>Trends</span>
                </div>
                <div className={`h-9 w-full rounded-full flex items-center px-3 gap-2 transition-all duration-300 ${activeView === 'concepts' ? 'bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'hover:bg-white/5'}`}>
                  <Activity className={`w-3.5 h-3.5 ${activeView === 'concepts' ? 'text-primary' : 'text-zinc-500'}`} />
                  <span className={`text-[10px] font-bold ${activeView === 'concepts' ? 'text-primary' : 'text-zinc-500'}`}>Concepts</span>
                </div>
                {[
                  { icon: Target, label: "Analytics" },
                  { icon: ClipboardList, label: "Practices" },
                  { icon: Swords, label: "Games" },
                  { icon: Users, label: "Roster" }
                ].map((item, i) => (
                  <div key={i} className="h-9 w-full hover:bg-white/5 rounded-full flex items-center px-3 gap-2 transition-colors">
                    <item.icon className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[10px] font-medium text-zinc-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-zinc-900/50">
            <AnimatePresence mode="wait">
              {activeView === 'overview' && <OverviewView key="overview" />}
              {activeView === 'trends' && <TrendsView key="trends" />}
              {activeView === 'concepts' && <ConceptsView key="concepts" />}
            </AnimatePresence>

            {/* AI Intelligence Scan Sweep */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12 animate-[scan-sweep_4s_ease-in-out_infinite]" />
            </div>

            {/* Tactical Intelligence Log (Bottom Left) */}
            <div className="absolute bottom-4 left-4 w-48 h-16 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-2 overflow-hidden pointer-events-none hidden lg:block">
              <div className="text-[8px] font-mono text-primary/60 uppercase mb-1 flex justify-between">
                <span>Intelligence Feed</span>
                <span className="animate-pulse">● Live</span>
              </div>
              <div className="space-y-1 animate-[terminal-scroll_10s_linear_infinite]">
                <div className="text-[7px] font-mono text-zinc-500 leading-tight">{">"} Analyzing zone entry trends...</div>
                <div className="text-[7px] font-mono text-zinc-500 leading-tight">{">"} Mapping breakout sequences...</div>
                <div className="text-[7px] font-mono text-primary/80 leading-tight">{">"} Tactical gap detected: RD shift</div>
                <div className="text-[7px] font-mono text-zinc-500 leading-tight">{">"} Syncing practice data...</div>
                <div className="text-[7px] font-mono text-zinc-500 leading-tight">{">"} Optimizing powerplay concepts...</div>
                <div className="text-[7px] font-mono text-primary/80 leading-tight">{">"} AI Insight: Concept retention up 12%</div>
                {/* Repeat for smooth scroll */}
                <div className="text-[7px] font-mono text-zinc-500 leading-tight">{">"} Analyzing zone entry trends...</div>
                <div className="text-[7px] font-mono text-zinc-500 leading-tight">{">"} Mapping breakout sequences...</div>
                <div className="text-[7px] font-mono text-primary/80 leading-tight">{">"} Tactical gap detected: RD shift</div>
                <div className="text-[7px] font-mono text-zinc-500 leading-tight">{">"} Syncing practice data...</div>
                <div className="text-[7px] font-mono text-zinc-500 leading-tight">{">"} Optimizing powerplay concepts...</div>
                <div className="text-[7px] font-mono text-primary/80 leading-tight">{">"} AI Insight: Concept retention up 12%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Overlay to unify look */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-20 pointer-events-none" />
      </div>
    </div>
  )
}
