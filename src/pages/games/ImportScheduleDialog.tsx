import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  toast,
  ScrollArea,
  Badge,
  Skeleton
} from '@blinkdotnew/ui'
import { FileUp, FileDown, AlertCircle, CheckCircle2, Loader2, Table } from 'lucide-react'
import { blink } from '@/blink/client'
import type { GameType } from '@/hooks/usePreferences'
import { cn } from '@/lib/utils'

interface ImportScheduleDialogProps {
  open: boolean
  onClose: () => void
  seasonId: string
  onSetType: (id: string, type: GameType, tournamentName?: string) => void
}

interface ParsedGame {
  id: string
  opponent: string
  date: string
  time: string
  location: 'home' | 'away'
  gameType: GameType
  tournamentName: string
  status: 'scheduled' | 'completed' | 'reviewed'
}

const EXPECTED_HEADERS = ['Date', 'Time', 'Opponent', 'Location', 'Type', 'Tournament']

export function ImportScheduleDialog({
  open,
  onClose,
  seasonId,
  onSetType,
}: ImportScheduleDialogProps) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedGames, setParsedGames] = useState<ParsedGame[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file')
        return
      }
      setFile(selectedFile)
      parseCsv(selectedFile)
    }
  }

  const parseCsv = async (file: File) => {
    setIsParsing(true)
    setErrors([])
    setParsedGames([])

    try {
      // 1. Upload to storage to get a URL for the Data extraction service
      const { publicUrl } = await blink.storage.upload(
        file, 
        `imports/${Date.now()}-${file.name}`
      )

      // 2. Use Data service to extract text (it handles CSV structure well)
      const csvText = await blink.data.extractFromUrl(publicUrl)
      
      // Basic manual parsing of the CSV text
      const rows = csvText.split('\n').map(row => 
        row.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'))
      ).filter(row => row.length > 1 && row.some(cell => cell.length > 0))

      if (rows.length < 2) {
        setErrors(['The CSV file appears to be empty or missing data.'])
        return
      }

      const headers = rows[0].map(h => h.toLowerCase())
      const gameRows = rows.slice(1)

      const games: ParsedGame[] = []
      const parseErrors: string[] = []

      gameRows.forEach((row, index) => {
        const rowNum = index + 2
        const getVal = (header: string) => {
          const idx = headers.indexOf(header.toLowerCase())
          return idx !== -1 ? row[idx] : ''
        }

        const opponent = getVal('Opponent')
        const dateStr = getVal('Date')
        const time = getVal('Time')
        const locationRaw = getVal('Location').toLowerCase()
        const typeRaw = getVal('Type').toLowerCase()
        const tournament = getVal('Tournament')

        if (!opponent) parseErrors.push(`Row ${rowNum}: Opponent is missing`)
        if (!dateStr) parseErrors.push(`Row ${rowNum}: Date is missing`)

        // Basic date validation/normalization (YYYY-MM-DD)
        let normalizedDate = dateStr
        if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          // Try to handle common formats like MM/DD/YYYY
          const parts = dateStr.split(/[/.-]/)
          if (parts.length === 3) {
            if (parts[2].length === 4) { // MM/DD/YYYY
              normalizedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
            } else if (parts[0].length === 4) { // YYYY/MM/DD
              normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
            }
          }
        }

        const location: 'home' | 'away' = locationRaw.includes('away') ? 'away' : 'home'
        let gameType: GameType = 'league'
        if (typeRaw.includes('tournament')) gameType = 'tournament'
        else if (typeRaw.includes('exhibition')) gameType = 'exhibition'

        games.push({
          id: crypto.randomUUID(),
          opponent,
          date: normalizedDate,
          time: time || '',
          location,
          gameType,
          tournamentName: tournament || '',
          status: 'scheduled'
        })
      })

      if (parseErrors.length > 0) {
        setErrors(parseErrors)
      } else {
        setParsedGames(games)
      }

      // Cleanup temporary file
      await blink.storage.remove(publicUrl.split('/').pop()!)
    } catch (err: any) {
      console.error('CSV Parsing Error:', err)
      setErrors([`Failed to parse CSV: ${err.message}`])
    } finally {
      setIsParsing(false)
    }
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      // Create games sequentially or in parallel
      await Promise.all(parsedGames.map(async (g) => {
        await blink.db.games.create({
          id: g.id,
          seasonId,
          userId: user.id,
          opponent: g.opponent,
          date: g.date,
          gameTime: g.time,
          location: g.location,
          status: g.status,
          createdAt: new Date().toISOString(),
        })
        onSetType(g.id, g.gameType, g.tournamentName)
      }))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      toast.success(`Successfully imported ${parsedGames.length} games`)
      handleReset()
      onClose()
    },
    onError: (e: Error) => toast.error('Failed to import schedule', { description: e.message }),
  })

  const handleReset = () => {
    setFile(null)
    setParsedGames([])
    setErrors([])
    setIsParsing(false)
  }

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      EXPECTED_HEADERS.join(',') + "\n" +
      "2024-11-15,19:30,Bulldogs,Home,League,\n" +
      "2024-11-20,18:00,Springfield Tigers,Away,Tournament,Spring Classic\n" +
      "2024-11-25,20:15,Hawks,Home,Exhibition,"
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "schedule_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { handleReset(); onClose() } }}>
      <DialogContent className="max-w-2xl rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            Import Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!file && !isParsing && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2rem] p-12 text-center space-y-4 hover:border-primary/50 transition-colors bg-secondary/5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Table className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Upload Regular Season CSV</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Upload your schedule to automatically create all games for this season.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={downloadTemplate}>
                  <FileDown className="w-4 h-4" />
                  Download Template
                </Button>
                <Button variant="default" size="sm" className="rounded-full gap-2 relative">
                  <FileUp className="w-4 h-4" />
                  Choose CSV File
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                  />
                </Button>
              </div>
            </div>
          )}

          {isParsing && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium animate-pulse">Analyzing schedule data...</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-[2rem] p-6 space-y-3">
              <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                Data Validation Issues
              </div>
              <ul className="text-xs space-y-1 list-disc list-inside text-destructive/80">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {errors.length > 5 && <li>...and {errors.length - 5} more errors</li>}
              </ul>
              <Button variant="outline" size="sm" className="rounded-full mt-2" onClick={handleReset}>
                Try Again
              </Button>
            </div>
          )}

          {parsedGames.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-sm font-bold">{parsedGames.length} games detected</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs rounded-full h-8" onClick={handleReset}>
                  Replace File
                </Button>
              </div>

              <ScrollArea className="h-[300px] border border-border rounded-[1.5rem] bg-secondary/5">
                <div className="p-4 space-y-2">
                  {parsedGames.map((game, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate">vs. {game.opponent}</p>
                          <Badge variant="outline" className="text-[10px] h-4 px-1 rounded-full uppercase">
                            {game.gameType}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                          {game.date} {game.time && `• ${game.time}`} • {game.location}
                        </p>
                      </div>
                      {game.tournamentName && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] rounded-full shrink-0">
                          {game.tournamentName}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { handleReset(); onClose() }} className="rounded-full">
            Cancel
          </Button>
          <Button 
            onClick={() => importMutation.mutate()} 
            disabled={parsedGames.length === 0 || importMutation.isPending}
            className="rounded-full gap-2 shadow-lg shadow-primary/20"
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
