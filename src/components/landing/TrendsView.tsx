import { motion } from 'framer-motion'

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

      <div className="grid grid-cols-2 gap-8 h-[60%]">
        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Goals For (Avg)</div>
          <div className="flex-1 flex items-end gap-1">
            {[2, 3, 2, 4, 3, 5, 4, 3, 6, 4].map((g, i) => (
              <div key={i} className="flex-1 bg-emerald-500/30 rounded-t" style={{ height: `${g * 15}%` }} />
            ))}
          </div>
          <div className="mt-4 text-3xl font-black text-white italic">4.2</div>
        </div>
        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Goals Against (Avg)</div>
          <div className="flex-1 flex items-end gap-1">
            {[3, 2, 1, 2, 2, 3, 1, 2, 1, 2].map((g, i) => (
              <div key={i} className="flex-1 bg-red-500/30 rounded-t" style={{ height: `${g * 15}%` }} />
            ))}
          </div>
          <div className="mt-4 text-3xl font-black text-white italic">1.8</div>
        </div>
      </div>

      <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex-1">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Cumulative Season Record</div>
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
