import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Swords, Zap, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  { 
    step: "01", 
    title: "Live Bench Mode", 
    desc: "Tap tactical +/- during the game. Dictate tactical notes via AI Mic between shifts. No more messy spreadsheets or clipboards.",
    icon: Swords,
    color: "text-blue-400",
    bg: "bg-blue-400/5",
    border: "border-blue-400/20",
    image: "https://cdn.blink.new/screenshots/blue-line-iq-qpy3h1ap.sites.blink.new-1777841188391.webp" // Using a placeholder for now
  },
  { 
    step: "02", 
    title: "Auto-Scoring", 
    desc: "Exit the bench and see your scores already calculated. One click to save the review and update your season-long trends.",
    icon: Zap,
    color: "text-emerald-400",
    bg: "bg-emerald-400/5",
    border: "border-emerald-400/20",
    image: "https://cdn.blink.new/screenshots/blue-line-iq-qpy3h1ap.sites.blink.new-1777841188391.webp"
  },
  { 
    step: "03", 
    title: "Practice Architect", 
    desc: "AI identifies your weakest concepts and generates a practice plan targeting those exact gaps. The bridge from data to development.",
    icon: Brain,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
    image: "https://cdn.blink.new/screenshots/blue-line-iq-qpy3h1ap.sites.blink.new-1777841188391.webp"
  }
]

export function HorizontalFeatures() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
  })

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.66%"])

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-[#0a0a0c]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-4 px-10">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative flex h-[70vh] w-[85vw] md:w-[70vw] shrink-0 items-center justify-center overflow-hidden rounded-[3rem] border border-white/5 bg-zinc-900/40 backdrop-blur-xl transition-all duration-500 hover:border-primary/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full">
                <div className="p-10 md:p-16 flex flex-col justify-center space-y-8">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center border shadow-2xl",
                    feature.bg, feature.border
                  )}>
                    <feature.icon className={cn("w-8 h-8", feature.color)} />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-black italic", feature.color)}>{feature.step}</span>
                      <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-lg text-zinc-400 leading-relaxed font-medium italic max-w-md">
                      {feature.desc}
                    </p>
                  </div>
                </div>
                
                <div className="relative hidden md:block overflow-hidden p-8">
                  <div className="h-full w-full rounded-2xl border border-white/5 bg-zinc-950 shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="h-full w-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0c] via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Background Section Title */}
      <div className="absolute top-1/4 left-10 pointer-events-none">
        <h2 className="text-[12rem] font-black italic uppercase tracking-tighter text-white/[0.02] leading-none select-none">
          Workflow
        </h2>
      </div>
    </section>
  )
}
