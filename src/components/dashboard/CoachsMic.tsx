import React, { useState, useRef, useEffect } from 'react'
import { 
  Button, 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  toast,
  Badge,
} from '@blinkdotnew/ui'
import { Mic, Square, Loader2, Sparkles, X, Brain, User, ShieldAlert, Copy, Check, Save } from 'lucide-react'
import { blink } from '@/blink/client'
import { CONCEPTS } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface CoachsMicProps {
  onApplyNote?: (text: string, type: 'team' | 'opponent') => void
  gameId?: string
}

export function CoachsMic({ onApplyNote, gameId }: CoachsMicProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [refinedText, setRefinedText] = useState('')
  const [classification, setClassification] = useState<'our_team' | 'opponent' | 'general'>('general')
  const [extractedConcepts, setExtractedConcepts] = useState<string[]>([])
  const [hasCopied, setChecked] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const startRecording = async () => {
    if (!isAuthenticated) {
      toast.error('Authentication required', { 
        description: 'Please sign in to use the AI Coach\'s Mic features.' 
      })
      blink.auth.login(window.location.href)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      
      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }
      
      recorder.onstop = handleRecordingComplete
      recorder.start()
      setIsRecording(true)
      toast.success('Recording started...')
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Could not access microphone')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(track => track.stop())
    setIsRecording(false)
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const handleRecordingComplete = async () => {
    setIsProcessing(true)
    
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const base64 = await blobToBase64(audioBlob)
      
      const { text } = await blink.ai.transcribeAudio({
        audio: base64,
        language: 'en'
      })
      
      setTranscription(text)
      
      // Extract concepts and classify using AI
      const { object } = await blink.ai.generateObject({
        prompt: `Analyze this coach's tactical note. 
        1. Identify which tactical concepts it mentions: ${CONCEPTS.join(', ')}.
        2. Classify if this is primarily about "our_team" (how our team played), "opponent" (scouting tendencies/players), or "general".
        3. Provide a refined, professional version of the note (clean up filler words, um, uh, and improve clarity).
        
        Note: "${text}"`,
        schema: {
          type: 'object',
          properties: {
            concepts: {
              type: 'array',
              items: { type: 'string', enum: CONCEPTS as any }
            },
            classification: {
              type: 'string',
              enum: ['our_team', 'opponent', 'general']
            },
            refinedText: {
              type: 'string'
            }
          },
          required: ['concepts', 'classification', 'refinedText']
        }
      })
      
      const result = object as any
      setExtractedConcepts(result.concepts)
      setClassification(result.classification)
      setRefinedText(result.refinedText)
      setShowResult(true)
      
    } catch (error: any) {
      console.error('Processing failed:', error)
      const isAuthError = 
        error?.details?.originalError?.name === 'BlinkAuthError' || 
        error?.message?.includes('401') || 
        error?.message?.includes('Unauthorized')

      if (isAuthError) {
        toast.error('Session expired', { description: 'Please sign in again to use AI features.' })
        blink.auth.login(window.location.href)
      } else {
        toast.error('Failed to process voice note')
      }
    } finally {
      setIsProcessing(false)
      chunksRef.current = []
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(refinedText || transcription)
    setChecked(true)
    toast.success('Note copied to clipboard')
    setTimeout(() => setChecked(false), 2000)
  }

  const handleApply = (type: 'team' | 'opponent') => {
    if (onApplyNote) {
      onApplyNote(refinedText || transcription, type)
      setShowResult(false)
      toast.success(`Applied to ${type === 'team' ? 'Team' : 'Opponent'} Notes`)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className={cn(
                  "w-14 h-14 rounded-full shadow-2xl transition-all duration-500 p-0",
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                    : "bg-primary hover:bg-primary/90 shadow-primary/30"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-bold text-[10px] uppercase tracking-widest bg-black border-white/10">
            {isRecording ? "Stop Recording" : "Coach's Mic (AI)"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md bg-zinc-950/90 backdrop-blur-xl border-white/10 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl italic font-black uppercase tracking-tighter">
              <Brain className="w-5 h-5 text-primary" />
              Tactical Signal
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              {classification === 'our_team' ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-full flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Team Performance
                </Badge>
              ) : classification === 'opponent' ? (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 rounded-full flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" /> Opponent Scouting
                </Badge>
              ) : (
                <Badge variant="outline" className="text-zinc-500 border-zinc-500/20 rounded-full">
                  General Note
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Refined Insight</p>
              <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5 relative group/text">
                <p className="text-sm italic leading-relaxed text-foreground">
                  "{refinedText || transcription}"
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-0 group-hover/text:opacity-100 transition-opacity rounded-full h-8 w-8"
                  onClick={copyToClipboard}
                >
                  {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {extractedConcepts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Auto-Tagged Concepts</p>
                <div className="flex flex-wrap gap-2">
                  {extractedConcepts.map(c => (
                    <Badge key={c} className="bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-1">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {onApplyNote && (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  className="rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-bold gap-2 hover:bg-emerald-500/10"
                  onClick={() => handleApply('team')}
                >
                  <User className="w-4 h-4" /> Apply to Team
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-full border-amber-500/20 bg-amber-500/5 text-amber-400 font-bold gap-2 hover:bg-amber-500/10"
                  onClick={() => handleApply('opponent')}
                >
                  <ShieldAlert className="w-4 h-4" /> Apply to Opponent
                </Button>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              {!onApplyNote && (
                <Button 
                  variant="ghost"
                  className="rounded-full font-bold gap-2"
                  onClick={copyToClipboard}
                >
                  <Copy className="w-4 h-4" /> Copy Note
                </Button>
              )}
              <Button 
                className="rounded-full bg-primary font-bold px-8 shadow-lg shadow-primary/20"
                onClick={() => setShowResult(false)}
              >
                {onApplyNote ? 'Cancel' : 'Done'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
