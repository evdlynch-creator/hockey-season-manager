import { motion } from 'framer-motion'
import { TrendingUp, Target, Activity, Zap, Shield, Swords } from 'lucide-react'

export function ConceptsView() {
  return (
    <motion.div 
      key="concepts"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 p-6 md:p-10 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Tactical Intelligence</h3>
          <p className="text-xs text-zinc-500 tracking-tight">Concept progression & ice segment efficiency</p>
        </div>
        <div className="h-10 w-48 bg-white/5 rounded-full border border-white/10 flex items-center px-4 gap-2">
          <Activity className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Concept Tracking</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[45%]">
        {[
          { title: "Breakouts", data: [2, 3, 4, 3, 5, 4, 5], color: "text-blue-400", bg: "bg-blue-500", icon: Zap },
          { title: "Forecheck", data: [4, 4, 3, 5, 5, 5, 5], color: "text-emerald-400", bg: "bg-emerald-500", icon: Swords },
          { title: "D-Zone", data: [3, 2, 3, 4, 4, 3, 4], color: "text-amber-400", bg: "bg-amber-500", icon: Shield }
        ].map((c, i) => (
          <div key={i} className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] flex flex-col justify-between group/concept hover-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover/concept:text-primary transition-colors">{c.title}</div>
              <c.icon className={`w-3 h-3 ${c.color} opacity-50 group-hover/concept:opacity-100 group-hover/concept:scale-110 transition-all`} />
            </div>
            <div className="flex-1 flex items-end gap-1 px-1">
              {c.data.map((v, j) => (
                <div 
                  key={j} 
                  className={`flex-1 ${c.bg}/20 rounded-t-sm transition-all duration-500 group-hover/concept:${c.bg}/50`} 
                  style={{ height: `${v * 20}%` }} 
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-black text-white italic transition-all">{(c.data[c.data.length-1]).toFixed(1)}</span>
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8 flex-1">
        <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.03] flex flex-col group/heatmap overflow-hidden relative hover-glow cursor-default">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full animate-float-2 opacity-30 -z-10" />
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 group-hover/heatmap:text-primary transition-colors">Offensive Zone Efficiency</div>
          <div className="flex-1 grid grid-cols-5 grid-rows-3 gap-1.5">
            {Array.from({ length: 15 }).map((_, i) => {
              const intensity = 0.3 + Math.random() * 0.7;
              const delay = Math.random() * 5;
              const duration = 2 + Math.random() * 3;
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: intensity }}
                  animate={{ opacity: [intensity, intensity * 0.5, intensity] }}
                  transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
                  className="rounded-full bg-primary/10 border border-primary/5 transition-all duration-500 group-hover/heatmap:bg-primary/30"
                />
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
            <span>Left Point</span>
            <span>Slot</span>
            <span>Right Point</span>
          </div>
        </div>

        <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.03] flex flex-col hover-glow cursor-default group/mastery">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-8 group-hover/mastery:text-primary transition-all">Concept Mastery Delta</div>
          <div className="space-y-6">
            {[
              { label: "D-Zone Coverage", val: 92, trend: 12 },
              { label: "Power Play Breakouts", val: 78, trend: -4 },
              { label: "Neutral Zone Regroups", val: 65, trend: 24 }
            ].map((c, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white font-bold italic uppercase tracking-tighter transition-all">{c.label}</span>
                  <span className={c.trend > 0 ? "text-emerald-400" : "text-red-400"}>{c.trend > 0 ? "+" : ""}{c.trend}%</span>
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
