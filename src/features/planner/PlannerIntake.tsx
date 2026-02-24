// ---------------------------------------------------------------------------
// Full Plan Wizard — Step 1: Intake
// ---------------------------------------------------------------------------
// Collects the date range + target persona for event generation.
// The building is already selected via the parent PlannerPage selector.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react'
import type { Dispatch } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Calendar, Check, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Building } from '@/lib/types/building'
import type { PlannerState, PlannerAction } from './usePlannerState'
import { RESIDENT_OPTIONS } from '@/lib/data/residentTypes'

// ---------------------------------------------------------------------------
// Date range helpers — single source of truth used by both presets and
// active-state detection so strings always match.
// ---------------------------------------------------------------------------

/** Returns first day of the month at the given year+month (0-indexed). */
function monthStart(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().slice(0, 10)
}

/** Returns last day of the month at the given year+month (0-indexed). */
function monthEnd(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10)
}

/** Quick preset: 1 month starting at `offsetMonths` from today. */
function getMonthRange(offsetMonths: number, spanMonths = 1): { start: string; end: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return {
    start: monthStart(y, m + offsetMonths),
    end: monthEnd(y, m + offsetMonths + spanMonths - 1),
  }
}

interface QuickPreset {
  label: string
  start: string
  end: string
}

function buildPresets(): QuickPreset[] {
  return [
    { label: 'This month', ...getMonthRange(0) },
    { label: 'Next month', ...getMonthRange(1) },
    { label: 'Next 3 months', ...getMonthRange(0, 3) },
    { label: 'Next 6 months', ...getMonthRange(0, 6) },
  ]
}

// ---------------------------------------------------------------------------
// Month-range popover
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const MONTH_NAMES_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface MonthPickerProps {
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  onChange: (start: string, end: string) => void
}

/**
 * Two-step month-range picker:
 *  1. Click a month → sets start (first day of that month).
 *  2. Click another month → sets end (last day of that month), range highlighted.
 *
 * Clicking the same month twice selects just that month.
 * Clicking a month before the current start resets to a new single-month selection.
 */
