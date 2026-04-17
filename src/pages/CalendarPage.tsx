import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, isToday, parseISO, getISOWeek,
} from 'date-fns'
import { Button } from '@blinkdotnew/ui'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Circle } from 'lucide-react'
import { usePractices } from '@/hooks/usePractices'
import { useGames } from '@/hooks/useGames'
import { cn } from '@/lib/utils'
import type { Practice, Game } from '@/types'

type View = 'Day' | 'Week' | 'Month'

type CalendarEvent =
  | { kind: 'practice'; data: Practice; date: Date }
  | { kind: 'game'; data: Game; date: Date }

// ── Helpers ──────────────────────────────────────────────────────────────────

function eventTitle(ev: CalendarEvent) {
  return ev.kind === 'practice' ? ev.data.title : `vs. ${ev.data.opponent}`
}

function eventAccent(ev: CalendarEvent): 'amber' | 'blue' {
  // Practices = amber (primary), Games = blue (secondary accent)
  return ev.kind === 'practice' ? 'amber' : 'blue'
}

function eventDotClass(ev: CalendarEvent) {
  return eventAccent(ev) === 'amber' ? 'text-amber-500' : 'text-blue-500'
}

// Light-canvas inline palette (intentional exception to design system —
// this page is a "light island" matching Apple Calendar's month canvas)
const LIGHT = {
  bg: '#FFFFFF',
  bgSoft: '#F8F8F8',
  border: '#E5E5E5',
  borderSoft: '#EFEFEF',
  text: '#111113',
  textMuted: '#8A8A8E',
  textSubtle: '#C4C4C6',
  todayBg: '#F4F4F5',
  weekendHeader: '#9A9A9F',
}

