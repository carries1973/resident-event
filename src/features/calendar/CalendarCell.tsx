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
      {/* Day number */}
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
      </div>

      {/* Observances — emoji + name text (readable on screen and in print) */}
      {observances.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {observances.slice(0, 2).map((obs) => (
            <div
              key={obs.id}
              title={obs.name}
              className="flex items-center gap-0.5 min-w-0"
            >
              <span className="text-[10px] shrink-0 print:hidden">{obs.emoji}</span>
              <span className="text-[10px] leading-3.5 truncate text-text-muted print:text-black print:font-normal">
                {obs.name}
              </span>
            </div>
          ))}
          {observances.length > 2 && (
            <span className="text-[10px] leading-3.5 text-text-muted italic">
              +{observances.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Events */}
      <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
        {visibleEvents.map((event) => {
          const status = computeEventStatus(event)
          const isDraft = status === 'draft'
          return (
            <div
              key={event.id}
              className={cn(
                'flex items-center gap-1 min-w-0 rounded px-1',
                isDraft && 'border border-dashed border-gray-300 dark:border-gray-600',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0 print:hidden',
                  STATUS_DOT_COLOURS[status],
                )}
              />
              <span className={cn(
                'text-[11px] sm:text-xs leading-4 truncate print:text-black print:font-semibold',
                isDraft ? 'text-text-muted italic' : 'text-text-secondary',
              )}>
                {event.name}
              </span>
            </div>
          )
        })}
        {overflowCount > 0 && (
          <span className="text-[11px] leading-4 text-text-muted italic print:text-black">
            +{overflowCount} more
          </span>
        )}
      </div>
    </button>
  )
}
