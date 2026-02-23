import type { Event } from '@/lib/types/event'
import type { Observance } from '@/lib/types/observance'
import type { EventStatus } from '@/lib/types/common'
import { computeEventStatus } from '@/lib/store/eventStore'
import { getMonthName } from '@/lib/utils/dates'
import { cn } from '@/lib/utils'

/** Colour dot mapping for each event status */
const STATUS_DOT_COLOURS: Record<EventStatus, string> = {
  draft: 'bg-gray-400',
  scheduled: 'bg-blue-500',
  active: 'bg-green-500',
  needs_closeout: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-400',
  archived: 'bg-gray-300',
}

interface CalendarCellProps {
  day: number | null
  month: number
  year: number
  events: Event[]
  observances: Observance[]
  isToday: boolean
  onClick: () => void
}

/**
 * CalendarCell — renders a single day cell in the calendar grid.
 * Shows the day number, up to 2 events (truncated), overflow indicator,
 * and observance emojis. Events are colour-coded by status with small dots.
 */
export function CalendarCell({
  day,
  month,
  year,
  events,
  observances,
  isToday: today,
  onClick,
}: CalendarCellProps) {
  if (day === null) {
    return (
      <div className="min-h-[100px] border-r border-b border-border-default bg-page/50" />
    )
  }

  const maxVisible = 2
  const visibleEvents = events.slice(0, maxVisible)
  const overflowCount = events.length - maxVisible

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${getMonthName(month)} ${day}, ${year}`}
      className={cn(
        'min-h-[100px] border-r border-b border-border-default p-1.5 text-left',
        'hover:bg-surface-hover transition-colors cursor-pointer',
        'flex flex-col gap-0.5',
        today && 'bg-brand-light/30',
      )}
    >
      {/* Day number + observance emojis */}
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'text-xs font-semibold leading-5 inline-flex items-center justify-center',
            today
              ? 'bg-brand text-white rounded-full h-5 w-5'
              : 'text-text-primary',
          )}
        >
          {day}
        </span>
        {observances.length > 0 && (
          <span className="text-xs leading-5 flex gap-0.5 flex-wrap justify-end max-w-[60%]">
            {observances.slice(0, 3).map((obs) => (
              <span
                key={obs.id}
                title={obs.name}
                aria-label={obs.name}
                role="img"
                className="cursor-default"
              >
                {obs.emoji}
              </span>
            ))}
            {observances.length > 3 && (
              <span className="text-text-muted text-[10px]">
                +{observances.length - 3}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Events */}
      <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
        {visibleEvents.map((event) => {
          const status = computeEventStatus(event)
          return (
            <div
              key={event.id}
              className="flex items-center gap-1 min-w-0"
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  STATUS_DOT_COLOURS[status],
                )}
              />
              <span className="text-[11px] sm:text-xs leading-4 text-text-secondary truncate">
                {event.name}
              </span>
            </div>
          )
        })}
        {overflowCount > 0 && (
          <span className="text-[11px] leading-4 text-text-muted italic">
            +{overflowCount} more
          </span>
        )}
      </div>
    </button>
  )
}
