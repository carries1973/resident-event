// ---------------------------------------------------------------------------
// Full Plan Wizard — Step 1: Intake
// ---------------------------------------------------------------------------
// Collects the date range for event generation. The building is already
// selected via the parent PlannerPage building selector.
// ---------------------------------------------------------------------------

import type { Dispatch } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Building } from '@/lib/types/building'
import type { PlannerState, PlannerAction } from './usePlannerState'

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

  function handleStartDateChange(value: string) {
    dispatch({ type: 'SET_DATES', startDate: value, endDate: state.endDate })
  }

  function handleEndDateChange(value: string) {
    dispatch({ type: 'SET_DATES', startDate: state.startDate, endDate: value })
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

        {/* Date range inputs */}
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
