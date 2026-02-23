import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ClipboardCheck, FileEdit } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEventStore } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { formatDateShort } from '@/lib/utils/dates'
import type { Event } from '@/lib/types/event'

type QueueItemType = 'prepare' | 'closeout' | 'schedule'

interface QueueItem {
  event: Event
  type: QueueItemType
  buildingName: string
}

const QUEUE_CONFIG: Record<QueueItemType, { label: string; icon: React.ReactNode }> = {
  prepare: {
    label: 'Prepare',
    icon: <Clock className="h-4 w-4" />,
  },
  closeout: {
    label: 'Complete Closeout',
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  schedule: {
    label: 'Schedule',
    icon: <FileEdit className="h-4 w-4" />,
  },
}

const MAX_ITEMS = 10

/**
 * Prioritised work queue for the dashboard.
 *
 * Priority order:
 *  1. Events in the next 48 hours needing preparation
 *  2. Events needing closeout (oldest first)
 *  3. Draft events (newest first)
 *
 * Maximum of 10 items displayed.
 */
export function WorkQueue() {
  const navigate = useNavigate()
  const getUpcomingEvents = useEventStore((s) => s.getUpcomingEvents)
  const getEventsNeedingCloseout = useEventStore((s) => s.getEventsNeedingCloseout)
  const getDraftEvents = useEventStore((s) => s.getDraftEvents)
  const getBuildingById = useBuildingStore((s) => s.getBuildingById)

  const items = useMemo<QueueItem[]>(() => {
    const result: QueueItem[] = []

    // 1. Events in next 48 hours
    const upcoming = getUpcomingEvents(2)
    for (const event of upcoming) {
      if (result.length >= MAX_ITEMS) break
      const building = getBuildingById(event.buildingId)
      result.push({
        event,
        type: 'prepare',
        buildingName: building?.name ?? 'Unknown building',
      })
    }

    // 2. Events needing closeout — oldest first
    const closeout = getEventsNeedingCloseout().sort(
      (a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime()
    )
    for (const event of closeout) {
      if (result.length >= MAX_ITEMS) break
      // Avoid duplicates (an event could appear in both lists)
      if (result.some((r) => r.event.id === event.id)) continue
      const building = getBuildingById(event.buildingId)
      result.push({
        event,
        type: 'closeout',
        buildingName: building?.name ?? 'Unknown building',
      })
    }

    // 3. Draft events — newest first
    const drafts = getDraftEvents().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    for (const event of drafts) {
      if (result.length >= MAX_ITEMS) break
      if (result.some((r) => r.event.id === event.id)) continue
      const building = getBuildingById(event.buildingId)
      result.push({
        event,
        type: 'schedule',
        buildingName: building?.name ?? 'Unknown building',
      })
    }

    return result
  }, [getUpcomingEvents, getEventsNeedingCloseout, getDraftEvents, getBuildingById])

  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <h2 className="mb-3 text-lg font-semibold text-text-primary">Work Queue</h2>
          <p className="text-sm text-text-muted">
            Nothing needs your attention right now. Nice work!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Work Queue</h2>
        <ul className="space-y-2" role="list" aria-label="Work queue items">
          {items.map((item) => {
            const config = QUEUE_CONFIG[item.type]
            return (
              <li key={item.event.id}>
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-default p-3 transition-colors hover:bg-surface-hover focus-within:ring-2 focus-within:ring-ring"
                  role="listitem"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.event.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {item.buildingName}
                      {item.event.date && (
                        <span className="ml-1">
                          &middot; {formatDateShort(item.event.date)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/events/${item.event.id}`)}
                    aria-label={`${config.label} ${item.event.name}`}
                  >
                    {config.icon}
                    <span className="hidden sm:inline">{config.label}</span>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
