import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, SlidersHorizontal, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store/appStore'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import { getMonthName } from '@/lib/utils/dates'
import { DEFAULT_OBSERVANCES } from '@/lib/data/observances'
import { Button } from '@/components/ui/button'
import { CalendarFilters } from '@/features/calendar/CalendarFilters'
import { CalendarGrid } from '@/features/calendar/CalendarGrid'
import { CalendarDayDrawer } from '@/features/calendar/CalendarDayDrawer'
import { CalendarExport } from '@/features/calendar/CalendarExport'
import type { Event } from '@/lib/types/event'
import type { Observance } from '@/lib/types/observance'

/**
 * CalendarPage — full calendar page with month navigation,
 * collapsible filter panel, calendar grid, and day drawer.
 * Shows an empty-state banner when no events exist.
 */
export function CalendarPage() {
  const navigate = useNavigate()
  const calendar = useAppStore((s) => s.calendar)
  const nextMonth = useAppStore((s) => s.nextMonth)
  const prevMonth = useAppStore((s) => s.prevMonth)
  const disabledObservanceIds = useAppStore((s) => s.disabledObservanceIds)
  const events = useEventStore((s) => s.events)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const setCalendarMonth = useAppStore((s) => s.setCalendarMonth)
  const { year, month, statusFilters, buildingFilter, observanceTypeFilters } = calendar

  const hasEvents = events.length > 0

  // Check how many events are in the current month vs other months
  const currentMonthEventCount = useMemo(() => {
    const monthStr = String(month).padStart(2, '0')
    const prefix = `${year}-${monthStr}`
    return events.filter((e: Event) => {
      if (!e.date.startsWith(prefix)) return false
      if (buildingFilter && e.buildingId !== buildingFilter) return false
      if (statusFilters.length > 0) {
        const cs = computeEventStatus(e)
        if (!statusFilters.includes(cs)) return false
      }
      return true
    }).length
  }, [events, year, month, statusFilters, buildingFilter])

  // Find the nearest month with events (if current month has none)
  const nearestEventMonth = useMemo(() => {
    if (currentMonthEventCount > 0 || events.length === 0) return null

    // Collect all months that have events
    const monthsWithEvents = new Map<string, { year: number; month: number; count: number }>()
    for (const event of events) {
      if (!event.date || event.date.length < 7) continue
      if (buildingFilter && event.buildingId !== buildingFilter) continue
      if (statusFilters.length > 0) {
        const cs = computeEventStatus(event)
        if (!statusFilters.includes(cs)) continue
      }
      const key = event.date.slice(0, 7) // "YYYY-MM"
      const eYear = parseInt(key.slice(0, 4), 10)
      const eMonth = parseInt(key.slice(5, 7), 10)
      const existing = monthsWithEvents.get(key)
      if (existing) {
        existing.count++
      } else {
        monthsWithEvents.set(key, { year: eYear, month: eMonth, count: 1 })
      }
    }

    if (monthsWithEvents.size === 0) return null

    // Find the nearest month to the current view
    let nearest: { year: number; month: number; count: number } | null = null
    let nearestDistance = Infinity
    const currentTotal = year * 12 + month
    for (const entry of monthsWithEvents.values()) {
      const entryTotal = entry.year * 12 + entry.month
      const distance = Math.abs(entryTotal - currentTotal)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = entry
      }
    }
    return nearest
  }, [events, year, month, currentMonthEventCount, statusFilters, buildingFilter])

  // Build the selected date string (YYYY-MM-DD)
  const selectedDateISO = useMemo(() => {
    if (selectedDay === null) return ''
    const m = String(month).padStart(2, '0')
    const d = String(selectedDay).padStart(2, '0')
    return `${year}-${m}-${d}`
  }, [year, month, selectedDay])

  // Events for the selected day (filtered)
  const selectedDayEvents = useMemo(() => {
    if (!selectedDateISO) return []
    return events.filter((event: Event) => {
      if (event.date !== selectedDateISO) return false

      if (statusFilters.length > 0) {
        const computedStatus = computeEventStatus(event)
        if (!statusFilters.includes(computedStatus)) return false
      }

      if (buildingFilter && event.buildingId !== buildingFilter) return false

      return true
    })
  }, [events, selectedDateISO, statusFilters, buildingFilter])

  // Observances for the selected day (shown in the day drawer).
  // Themes are internal planning context — excluded from resident-facing views.
  // Month-long observances (Ramadan, Black History Month, etc.) are shown in
  // the drawer for every day of that month since they span the whole period.
  const selectedDayObservances = useMemo(() => {
    if (selectedDay === null) return []
    return DEFAULT_OBSERVANCES.filter((obs: Observance) => {
      if (obs.month !== month) return false
      // Themes are internal — not shown in the calendar at all
      if (obs.type === 'theme') return false
      if (disabledObservanceIds.includes(obs.id)) return false
      if (
        observanceTypeFilters.length > 0 &&
        !observanceTypeFilters.includes(obs.type)
      )
        return false
      // Day-specific observance: must match the day
      // Month-long observance (no day): show on every day of the month
      if (obs.day != null && obs.day !== selectedDay) return false
      return true
    })
  }, [selectedDay, month, disabledObservanceIds, observanceTypeFilters])

  function handleDayClick(day: number) {
    setSelectedDay(day)
    setDrawerOpen(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header: Month/Year + Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-text-primary min-w-[200px] text-center">
            {getMonthName(month)} {year}
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarExport year={year} month={month} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-controls="calendar-filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      {/* No events at all banner */}
      {!hasEvents && (
        <div className="rounded-lg border border-border-default bg-warning-light p-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-text-secondary">
            No events planned yet — your calendar is empty.
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/planner')}
          >
            Plan Events
          </Button>
        </div>
      )}

      {/* Events exist but none in current month — show jump link */}
      {hasEvents && currentMonthEventCount === 0 && nearestEventMonth && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-text-secondary">
            No events in {getMonthName(month)} {year} — but you have{' '}
            <span className="font-semibold text-text-primary">
              {nearestEventMonth.count} {nearestEventMonth.count === 1 ? 'event' : 'events'}
            </span>{' '}
            in {getMonthName(nearestEventMonth.month)} {nearestEventMonth.year}.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setCalendarMonth(nearestEventMonth.year, nearestEventMonth.month)}
          >
            Jump to {getMonthName(nearestEventMonth.month)}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Mobile filters (below header, above grid) */}
      {filtersOpen && (
        <div
          id="calendar-filters-mobile"
          className="md:hidden p-4 rounded-lg border border-border-default bg-surface"
        >
          <CalendarFilters />
        </div>
      )}

      {/* Main layout: filters sidebar + grid */}
      <div className="flex gap-4">
        {/* Collapsible Filters Panel (desktop) */}
        {filtersOpen && (
          <aside
            id="calendar-filters"
            className="w-56 shrink-0 p-4 rounded-lg border border-border-default bg-surface hidden md:block"
          >
            <CalendarFilters />
          </aside>
        )}

        {/* Calendar Grid */}
        <div className="flex-1 min-w-0">
          <CalendarGrid onDayClick={handleDayClick} />
        </div>
      </div>

      {/* Day Drawer */}
      <CalendarDayDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        date={selectedDateISO}
        events={selectedDayEvents}
        observances={selectedDayObservances}
      />
    </div>
  )
}
