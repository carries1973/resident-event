import { Link } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { computeEventStatus } from '@/lib/store/eventStore'
import type { Event } from '@/lib/types/event'
import type { LocalEvent } from '@/lib/types/localEvent'
import { LOCAL_EVENT_CATEGORY_LABELS } from '@/lib/types/localEvent'
import type { Observance } from '@/lib/types/observance'
import { MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarDayDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string // YYYY-MM-DD
  events: Event[]
  localEvents: LocalEvent[]
  observances: Observance[]
}

function formatLocalTime(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

/**
 * CalendarDayDrawer — a right-side sheet that shows full day details.
 * Lists all in-building events with StatusBadge, time, and link to event detail.
 * Lists local (community) events in amber with optional link and location.
 * Lists observances with emoji, description, and event ideas.
 */
export function CalendarDayDrawer({
  open,
  onOpenChange,
  date,
  events,
  localEvents,
  observances,
}: CalendarDayDrawerProps) {
  const formattedDate = date ? formatDate(date) : ''
  const hasLocalEvents = localEvents.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-text-primary">
            {formattedDate}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* In-building Events Section */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              In-Building Events
              {events.length > 0 && (
                <span className="text-text-muted font-normal ml-1">
                  ({events.length})
                </span>
              )}
            </h4>
            {events.length === 0 ? (
              <p className="text-sm text-text-muted">
                No in-building events on this day.
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const status = computeEventStatus(event)
                  return (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      onClick={() => onOpenChange(false)}
                      className="block p-3 rounded-lg border border-border-default bg-surface hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary leading-5">
                          {event.name}
                        </span>
                        <StatusBadge status={status} />
                      </div>
                      {(event.startTime || event.endTime) && (
                        <p className="text-xs text-text-secondary">
                          {event.startTime && formatTime(event.startTime)}
                          {event.startTime && event.endTime && ' - '}
                          {event.endTime && formatTime(event.endTime)}
                        </p>
                      )}
                      {event.location && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {event.location}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Local (community) Events Section */}
          {hasLocalEvents && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                Community Events
                <span className="text-text-muted font-normal">({localEvents.length})</span>
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
              </h4>
              <div className="space-y-3">
                {localEvents.map((localEvent) => (
                  <div
                    key={localEvent.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      'border-amber-200 dark:border-amber-800/60',
                      'bg-amber-50/60 dark:bg-amber-950/20',
                    )}
                  >
                    <p className="text-sm font-medium text-text-primary mb-0.5">
                      {localEvent.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-text-muted">
                      {/* Category */}
                      <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[11px] font-medium">
                        {LOCAL_EVENT_CATEGORY_LABELS[localEvent.category]}
                      </span>

                      {/* Time */}
                      {localEvent.startTime && (
                        <span>
                          {formatLocalTime(localEvent.startTime)}
                          {localEvent.endTime && ` – ${formatLocalTime(localEvent.endTime)}`}
                        </span>
                      )}

                      {/* Location */}
                      {localEvent.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {localEvent.location}
                        </span>
                      )}
                    </div>

                    {localEvent.description && (
                      <p className="text-xs text-text-muted mt-1.5">{localEvent.description}</p>
                    )}

                    {localEvent.url && (
                      <a
                        href={localEvent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs text-brand hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        More info
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observances Section */}
          {observances.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">
                Observances
              </h4>
              <div className="space-y-3">
                {observances.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-3 rounded-lg border border-border-default bg-surface"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{obs.emoji}</span>
                      <span className="text-sm font-medium text-text-primary">
                        {obs.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-text-muted bg-surface-hover px-1.5 py-0.5 rounded">
                        {obs.type}
                      </span>
                    </div>
                    {obs.description && (
                      <p className="text-xs text-text-secondary mt-1">
                        {obs.description}
                      </p>
                    )}
                    {obs.eventIdeas && obs.eventIdeas.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                          Event Ideas
                        </p>
                        <ul className="space-y-0.5">
                          {obs.eventIdeas.map((idea, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-text-secondary flex items-center gap-1.5"
                            >
                              <span className="text-brand">&#8226;</span>
                              {idea}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