function MonthRangePicker({ startDate, endDate, onChange }: MonthPickerProps) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')
  const [pendingStart, setPendingStart] = useState<string | null>(null)

  // Parse currently selected range
  const selStart = startDate ? new Date(startDate + 'T12:00:00') : null
  const selEnd = endDate ? new Date(endDate + 'T12:00:00') : null

  function handleMonthClick(year: number, month: number) {
    const clickedStart = monthStart(year, month)
    const clickedEnd = monthEnd(year, month)

    if (selecting === 'start' || pendingStart === null) {
      // First click: set as start, wait for end
      setPendingStart(clickedStart)
      setSelecting('end')
      // Immediately apply as a single-month selection so the parent is updated
      onChange(clickedStart, clickedEnd)
    } else {
      // Second click: determine start/end order
      const clickedDate = new Date(year, month, 1)
      const pendingDate = new Date(pendingStart + 'T12:00:00')

      if (clickedDate < pendingDate) {
        // Clicked before pending start — reset with new start
        setPendingStart(clickedStart)
        onChange(clickedStart, clickedEnd)
      } else {
        // Clicked at or after pending start — set as end
        const finalEnd = monthEnd(year, month)
        onChange(pendingStart, finalEnd)
        setPendingStart(null)
        setSelecting('start')
      }
    }
  }

  function isInRange(year: number, month: number): boolean {
    if (!selStart || !selEnd) return false
    const d = new Date(year, month, 15) // mid-month for range check
    return d >= selStart && d <= selEnd
  }

  function isStartMonth(year: number, month: number): boolean {
    if (!selStart) return false
    return selStart.getFullYear() === year && selStart.getMonth() === month
  }

  function isEndMonth(year: number, month: number): boolean {
    if (!selEnd) return false
    return selEnd.getFullYear() === year && selEnd.getMonth() === month
  }

  function isSameMonth(): boolean {
    if (!selStart || !selEnd) return false
    return selStart.getFullYear() === selEnd.getFullYear() &&
      selStart.getMonth() === selEnd.getMonth()
  }

  return (
    <div className="w-72 select-none">
      {/* Year navigation */}
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          type="button"
          onClick={() => setViewYear(y => y - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-hover text-text-muted"
          aria-label="Previous year"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-text-primary">{viewYear}</span>
        <button
          type="button"
          onClick={() => setViewYear(y => y + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-hover text-text-muted"
          aria-label="Next year"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Instruction */}
      <p className="px-1 pb-2 text-[11px] text-text-muted">
        {selecting === 'start' || pendingStart === null
          ? 'Click a month to start your date range'
          : 'Now click the end month (or the same month for a single month)'}
      </p>

      {/* Month grid */}
      <div className="grid grid-cols-4 gap-1">
        {MONTH_NAMES.map((name, month) => {
          const start = isStartMonth(viewYear, month)
          const end = isEndMonth(viewYear, month)
          const inRange = isInRange(viewYear, month)
          const singleMonth = isSameMonth()
          const isSelected = start || end

          return (
            <button
              key={month}
              type="button"
              onClick={() => handleMonthClick(viewYear, month)}
              className={[
                'rounded-md py-2 text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-accent-primary text-white'
                  : inRange && !singleMonth
                    ? 'bg-accent-primary/15 text-accent-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                // Round only the outer edges for range endpoints
                start && !singleMonth ? 'rounded-r-none' : '',
                end && !singleMonth ? 'rounded-l-none' : '',
                inRange && !start && !end && !singleMonth ? 'rounded-none' : '',
              ].filter(Boolean).join(' ')}
            >
              {name}
            </button>
          )
        })}
      </div>

      {/* Selected summary */}
      {selStart && selEnd && (
        <p className="mt-3 border-t border-border-default pt-2 text-center text-[11px] text-text-muted">
          {isSameMonth()
            ? `${MONTH_NAMES_LONG[selStart.getMonth()]} ${selStart.getFullYear()}`
            : `${MONTH_NAMES_LONG[selStart.getMonth()]} ${selStart.getFullYear()} → ${MONTH_NAMES_LONG[selEnd.getMonth()]} ${selEnd.getFullYear()}`}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Friendly label for the date-range trigger button
// ---------------------------------------------------------------------------

function formatRangeLabel(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return 'Select date range'

  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')

  const startLabel = `${MONTH_NAMES_LONG[start.getMonth()]} ${start.getFullYear()}`
  const endLabel = `${MONTH_NAMES_LONG[end.getMonth()]} ${end.getFullYear()}`

  if (startLabel === endLabel) return startLabel

  // Same year: "March – June 2026"
  if (start.getFullYear() === end.getFullYear()) {
    return `${MONTH_NAMES_LONG[start.getMonth()]} – ${MONTH_NAMES_LONG[end.getMonth()]} ${start.getFullYear()}`
  }

  return `${startLabel} – ${endLabel}`
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PlannerIntakeProps {
  building: Building
  state: PlannerState
  dispatch: Dispatch<PlannerAction>
  onSkipToGenerate: () => void
}

export function PlannerIntake({
  building,
  state,
  dispatch,
  onSkipToGenerate,
}: PlannerIntakeProps) {
  const isProfileIncomplete =
    building.amenities.length === 0 &&
    building.customAmenities.length === 0 &&
    !building.primaryResidentGroup

  const canProceed = state.startDate !== '' && state.endDate !== ''

  // Presets built once per render — same pure function used for both display
  // and active-state comparison, so strings always match.
  const presets = buildPresets()

  // Month picker popover state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!pickerOpen) return
    function handleOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [pickerOpen])

  function handlePreset(preset: QuickPreset) {
    dispatch({ type: 'SET_DATES', startDate: preset.start, endDate: preset.end })
    setPickerOpen(false)
    setShowCustom(false)
  }

  function handlePickerChange(start: string, end: string) {
    dispatch({ type: 'SET_DATES', startDate: start, endDate: end })
  }

  function handleStartDateChange(value: string) {
    dispatch({ type: 'SET_DATES', startDate: value, endDate: state.endDate })
  }

  function handleEndDateChange(value: string) {
    dispatch({ type: 'SET_DATES', startDate: state.startDate, endDate: value })
  }

  function handlePersonaChange(personaId: string) {
    const next = state.personaOverride === personaId ? '' : personaId
    dispatch({ type: 'SET_PERSONA', personaOverride: next })
  }

  function handleNext() {
    dispatch({
      type: 'SET_INTAKE',
      buildingId: building.id,
      startDate: state.startDate,
      endDate: state.endDate,
    })
  }

  function handleSkip() {
    if (!canProceed) return
    dispatch({
      type: 'SET_INTAKE',
      buildingId: building.id,
      startDate: state.startDate,
      endDate: state.endDate,
    })
    onSkipToGenerate()
  }

  const effectivePersona = state.personaOverride || building.primaryResidentGroup || ''

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">Step 1 of 3</span>
            <span className="text-text-secondary">Intake</span>
          </div>
          <Progress value={33} />
        </div>

        {/* Incomplete profile banner */}
        {isProfileIncomplete && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-950/20">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Your building profile is incomplete.
              </p>
              <p className="text-amber-700 dark:text-amber-400 mt-1">
                Results will be better with more context.{' '}
                <Link
                  to={`/buildings/${building.id}/edit`}
                  className="underline font-medium hover:no-underline"
                >
                  Add details
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ── Date range section ── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-primary">Event timeframe</p>

          {/* Quick preset pills */}
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const isActive = state.startDate === preset.start && state.endDate === preset.end
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-accent-primary bg-accent-primary text-white'
                      : 'border-border-default text-text-secondary hover:border-accent-primary hover:text-accent-primary'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          {/* Month-range picker trigger */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors text-left ${
                pickerOpen
                  ? 'border-accent-primary ring-1 ring-accent-primary'
                  : 'border-border-default hover:border-accent-primary/60'
              } ${canProceed ? 'text-text-primary' : 'text-text-muted'}`}
            >
              <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
              <span className="flex-1 truncate">
                {formatRangeLabel(state.startDate, state.endDate)}
              </span>
              <span className="text-xs text-text-muted">Pick months</span>
            </button>

            {/* Popover */}
            {pickerOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 rounded-xl border border-border-default bg-surface p-4 shadow-elevated">
                {/* Preset list at top of popover */}
                <div className="mb-3 flex flex-wrap gap-1.5 border-b border-border-default pb-3">
                  {presets.map((preset) => {
                    const isActive = state.startDate === preset.start && state.endDate === preset.end
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePreset(preset)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'border-accent-primary bg-accent-primary text-white'
                            : 'border-border-default text-text-secondary hover:border-accent-primary hover:text-accent-primary'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {/* Month grid */}
                <MonthRangePicker
                  startDate={state.startDate}
                  endDate={state.endDate}
                  onChange={handlePickerChange}
                />

                {/* Custom range toggle */}
                <div className="mt-3 border-t border-border-default pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCustom((v) => !v)}
                    className="text-xs text-accent-primary hover:underline"
                  >
                    {showCustom ? 'Hide custom dates' : 'Enter exact dates instead'}
                  </button>

                  {showCustom && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-text-muted">Start</label>
                        <Input
                          type="date"
                          value={state.startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-text-muted">End</label>
                        <Input
                          type="date"
                          value={state.endDate}
                          min={state.startDate || undefined}
                          onChange={(e) => handleEndDateChange(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Done button */}
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => setPickerOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Target Persona selector ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary">Target Resident Persona</p>
            {building.primaryResidentGroup && !state.personaOverride && (
              <span className="text-xs text-text-muted">(from building profile)</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RESIDENT_OPTIONS.map((persona) => {
              const isActive = effectivePersona === persona.id
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handlePersonaChange(persona.id)}
                  className={`relative rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    isActive
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-default text-text-secondary hover:border-accent-primary/50 hover:text-text-primary'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-primary">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                  <p className="font-medium truncate pr-5">{persona.label}</p>
                  <p className="text-text-muted mt-0.5 truncate">{persona.ageRange}</p>
                </button>
              )
            })}
          </div>
          {effectivePersona && (
            <p className="text-xs text-text-muted">
              {RESIDENT_OPTIONS.find((p) => p.id === effectivePersona)?.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={!canProceed}
            className="w-full sm:w-auto gap-2"
          >
            <Zap className="h-4 w-4" />
            Skip &amp; Generate
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full sm:w-auto gap-2"
          >
            Next: Preferences
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
