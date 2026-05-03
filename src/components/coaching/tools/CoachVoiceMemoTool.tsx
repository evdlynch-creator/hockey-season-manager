import { useState, useRef, useEffect } from 'react'
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  toast,
  Badge
} from '@blinkdotnew/ui'
import { Mic, Square, Loader2, Play, Pause, Save, X } from 'lucide-react'
import { blink } from '@/blink/client'
import { cn } from '@/lib/utils'

interface CoachVoiceMemoToolProps {
  open: boolean
  onClose: () => void
  onShare: (text: string, audioUrl: string) => void
}

export function CoachVoiceMemoTool({ open, onClose, onShare }: CoachVoiceMemoToolProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState('')
  const [refinedText, setRefinedText] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = handleRecordingComplete
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      toast.error('Could not access microphone')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(track => track.stop())
    setIsRecording(false)
  }

  const handleRecordingComplete = async () => {
    setIsProcessing(true)
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const file = new File([audioBlob], `memo-${Date.now()}.webm`, { type: 'audio/webm' })
      
      // 1. Upload to storage
      const { url } = await blink.storage.upload(file)
      setAudioUrl(url)

      // 2. Transcribe
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(audioBlob)
      })
      const base64 = await base64Promise
      
      const { text } = await blink.ai.transcribeAudio({ audio: base64, language: 'en' })
      setTranscription(text)

      // 3. Refine
      const { object } = await blink.ai.generateObject({
        model: 'google/gemini-3-flash',
        prompt: `Clean up this coach's voice note. Remove filler words and improve clarity while keeping the tactical meaning. 
        Note: "${text}"`,
        schema: {
          type: 'object',
          properties: { refined: { type: 'string' } },
          required: ['refined']
        }
      })
      setRefinedText((object as any).refined)
    } catch (error) {
      toast.error('Failed to process voice note')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleShare = () => {
    if (!audioUrl || (!refinedText && !transcription)) return
    onShare(refinedText || transcription, audioUrl)
    setAudioUrl(null)
    setTranscription('')
    setRefinedText('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Coach's Mic
          </DialogTitle>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center justify-center space-y-6">
          {!audioUrl ? (
            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              )}
              <Button
                size="lg"
                className={cn(
                  "w-20 h-20 rounded-full shadow-2xl transition-all duration-500",
                  isRecording ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                )}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="p-4 rounded-2xl bg-secondary/10 border border-white/5 space-y-2">
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">AI Refined Note</p>
                <p className="text-sm italic leading-relaxed">"{refinedText || transcription}"</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <audio src={audioUrl} controls className="h-10 w-full" />
              </div>
            </div>
          )}
          
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest text-center">
            {isRecording ? "Recording active..." : isProcessing ? "AI Refining Thought..." : audioUrl ? "Note captured" : "Tap to record tactical thought"}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setAudioUrl(null); onClose(); }} className="rounded-full">Cancel</Button>
          {audioUrl && (
            <Button onClick={handleShare} className="rounded-full gap-2 shadow-lg shadow-primary/20">
              <Save className="w-4 h-4" /> Share Memo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
