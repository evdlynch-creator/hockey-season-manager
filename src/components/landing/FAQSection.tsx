import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItemProps {
  question: string
  answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn(
      "border-b border-white/5 transition-colors",
      isOpen ? "bg-white/[0.02]" : "hover:bg-white/[0.01]"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-8 px-6 flex items-center justify-between text-left group"
      >
        <span className={cn(
          "text-lg font-bold tracking-tight transition-colors italic uppercase",
          isOpen ? "text-primary" : "text-zinc-200 group-hover:text-white"
        )}>
          {question}
        </span>
        <div className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ml-4",
          isOpen ? "bg-primary border-primary text-primary-foreground" : "border-white/10 text-zinc-500 group-hover:border-white/20"
        )}>
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-8 text-zinc-400 text-sm leading-relaxed font-medium italic">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection() {
  const faqs = [
    {
      question: "What leagues and levels does Blue Line IQ support?",
      answer: "Blue Line IQ is designed for competitive hockey at all levels—from high-performance youth and AAA programs up to USHL, NCAA, and professional leagues. The tactical concepts are fully customizable to match your program's specific systems."
    },
    {
      question: "Does it work on the bench during a game?",
      answer: "Yes. The 'Live Bench Mode' is built specifically for tablets and mobile devices with a high-contrast, large-button interface designed for the speed of the game. Coaches can track execution and dictate tactical notes between shifts without looking away from the play."
    },
    {
      question: "How does the practice plan generator work?",
      answer: "Our AI 'Practice Architect' analyzes the cumulative pulse scores from your game reviews. If the data shows a dip in 'D-Zone Coverage' or 'Zone Entries', the AI automatically prioritizes drills that target those specific weaknesses for your next session."
    },
    {
      question: "Can multiple coaches on my staff use it?",
      answer: "Absolutely. Blue Line IQ is built for staff collaboration. You can invite your assistants to your season, allowing everyone to see live data, contribute scouting notes, and review practice plans in real-time."
    },
    {
      question: "Is my data private and secure?",
      answer: "Security and privacy are core to Blue Line IQ. Your team's tactical data, scouting reports, and player notes are encrypted and isolated. You have full control over who on your staff has access to specific modules."
    }
  ]

  return (
    <section className="py-32 relative overflow-hidden z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest italic">
            <HelpCircle className="w-3 h-3" /> FAQ
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
            Common <span className="text-primary">Questions</span>
          </h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 backdrop-blur-sm overflow-hidden shadow-2xl"
        >
          {faqs.map((faq, i) => (
            <FAQItem key={i} {...faq} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
