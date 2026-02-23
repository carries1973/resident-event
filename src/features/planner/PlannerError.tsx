// ---------------------------------------------------------------------------
// Full Plan Wizard — Error State
// ---------------------------------------------------------------------------
// Shown when AI generation fails. Provides retry, simplify, and fallback
// options. Shows an extra hint after multiple failures.
// ---------------------------------------------------------------------------

import type { Dispatch } from 'react'
import { XCircle, RefreshCw, Settings2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PlannerState, PlannerAction } from './usePlannerState'

interface PlannerErrorProps {
  state: PlannerState
  dispatch: Dispatch<PlannerAction>
  onRetry: () => void
}

export function PlannerError({ state, dispatch, onRetry }: PlannerErrorProps) {
  return (
    <Card role="alert">
      <CardContent className="flex flex-col items-center text-center py-10 space-y-5">
        {/* Error icon */}
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-950/40">
          <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-text-primary">
          Something went wrong generating events.
        </h2>

        {/* Error message */}
        <p className="text-sm text-text-secondary max-w-md">
          {state.errorMessage ||
            'This can happen with complex requests. Please try again or simplify your preferences.'}
        </p>

        {/* Repeated failure hint */}
        {state.errorCount >= 2 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/20 dark:text-amber-300 max-w-md">
            Having trouble? Try reducing the number of events or simplifying
            preferences.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button onClick={onRetry} className="w-full sm:w-auto gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: 'options' })}
            className="w-full sm:w-auto gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Simplify &amp; Retry
          </Button>
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'GO_TO_STEP', step: 'intake' })}
            className="w-full sm:w-auto gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Try Quick Ideas Instead
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
