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

      <div className="grid grid-cols-2 gap-8 h-[55%]">
        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between group/goals">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Goal Differential</div>
            <Activity className="w-3 h-3 text-emerald-400 opacity-50" />
          </div>
          <div className="flex-1 flex items-end gap-1.5 px-2">
            {[2, 3, 2, 4, 3, 5, 4, 3, 6, 4].map((g, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5 items-center group/bar">
                <div className="w-full bg-emerald-500/20 rounded-t-sm group-hover/bar:bg-emerald-500/40 transition-colors" style={{ height: `${g * 12}%` }} />
                <div className="w-full bg-red-500/20 rounded-b-sm group-hover/bar:bg-red-500/40 transition-colors" style={{ height: `${(Math.random() * 2 + 1) * 12}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white italic">+2.4</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Avg Delta</span>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center relative overflow-hidden group/radar">
          <div className="absolute top-4 left-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Concept Balance</div>
          
          <svg className="w-40 h-40 transform scale-125 md:scale-150" viewBox="0 0 100 100">
            {/* Radar Background Grids */}
            {[20, 40, 60, 80, 100].map((r) => (
              <circle key={r} cx="50" cy="50" r={r/2.2} fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
            ))}
            {/* Axis Lines */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * (Math.PI / 180);
              return <line key={i} x1="50" y1="50" x2={50 + Math.cos(angle) * 45} y2={50 + Math.sin(angle) * 45} stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />;
            })}
            {/* Data Shape */}
            <path 
              d="M 50 15 L 85 30 L 80 75 L 50 85 L 20 75 L 15 30 Z" 
              fill="hsl(var(--primary))" 
              fillOpacity="0.2" 
              stroke="hsl(var(--primary))" 
              strokeWidth="1.5"
              className="transition-all duration-1000 group-hover/radar:fill-opacity-40"
            />
            {/* Points */}
            {[
              {x: 50, y: 15}, {x: 85, y: 30}, {x: 80, y: 75}, 
              {x: 50, y: 85}, {x: 20, y: 75}, {x: 15, y: 30}
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="white" />
            ))}
          </svg>

          <div className="absolute bottom-4 flex gap-4 text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
            <span>D-Zone</span>
            <span>Pass</span>
            <span>Skate</span>
            <span>Break</span>
          </div>
        </div>
      </div>

      <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] flex-1 relative group/record">
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