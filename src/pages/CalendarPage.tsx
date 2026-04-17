import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  format, addMonths, subMonths, addDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, isToday, parseISO, getISOWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Circle } from 'lucide-react'
import { usePractices } from '@/hooks/usePractices'
import { useGames } from '@/hooks/useGames'
import { cn } from '@/lib/utils'
import type { Practice, Game } from '@/types'

type CalendarEvent =
  | { kind: 'practice'; data: Practice; date: Date }
  | { kind: 'game'; data: Game; date: Date }

// ── Helpers ──────────────────────────────────────────────────────────────────

function eventTitle(ev: CalendarEvent) {
  return ev.kind === 'practice' ? ev.data.title : `vs. ${ev.data.opponent}`
}

function eventDotClass(ev: CalendarEvent) {
  return ev.kind === 'practice' ? 'text-amber-500' : 'text-blue-500'
}

// ── Mini month ───────────────────────────────────────────────────────────────

function MiniMonth({
  cursor,
  setCursor,
  eventDates,
}: {
  cursor: Date
  setCursor: (d: Date) => void
  eventDates: Set<string>
}) {
  const [monthCursor, setMonthCursor] = useState(cursor)

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 })
    const days: Date[] = []
    let d = start
    while (d <= end) {
      days.push(d)
      d = addDays(d, 1)
    }
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return weeks
  }, [monthCursor])

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-2xl font-semibold text-white">
          {format(monthCursor, 'MMMM')}{' '}
          <span className="text-primary">{format(monthCursor, 'yyyy')}</span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonthCursor(subMonths(monthCursor, 1))}
            className="w-8 h-8 rounded-md hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
            className="w-8 h-8 rounded-md hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-8 gap-0 text-[11px] uppercase tracking-wider font-medium text-white/40 px-0.5 mb-1">
        <div className="text-center">CW</div>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className={cn('text-center', (i === 5 || i === 6) && 'text-white/30')}>{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="space-y-1">
        {weeks.map(week => {
          const weekNum = getISOWeek(week[0])
          return (
            <div key={weekNum + '_' + week[0].toISOString()} className="grid grid-cols-8 gap-0 items-center">
              <div className="text-center text-[11px] text-white/30 tabular-nums">
                {weekNum}
              </div>
              {week.map(day => {
                const isCurrentMonth = isSameMonth(day, monthCursor)
                const selected = isSameDay(day, cursor)
                const today = isToday(day)
                const hasEvent = eventDates.has(format(day, 'yyyy-MM-dd'))
                const dow = day.getDay()
                const isWeekend = dow === 0 || dow === 6

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setCursor(day)}
                    className={cn(
                      'relative aspect-square flex items-center justify-center rounded-full text-sm tabular-nums transition-colors group',
                      !isCurrentMonth && 'text-white/25',
                      isCurrentMonth && !selected && !today && (isWeekend ? 'text-white/60' : 'text-white/85'),
                      today && !selected && 'text-primary font-semibold',
                      selected && 'bg-white text-black font-semibold',
                      !selected && 'hover:bg-white/10',
                    )}
                  >
                    {format(day, 'd')}
                    {hasEvent && !selected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Agenda item ──────────────────────────────────────────────────────────────

function AgendaSection({
  label,
  date,
  events,
  onOpen,
  selectedId,
}: {
  label: string
  date: Date
  events: CalendarEvent[]
  onOpen: (ev: CalendarEvent) => void
  selectedId?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-white">{label}</span>
        <span className="text-xs text-white/40 tabular-nums">{format(date, 'dd/MM/yyyy')}</span>
      </div>
      <div className="space-y-1">
        {events.length === 0 ? (
          <p className="text-sm text-white/30 italic px-1 py-1">No events</p>
        ) : (
          events.map(ev => {
            const selected = ev.data.id === selectedId
            return (
              <button
                key={ev.data.id}
                onClick={() => onOpen(ev)}
                className={cn(
                  'w-full text-left rounded-lg p-3 transition-colors flex items-start gap-3 group',
                  selected ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'
                )}
              >
                <Circle
                  className={cn(
                    'w-2.5 h-2.5 shrink-0 mt-1.5 fill-current',
                    selected ? 'text-primary-foreground' : eventDotClass(ev)
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs font-medium truncate',
                    selected ? 'text-primary-foreground/80' : 'text-white/50'
                  )}>
                    {ev.kind === 'practice' ? 'Practice' : `Game · ${ev.data.location === 'home' ? 'Home' : 'Away'}`}
                  </p>
                  <p className={cn(
                    'text-base font-semibold truncate',
                    selected ? 'text-primary-foreground' : 'text-white/95'
                  )}>
                    {eventTitle(ev)}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const navigate = useNavigate()
  const { data: practices = [] } = usePractices()
  const { data: games = [] } = useGames()
  const [cursor, setCursor] = useState(new Date())

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const p of practices) {
      if (!p.date) continue
      const d = parseISO(p.date)
      const key = format(d, 'yyyy-MM-dd')
      const arr = map.get(key) ?? []
      arr.push({ kind: 'practice', data: p, date: d })
      map.set(key, arr)
    }
    for (const g of games) {
      if (!g.date) continue
      const d = parseISO(g.date)
      const key = format(d, 'yyyy-MM-dd')
      const arr = map.get(key) ?? []
      arr.push({ kind: 'game', data: g, date: d })
      map.set(key, arr)
    }
    return map
  }, [practices, games])

  const eventDates = useMemo(() => new Set(eventsByDate.keys()), [eventsByDate])

  const openEvent = (ev: CalendarEvent) => {
    if (ev.kind === 'practice') {
      navigate({ to: '/practices/$practiceId', params: { practiceId: ev.data.id } })
    } else {
      navigate({ to: '/games/$gameId', params: { gameId: ev.data.id } })
    }
  }

  const agendaDays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const result: { label: string; date: Date; events: CalendarEvent[] }[] = []
    const allDates = [...eventsByDate.keys()].sort()
    const futureDates = allDates
      .filter(k => parseISO(k) >= today)
      .slice(0, 6)

    const todayKey = format(today, 'yyyy-MM-dd')
    if (!futureDates.includes(todayKey)) futureDates.unshift(todayKey)

    for (const key of futureDates.slice(0, 6)) {
      const d = parseISO(key)
      let label: string
      if (isSameDay(d, today)) label = 'TODAY'
      else if (isSameDay(d, addDays(today, 1))) label = 'TOMORROW'
      else label = format(d, 'EEEE').toUpperCase()

      result.push({
        label,
        date: d,
        events: eventsByDate.get(key) ?? [],
      })
    }
    return result
  }, [eventsByDate])

  const selectedDayKey = format(cursor, 'yyyy-MM-dd')
  const selectedDayEvents = eventsByDate.get(selectedDayKey) ?? []

  return (
    <div className="min-h-dvh w-full bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Schedule</h1>
            <p className="text-sm text-white/50 mt-0.5">Practices and games at a glance</p>
          </div>
          <button
            onClick={() => navigate({ to: '/practices' })}
            className="w-9 h-9 rounded-md bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors"
            aria-label="New event"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Mini month */}
        <div className="rounded-xl bg-sidebar border border-sidebar-border p-4 sm:p-5 mb-6">
          <MiniMonth cursor={cursor} setCursor={setCursor} eventDates={eventDates} />
        </div>

        {/* Agenda */}
        <div className="space-y-6">
          {selectedDayEvents.length > 0 && !agendaDays.some(a => isSameDay(a.date, cursor)) && (
            <AgendaSection
              label={format(cursor, 'EEEE').toUpperCase()}
              date={cursor}
              events={selectedDayEvents}
              onOpen={openEvent}
            />
          )}
          {agendaDays.map(section => (
            <AgendaSection
              key={section.label + section.date.toISOString()}
              label={section.label}
              date={section.date}
              events={section.events}
              onOpen={openEvent}
              selectedId={isSameDay(section.date, cursor) ? selectedDayEvents[0]?.data.id : undefined}
            />
          ))}
          {agendaDays.length === 0 && (
            <div className="text-center py-12 rounded-xl bg-sidebar border border-sidebar-border">
              <CalendarDays className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">No upcoming events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
