import { useState } from 'react'
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Textarea,
  toast,
  Badge
} from '@blinkdotnew/ui'
import { Sparkles, FileText, Save, RefreshCw, Trophy, Target, Brain, Loader2 } from 'lucide-react'
import { blink } from '@/blink/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCoachMessages } from '@/hooks/useCoachMessages'
import type { Game, GameReview } from '@/types'
import { cn } from '@/lib/utils'

interface PostGameReportGeneratorProps {
  game: Game
  review?: GameReview | null
  onSave: (summary: string) => void
}

export function PostGameReportGenerator({ game, review, onSave }: PostGameReportGeneratorProps) {
  const [isGenerating, setIsProcessing] = useState(false)
  const [summary, setSummary] = useState(review?.summary || '')
  const queryClient = useQueryClient()
  const { sendMessage } = useCoachMessages('general')

  const generateReport = async () => {
    setIsProcessing(true)
    try {
      const prompt = `Generate a professional post-game tactical report for a hockey game.
      
      Game Details:
      Opponent: ${game.opponent}
      Score: ${game.goalsFor} - ${game.goalsAgainst}
      Shots: ${game.shotsFor} - ${game.shotsAgainst}
      Status: ${game.goalsFor! > game.goalsAgainst! ? 'Win' : game.goalsFor! < game.goalsAgainst! ? 'Loss' : 'Tie'}
      
      Staff Ratings (1-5):
      Breakouts: ${review?.breakoutsRating || 'N/A'}
      Forecheck: ${review?.forecheckRating || 'N/A'}
      D-Zone: ${review?.defensiveZoneRating || 'N/A'}
      Zone Entry: ${review?.zoneEntryRating || 'N/A'}
      Offensive Zone: ${review?.offensiveZoneRating || 'N/A'}
      Passing: ${review?.passingRating || 'N/A'}
      Skating: ${review?.skatingRating || 'N/A'}
      
      Coach's Raw Notes:
      ${review?.notes || 'No specific notes recorded.'}
      
      Format the report with these sections:
      1. Executive Summary (High-level outcome and vibe)
      2. Tactical Performance (Analysis of the ratings)
      3. Key Highlights (What worked well)
      4. Areas for Growth (What to focus on in next practice)
      
      Keep it concise, professional, and tactical.`

      const { text } = await blink.ai.generateText({
        model: 'google/gemini-3-flash',
        prompt
      })

      setSummary(text)
      toast.success('Report generated successfully')
    } catch (error) {
      console.error('Failed to generate report:', error)
      toast.error('Failed to generate report using AI')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFinalize = () => {
    if (!summary.trim()) {
      toast.error('No report to save. Generate a report first.')
      return
    }
    onSave(summary)
    
    // Share to Locker Room Talk — fire and forget, never block save
    try {
      sendMessage(`The Post-Game Report for the game vs ${game.opponent} is now finalized.`, JSON.stringify({
        type: 'post_game_report',
        gameId: game.id,
        opponent: game.opponent,
        score: `${game.goalsFor}-${game.goalsAgainst}`,
        summary: summary.slice(0, 200) + '...'
      }))
    } catch (err) {
      // Non-critical — don't block the save
      console.warn('Could not broadcast report to locker room:', err)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/5">
      <CardHeader className="p-6 border-b border-primary/10 bg-primary/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tighter italic italic-700">AI Post-Game Report</CardTitle>
            <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">Automated Tactical Analysis</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateReport} 
          disabled={isGenerating}
          className="rounded-full gap-2 border-primary/30 text-primary hover:bg-primary/20"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {summary ? 'Regenerate' : 'Generate Report'}
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {!summary && !isGenerating ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
            <FileText className="w-12 h-12 text-primary/40" />
            <div className="space-y-1">
              <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">No Report Active</p>
              <p className="text-[10px] text-zinc-600 italic max-w-[240px]">
                Click the generate button to build a structured tactical summary based on your game data.
              </p>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 animate-pulse">Analyzing Performance Data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Textarea 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Tactical summary will appear here..."
                rows={12}
                className="rounded-[1.5rem] bg-zinc-950/40 border-white/5 italic text-sm leading-relaxed p-6"
              />
              <Badge variant="outline" className="absolute top-4 right-4 text-[8px] h-4 uppercase font-black rounded-full border-primary/30 text-primary bg-primary/5">
                AI Draft
              </Badge>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleFinalize} 
                className="rounded-full gap-2 shadow-lg shadow-primary/20 font-bold px-8"
              >
                <Save className="w-4 h-4" />
                Finalize & Share Report
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
