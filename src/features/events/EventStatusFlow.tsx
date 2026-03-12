import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import { type EventStatus } from '@/lib/types/common'
import { isValidEventForStatus } from '@/lib/utils/validation'
import type { Event } from '@/lib/types/event'
import { toast } from 'sonner'
import { CalendarCheck, CheckCircle, Archive, RotateCcw, XCircle, AlertCircle } from 'lucide-react'

/**
 * Which manual transitions to show per status.
 *
 * Auto-transitions (scheduled→active, active→needs_closeout) happen
 * automatically via computeEventStatus, so we don't surface buttons for them.
 * "Cancel" is routed through the parent's confirmation dialog.
 */
const MANUAL_TRANSITIONS: Partial<Record<EventStatus, EventStatus[]>> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['cancelled'],          // active happens automatically on event day
  active: [],                        // needs_closeout happens automatically after end time
  needs_closeout: ['completed'],
  completed: ['archived'],
  cancelled: ['draft', 'archived'],
  archived: [],
}

const TRANSITION_CONFIG: Record<EventStatus, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'outline' | 'destructive'
  danger?: boolean
}> = {
  scheduled: {
    label: 'Schedule',
    icon: CalendarCheck,
    variant: 'default',
  },
  active: {
    label: 'Mark Active',
    icon: CheckCircle,
    variant: 'default',
  },
  needs_closeout: {
    label: 'Mark Needs Closeout',
    icon: CheckCircle,
    variant: 'outline',
  },
  completed: {
    label: 'Complete Closeout',
    icon: CheckCircle,
    variant: 'default',
  },
  cancelled: {
    label: 'Cancel Event',
    icon: XCircle,
    variant: 'outline',
    danger: true,
  },
  draft: {
    label: 'Reactivate',
    icon: RotateCcw,
    variant: 'outline',
  },
  archived: {
    label: 'Archive',
    icon: Archive,
    variant: 'outline',
  },
}

interface EventStatusFlowProps {
  event: Event
  onCancelRequest?: () => void
}

/**
 * Status transition buttons for an event.
 *
 * Shows only the manual transitions available from the current computed status.
 * Auto-transitions (scheduled→active, active→needs_closeout) are handled by
 * computeEventStatus and don't need user action.
 *
 * When a transition fails validation, the specific missing fields are shown
 * inline beneath the buttons rather than as generic toast errors.
 */
export function EventStatusFlow({ event, onCancelRequest }: EventStatusFlowProps) {
  const transitionStatus = useEventStore((s) => s.transitionStatus)
  const skipCloseout = useEventStore((s) => s.skipCloseout)
  const currentStatus = computeEventStatus(event)
  const transitions = MANUAL_TRANSITIONS[currentStatus] ?? []

  // Inline validation errors shown beneath the buttons
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  if (transitions.length === 0) return null

  function handleTransition(targetStatus: EventStatus) {
    if (targetStatus === 'cancelled') {
      setValidationErrors([])
      onCancelRequest?.()
      return
    }

    const validation = isValidEventForStatus(event, targetStatus)
    if (!validation.valid) {
      // Show errors inline (field-level hints) instead of generic toasts
      setValidationErrors(validation.errors)
      return
    }

    setValidationErrors([])
    const success = transitionStatus(event.id, targetStatus)
    if (success) {
      const label = TRANSITION_CONFIG[targetStatus]?.label ?? 'updated'
      toast.success(`Event ${label.toLowerCase()}`)
    } else {
      toast.error('Could not update event status')
    }
  }

  function handleSkipCloseout() {
    skipCloseout(event.id)
    toast.success('Closeout skipped — event marked as completed')
  }

  return (
    <div className="mt-1 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {transitions.map((targetStatus) => {
          const cfg = TRANSITION_CONFIG[targetStatus]
          const Icon = cfg.icon
          return (
            <Button
              key={targetStatus}
              variant={cfg.variant}
              size="sm"
              onClick={() => handleTransition(targetStatus)}
              className={cfg.danger ? 'text-danger border-danger/30 hover:bg-danger/10' : undefined}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {cfg.label}
            </Button>
          )
        })}

        {/* Skip closeout — secondary option when event needs closeout */}
        {currentStatus === 'needs_closeout' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipCloseout}
            className="text-text-muted hover:text-text-secondary text-xs"
          >
            Skip closeout
          </Button>
        )}
      </div>

      {/* Inline field-level validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            Please fill in the following fields before scheduling:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {validationErrors.map((err) => (
              <li key={err} className="text-xs text-amber-700 dark:text-amber-300">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
