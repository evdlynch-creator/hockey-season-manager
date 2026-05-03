import { motion } from 'framer-motion'
import { TrendingUp, Target, Activity, Zap, Shield, Swords, Mic, Sparkles } from 'lucide-react'

function PulseNode({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div className={`absolute w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse ${className}`} style={style} />
  )
}

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[45%] relative">
        <PulseNode className="top-1/2 left-1/3 z-20" />
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

      <div className="grid grid-cols-2 gap-8 flex-1 relative">
        <PulseNode className="bottom-8 right-8 z-20" style={{ animationDelay: '1.5s' }} />
        
        <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.03] flex flex-col group/heatmap overflow-hidden relative hover-glow cursor-default">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full animate-float-2 opacity-30 -z-10" />
          <div className="flex items-center justify-between mb-6">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover/heatmap:text-primary transition-colors">Tactical Pulse · Live</div>
            <div className="bg-primary/20 text-primary border-none text-[8px] px-1.5 h-4 rounded-full font-black animate-pulse">LIVE</div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Breakout Execution", plus: 8, minus: 1, score: 4.4 },
              { label: "Forecheck Pressure", plus: 12, minus: 0, score: 5.0 },
              { label: "D-Zone Shape", plus: 4, minus: 3, score: 2.7 }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 px-4 rounded-full">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{p.label}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black italic text-white">{p.score.toFixed(1)}</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      <div className="w-1 h-1 rounded-full bg-red-400 opacity-30" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-400">{p.plus}</div>
                  <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-[10px] font-bold text-red-400">{p.minus}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.03] flex flex-col hover-glow cursor-default group/mastery">
          <div className="flex items-center justify-between mb-8">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover/mastery:text-primary transition-all">AI Tactical Notes</div>
            <Mic className="w-3 h-3 text-primary" />
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-[1.5rem] bg-primary/5 border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2"><Sparkles className="w-3 h-3 text-primary animate-pulse" /></div>
              <p className="text-[10px] italic leading-relaxed text-zinc-300">
                "Our weak-side D is struggling with the initial pivot. Toronto is exploiting the gap between the winger and the point..."
              </p>
              <div className="mt-3 flex gap-1">
                <div className="text-[8px] px-1.5 h-4 border-primary/20 text-primary uppercase font-bold rounded-full">D-Zone</div>
                <div className="text-[8px] px-1.5 h-4 border-zinc-500/20 text-zinc-500 uppercase font-bold rounded-full">Opponent</div>
              </div>
            </div>
            <div className="p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 opacity-50 scale-95 origin-top">
              <p className="text-[10px] italic leading-relaxed text-zinc-500">
                "Zone entries were sharp in the 2nd. The clean entries into their end led to 4 odd-man rushes..."
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}