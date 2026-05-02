import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Field, FieldLabel, FieldError,
  toast,
} from '@blinkdotnew/ui'
import { blink } from '@/blink/client'
import type { GameType } from '@/hooks/usePreferences'
import { gameSchema, type GameForm } from './schema'

interface CreateGameDialogProps {
  open: boolean
  onClose: () => void
  seasonId: string
  onSetType: (id: string, type: GameType, tournamentName?: string) => void
}

export function CreateGameDialog({
  open,
  onClose,
  seasonId,
  onSetType,
}: CreateGameDialogProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GameForm>({
    resolver: zodResolver(gameSchema),
    defaultValues: { opponent: '', date: '', time: '', location: 'home', status: 'scheduled', gameType: 'league', tournamentName: '' },
  })

  const locationVal = watch('location')
  const statusVal = watch('status')
  const gameTypeVal = watch('gameType')

  const mutation = useMutation({
    mutationFn: async (data: GameForm) => {
      const user = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')

      const id = crypto.randomUUID()
      await blink.db.games.create({
        id,
        seasonId,
        userId: user.id,
        opponent: data.opponent,
        date: data.date,
        gameTime: data.time ?? '',
        location: data.location,
        status: data.status,
        createdAt: new Date().toISOString(),
      })
      onSetType(id, data.gameType, data.tournamentName)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      toast.success('Game scheduled')
      reset()
      onClose()
    },
    onError: (e: Error) => toast.error('Failed to create game', { description: e.message }),
  })

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle>New Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 pt-2">
          <Field>
            <FieldLabel>Opponent</FieldLabel>
            <Input {...register('opponent')} placeholder="e.g. Bulldogs" className="rounded-full" />
            {errors.opponent && <FieldError>{errors.opponent.message}</FieldError>}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Date</FieldLabel>
              <Input type="date" {...register('date')} className="rounded-full" />
              {errors.date && <FieldError>{errors.date.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Time <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
              <Input type="time" {...register('time')} className="rounded-full" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Game Type</FieldLabel>
            <Select value={gameTypeVal} onValueChange={v => setValue('gameType', v as GameForm['gameType'])}>
              <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="league">League</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="exhibition">Exhibition</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {gameTypeVal === 'tournament' && (
            <Field>
              <FieldLabel>Tournament Name <span className="text-muted-foreground text-xs">(optional)</span></FieldLabel>
              <Input {...register('tournamentName')} placeholder="e.g. Spring Classic, City Cup…" className="rounded-full" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Location</FieldLabel>
              <Select value={locationVal} onValueChange={v => setValue('location', v as 'home' | 'away')}>
                <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusVal} onValueChange={v => setValue('status', v as GameForm['status'])}>
                <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="rounded-full">
              {mutation.isPending ? 'Creating…' : 'Schedule Game'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
