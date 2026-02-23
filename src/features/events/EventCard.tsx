import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { computeEventStatus } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { formatDateShort, formatTime } from '@/lib/utils/dates'
import type { Event } from '@/lib/types/event'
import { MapPin, Clock } from 'lucide-react'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate()
  const building = useBuildingStore((s) => s.buildings.find((b) => b.id === event.buildingId))
  const displayStatus = computeEventStatus(event)

  return (
    <Card
      className="group cursor-pointer hover:border-brand/30 transition-colors"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-text-primary truncate">{event.name}</h3>
          <StatusBadge status={displayStatus} />
        </div>

        {event.date && (
          <p className="text-sm text-text-secondary mb-1">
            {formatDateShort(event.date)}
            {event.startTime && ` at ${formatTime(event.startTime)}`}
          </p>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted mt-2">
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
          {event.startTime && event.endTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(event.startTime)} – {formatTime(event.endTime)}
            </span>
          )}
        </div>

        {building && (
          <div className="flex items-center gap-1.5 mt-2">
            <div
              className="h-3 w-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: building.brandColor }}
            />
            <span className="text-xs text-text-muted truncate">{building.name}</span>
          </div>
        )}

        {event.category && (
          <div className="mt-2">
            <span className="inline-block rounded-full bg-page px-2 py-0.5 text-[10px] text-text-muted">
              {event.category}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