// ── Mini month (dark sidebar) ────────────────────────────────────────────────

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
    // Chunk into weeks
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return weeks
  }, [monthCursor])

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xl font-semibold text-white">
          {format(monthCursor, 'MMMM')}{' '}
          <span className="text-primary">{format(monthCursor, 'yyyy')}</span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonthCursor(subMonths(monthCursor, 1))}
            className="w-7 h-7 rounded-md hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
            className="w-7 h-7 rounded-md hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-8 gap-0 text-[10px] uppercase tracking-wider font-medium text-white/40 px-0.5 mb-1">
        <div className="text-center">CW</div>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className={cn('text-center', (i === 5 || i === 6) && 'text-white/30')}>{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="space-y-0.5">
        {weeks.map(week => {
          const weekNum = getISOWeek(week[0])
          return (
            <div key={weekNum + '_' + week[0].toISOString()} className="grid grid-cols-8 gap-0 items-center">
              <div className="text-center text-[10px] text-white/30 tabular-nums">
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
                      'relative aspect-square flex items-center justify-center rounded-full text-xs tabular-nums transition-colors group',
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

// ── Agenda item (sidebar) ────────────────────────────────────────────────────

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
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white">{label}</span>
        <span className="text-[11px] text-white/40 tabular-nums">{format(date, 'dd/MM/yyyy')}</span>
      </div>
      <div className="space-y-1">
        {events.length === 0 ? (
          <p className="text-xs text-white/30 italic px-1 py-1">No events</p>
        ) : (
          events.map(ev => {
            const selected = ev.data.id === selectedId
            return (
              <button
                key={ev.data.id}
                onClick={() => onOpen(ev)}
                className={cn(
                  'w-full text-left rounded-md p-2 transition-colors flex items-start gap-2.5 group',
                  selected ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'
                )}
              >
                <Circle
                  className={cn(
                    'w-2 h-2 shrink-0 mt-1 fill-current',
                    selected ? 'text-primary-foreground' : eventDotClass(ev)
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-[11px] font-medium truncate',
                    selected ? 'text-primary-foreground/80' : 'text-white/50'
                  )}>
                    {ev.kind === 'practice' ? 'Practice' : `Game · ${ev.data.location === 'home' ? 'Home' : 'Away'}`}
                  </p>
                  <p className={cn(
                    'text-sm font-semibold truncate',
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

// ── Event chip in month cell (light canvas) ──────────────────────────────────

function EventChip({ ev, onClick }: { ev: CalendarEvent; onClick: () => void }) {
  const isAmber = eventAccent(ev) === 'amber'
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-[11px] leading-tight flex items-center gap-1.5 hover:opacity-80 transition-opacity py-0.5 px-1 rounded"
      style={{ color: LIGHT.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: isAmber ? '#F59E0B' : '#3B82F6' }}
      />
      <span className="truncate font-medium">{eventTitle(ev)}</span>
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const navigate = useNavigate()
  const { data: practices = [] } = usePractices()
  const { data: games = [] } = useGames()
  const [cursor, setCursor] = useState(new Date())
  const [view, setView] = useState<View>('Month')

  // All events keyed by yyyy-MM-dd
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

  // Agenda: today + 4 upcoming days with events
  const agendaDays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const result: { label: string; date: Date; events: CalendarEvent[] }[] = []
    const allDates = [...eventsByDate.keys()].sort()
    const futureDates = allDates
      .filter(k => parseISO(k) >= today)
      .slice(0, 6)

    // Ensure today is always shown
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
    <div
      className="flex h-dvh md:h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: LIGHT.bg }}
    >
      {/* ── Dark sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-[300px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Plus button row */}
        <div className="flex justify-end p-3">
          <button
            onClick={() => navigate({ to: '/practices' })}
            className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-colors"
            aria-label="New event"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Mini month */}
        <div className="px-4 pb-4 border-b border-sidebar-border">
          <MiniMonth cursor={cursor} setCursor={setCursor} eventDates={eventDates} />
        </div>

        {/* Agenda */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Selected day always at top if it has events */}
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
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">No upcoming events</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Light canvas ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: LIGHT.bg, color: LIGHT.text }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-3 border-b shrink-0"
          style={{ borderColor: LIGHT.border, backgroundColor: LIGHT.bg }}
        >
          {/* Left: prev / today / next */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ backgroundColor: LIGHT.bgSoft }}
          >
            <button
              onClick={() => {
                if (view === 'Day') setCursor(subDays(cursor, 1))
                else if (view === 'Week') setCursor(subWeeks(cursor, 1))
                else setCursor(subMonths(cursor, 1))
              }}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white transition-colors"
              style={{ color: LIGHT.text }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="h-8 px-4 rounded-md text-sm font-medium hover:bg-white transition-colors"
              style={{ color: LIGHT.text }}
            >
              Today
            </button>
            <button
              onClick={() => {
                if (view === 'Day') setCursor(addDays(cursor, 1))
                else if (view === 'Week') setCursor(addWeeks(cursor, 1))
                else setCursor(addMonths(cursor, 1))
              }}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white transition-colors"
              style={{ color: LIGHT.text }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: view switcher */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ backgroundColor: LIGHT.bgSoft }}
          >
            {(['Day', 'Week', 'Month'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'h-8 px-5 rounded-md text-sm font-medium transition-all',
                )}
                style={{
                  backgroundColor: view === v ? LIGHT.bg : 'transparent',
                  color: LIGHT.text,
                  boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Right: title */}
          <div className="text-sm font-medium tabular-nums" style={{ color: LIGHT.text }}>
            {view === 'Month' && format(cursor, 'MMMM yyyy')}
            {view === 'Week' &&
              `${format(startOfWeek(cursor, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(cursor, { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
            {view === 'Day' && format(cursor, 'EEEE, MMM d, yyyy')}
          </div>
        </div>

        {/* View body */}
        <div className="flex-1 overflow-hidden">
          {view === 'Month' && <MonthGrid cursor={cursor} eventsByDate={eventsByDate} onOpen={openEvent} />}
          {view === 'Week' && <WeekView cursor={cursor} eventsByDate={eventsByDate} onOpen={openEvent} />}
          {view === 'Day' && <DayView cursor={cursor} eventsByDate={eventsByDate} onOpen={openEvent} />}
        </div>
      </main>
    </div>
  )
}

// ── Month grid (light canvas) ────────────────────────────────────────────────

function MonthGrid({
  cursor,
  eventsByDate,
  onOpen,
}: {
  cursor: Date
  eventsByDate: Map<string, CalendarEvent[]>
  onOpen: (ev: CalendarEvent) => void
}) {
  const { weeks } = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    const days: Date[] = []
    let d = start
    while (d <= end) {
      days.push(d)
      d = addDays(d, 1)
    }
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return { weeks }
  }, [cursor])

  const dowLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: LIGHT.bg }}>
      {/* Weekday header */}
      <div
        className="grid shrink-0 border-b"
        style={{
          gridTemplateColumns: '56px repeat(7, 1fr)',
          borderColor: LIGHT.border,
          backgroundColor: LIGHT.bg,
        }}
      >
        <div />
        {dowLabels.map(d => (
          <div
            key={d}
            className="text-[11px] font-semibold tracking-wider text-center py-3"
            style={{ color: LIGHT.weekendHeader }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {weeks.map((week, wi) => {
          const weekNum = getISOWeek(week[0])
          return (
            <div
              key={wi}
              className="grid flex-1 min-h-[120px]"
              style={{
                gridTemplateColumns: '56px repeat(7, 1fr)',
                borderBottom: wi < weeks.length - 1 ? `1px solid ${LIGHT.border}` : 'none',
              }}
            >
              {/* Week number gutter */}
              <div
                className="text-[11px] font-medium pt-2 text-center"
                style={{ color: LIGHT.textSubtle, borderRight: `1px solid ${LIGHT.borderSoft}` }}
              >
                CW {weekNum}
              </div>

              {week.map((day, di) => {
                const key = format(day, 'yyyy-MM-dd')
                const events = eventsByDate.get(key) ?? []
                const isCurrentMonth = isSameMonth(day, cursor)
                const today = isToday(day)
                const isFirstOfMonth = day.getDate() === 1

                return (
                  <div
                    key={day.toISOString()}
                    className="p-1.5 overflow-hidden flex flex-col min-w-0"
                    style={{
                      borderRight: di < 6 ? `1px solid ${LIGHT.borderSoft}` : 'none',
                      backgroundColor: today ? LIGHT.todayBg : 'transparent',
                    }}
                  >
                    {/* Date number */}
                    <div className="flex items-center justify-end mb-1 px-1">
                      {today ? (
                        <span
                          className="inline-flex items-center justify-center px-2 h-5 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: '#111113', color: '#FFFFFF' }}
                        >
                          {isFirstOfMonth ? `${format(day, 'd MMM')}` : format(day, 'd')}
                        </span>
                      ) : (
                        <span
                          className="text-[13px] tabular-nums"
                          style={{
                            color: !isCurrentMonth ? LIGHT.textSubtle : LIGHT.text,
                            fontWeight: isFirstOfMonth ? 600 : 400,
                          }}
                        >
                          {isFirstOfMonth ? format(day, 'd MMM') : format(day, 'd')}
                        </span>
                      )}
                    </div>

                    {/* Events */}
                    <div className="space-y-0.5 overflow-hidden">
                      {events.slice(0, 3).map(ev => (
                        <EventChip key={ev.data.id} ev={ev} onClick={() => onOpen(ev)} />
                      ))}
                      {events.length > 3 && (
                        <p className="text-[10px] px-1" style={{ color: LIGHT.textMuted }}>
                          +{events.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week view (light canvas) ─────────────────────────────────────────────────

function WeekView({
  cursor,
  eventsByDate,
  onOpen,
}: {
  cursor: Date
  eventsByDate: Map<string, CalendarEvent[]>
  onOpen: (ev: CalendarEvent) => void
}) {
  const days = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [cursor])

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: LIGHT.bg }}>
      <div
        className="grid shrink-0 border-b"
        style={{ gridTemplateColumns: 'repeat(7, 1fr)', borderColor: LIGHT.border }}
      >
        {days.map(d => {
          const today = isToday(d)
          return (
            <div
              key={d.toISOString()}
              className="text-center py-3 border-r last:border-r-0"
              style={{ borderColor: LIGHT.borderSoft }}
            >
              <p className="text-[11px] font-semibold tracking-wider" style={{ color: LIGHT.weekendHeader }}>
                {format(d, 'EEE').toUpperCase()}
              </p>
              <p
                className={cn('text-2xl font-semibold mt-0.5 tabular-nums')}
                style={{ color: today ? '#F59E0B' : LIGHT.text }}
              >
                {format(d, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      <div
        className="flex-1 grid overflow-y-auto"
        style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
      >
        {days.map((d, di) => {
          const key = format(d, 'yyyy-MM-dd')
          const events = eventsByDate.get(key) ?? []
          const today = isToday(d)
          return (
            <div
              key={d.toISOString()}
              className="p-3 space-y-2"
              style={{
                borderRight: di < 6 ? `1px solid ${LIGHT.borderSoft}` : 'none',
                backgroundColor: today ? LIGHT.todayBg : 'transparent',
                minHeight: 400,
              }}
            >
              {events.length === 0 ? (
                <p className="text-[11px] italic" style={{ color: LIGHT.textSubtle }}>No events</p>
              ) : (
                events.map(ev => (
                  <button
                    key={ev.data.id}
                    onClick={() => onOpen(ev)}
                    className="w-full text-left p-2 rounded-md text-xs font-medium transition-transform hover:scale-[1.02]"
                    style={{
                      backgroundColor: eventAccent(ev) === 'amber' ? '#FEF3C7' : '#DBEAFE',
                      color: eventAccent(ev) === 'amber' ? '#92400E' : '#1E3A8A',
                      borderLeft: `3px solid ${eventAccent(ev) === 'amber' ? '#F59E0B' : '#3B82F6'}`,
                    }}
                  >
                    <p className="uppercase text-[9px] tracking-wider font-semibold opacity-80">
                      {ev.kind === 'practice' ? 'Practice' : `Game · ${ev.data.location}`}
                    </p>
                    <p className="truncate mt-0.5">{eventTitle(ev)}</p>
                  </button>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Day view (light canvas) ──────────────────────────────────────────────────

function DayView({
  cursor,
  eventsByDate,
  onOpen,
}: {
  cursor: Date
  eventsByDate: Map<string, CalendarEvent[]>
  onOpen: (ev: CalendarEvent) => void
}) {
  const key = format(cursor, 'yyyy-MM-dd')
  const events = eventsByDate.get(key) ?? []

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: LIGHT.bg }}>
      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-wider" style={{ color: LIGHT.weekendHeader }}>
            {format(cursor, 'EEEE').toUpperCase()}
          </p>
          <h2 className="text-4xl font-bold mt-1" style={{ color: LIGHT.text }}>
            {format(cursor, 'MMMM d')}
          </h2>
        </div>

        {events.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{ backgroundColor: LIGHT.bgSoft, color: LIGHT.textMuted }}
          >
            <CalendarDays className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No events scheduled for this day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map(ev => (
              <button
                key={ev.data.id}
                onClick={() => onOpen(ev)}
                className="w-full text-left p-4 rounded-lg transition-transform hover:scale-[1.01] flex items-center gap-4"
                style={{
                  backgroundColor: eventAccent(ev) === 'amber' ? '#FEF3C7' : '#DBEAFE',
                  borderLeft: `4px solid ${eventAccent(ev) === 'amber' ? '#F59E0B' : '#3B82F6'}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: eventAccent(ev) === 'amber' ? '#F59E0B' : '#3B82F6', color: '#FFFFFF' }}
                >
                  {ev.kind === 'practice' ? 'P' : 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="uppercase text-[10px] tracking-wider font-semibold"
                    style={{ color: eventAccent(ev) === 'amber' ? '#92400E' : '#1E3A8A', opacity: 0.75 }}
                  >
                    {ev.kind === 'practice' ? 'Practice' : `Game · ${ev.data.location === 'home' ? 'Home' : 'Away'}`}
                  </p>
                  <p
                    className="text-base font-semibold truncate"
                    style={{ color: eventAccent(ev) === 'amber' ? '#92400E' : '#1E3A8A' }}
                  >
                    {eventTitle(ev)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Silence unused import (Button) — keep for future add-event dialog
void Button
