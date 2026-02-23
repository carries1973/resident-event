// ---------------------------------------------------------------------------
// Full Plan Wizard — Step 4: Results
// ---------------------------------------------------------------------------
// Displays the generated events with accept/reject controls, calendar context,
// internal notes (REP v3.3), and batch actions for saving/regenerating.
// ---------------------------------------------------------------------------

import { useState, type Dispatch } from 'react'
import {
  Save, RefreshCw, Settings2, Sparkles,
  ChevronDown, ChevronUp, Calendar, FileText, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/common/EmptyState'
import type { Building } from '@/lib/types/building'
import type { PlannerState, PlannerAction } from './usePlannerState'
import { PlannerEventCard } from './PlannerEventCard'

interface PlannerResultsProps {
  state: PlannerState
  dispatch: Dispatch<PlannerAction>
  building: Building
  onSave: () => void
  onRegenerateAll: () => void
}

export function PlannerResults({
  state,
  dispatch,
  building,
  onSave,
  onRegenerateAll,
}: PlannerResultsProps) {
  const totalGenerated = state.generatedEvents.length
  const totalSelected = state.selectedIds.length

  const [showCalendarContext, setShowCalendarContext] = useState(false)
  const [showInternalNotes, setShowInternalNotes] = useState(false)

  // Empty results
  if (totalGenerated === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-12 w-12" />}
        title="No events generated"
        description="The AI did not return any events. Try adjusting your preferences or date range."
        actionLabel="Adjust & Retry"
        onAction={() => dispatch({ type: 'GO_TO_STEP', step: 'options' })}
      />
    )
  }

  const calCtx = state.calendarContext
  const notes = state.internalNotes
  const warnings = state.preflightWarnings

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{totalGenerated}</span>{' '}
          {totalGenerated === 1 ? 'event' : 'events'} generated{' '}
          <span className="text-text-muted">&bull;</span>{' '}
          <span className="font-semibold text-text-primary">{totalSelected}</span>{' '}
          selected
        </div>
        <div className="text-xs text-text-muted">
          Building: {building.name}
        </div>
      </div>

      {/* Preflight warnings */}
      {warnings && warnings.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-warning mb-1">
            <AlertTriangle className="h-4 w-4" />
            Planner Notes
          </div>
          <ul className="list-disc list-inside text-text-secondary space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Calendar Context (collapsible) */}
      {calCtx && (
        calCtx.observancesInPeriod.length > 0 ||
        calCtx.neighbourhoodAddOns.length > 0 ||
        calCtx.verifiedLocalEvents.length > 0
      ) && (
        <div className="rounded-lg border border-border bg-surface">
          <button
            onClick={() => setShowCalendarContext((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-text-primary hover:bg-surface-hover transition-colors rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Calendar Context
            </span>
            {showCalendarContext ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showCalendarContext && (
            <div className="px-4 pb-4 space-y-3 text-sm">
              {calCtx.observancesInPeriod.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-secondary mb-1">Observances in Period</h4>
                  <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                    {calCtx.observancesInPeriod.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
              {calCtx.neighbourhoodAddOns.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-secondary mb-1">Neighbourhood Add-Ons</h4>
                  <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                    {calCtx.neighbourhoodAddOns.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
              )}
              {calCtx.verifiedLocalEvents.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-secondary mb-1">Local Events</h4>
                  <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                    {calCtx.verifiedLocalEvents.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Internal Notes (collapsible — manager-facing) */}
      {notes && (
        <div className="rounded-lg border border-border bg-surface">
          <button
            onClick={() => setShowInternalNotes((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-text-primary hover:bg-surface-hover transition-colors rounded-lg"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Planning Notes (Internal)
            </span>
            {showInternalNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showInternalNotes && (
            <div className="px-4 pb-4 text-sm text-text-secondary space-y-2">
              {notes.intakeSummary && <p><span className="font-medium">Summary:</span> {notes.intakeSummary}</p>}
              {notes.amenitySources && <p><span className="font-medium">Amenity Sources:</span> {notes.amenitySources}</p>}
              {notes.residentMixSource && <p><span className="font-medium">Resident Mix:</span> {notes.residentMixSource}</p>}
              {notes.localSearchNotes && <p><span className="font-medium">Local Search:</span> {notes.localSearchNotes}</p>}
              {notes.neighbourhoodNotes && <p><span className="font-medium">Neighbourhood:</span> {notes.neighbourhoodNotes}</p>}
              {notes.weatherAssumptions && <p><span className="font-medium">Weather:</span> {notes.weatherAssumptions}</p>}
              {notes.complianceNotes && <p><span className="font-medium">Compliance:</span> {notes.complianceNotes}</p>}
            </div>
          )}
        </div>
      )}

      {/* Event cards */}
      <div className="space-y-4">
        {state.generatedEvents.map((event, index) => (
          <PlannerEventCard
            key={`${event.name}-${event.date}-${index}`}
            event={event}
            index={index}
            isSelected={state.selectedIds.includes(index)}
            dispatch={dispatch}
          />
        ))}
      </div>

      {/* Bottom action bar */}
      <Separator />
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={onSave}
          disabled={totalSelected === 0}
          className="w-full sm:w-auto gap-2"
        >
          <Save className="h-4 w-4" />
          Save Selected as Drafts
        </Button>
        <Button
          variant="outline"
          onClick={onRegenerateAll}
          className="w-full sm:w-auto gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate All
        </Button>
        <Button
          variant="outline"
          onClick={() => dispatch({ type: 'GO_TO_STEP', step: 'options' })}
          className="w-full sm:w-auto gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Adjust &amp; Retry
        </Button>
      </div>
    </div>
  )
}
