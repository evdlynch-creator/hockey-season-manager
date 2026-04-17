import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  format, addMonths, subMonths, addDays, addWeeks,
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
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h2 className="text-base font-semibold text-white">
          {format(monthCursor, 'MMMM')}{' '}
          <span className="text-primary">{format(monthCursor, 'yyyy')}</span>
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setMonthCursor(subMonths(monthCursor, 1))}
            className="w-6 h-6 rounded-md hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
            className="w-6 h-6 rounded-md hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-0 text-[10px] uppercase tracking-wider font-medium text-white/40 mb-0.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className={cn('text-center', (i === 5 || i === 6) && 'text-white/30')}>{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="space-y-0">
        {weeks.map(week => {
          const weekNum = getISOWeek(week[0])
          return (
            <div key={weekNum + '_' + week[0].toISOString()} className="grid grid-cols-7 gap-0 items-center">
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
                      'relative aspect-square flex items-center justify-center rounded-full text-[11px] tabular-nums transition-colors group',
                      !isCurrentMonth && 'text-white/25',
                      isCurrentMonth && !selected && !today && (isWeekend ? 'text-white/60' : 'text-white/85'),
                      today && !selected && 'text-primary font-semibold',
                      selected && 'bg-white text-black font-semibold',
                      !selected && 'hover:bg-white/10',
                    )}
                  >
                    {format(day, 'd')}
                    {hasEvent && !selected && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
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

  const zones = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = addDays(today, 1)
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 })
    const startOfNextWeek = addDays(endOfThisWeek, 1)
    const endOfNextWeek = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
    const endOfThisMonth = endOfMonth(today)
    const endOfNextMonth = endOfMonth(addMonths(today, 1))

    type Zone = { id: string; label: string; sub: string; days: { date: Date; label: string; events: CalendarEvent[] }[] }
    const zoneList: Zone[] = [
      { id: 'today', label: 'Today', sub: format(today, 'EEEE, MMM d'), days: [] },
      { id: 'thisWeek', label: 'This Week', sub: 'Rest of the week', days: [] },
      { id: 'nextWeek', label: 'Next Week', sub: format(startOfNextWeek, 'MMM d') + ' – ' + format(endOfNextWeek, 'MMM d'), days: [] },
      { id: 'thisMonth', label: 'Later This Month', sub: format(today, 'MMMM yyyy'), days: [] },
      { id: 'nextMonth', label: 'Next Month', sub: format(addMonths(today, 1), 'MMMM yyyy'), days: [] },
    ]

    const sortedKeys = [...eventsByDate.keys()].sort()
    for (const key of sortedKeys) {
      const d = parseISO(key)
      if (d < today) continue
      const events = eventsByDate.get(key) ?? []
      const dayLabel = isSameDay(d, today)
        ? 'Today'
        : isSameDay(d, tomorrow)
        ? 'Tomorrow'
        : format(d, 'EEE, MMM d')
      const day = { date: d, label: dayLabel, events }

      if (isSameDay(d, today)) zoneList[0].days.push(day)
      else if (d <= endOfThisWeek) zoneList[1].days.push(day)
      else if (d <= endOfNextWeek) zoneList[2].days.push(day)
      else if (d <= endOfThisMonth) zoneList[3].days.push(day)
      else if (d <= endOfNextMonth) zoneList[4].days.push(day)
    }

    return zoneList
  }, [eventsByDate])

  const totalUpcoming = useMemo(
    () => zones.reduce((acc, z) => acc + z.days.reduce((a, d) => a + d.events.length, 0), 0),
    [zones]
  )

  return (
    <div className="min-h-dvh w-full bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
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

        {/* Stacked: compact calendar on top, agenda below */}
        <div className="space-y-6">
          {/* Mini month — narrow, sits above the agenda */}
          <div className="rounded-xl bg-sidebar border border-sidebar-border p-3 max-w-xs">
            <MiniMonth cursor={cursor} setCursor={setCursor} eventDates={eventDates} />
          </div>

          {/* Agenda zones */}
          <div className="space-y-6 min-w-0">
            {totalUpcoming === 0 ? (
              <div className="text-center py-12 rounded-xl bg-sidebar border border-sidebar-border">
                <CalendarDays className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No upcoming events</p>
              </div>
            ) : (
              zones.map(zone => (
                <ZoneBlock
                  key={zone.id}
                  label={zone.label}
                  sub={zone.sub}
                  days={zone.days}
                  onOpen={openEvent}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ZoneBlock({
  label,
  sub,
  days,
  onOpen,
}: {
  label: string
  sub: string
  days: { date: Date; label: string; events: CalendarEvent[] }[]
  onOpen: (ev: CalendarEvent) => void
}) {
  const eventCount = days.reduce((a, d) => a + d.events.length, 0)
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div>
          <h2 className="text-lg font-semibold text-white">{label}</h2>
          <p className="text-xs text-white/40">{sub}</p>
        </div>
        <span className="text-xs text-white/40 tabular-nums">
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </span>
      </div>
      {eventCount === 0 ? (
        <div className="rounded-lg bg-sidebar/50 border border-sidebar-border px-4 py-3">
          <p className="text-sm text-white/30 italic">Nothing scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map(day => (
            <AgendaSection
              key={day.date.toISOString()}
              label={day.label}
              date={day.date}
              events={day.events}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  )
}
