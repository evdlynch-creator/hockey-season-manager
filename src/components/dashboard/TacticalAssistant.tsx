import React, { useState, useRef, useEffect } from 'react'
import { useAgent, useBlinkAuth } from '@blinkdotnew/react'
import { 
  Button, 
  Card, 
  Input, 
  ScrollArea, 
  Avatar, 
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn
} from '@blinkdotnew/ui'
import { 
  Bot, 
  X, 
  Send, 
  MessageSquare, 
  TrendingUp, 
  ShieldAlert, 
  Zap,
  Loader2,
  Brain
} from 'lucide-react'
import { tacticalAgent } from '@/lib/agents'
import { motion, AnimatePresence } from 'framer-motion'
import { blink } from '@/blink/client'

export function TacticalAssistant() {
  const { isAuthenticated, isLoading: authLoading } = useBlinkAuth()
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    sendMessage,
    clearMessages
  } = useAgent({ 
    agent: tacticalAgent,
    onFinish: () => {
      scrollToBottom()
    }
  })

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const suggestedPrompts = [
    { label: 'Analyze Season Trends', icon: TrendingUp, text: 'Analyze our tactical performance trends across all games this season. Where are we improving and where are we stalling?' },
    { label: 'Defensive Gaps', icon: ShieldAlert, text: 'What are our primary defensive gaps based on the last 5 game reviews?' },
    { label: 'Practice Impact', icon: Zap, text: 'Which practice concepts have had the highest transfer rating to game performance recently?' }
  ]

  const handlePromptClick = (text: string) => {
    if (!isAuthenticated) {
      blink.auth.login(window.location.href)
      return
    }
    sendMessage(text)
  }

  const onOpenToggle = () => {
    if (!isAuthenticated && !isOpen) {
      blink.auth.login(window.location.href)
      return
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="fixed bottom-6 right-24 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] flex flex-col"
          >
            <Card className="flex-1 flex flex-col shadow-2xl border-white/10 bg-zinc-950/90 backdrop-blur-xl overflow-hidden rounded-[2rem]">
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tighter italic">Tactical Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Analyst Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   <Button variant="ghost" size="icon" onClick={() => clearMessages()} className="rounded-full hover:bg-white/5 h-8 w-8">
                    <Zap className="w-4 h-4 text-zinc-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/5 h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4">
                      <div className="p-4 rounded-full bg-primary/5 border border-primary/10">
                        <Bot className="w-12 h-12 text-primary/40" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-white uppercase tracking-widest">How can I help you today?</p>
                        <p className="text-xs text-zinc-500">I have access to your season data and can analyze tactical trends, practice impact, and team progression.</p>
                      </div>
                      <div className="w-full space-y-2 pt-4">
                        {suggestedPrompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handlePromptClick(prompt.text)}
                            className="w-full p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/20 transition-all text-left flex items-center gap-3 group"
                          >
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20">
                              <prompt.icon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors">{prompt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message, i) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex w-full gap-3",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="w-8 h-8 border border-primary/20 bg-primary/10 shrink-0">
                            <Brain className="w-4 h-4 text-primary" />
                          </Avatar>
                        )}
                        <div className={cn(
                          "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                          message.role === 'user' 
                            ? "bg-primary text-white rounded-tr-none font-medium" 
                            : "bg-white/5 border border-white/10 text-zinc-300 rounded-tl-none italic"
                        )}>
                          {message.content}
                          
                          {message.parts?.map((part, j) => (
                            part.type === 'tool-invocation' && (
                              <div key={j} className="mt-3 p-2 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[9px] font-mono text-primary/80 uppercase tracking-widest">
                                  {part.toolName === 'db_list' || part.toolName === 'db_get' ? 'Analyzing Season Data...' : 'Executing Tactical Scan...'}
                                </span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start gap-3">
                      <Avatar className="w-8 h-8 border border-white/10 bg-white/5 shrink-0">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </Avatar>
                      <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" />
                          <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!isAuthenticated) {
                      blink.auth.login(window.location.href)
                      return
                    }
                    handleSubmit(e)
                  }} 
                  className="p-4 bg-white/[0.02] border-t border-white/10"
                >
                  <div className="relative flex items-center">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask about your season trends..."
                      className="pr-12 h-12 bg-white/5 border-white/10 rounded-full focus-visible:ring-primary/30"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isLoading}
                      className="absolute right-1.5 h-9 w-9 rounded-full bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[9px] text-center text-zinc-600 mt-3 font-bold uppercase tracking-widest">
                    AI can make mistakes. Verify critical tactical decisions.
                  </p>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={onOpenToggle}
                className={cn(
                  "w-14 h-14 rounded-full shadow-2xl transition-all duration-500 p-0 border border-white/10",
                  isOpen 
                    ? "bg-zinc-800 text-white" 
                    : "bg-zinc-950 hover:bg-zinc-900 shadow-primary/10"
                )}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                    >
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="relative"
                    >
                      <Brain className="w-6 h-6 text-primary" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-zinc-950 animate-pulse" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-bold text-[10px] uppercase tracking-widest bg-black border-white/10">
            {isOpen ? "Close Assistant" : "Tactical Assistant (AI)"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
