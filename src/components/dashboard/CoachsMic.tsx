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
import { Mic, Square, Loader2, Sparkles, X, Brain } from 'lucide-react'
import { blink } from '@/blink/client'
import { CONCEPTS } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function CoachsMic() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [extractedConcepts, setExtractedConcepts] = useState<string[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const startRecording = async () => {
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
      
      // Extract concepts using AI
      const { object } = await blink.ai.generateObject({
        prompt: `Analyze this coach's note and identify which of the following tactical concepts it mentions: ${CONCEPTS.join(', ')}. Return them as an array. Note: "${text}"`,
        schema: {
          type: 'object',
          properties: {
            concepts: {
              type: 'array',
              items: { type: 'string', enum: CONCEPTS as any }
            }
          },
          required: ['concepts']
        }
      })
      
      setExtractedConcepts((object as any).concepts)
      setShowResult(true)
      
    } catch (error) {
      console.error('Processing failed:', error)
      toast.error('Failed to process voice note')
    } finally {
      setIsProcessing(false)
      chunksRef.current = []
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
            <DialogDescription className="text-zinc-400">
              Voice transcription processed by Blue Line IQ
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/5">
              <p className="text-sm italic leading-relaxed text-foreground">
                "{transcription}"
              </p>
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

          <div className="flex justify-end">
            <Button 
              className="rounded-full bg-primary font-bold px-6"
              onClick={() => setShowResult(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

