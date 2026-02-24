// ---------------------------------------------------------------------------
// Full Plan Wizard — Step 1: Intake
// ---------------------------------------------------------------------------
// Collects the date range + target persona for event generation.
// The building is already selected via the parent PlannerPage selector.
// ---------------------------------------------------------------------------

import type { Dispatch } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Building } from '@/lib/types/building'
import type { PlannerState, PlannerAction } from './usePlannerState'
import { RESIDENT_OPTIONS } from '@/lib/data/residentTypes'

// Quick month-range presets — fills startDate/endDate automatically
const MONTH_PRESETS = [
  { label: 'This month', getRange: () => getMonthRange(0) },
  { label: 'Next month', getRange: () => getMonthRange(1) },
  { label: 'Next 3 months', getRange: () => getMonthRange(0, 3) },
  { label: 'Next 6 months', getRange: () => getMonthRange(0, 6) },
]

function getMonthRange(offsetMonths: number, spanMonths = 1): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + spanMonths, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

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

  function handlePreset(preset: (typeof MONTH_PRESETS)[number]) {
    const { start, end } = preset.getRange()
    dispatch({ type: 'SET_DATES', startDate: start, endDate: end })
  }

  function handleStartDateChange(value: string) {
    dispatch({ type: 'SET_DATES', startDate: value, endDate: state.endDate })
  }

  function handleEndDateChange(value: string) {
    dispatch({ type: 'SET_DATES', startDate: state.startDate, endDate: value })
  }

  function handlePersonaChange(personaId: string) {
    // Toggle off if already selected
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

  // Effective persona for display — override wins over building profile
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

        {/* ── Quick month presets ── */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">Event month</p>
          <div className="flex flex-wrap gap-2">
            {MONTH_PRESETS.map((preset) => {
              const { start, end } = preset.getRange()
              const isActive = state.startDate === start && state.endDate === end
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
        </div>

        {/* ── Custom date range inputs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="planner-start-date"
              className="text-sm font-medium text-text-primary"
            >
              Start Date
            </label>
            <Input
              id="planner-start-date"
              type="date"
              value={state.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="planner-end-date"
              className="text-sm font-medium text-text-primary"
            >
              End Date
            </label>
            <Input
              id="planner-end-date"
              type="date"
              value={state.endDate}
              min={state.startDate || undefined}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
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
