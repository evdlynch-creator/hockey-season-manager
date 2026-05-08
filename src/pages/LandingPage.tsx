import { Button, Badge } from '@blinkdotnew/ui'
import { blink } from '../blink/client'
import { useDemoMode } from '../hooks/useDemoData'
import logoUrl from '@/assets/blue-line-iq-logo.svg'
import { 
  Trophy, 
  Shield, 
  ArrowRight,
  ClipboardList,
  Swords,
  TrendingUp,
  Users,
  Target,
  Mic,
  Zap,
  Sparkles,
  FileText,
  Brain
} from 'lucide-react'
import { DashboardPreview } from '../components/landing/DashboardPreview'
import { FeatureCard } from '../components/landing/FeatureCard'
import { SocialProofStrip } from '../components/landing/SocialProofStrip'
import { TestimonialSection } from '../components/landing/TestimonialSection'
import { FAQSection } from '../components/landing/FAQSection'
import { SeasonImpactStats } from '../components/landing/SeasonImpactStats'
import { IceParticles } from '../components/landing/IceParticles'
import { MagneticButton } from '../components/landing/MagneticButton'
import { cn } from '@/lib/utils'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export default function LandingPage() {
  const { enterDemo } = useDemoMode()
  const [isDashboardHovered, setIsDashboardHovered] = useState(false)
  
  // Spotlight effect
  const mouseX = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const mouseY = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current || isDashboardHovered) return
      const { left, top } = heroRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - left)
      mouseY.set(e.clientY - top)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY, isDashboardHovered])

  const handleLogin = () => {
    blink.auth.login(window.location.href)
  }

  const spotlightGradient = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(56, 189, 248, 0.08), transparent 80%)`
  )

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden relative">
      <IceParticles />
      
      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md pt-[var(--safe-area-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Blue Line IQ" className="h-8 w-auto" loading="eager" />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors btn-premium rounded-full" onClick={handleLogin}>
              Sign In
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-lg shadow-primary/20 btn-premium rounded-full" onClick={handleLogin}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────── */}
      <motion.section 
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden group/hero z-10"
      >
        {/* Spotlight Overlay - Throttled when dashboard is active */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-700"
          style={{ 
            background: spotlightGradient,
            opacity: isDashboardHovered ? 0 : 1
          }}
        />

        <div className="scanlines scanline-pulse" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20">
          <div className="z-30 relative mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider font-avega italic"
            >
              <Trophy className="w-3 h-3" />
              Built for <span className="text-white">High-Performance</span> Coaching
            </motion.div>
          </div>
          
          {/* Pixel-Locked Heading Container */}
          <div 
            className="min-h-[clamp(140px,25vh,200px)] flex flex-col items-center justify-center relative z-30"
            style={{ isolation: "isolate", contain: "strict" }}
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-[clamp(1.8rem,8vw,4.5rem)] font-black tracking-tight mb-6 leading-[clamp(2.2rem,9vw,5rem)] relative"
            >
              Master Your Season with <br />
              <span className="relative inline-block">
                <span 
                  className="heading-premium"
                  style={{ '--shimmer-state': isDashboardHovered ? 'paused' : 'running' } as any}
                >
                  Automated Intelligence
                </span>
                <span className="heading-glow-backdrop" aria-hidden="true">
                  Automated Intelligence
                </span>
              </span>
            </motion.h1>
          </div>
          
          <div className="z-30 relative">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-2xl mx-auto text-lg lg:text-xl text-zinc-400 mb-10"
            >
              Blue Line IQ turns live game action into actionable coaching plans. 
              Track stats, dictate tactical notes, and generate practice plans in seconds.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
            >
              <MagneticButton>
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 btn-premium group rounded-full" onClick={handleLogin}>
                  Request Early Access
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white btn-premium rounded-full flex flex-col items-center justify-center group/demo" onClick={enterDemo}>
                  <span className="text-lg font-bold">Explore the Pulse</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60 font-medium -mt-0.5">Interactive Demo</span>
                </Button>
              </MagneticButton>
            </motion.div>
          </div>

          {/* Interactive Dashboard Block - Separated stacking context */}
          <div className="relative z-20 mt-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              onHoverStart={() => setIsDashboardHovered(true)}
              onHoverEnd={() => setIsDashboardHovered(false)}
              transition={{ 
                initial: { delay: 1, duration: 1 },
                animate: { delay: 1, duration: 1 }
              }}
              className="rounded-[2rem] p-1 relative isolation-auto group/preview"
              style={{ 
                transform: "translate3d(0,0,0)", 
                backfaceVisibility: "hidden",
                contain: "layout"
              }}
            >
              {/* Inner hover effect wrapper to prevent layout shift */}
              <motion.div
                style={{ 
                  transform: "translateY(var(--hover-y, 0))",
                  transition: "transform 0.3s ease-out",
                  '--hover-y': isDashboardHovered ? '-8px' : '0px'
                } as any}
                className="relative w-full h-full"
              >
                <div className="absolute inset-0 rounded-[2rem] bg-white/[0.03] border border-white/5 transition-colors duration-300 group-hover/preview:border-primary/30" />
                <div className="absolute -inset-4 rounded-[3rem] opacity-0 group-hover/preview:opacity-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_30px_0_hsla(var(--primary)/0.2)] transition-opacity duration-300 pointer-events-none" />
                <div className="relative z-10">
                  <DashboardPreview onEnterDemo={enterDemo} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <div className="relative z-10">
        <SocialProofStrip />
      </div>

      <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="py-24 relative overflow-hidden border-t border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-full uppercase tracking-widest text-[10px] font-black px-4 py-1 mb-4">Automated Workflow</Badge>
          <h2 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter text-white leading-none mb-6">From Bench to <span className="text-primary">Practice Plan</span></h2>
          <p className="text-zinc-500 max-w-2xl mx-auto font-medium italic mb-20">Blue Line IQ eliminates manual data entry. Our "Tactical Pulse" system automates your post-game reviews so you can focus on winning.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-[40px] left-[16.6%] right-[16.6%] h-[2px] bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 -translate-y-1/2 z-0">
              <div className="absolute inset-0 bg-primary/20 blur-[2px]" />
            </div>
            {[
              { step: "01", title: "Live Bench Mode", desc: "Tap tactical +/- during the game. Dictate tactical notes via AI Mic between shifts.", icon: Swords, color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/20" },
              { step: "02", title: "Auto-Scoring", desc: "Exit the bench and see your scores already calculated. One click to save the review.", icon: Zap, color: "text-emerald-400", bg: "bg-emerald-400/5", border: "border-emerald-400/20" },
              { step: "03", title: "Practice Architect", desc: "AI identifies your weakest concepts and generates a practice plan targeting those exact gaps.", icon: Brain, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" }
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="relative z-10 space-y-6 group flex flex-col items-center text-center">
                <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center border shadow-2xl transition-all duration-500 group-hover:scale-110", item.bg, item.border)}>
                  <item.icon className={cn("w-10 h-10", item.color)} />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn("text-[10px] font-black italic", item.color)}>{item.step}</span>
                    <h3 className="text-xl font-bold italic uppercase tracking-tight text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed font-medium italic max-w-[240px]">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="py-24 relative overflow-hidden z-10">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full animate-float-3 -z-10" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[80px] rounded-full animate-float-1 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl mb-4 heading-premium">Powerful Tools for the Rink</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Everything you need to manage your team and drive player development.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Swords className="text-primary" />, title: "Live Bench Mode", description: "Record goals, shots, and tactical execution in real-time with a high-contrast bench interface." },
              { icon: <Mic className="text-emerald-400" />, title: "AI Coach's Mic", description: "Dictate observations and scouting reports. AI refines and tags them to tactical concepts automatically." },
              { icon: <FileText className="text-amber-400" />, title: "Rematch Briefings", description: "Generate professional scouting reports for rematches, aggregating every note and pulse score." },
              { icon: <TrendingUp className="text-blue-400" />, title: "Tactical Pulse", description: "Visualize team performance across 6 core concepts. Watch trends evolve as you track more games." },
              { icon: <Users className="text-indigo-400" />, title: "Staff Intelligence", description: "Collaborate with your entire staff. Everyone sees the same live data and scouting intel." },
              { icon: <Target className="text-red-400" />, title: "Practice Architect", description: "Close the gap between identifying a problem and training the solution with AI practice generation." }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <SeasonImpactStats />
      <TestimonialSection />
      <FAQSection />

      <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="py-32 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full animate-pulse-soft -z-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">Your next win starts <br /><span className="text-primary">before the puck drops.</span></h2>
            <p className="text-zinc-400 text-lg md:text-xl font-medium italic max-w-2xl mx-auto">Join the elite coaching staff using automated intelligence to drive player development.</p>
          </div>
          <div className="max-w-md mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative flex p-1 bg-zinc-900 rounded-full border border-white/10 backdrop-blur-xl">
              <input type="email" placeholder="Enter your email" className="flex-1 bg-transparent border-none focus:ring-0 px-6 text-sm text-white placeholder:text-zinc-600 font-medium" />
              <MagneticButton><Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 rounded-full shrink-0">Request Early Access</Button></MagneticButton>
            </div>
          </div>
        </div>
      </motion.section>

      <footer className="py-12 border-t border-white/5 bg-[#0a0a0c] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 pb-[var(--safe-area-bottom)]">
          <div className="flex items-center gap-2 opacity-50 grayscale"><img src={logoUrl} alt="Blue Line IQ" className="h-6 w-auto" loading="lazy" /></div>
          <p className="text-zinc-500 text-sm">&copy; {new Date().getFullYear()} Blue Line IQ. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
