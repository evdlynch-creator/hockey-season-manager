import { motion } from 'framer-motion'
import { StatsCounter } from './StatsCounter'

export function SocialProofStrip() {
  const stats = [
    { value: "500+", label: "Games Analyzed" },
    { value: "32", label: "Active Teams" },
    { value: "18.5%", label: "Avg Win Rate Increase" }
  ]

  return (
    <div className="relative border-y border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 relative z-10">
          {stats.map((stat, i) => (
            <div 
              key={i}
              className={`flex flex-col items-center justify-center ${
                i !== stats.length - 1 ? "md:border-r md:border-white/5" : ""
              }`}
            >
              <StatsCounter 
                value={stat.value} 
                label={stat.label} 
                delay={i * 0.15} 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative gradient flare */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none" />
    </div>
  )
}
