import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { computeEventStatus } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { formatDateShort, formatTime } from '@/lib/utils/dates'
import type { Event } from '@/lib/types/event'
import { MapPin, Clock, Zap, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate()
  const building = useBuildingStore((s) => s.buildings.find((b) => b.id === event.buildingId))
  const displayStatus = computeEventStatus(event)

  const isDraft = displayStatus === 'draft'
  const isActive = displayStatus === 'active'
  const isCompleted = displayStatus === 'completed' || displayStatus === 'archived'
  const isCancelled = displayStatus === 'cancelled'

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all',
        // Draft: dashed border, 60% opacity
        isDraft && 'border-dashed border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-80',
        // Active: highlighted orange ring + brighter card
        isActive && 'border-orange-300 ring-1 ring-orange-200 bg-orange-50/30 dark:bg-orange-950/20 dark:border-orange-800 dark:ring-orange-900',
        // Completed / archived: muted appearance
        (isCompleted || isCancelled) && 'opacity-60',
        // Default hover
        !isDraft && !isActive && 'hover:border-brand/30',
      )}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className={cn(
              'font-semibold text-text-primary truncate',
              // Active: slightly bolder appearance
              isActive && 'text-orange-900 dark:text-orange-100',
              // Completed: muted
              isCompleted && 'line-through text-text-muted',
              isCancelled && 'line-through text-text-muted',
            )}
          >
            {/* Live / Active icon */}
            {isActive && (
              <Zap className="inline mr-1 h-3.5 w-3.5 text-orange-500 align-middle" />
            )}
            {/* Completed checkmark */}
            {isCompleted && (
              <Check className="inline mr-1 h-3.5 w-3.5 text-emerald-500 align-middle" />
            )}
            {event.name}
          </h3>
          <StatusBadge status={displayStatus} />
        </div>

        {event.date && (
          <p className={cn(
            'text-sm mb-1',
            isActive ? 'text-orange-700 dark:text-orange-300 font-medium' : 'text-text-secondary',
            (isCompleted || isCancelled) && 'text-text-muted',
          )}>
            {isActive && 'TODAY — '}
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
