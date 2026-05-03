import { motion } from 'framer-motion'
import { TrendingUp, Target, Users, Zap, Shield, Sparkles } from 'lucide-react'

export function SeasonImpactStats() {
  const categories = [
    {
      label: "Tactical Execution",
      value: "92%",
      trend: "+14% from baseline",
      icon: Target,
      color: "text-primary",
      delay: 0.1
    },
    {
      label: "Prep Efficiency",
      value: "2.4x",
      trend: "Faster post-game reviews",
      icon: Zap,
      color: "text-emerald-400",
      delay: 0.2
    },
    {
      label: "Player Growth",
      value: "88%",
      trend: "Concept mastery rate",
      icon: Sparkles,
      color: "text-amber-400",
      delay: 0.3
    }
  ]

  return (
    <section className="py-24 relative overflow-hidden bg-[#0a0a0c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest italic mb-4">
            <TrendingUp className="w-3 h-3" /> Season Intelligence
          </div>
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-tight">
            Measured <span className="text-primary">Impact.</span> <br />
            Proven <span className="text-white">Results.</span>
          </h2>
          <p className="mt-6 text-zinc-500 max-w-2xl mx-auto font-medium italic">
            Coaches using Blue Line IQ see immediate improvements in team understanding and staff efficiency.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: cat.delay, duration: 0.6 }}
              className="p-10 rounded-[3rem] border border-white/5 bg-zinc-900/30 backdrop-blur-sm relative group hover-glow overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <cat.icon size={120} className={cat.color} />
              </div>
              
              <div className="relative z-10 space-y-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 ${cat.color} shadow-lg`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">
                    {cat.label}
                  </p>
                  <h3 className="text-5xl font-black text-white italic tracking-tighter font-avega">
                    {cat.value}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 italic">
                  <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse`} />
                  {cat.trend}
                </div>
              </div>

              {/* Progress bar teaser */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: cat.value.includes('%') ? cat.value : '100%' }}
                  viewport={{ once: true }}
                  transition={{ delay: cat.delay + 0.4, duration: 1.5, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r from-transparent via-primary/40 to-primary`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
