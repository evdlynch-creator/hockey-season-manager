import { motion } from 'framer-motion'

export function SocialProofStrip() {
  const stats = [
    { value: "500+", label: "Games Analyzed" },
    { value: "32", label: "Active Teams" },
    { value: "18%", label: "Avg Win Rate Increase" }
  ]

  return (
    <div className="relative border-y border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative z-10">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`flex flex-col items-center justify-center text-center ${
                i !== stats.length - 1 ? "md:border-r md:border-white/5" : ""
              }`}
            >
              <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-1">
                {stat.value}
              </div>
              <div className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative gradient flare */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none" />
    </div>
  )
}
