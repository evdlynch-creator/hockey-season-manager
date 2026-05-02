import { Button } from '@blinkdotnew/ui'
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
  Target
} from 'lucide-react'
import { DashboardPreview } from '../components/landing/DashboardPreview'
import { FeatureCard } from '../components/landing/FeatureCard'

export default function LandingPage() {
  const { enterDemo } = useDemoMode()

  const handleLogin = () => {
    blink.auth.login(window.location.href)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden relative">
      {/* ── Background Floating Blobs ────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Large pulsing primary blobs with color shifting */}
        <div className="absolute top-[-10%] left-[-15%] w-[100vw] h-[100vw] bg-primary/40 blur-[200px] rounded-full animate-float-1 animate-blob-pulse" style={{ opacity: 0.8 }} />
        <div className="absolute bottom-[-30%] right-[-10%] w-[110vw] h-[110vw] bg-blue-600/30 blur-[180px] rounded-full animate-float-2 animate-blob-pulse" style={{ animationDelay: '-7s', opacity: 0.7 }} />
        
        {/* Dynamic Accent Blobs */}
        <div className="absolute top-[20%] right-[-15%] w-[80vw] h-[80vw] bg-cyan-500/25 blur-[160px] rounded-full animate-float-3 animate-blob-pulse" style={{ animationDelay: '-12s', opacity: 0.6 }} />
        <div className="absolute top-[50%] left-[-15%] w-[70vw] h-[70vw] bg-blue-400/20 blur-[140px] rounded-full animate-float-4 animate-blob-pulse" style={{ animationDelay: '-4s', opacity: 0.5 }} />
        
        {/* Moving Indigo Accent */}
        <div className="absolute bottom-[20%] left-[10%] w-[75vw] h-[75vw] bg-indigo-500/25 blur-[170px] rounded-full animate-float-1 animate-blob-pulse" style={{ animationDelay: '-18s', opacity: 0.6 }} />
        
        {/* Sky Blue Highlight */}
        <div className="absolute top-[5%] left-[35%] w-[60vw] h-[60vw] bg-sky-400/25 blur-[130px] rounded-full animate-float-3 animate-blob-pulse" style={{ animationDelay: '-25s', opacity: 0.5 }} />

        {/* New Layer: Smaller random pulses for extra depth */}
        <div className="absolute top-[40%] right-[30%] w-[40vw] h-[40vw] bg-primary/15 blur-[110px] rounded-full animate-blob-pulse" style={{ animationDelay: '-2s', opacity: 0.4 }} />
        <div className="absolute bottom-[10%] left-[40%] w-[45vw] h-[45vw] bg-blue-500/15 blur-[130px] rounded-full animate-blob-pulse" style={{ animationDelay: '-5s', opacity: 0.4 }} />

        {/* Central Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vh] bg-primary/10 blur-[250px] rounded-full opacity-60" />

        {/* Random Sparkles */}
        <div className="absolute top-[15%] left-[30%] w-4 h-4 bg-primary blur-md rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[65%] right-[20%] w-6 h-6 bg-blue-400 blur-lg rounded-full animate-pulse opacity-30" style={{ animationDelay: '2.5s' }} />
        <div className="absolute bottom-[35%] left-[45%] w-4 h-4 bg-primary blur-md rounded-full animate-pulse opacity-40" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[50%] left-[60%] w-5 h-5 bg-blue-300 blur-lg rounded-full animate-pulse opacity-25" style={{ animationDelay: '3.2s' }} />
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Blue Line IQ" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors btn-premium rounded-full"
              onClick={handleLogin}
            >
              Sign In
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-lg shadow-primary/20 btn-premium rounded-full"
              onClick={handleLogin}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in font-avega italic">
            <Trophy className="w-3 h-3" />
            Built for High-Performance Coaching
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 animate-fade-in [animation-delay:200ms] leading-[1.1]">
            Master Your Season with <br />
            <span className="heading-premium">
              Intelligence and Precision
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg lg:text-xl text-zinc-400 mb-10 animate-fade-in [animation-delay:400ms]">
            Track practices, analyze game performance, and visualize team trends. 
            The all-in-one dashboard designed for hockey coaches who demand more from their data.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:600ms]">
            <Button 
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 btn-premium group rounded-full"
              onClick={handleLogin}
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white btn-premium rounded-full"
              onClick={enterDemo}
            >
              Explore Interactive Demo
            </Button>
          </div>

          <div className="hover-glow rounded-[2rem] p-1 mt-20 transition-all duration-500">
            <DashboardPreview onEnterDemo={enterDemo} />
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────── */}
      <section className="py-24 bg-[#08080a] relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full animate-float-3 -z-10" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[80px] rounded-full animate-float-1 -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl mb-4 heading-premium">Powerful Tools for the Rink</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Everything you need to manage your team and drive player development.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ClipboardList className="text-blue-400" />}
              title="Practice Planning"
              description="Build detailed practice segments, assign drill types, and track concept coverage."
            />
            <FeatureCard 
              icon={<Swords className="text-red-400" />}
              title="Game Analysis"
              description="Log game scores, shots, and penalties. Rate team performance across core concepts."
            />
            <FeatureCard 
              icon={<TrendingUp className="text-emerald-400" />}
              title="Visual Trends"
              description="Visualize your team's progression throughout the season with advanced analytics charts."
            />
            <FeatureCard 
              icon={<Users className="text-primary" />}
              title="Staff Collaboration"
              description="Invite assistant coaches and managers to collaborate on practice plans and reviews."
            />
            <FeatureCard 
              icon={<Target className="text-amber-400" />}
              title="Concept Tracking"
              description="Identify strengths and weaknesses by tracking performance across specific tactical concepts."
            />
            <FeatureCard 
              icon={<Shield className="text-indigo-400" />}
              title="Secure & Private"
              description="Your data is safe and accessible only to your authorized coaching staff."
            />
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full animate-float-1 -z-10 opacity-50" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full animate-float-3 -z-10 opacity-40" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-primary/20 bg-zinc-900/50 p-10 lg:p-16 text-center shadow-2xl relative overflow-hidden group hover-glow">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[80px] rounded-full animate-float-2 -z-10" />
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
            
            <h2 className="text-3xl lg:text-5xl mb-6 heading-premium">Ready to Level Up Your Coaching?</h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto group-hover:text-zinc-300 transition-colors">
              Join hundreds of coaches using Blue Line IQ to streamline their season and maximize player potential.
            </p>
            <Button 
              size="lg"
              className="h-16 px-12 text-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 btn-premium group rounded-full"
              onClick={handleLogin}
            >
              Get Started Now
              <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/5 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 opacity-50 grayscale">
              <img src={logoUrl} alt="Blue Line IQ" className="h-6 w-auto" />
            </div>
            <p className="text-zinc-500 text-sm">
              &copy; {new Date().getFullYear()} Blue Line IQ. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
