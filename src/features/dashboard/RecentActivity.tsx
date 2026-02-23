import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useEventStore, computeEventStatus } from '@/lib/store/eventStore'
import { relativeTime } from '@/lib/utils/dates'

const MAX_ITEMS = 10

/**
 * Recent activity feed showing the last 10 events sorted by updatedAt descending.
 * Each item displays the event name, its status badge, and a relative timestamp.
 * Clicking an item navigates to the event detail page.
 */
export function RecentActivity() {
  const navigate = useNavigate()
  const events = useEventStore((s) => s.events)

  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_ITEMS)
  }, [events])

  if (recentEvents.length === 0) {
    return (
      <Card>
        <CardContent>
          <h2 className="mb-3 text-lg font-semibold text-text-primary">Recent Activity</h2>
          <p className="text-sm text-text-muted">
            No recent activity to display.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Recent Activity</h2>
        <ul className="space-y-1" role="list" aria-label="Recent activity">
          {recentEvents.map((event) => {
            const displayStatus = computeEventStatus(event)
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`View ${event.name}, ${displayStatus}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {event.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {relativeTime(event.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={displayStatus} />
                </button>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
