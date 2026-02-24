import { Button } from '@/components/ui/button'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import { type EventStatus } from '@/lib/types/common'
import { isValidEventForStatus } from '@/lib/utils/validation'
import type { Event } from '@/lib/types/event'
import { toast } from 'sonner'
import { CalendarCheck, CheckCircle, Archive, RotateCcw, XCircle } from 'lucide-react'

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
 * For events in needs_closeout status, also shows a "Skip Closeout" secondary
 * option so users can bypass if no data is available.
 */
export function EventStatusFlow({ event, onCancelRequest }: EventStatusFlowProps) {
  const transitionStatus = useEventStore((s) => s.transitionStatus)
  const skipCloseout = useEventStore((s) => s.skipCloseout)
  const currentStatus = computeEventStatus(event)
  const transitions = MANUAL_TRANSITIONS[currentStatus] ?? []

  if (transitions.length === 0) return null

  function handleTransition(targetStatus: EventStatus) {
    if (targetStatus === 'cancelled') {
      onCancelRequest?.()
      return
    }

    const validation = isValidEventForStatus(event, targetStatus)
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err))
      return
    }

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
    <div className="flex flex-wrap items-center gap-2 mt-1">
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
  )
}
