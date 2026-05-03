import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  format, addMonths, subMonths, addDays, addWeeks,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, isToday, parseISO, getISOWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Circle, ArrowLeft } from 'lucide-react'
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

export function formatEventTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

// ── Mini month ───────────────────────────────────────────────────────────────

function MiniMonth({
  cursor,
  onSelectDate,
  eventDates,
  view,
  setView,
}: {
  cursor: Date
  onSelectDate: (d: Date) => void
  eventDates: Set<string>
  view: 'week' | 'month'
  setView: (v: 'week' | 'month') => void
}) {
  const [monthCursor, setMonthCursor] = useState(cursor)

  // Keep monthCursor in sync when cursor changes externally
  useEffect(() => {
    setMonthCursor(cursor)
  }, [cursor])

  const weeks = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(monthCursor, { weekStartsOn: 1 })
      const week: Date[] = []
      for (let i = 0; i < 7; i++) week.push(addDays(start, i))
      return [week]
    }
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
  }, [monthCursor, view])

  const goPrev = () => setMonthCursor(view === 'week' ? addDays(monthCursor, -7) : subMonths(monthCursor, 1))
  const goNext = () => setMonthCursor(view === 'week' ? addDays(monthCursor, 7) : addMonths(monthCursor, 1))

  const wkStart = startOfWeek(monthCursor, { weekStartsOn: 1 })
  const wkEnd = addDays(wkStart, 6)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-0.5 gap-3">
        <h2 className="text-base font-semibold truncate">
          {view === 'week' ? (
            <span className="text-white tabular-nums">
              {format(wkStart, 'MMM d')} – {format(wkEnd, 'MMM d, yyyy')}
            </span>
          ) : (
            <>
              <span className="text-white">{format(monthCursor, 'MMMM')}</span>{' '}
              <span className="text-primary">{format(monthCursor, 'yyyy')}</span>
            </>
          )}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center rounded-full bg-white/5 p-0.5">
            <button
              onClick={() => setView('week')}
              className={cn(
                'px-2 py-0.5 text-[11px] font-medium rounded transition-colors',
                view === 'week' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={cn(
                'px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors',
                view === 'month' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
              )}
            >
              Month
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={goPrev}
              className="w-6 h-6 rounded-full hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
              aria-label={view === 'week' ? 'Previous week' : 'Previous month'}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={goNext}
              className="w-6 h-6 rounded-full hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
              aria-label={view === 'week' ? 'Next week' : 'Next month'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
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
                const todayDay = isToday(day)
                const hasEvent = eventDates.has(format(day, 'yyyy-MM-dd'))
                const dow = day.getDay()
                const isWeekend = dow === 0 || dow === 6

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onSelectDate(day)}
                    className={cn(
                      'relative aspect-square flex items-center justify-center rounded-full text-[11px] tabular-nums transition-colors',
                      !isCurrentMonth && 'text-white/25',
                      isCurrentMonth && !selected && !todayDay && (isWeekend ? 'text-white/60' : 'text-white/85'),
                      todayDay && !selected && 'text-primary font-semibold',
                      selected && 'bg-primary text-primary-foreground font-semibold',
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

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({ ev, onOpen }: { ev: CalendarEvent; onOpen: (ev: CalendarEvent) => void }) {
  const timeStr = ev.kind === 'game' && ev.data.gameTime
    ? formatEventTime(ev.data.gameTime)
    : (ev.kind === 'practice' && ev.data.practiceTime ? formatEventTime(ev.data.practiceTime) : null)

  return (
    <button
      onClick={() => onOpen(ev)}
      className="w-full text-left rounded-full p-3 transition-colors flex items-start gap-3 hover:bg-white/5"
    >
      <Circle className={cn('w-2.5 h-2.5 shrink-0 mt-1.5 fill-current', eventDotClass(ev))} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/50 truncate">
          {ev.kind === 'practice'
            ? `Practice${timeStr ? ` · ${timeStr}` : ''}`
            : `Game · ${ev.data.location === 'home' ? 'Home' : 'Away'}${timeStr ? ` · ${timeStr}` : ''}`}
        </p>
        <p className="text-base font-semibold text-white/95 truncate">{eventTitle(ev)}</p>
      </div>
    </button>
  )
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({
  date,
  events,
  onOpen,
  onBack,
}: {
  date: Date
  events: CalendarEvent[]
  onOpen: (ev: CalendarEvent) => void
  onBack: () => void
}) {
  const label = isToday(date)
    ? 'Today'
    : format(date, 'EEEE, MMMM d')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Upcoming
        </button>
      </div>
      <div className="rounded-[2rem] bg-sidebar border border-sidebar-border overflow-hidden">
        <div className="flex items-baseline justify-between px-4 py-3 border-b border-sidebar-border">
          <h2 className="text-base font-semibold text-white">{label}</h2>
          <span className="text-xs text-primary tabular-nums">{format(date, 'MMM d, yyyy')}</span>
        </div>
        {events.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CalendarDays className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">Nothing scheduled</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {events.map(ev => <EventRow key={ev.data.id} ev={ev} onOpen={onOpen} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Zone block ────────────────────────────────────────────────────────────────

function ZoneBlock({
  label,
  sub,
  days,
  onOpen,
  compact,
}: {
  label: string
  sub: string
  days: { date: Date; label: string; events: CalendarEvent[] }[]
  onOpen: (ev: CalendarEvent) => void
  compact?: boolean
}) {
  const eventCount = days.reduce((a, d) => a + d.events.length, 0)
  if (eventCount === 0) return null

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div>
          <h2 className="text-lg font-semibold text-white">{label}</h2>
          <p className="text-xs text-primary tabular-nums">{sub}</p>
        </div>
        <span className="text-xs text-white/40 tabular-nums">
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </span>
      </div>
      {compact ? (
        <div className="rounded-[2rem] bg-sidebar border border-sidebar-border p-2 space-y-1">
          {days.flatMap(day => day.events).map(ev => (
            <EventRow key={ev.data.id} ev={ev} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] bg-sidebar border border-sidebar-border overflow-hidden">
          {days.map((day, i) => (
            <div key={day.date.toISOString()}>
              {i > 0 && <div className="border-t border-sidebar-border" />}
              <div className="px-4 pt-3 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  {day.label}
                </span>
              </div>
              <div className="p-2 pt-1 space-y-1">
                {day.events.map(ev => <EventRow key={ev.data.id} ev={ev} onOpen={onOpen} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const navigate = useNavigate()
  const { data: practices = [] } = usePractices()
  const { data: games = [] } = useGames()
  const [cursor, setCursor] = useState(new Date())
  const [calView, setCalView] = useState<'week' | 'month'>('week')
  const [dayFilter, setDayFilter] = useState<Date | null>(null)
  const agendaRef = useRef<HTMLDivElement>(null)

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

  const handleSelectDate = (d: Date) => {
    setCursor(d)
    setDayFilter(d)
    // Scroll agenda into view smoothly
    setTimeout(() => agendaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

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

    type Zone = { id: string; label: string; sub: string; compact?: boolean; days: { date: Date; label: string; events: CalendarEvent[] }[] }
    const zoneList: Zone[] = [
      { id: 'today', label: 'Today', sub: format(today, 'MMMM d, yyyy'), compact: true, days: [] },
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
        : format(d, 'EEEE, MMM do')
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

  const dayFilterKey = dayFilter ? format(dayFilter, 'yyyy-MM-dd') : null
  const dayFilterEvents = dayFilterKey ? (eventsByDate.get(dayFilterKey) ?? []) : []

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
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors"
            aria-label="New event"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Mini calendar */}
          <div className="rounded-[2rem] bg-sidebar border border-sidebar-border p-4 sm:p-5">
            <MiniMonth
              cursor={cursor}
              onSelectDate={handleSelectDate}
              eventDates={eventDates}
              view={calView}
              setView={setCalView}
            />
          </div>

          {/* Agenda area */}
          <div ref={agendaRef} className="space-y-6 min-w-0 scroll-mt-4">
            {dayFilter ? (
              // ── Day filter view ──
              <DayView
                date={dayFilter}
                events={dayFilterEvents}
                onOpen={openEvent}
                onBack={() => {
                  setDayFilter(null)
                  setCursor(new Date())
                }}
              />
            ) : totalUpcoming === 0 ? (
              // ── Empty state ──
              <div className="text-center py-12 rounded-[2rem] bg-sidebar border border-sidebar-border">
                <CalendarDays className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No upcoming events</p>
              </div>
            ) : (
              // ── Zone view ──
              zones.map(zone => (
                <ZoneBlock
                  key={zone.id}
                  label={zone.label}
                  sub={zone.sub}
                  days={zone.days}
                  onOpen={openEvent}
                  compact={zone.compact}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
