import { motion } from 'framer-motion'

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
          <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Tactical Heatmap</h3>
          <p className="text-xs text-zinc-500 tracking-tight">Understanding gap by ice segment and concept focus</p>
        </div>
        <div className="h-10 w-48 bg-white/5 rounded-full border border-white/10 flex items-center px-4 gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Mid-Season Review</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 h-64">
        {Array.from({ length: 25 }).map((_, i) => {
          const intensity = 0.2 + Math.random() * 0.8;
          return (
            <div 
              key={i} 
              className="rounded-lg border border-white/5 flex items-center justify-center transition-all hover:scale-105"
              style={{ 
                backgroundColor: `rgba(204, 251, 0, ${intensity * 0.4})`,
                borderColor: `rgba(204, 251, 0, ${intensity * 0.2})`
              }}
            >
              <div className="text-[10px] font-bold text-white opacity-20">{Math.floor(intensity * 100)}%</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {[
          { title: "Defensive Zone", value: 74, status: "Improving" },
          { title: "Special Teams", value: 88, status: "Elite" }
        ].map((c, i) => (
          <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <circle 
                  cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" 
                  strokeDasharray={220}
                  strokeDashoffset={220 - (220 * c.value) / 100}
                  className="text-primary"
                />
              </svg>
              <span className="absolute text-xs font-black italic">{c.value}%</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-black italic uppercase text-white">{c.title}</div>
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest">{c.status}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
