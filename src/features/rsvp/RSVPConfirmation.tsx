import type { Event } from '@/lib/types/event'
import type { Building } from '@/lib/types/building'

interface RSVPConfirmationProps {
  event: Event
  building?: Building
  wasWaitlisted?: boolean
}

export function RSVPConfirmation({ event, building, wasWaitlisted = false }: RSVPConfirmationProps) {
  const brandColor = building?.brandColor || '#3B7BF4'

  // Use the explicit prop from the parent to know if the user was waitlisted,
  // instead of guessing from event state (which may have changed since submission)
  const isAtCapacity = wasWaitlisted

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (time: string): string => {
    if (!time || !time.includes(':')) return ''
    const [hours, minutes] = time.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return ''
    const period = hours >= 12 ? 'p.m.' : 'a.m.'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  return (
    <div className="text-center py-8">
      {/* Green checkmark */}
      <div
        className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${brandColor}15` }}
      >
        <svg
          className="w-10 h-10"
          fill="none"
          stroke={brandColor}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {isAtCapacity
          ? "You've been added to the waitlist!"
          : "You're registered!"}
      </h2>

      <p className="text-gray-600 mb-6">
        {isAtCapacity
          ? "We'll notify you if a spot opens up."
          : "We look forward to seeing you there."}
      </p>

      {/* Event summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-left space-y-3 mb-6">
        <h3 className="font-semibold text-gray-900 text-lg">{event.name}</h3>

        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-0.5">📅</span>
          <span className="text-gray-700">{formatDate(event.date)}</span>
        </div>

        {(event.startTime || event.endTime) && (
          <div className="flex items-start gap-3">
            <span className="text-gray-400 mt-0.5">🕐</span>
            <span className="text-gray-700">
              {formatTime(event.startTime)}
              {event.startTime && event.endTime ? ' – ' : ''}
              {formatTime(event.endTime)}
            </span>
          </div>
        )}

        {event.location && (
          <div className="flex items-start gap-3">
            <span className="text-gray-400 mt-0.5">📍</span>
            <span className="text-gray-700">{event.location}</span>
          </div>
        )}
      </div>

      {/* Add to calendar hint */}
      <p className="text-sm text-gray-500 mb-6">
        Don't forget to add this event to your personal calendar!
      </p>

      {/* Building logo */}
      {building?.logoUrl && (
        <div className="flex justify-center pt-4 border-t border-gray-100">
          <img
            src={building.logoUrl}
            alt={`${building.name} logo`}
            className="h-10 w-auto object-contain opacity-60"
          />
        </div>
      )}
    </div>
  )
}
