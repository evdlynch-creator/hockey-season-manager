import { motion } from 'framer-motion'
import { Activity, TrendingUp, Target, Swords, ClipboardList } from 'lucide-react'

export function TrendsView() {
  return (
    <motion.div 
      key="trends"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 p-6 md:p-10 space-y-8"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1">
          <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Goal Trends</h3>
          <p className="text-xs text-zinc-500">Offensive vs Defensive performance delta</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest">+12% vs LY</div>
          <div className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest">RECORD: 12-4-2</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 h-[55%]">
        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between group/goals hover-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover/goals:text-primary transition-colors">Shot Volume Trends</div>
            <Swords className="w-3 h-3 text-blue-400 opacity-50" />
          </div>
          <div className="flex-1 flex items-end gap-1.5 px-2">
            {[28, 34, 42, 31, 38, 45, 39, 32, 48, 41].map((s, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5 items-center group/bar">
                <div className="w-full bg-blue-500/20 rounded-t-sm group-hover/bar:bg-blue-500/40 transition-colors" style={{ height: `${(s/60) * 100}%` }} />
                <div className="w-full bg-zinc-800 rounded-b-sm" style={{ height: `${(25/60) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white italic transition-all">37.8</span>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Avg SF/G</span>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between group/concepts hover-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover/concepts:text-primary transition-colors">System Execution</div>
            <Target className="w-3 h-3 text-primary opacity-50" />
          </div>
          
          <div className="flex-1 space-y-4 py-2">
            {[
              { label: "Zone Entries", val: 78, color: "bg-primary" },
              { label: "Turnover Recovery", val: 62, color: "bg-emerald-500" },
              { label: "Net Front Presence", val: 84, color: "bg-blue-500" }
            ].map((c, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                  <span>{c.label}</span>
                  <span className="text-white">{c.val}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${c.val}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`h-full ${c.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>+6.2% IMPROVEMENT</span>
          </div>
        </div>
      </div>

      <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] flex-1 relative group/record hover-glow">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 group-hover/record:text-primary transition-colors">Cumulative Season Record</div>
        <div className="h-32 w-full flex items-center px-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
            <path 
              d="M 0 80 L 40 70 L 80 50 L 120 60 L 160 40 L 200 30 L 240 45 L 280 20 L 320 10 L 360 15 L 400 5" 
              fill="none" 
              stroke="hsl(var(--primary))" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            <circle cx="400" cy="5" r="4" fill="white" className="animate-pulse" />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}