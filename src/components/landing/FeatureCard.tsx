import React from 'react'

export function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-[2rem] border border-white/5 bg-zinc-900/30 transition-all duration-300 group hover:border-primary/30 hover:bg-white/[0.05] hover:-translate-y-2 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5),0_0_20px_0_hsla(var(--primary)/0.1)] cursor-default">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300 text-zinc-400 group-hover:text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
