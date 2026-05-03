import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

export function TestimonialSection() {
  return (
    <section className="py-32 relative overflow-hidden bg-[#08080a]">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative text-center space-y-12"
        >
          {/* Oversized Quote Mark */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-[0.03] pointer-events-none">
            <Quote size={200} className="text-white fill-current" />
          </div>

          <blockquote className="relative">
            <p className="text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tight text-white leading-[1.1] font-avega selection:bg-primary/30">
              "Blue Line IQ cut my post-game prep time in half. I walk into practice the next morning with a full plan already built. My staff can't imagine going back."
            </p>
          </blockquote>

          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-px bg-white/10" />
            <div className="space-y-1">
              <cite className="text-lg font-bold text-white not-italic italic uppercase tracking-tight">
                Dave Marchand
              </cite>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
                Head Coach, Lakewood Wolves | USHL
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
