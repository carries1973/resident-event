import { Button } from '@/components/ui/button'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import { EVENT_STATUS_TRANSITIONS, type EventStatus } from '@/lib/types/common'
import { isValidEventForStatus } from '@/lib/utils/validation'
import type { Event } from '@/lib/types/event'
import { toast } from 'sonner'

const STATUS_ACTION_LABELS: Partial<Record<EventStatus, string>> = {
  scheduled: 'Schedule',
  active: 'Mark active',
  needs_closeout: 'Needs closeout',
  completed: 'Complete',
  cancelled: 'Cancel',
  draft: 'Reactivate',
  archived: 'Archive',
}

interface EventStatusFlowProps {
  event: Event
  onCancelRequest?: () => void
}

/**
 * Status transition buttons for an event.
 * Shows available next statuses based on current computed status.
 */
export function EventStatusFlow({ event, onCancelRequest }: EventStatusFlowProps) {
  const transitionStatus = useEventStore((s) => s.transitionStatus)
  const currentStatus = computeEventStatus(event)
  const availableTransitions = EVENT_STATUS_TRANSITIONS[currentStatus] ?? []

  if (availableTransitions.length === 0) return null

  function handleTransition(targetStatus: EventStatus) {
    // Special handling for cancel — delegate to parent for confirmation
    if (targetStatus === 'cancelled') {
      onCancelRequest?.()
      return
    }

    // Validate requirements
    const validation = isValidEventForStatus(event, targetStatus)
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err))
      return
    }

    const success = transitionStatus(event.id, targetStatus)
    if (success) {
      toast.success(`Event ${STATUS_ACTION_LABELS[targetStatus]?.toLowerCase() ?? 'updated'}`)
    } else {
      toast.error('Could not change status')
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableTransitions.map((status) => (
        <Button
          key={status}
          variant={status === 'cancelled' || status === 'archived' ? 'outline' : 'default'}
          size="sm"
          onClick={() => handleTransition(status)}
          className={
            status === 'cancelled'
              ? 'text-danger border-danger/30 hover:bg-danger/10'
              : undefined
          }
        >
          {STATUS_ACTION_LABELS[status] ?? status}
        </Button>
      ))}
    </div>
  )
}
