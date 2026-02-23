import { useParams } from 'react-router-dom'
import { useEventStore } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useState, useMemo } from 'react'
import { RSVPForm } from './RSVPForm'
import { RSVPFull } from './RSVPFull'
import { RSVPConfirmation } from './RSVPConfirmation'

type RSVPView = 'form' | 'confirmation' | 'full' | 'waitlist_form'

export function RSVPPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const event = useEventStore((s) => s.events.find((e) => e.id === eventId))
  const building = useBuildingStore((s) =>
    event ? s.buildings.find((b) => b.id === event.buildingId) : undefined
  )

  const [view, setView] = useState<RSVPView>('form')
  // Track whether the last submission went to the waitlist
  const [wasWaitlisted, setWasWaitlisted] = useState(false)

  const capacityInfo = useMemo(() => {
    if (!event) return null
    const hasLimit = typeof event.rsvpLimit === 'number' && event.rsvpLimit > 0
    const isFull = hasLimit && event.rsvpCount >= event.rsvpLimit!
    const percentFull = hasLimit
      ? Math.round((event.rsvpCount / event.rsvpLimit!) * 100)
      : 0
    const almostFull = hasLimit && percentFull >= 80 && !isFull
    return { hasLimit, isFull, percentFull, almostFull }
  }, [event])

  // Determine effective view based on capacity
  // - 'form' → show RSVPFull if event is full (initial landing)
  // - 'waitlist_form' → always show the form (user chose "Join Waitlist")
  // - 'confirmation' → always show confirmation
  const effectiveView: string =
    view === 'form' && capacityInfo?.isFull ? 'full' : view

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Event not found
          </h1>
          <p className="text-gray-600">
            This event may have been removed or the link may be incorrect.
          </p>
        </div>
      </div>
    )
  }

  if (!event.rsvpEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            RSVP is not available for this event
          </h1>
          <p className="text-gray-600">
            Registration is currently closed for{' '}
            <span className="font-medium">{event.name}</span>.
          </p>
        </div>
      </div>
    )
  }

  const brandColor = building?.brandColor || '#3B7BF4'

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
    <div className="min-h-screen bg-gray-50">
      {/* Brand accent bar */}
      <div className="h-2" style={{ backgroundColor: brandColor }} />

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Building logo */}
        {building?.logoUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={building.logoUrl}
              alt={`${building.name} logo`}
              className="h-16 w-auto object-contain"
            />
          </div>
        )}

        {/* Event heading */}
        <h1
          className="text-2xl font-bold text-center mb-1"
          style={{ color: brandColor }}
        >
          {event.name}
        </h1>

        {building && (
          <p className="text-center text-gray-500 text-sm mb-4">
            {building.name}
          </p>
        )}

        {/* Event details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 mt-0.5">📅</span>
            <span className="text-gray-800">{formatDate(event.date)}</span>
          </div>
          {(event.startTime || event.endTime) && (
            <div className="flex items-start gap-3">
              <span className="text-gray-400 mt-0.5">🕐</span>
              <span className="text-gray-800">
                {formatTime(event.startTime)}
                {event.startTime && event.endTime ? ' – ' : ''}
                {formatTime(event.endTime)}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-start gap-3">
              <span className="text-gray-400 mt-0.5">📍</span>
              <span className="text-gray-800">{event.location}</span>
            </div>
          )}
          {event.description && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Capacity indicator */}
        {capacityInfo && (
          <div className="mb-6">
            {capacityInfo.hasLimit ? (
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600">
                    {event.rsvpCount} of {event.rsvpLimit} spots filled
                  </span>
                  {capacityInfo.almostFull && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Almost full!
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(capacityInfo.percentFull, 100)}%`,
                      backgroundColor: capacityInfo.almostFull
                        ? '#D97706'
                        : brandColor,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center">
                {event.rsvpCount}{' '}
                {event.rsvpCount === 1 ? 'person' : 'people'} attending
              </p>
            )}
          </div>
        )}

        {/* View switching */}
        {effectiveView === 'form' && (
          <RSVPForm
            event={event}
            onSuccess={() => {
              setWasWaitlisted(false)
              setView('confirmation')
            }}
          />
        )}

        {effectiveView === 'waitlist_form' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-blue-800 font-medium">
                Joining the waitlist — we'll contact you if a spot opens up.
              </p>
            </div>
            <RSVPForm
              event={event}
              onSuccess={() => {
                setWasWaitlisted(true)
                setView('confirmation')
              }}
            />
          </div>
        )}

        {effectiveView === 'full' && (
          <RSVPFull
            event={event}
            onJoinWaitlist={() => setView('waitlist_form')}
          />
        )}

        {effectiveView === 'confirmation' && (
          <RSVPConfirmation
            event={event}
            building={building}
            wasWaitlisted={wasWaitlisted}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400">
        Powered by Resident Event Ideas
      </div>
    </div>
  )
}
