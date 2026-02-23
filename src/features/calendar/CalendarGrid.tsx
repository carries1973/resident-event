import { useMemo } from 'react'
import { useAppStore } from '@/lib/store/appStore'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import { generateCalendarGrid, getShortDayNames } from '@/lib/utils/dates'
import { DEFAULT_OBSERVANCES } from '@/lib/data/observances'
import { CalendarCell } from '@/features/calendar/CalendarCell'
import type { Event } from '@/lib/types/event'
import type { Observance } from '@/lib/types/observance'

/**
 * CalendarGrid — renders the monthly calendar grid.
 * Reads the current month/year and filter state from useAppStore.
 * Filters events by status and building, filters observances by
 * disabled IDs and type filters, then distributes them across days.
 */
export function CalendarGrid({
  onDayClick,
}: {
  onDayClick: (day: number) => void
}) {
  const calendar = useAppStore((s) => s.calendar)
  const disabledObservanceIds = useAppStore((s) => s.disabledObservanceIds)
  const events = useEventStore((s) => s.events)

  const { year, month, statusFilters, buildingFilter, observanceTypeFilters } =
    calendar

  const grid = useMemo(
    () => generateCalendarGrid(year, month),
    [year, month],
  )

  const dayNames = getShortDayNames()

  // Filter events for this month
  const monthEvents = useMemo(() => {
    const monthStr = String(month).padStart(2, '0')
    const prefix = `${year}-${monthStr}`

    return events.filter((event: Event) => {
      // Must be in this month
      if (!event.date.startsWith(prefix)) return false

      // Status filter — when empty, show all
      if (statusFilters.length > 0) {
        const computedStatus = computeEventStatus(event)
        if (!statusFilters.includes(computedStatus)) return false
      }

      // Building filter
      if (buildingFilter && event.buildingId !== buildingFilter) return false

      return true
    })
  }, [events, year, month, statusFilters, buildingFilter])

  // Index events by day number for fast lookup
  const eventsByDay = useMemo(() => {
    const map = new Map<number, Event[]>()
    for (const event of monthEvents) {
      const dayNum = parseInt(event.date.split('-')[2], 10)
      const existing = map.get(dayNum) ?? []
      existing.push(event)
      map.set(dayNum, existing)
    }
    return map
  }, [monthEvents])

  // Filter observances for this month
  const monthObservances = useMemo(() => {
    return DEFAULT_OBSERVANCES.filter((obs: Observance) => {
      // Must be in this month
      if (obs.month !== month) return false

      // Not disabled by user
      if (disabledObservanceIds.includes(obs.id)) return false

      // Observance type filter — when empty, show all
      if (observanceTypeFilters.length > 0) {
        if (!observanceTypeFilters.includes(obs.type)) return false
      }

      return true
    })
  }, [month, disabledObservanceIds, observanceTypeFilters])

  // Index observances by day (month-long observances go on every day)
  const getObservancesForDay = useMemo(() => {
    const daySpecific = new Map<number, Observance[]>()
    const monthLong: Observance[] = []

    for (const obs of monthObservances) {
      if (obs.day != null) {
        const existing = daySpecific.get(obs.day) ?? []
        existing.push(obs)
        daySpecific.set(obs.day, existing)
      } else {
        monthLong.push(obs)
      }
    }

    return (day: number): Observance[] => {
      const specific = daySpecific.get(day) ?? []
      return [...specific, ...monthLong]
    }
  }, [monthObservances])

  // Check if a day is today
  const today = new Date()
  const isTodayInMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month
  const todayDay = today.getDate()

  return (
    <div className="border-l border-t border-border-default rounded-lg overflow-hidden bg-surface">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7">
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-xs font-semibold text-text-secondary text-center py-2 border-r border-b border-border-default bg-surface-hover/50"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar rows */}
      {grid.map((week, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-7">
          {week.map((day, colIdx) => (
            <CalendarCell
              key={`${rowIdx}-${colIdx}`}
              day={day}
              month={month}
              year={year}
              events={day != null ? eventsByDay.get(day) ?? [] : []}
              observances={day != null ? getObservancesForDay(day) : []}
              isToday={isTodayInMonth && day === todayDay}
              onClick={() => {
                if (day != null) onDayClick(day)
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
