import { motion } from 'framer-motion'
import { Target, ClipboardList, Swords } from 'lucide-react'

export function OverviewView() {
  return (
    <motion.div 
      key="overview"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 p-6 md:p-10 space-y-10"
    >
      {/* Mock Content: Stats Row */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Season Progress", val: "84%", icon: Target, color: "text-primary" },
          { label: "Practice Rating", val: "4.8", icon: ClipboardList, color: "text-emerald-400" },
          { label: "Game Win %", val: "72%", icon: Swords, color: "text-blue-400" }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-3 group/stat hover-glow">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              <stat.icon className={`w-3 h-3 ${stat.color} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
            </div>
            <div className="text-2xl font-black text-white transition-all">{stat.val}</div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full bg-primary/40 transition-all duration-1000 group-hover:bg-primary group-hover:w-full`} style={{ width: i === 0 ? '84%' : i === 1 ? '96%' : '72%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Mock Content: Main Performance Graph Block */}
      <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] flex-1 relative overflow-hidden group/graph">
        <div className="absolute top-0 right-0 p-8 text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Progress</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white/10" /> Baseline</span>
        </div>
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-2">
            <div className="text-lg font-bold text-white italic">Seasonal Concept Progression</div>
            <div className="text-xs text-zinc-500 tracking-tight">Tracking team understanding across all core segments</div>
          </div>
        </div>
        <div className="h-48 w-full flex items-end gap-2 md:gap-4 px-2">
          {[40, 70, 45, 90, 65, 80, 55, 85, 45, 75, 60, 95].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-primary/20 rounded-t-lg transition-all duration-700 group-hover/graph:bg-primary group-hover/graph:translate-y-[-4px]"
              style={{ 
                height: `${h}%`,
                opacity: 0.3 + (h / 100) * 0.7,
                transitionDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Mock Content: Bottom Grid */}
      <div className="grid grid-cols-2 gap-8">
        <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Recent Activity</div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="text-xs font-bold text-white italic uppercase tracking-tighter">Power Play Breakouts</div>
              </div>
              <div className="text-[10px] text-zinc-500">2h ago</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <div className="text-xs font-bold text-white italic uppercase tracking-tighter">D-Zone Coverage</div>
              </div>
              <div className="text-[10px] text-zinc-500">Yesterday</div>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-4">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Top Concept Mastery</div>
          <div className="space-y-4 py-2">
            {[
              { label: "Forecheck", val: 92 },
              { label: "Transition", val: 78 },
              { label: "D-Zone", val: 64 }
            ].map((c, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white font-bold italic uppercase tracking-tighter">{c.label}</span>
                  <span className="text-primary font-bold">{c.val}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${c.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
