// ---------------------------------------------------------------------------
// Full Plan Wizard — Individual Generated Event Card
// ---------------------------------------------------------------------------
// Displays a single AI-generated event with collapsed/expanded views and
// accept/reject actions.
// ---------------------------------------------------------------------------

import { useState, type Dispatch } from 'react'
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { AiGeneratedEvent } from '@/lib/ai/schemas'
import type { PlannerAction } from './usePlannerState'
import { formatDate, formatTime } from '@/lib/utils/dates'

interface PlannerEventCardProps {
  event: AiGeneratedEvent
  index: number
  isSelected: boolean
  dispatch: Dispatch<PlannerAction>
}

export function PlannerEventCard({
  event,
  index,
  isSelected,
  dispatch,
}: PlannerEventCardProps) {
  const [expanded, setExpanded] = useState(false)

  function handleAccept() {
    dispatch({ type: 'ACCEPT_EVENT', index })
  }

  function handleReject() {
    dispatch({ type: 'REJECT_EVENT', index })
  }

  return (
    <Card
      className={`transition-colors ${
        isSelected ? 'border-l-4 border-l-green-500' : ''
      }`}
    >
      <CardContent className="space-y-3">
        {/* Collapsed view — always visible */}
        <div
          className="flex items-start justify-between gap-3 cursor-pointer"
          onClick={() => setExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setExpanded((prev) => !prev)
            }
          }}
        >
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              {isSelected && (
                <Check className="h-4 w-4 shrink-0 text-green-600" />
              )}
              <h3 className="font-semibold text-text-primary truncate">
                {event.name}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {event.date ? formatDate(event.date) : 'No date set'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {event.startTime ? formatTime(event.startTime) : '?'} &ndash; {event.endTime ? formatTime(event.endTime) : '?'}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{event.category}</Badge>
              {event.isOffSite && (
                <Badge variant="outline" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Off-site
                </Badge>
              )}
            </div>
          </div>

          <button
            type="button"
            className="shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Expanded view — detailed information */}
        {expanded && (
          <>
            <Separator />
            <div className="space-y-4 text-sm">
              {/* Description */}
              <div>
                <p className="font-medium text-text-primary mb-1">Description</p>
                <p className="text-text-secondary">{event.description}</p>
              </div>

              {/* Why It Works */}
              <div>
                <p className="font-medium text-text-primary mb-1">Why It Works</p>
                <p className="text-text-secondary">{event.whyItWorks}</p>
              </div>

              {/* Budget */}
              {event.budgetEstimate && (
                <div>
                  <p className="font-medium text-text-primary mb-1 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Budget
                  </p>
                  <p className="text-text-secondary">
                    <span className="capitalize">{event.budgetEstimate.tier}</span>
                    {event.budgetEstimate.amount != null && (
                      <> &mdash; ${event.budgetEstimate.amount}</>
                    )}
                  </p>
                  {event.budgetEstimate.breakdown && (
                    <p className="text-text-muted mt-0.5">
                      {event.budgetEstimate.breakdown}
                    </p>
                  )}
                </div>
              )}

              {/* Setup & Supplies */}
              {event.setupAndSupplies && (
                <div>
                  <p className="font-medium text-text-primary mb-1">
                    Setup &amp; Supplies
                  </p>
                  <p className="text-text-secondary">{event.setupAndSupplies}</p>
                </div>
              )}

              {/* Staffing */}
              {event.staffing && (
                <div>
                  <p className="font-medium text-text-primary mb-1">Staffing</p>
                  <p className="text-text-secondary">{event.staffing}</p>
                </div>
              )}

              {/* Weather Plan */}
              {event.weatherPlan && (
                <div>
                  <p className="font-medium text-text-primary mb-1">Weather Plan</p>
                  <p className="text-text-secondary">{event.weatherPlan}</p>
                </div>
              )}

              {/* Accessibility */}
              {event.accessibilityNotes && (
                <div>
                  <p className="font-medium text-text-primary mb-1">
                    Accessibility Notes
                  </p>
                  <p className="text-text-secondary">{event.accessibilityNotes}</p>
                </div>
              )}

              {/* Measurement Plan */}
              {event.measurementPlan && (
                <div>
                  <p className="font-medium text-text-primary mb-1">
                    Measurement Plan
                  </p>
                  <p className="text-text-secondary">{event.measurementPlan}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Actions row */}
        <Separator />
        <div className="flex items-center gap-2">
          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={handleAccept}
            className={`gap-1.5 ${
              isSelected
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-950'
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            {isSelected ? 'Selected' : 'Accept'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
