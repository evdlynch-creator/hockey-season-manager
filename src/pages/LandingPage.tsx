import { Button } from '@blinkdotnew/ui'
import { blink } from '../blink/client'
import { useDemoMode } from '../hooks/useDemoData'
import logoUrl from '@/assets/blue-line-iq-logo.svg'
import heroUrl from '@/assets/hero.png'
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  ClipboardList,
  Swords,
  Users
} from 'lucide-react'

export default function LandingPage() {
  const { enterDemo } = useDemoMode()
  const handleLogin = () => {
    blink.auth.login(window.location.href)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Blue Line IQ" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={handleLogin}
            >
              Sign In
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-lg shadow-primary/20 transition-all active:scale-95"
              onClick={handleLogin}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background glow effects - Simplified to prevent glitching */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10 opacity-30" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
            <Trophy className="w-3 h-3" />
            Built for High-Performance Coaching
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 animate-fade-in [animation-delay:200ms] leading-[1.1]">
            Master Your Season with <br />
            <span className="text-shimmer">
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
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 transition-all active:scale-95 group"
              onClick={handleLogin}
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
              onClick={enterDemo}
            >
              Explore Interactive Demo
            </Button>
          </div>

          <div className="mt-20 relative group">
            {/* Background Glow for Preview */}
            <div className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
            
            {/* Dashboard Preview Container - Replaced image with mock UI cards */}
            <div 
              className="relative rounded-2xl border border-white/10 bg-[#0c0c0e] shadow-2xl shadow-black/80 overflow-hidden transition-all duration-500 group-hover:scale-[1.01] group-hover:border-primary/20 cursor-pointer"
              onClick={enterDemo}
            >
              {/* Browser Shell Mock */}
              <div className="h-11 border-b border-white/5 bg-white/[0.03] flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <div className="ml-4 h-6 w-48 bg-white/5 rounded-md" />
              </div>

              <div className="relative aspect-[16/10] bg-zinc-950 flex">
                {/* Mock Sidebar */}
                <div className="hidden md:flex w-56 border-r border-white/5 bg-white/[0.01] p-6 flex-col gap-8 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20" />
                    <div className="h-4 w-24 bg-white/10 rounded" />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="h-2 w-16 bg-white/5 rounded opacity-50" />
                      <div className="h-4 w-full bg-primary/10 rounded" />
                      <div className="h-4 w-full bg-white/5 rounded" />
                      <div className="h-4 w-full bg-white/5 rounded" />
                      <div className="h-4 w-full bg-white/5 rounded" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 md:p-10 space-y-10 overflow-hidden bg-zinc-900/50">
                  {/* Mock Content: Stats */}
                  <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                        <div className="h-3 w-1/2 bg-white/5 rounded" />
                        <div className="h-8 w-3/4 bg-white/10 rounded" />
                      </div>
                    ))}
                  </div>

                  {/* Mock Content: Large Chart Block */}
                  <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex-1">
                    <div className="flex items-center justify-between mb-8">
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-white/10 rounded" />
                        <div className="h-3 w-48 bg-white/5 rounded" />
                      </div>
                      <div className="h-8 w-24 bg-white/5 rounded" />
                    </div>
                    <div className="h-48 w-full flex items-end gap-3 px-4">
                      {[40, 70, 45, 90, 65, 80, 55, 85, 45, 75, 60, 95].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-primary/20 rounded-t-sm transition-all duration-500 group-hover:bg-primary/40"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mock Content: Bottom Row */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-4">
                      <div className="h-4 w-1/3 bg-white/10 rounded" />
                      <div className="space-y-3">
                        <div className="h-10 w-full bg-white/5 rounded" />
                        <div className="h-10 w-full bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-4">
                      <div className="h-4 w-1/3 bg-white/10 rounded" />
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/5" />
                        <div className="flex-1 space-y-2 py-2">
                          <div className="h-3 w-full bg-white/10 rounded" />
                          <div className="h-2 w-1/2 bg-white/5 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle Overlay to unify look */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-20 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────── */}
      <section className="py-24 bg-[#08080a] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Powerful Tools for the Rink</h2>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-primary/20 bg-zinc-900/50 p-10 lg:p-16 text-center shadow-2xl relative">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
            
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 italic">Ready to Level Up Your Coaching?</h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto">
              Join hundreds of coaches using Blue Line IQ to streamline their season and maximize player potential.
            </p>
            <Button 
              size="lg"
              className="h-16 px-12 text-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 transition-all active:scale-95 group"
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-primary/20 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
