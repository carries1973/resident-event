import { useState, useEffect } from 'react'
import type { Event } from '@/lib/types/event'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { useEventStore } from '@/lib/store/eventStore'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { MapPin, Users, Tag, DollarSign, CalendarDays, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AiDisclaimer } from '@/components/common/AiDisclaimer'

interface EventOverviewTabProps {
  event: Event
}

// Derive duration string from HH:mm times
function deriveDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const totalMin = (eh * 60 + em) - (sh * 60 + sm)
  if (totalMin <= 0) return ''
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function EventOverviewTab({ event }: EventOverviewTabProps) {
  const building = useBuildingStore((s) => s.buildings.find((b) => b.id === event.buildingId))
  const updateEvent = useEventStore((s) => s.updateEvent)

  // Scheduling inline-edit state
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState(event.date ?? '')
  const [startTime, setStartTime] = useState(event.startTime ?? '')
  const [endTime, setEndTime] = useState(event.endTime ?? '')
  const [location, setLocation] = useState(event.location ?? '')

  // Keep local state in sync if event updates externally
  useEffect(() => {
    setDate(event.date ?? '')
    setStartTime(event.startTime ?? '')
    setEndTime(event.endTime ?? '')
    setLocation(event.location ?? '')
  }, [event.date, event.startTime, event.endTime, event.location])

  const hasSchedule = !!(event.date && event.startTime && event.endTime && event.location)
  const missingSchedule = !event.date || !event.startTime || !event.endTime || !event.location

  function handleSaveSchedule() {
    if (!date) { toast.error('Date is required.'); return }
    if (!startTime) { toast.error('Start time is required.'); return }
    if (!endTime) { toast.error('End time is required.'); return }
    if (startTime >= endTime) { toast.error('End time must be after start time.'); return }
    if (!location.trim()) { toast.error('Location is required.'); return }
    updateEvent(event.id, { date, startTime, endTime, location: location.trim() })
    toast.success('Schedule saved.')
    setEditing(false)
  }

  function handleCancel() {
    setDate(event.date ?? '')
    setStartTime(event.startTime ?? '')
    setEndTime(event.endTime ?? '')
    setLocation(event.location ?? '')
    setEditing(false)
  }

  const duration = (startTime && endTime && startTime < endTime)
    ? deriveDuration(startTime, endTime)
    : ''

  return (
    <div className="space-y-6">
      {/* ── Scheduling section ── */}
      <section className="rounded-lg border border-border-default bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Schedule
          </h3>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" />
              {hasSchedule ? 'Edit' : 'Set schedule'}
            </Button>
          )}
        </div>

        {editing ? (
          /* Inline edit form */
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-text-muted font-medium" htmlFor="ov-date">Date <span className="text-danger">*</span></label>
                <input
                  id="ov-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-border-default bg-page px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted font-medium" htmlFor="ov-start">Start time <span className="text-danger">*</span></label>
                <input
                  id="ov-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-md border border-border-default bg-page px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-muted font-medium" htmlFor="ov-end">End time <span className="text-danger">*</span></label>
                <input
                  id="ov-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-md border border-border-default bg-page px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted font-medium" htmlFor="ov-location">
                Location <span className="text-danger">*</span>
              </label>
              <input
                id="ov-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Rooftop Patio, Resident Lounge"
                className="w-full rounded-md border border-border-default bg-page px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {duration && (
              <p className="text-xs text-text-muted">Duration: {duration}</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" className="h-7 px-3 text-xs gap-1" onClick={handleSaveSchedule}>
                <Check className="h-3 w-3" />
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={handleCancel}>
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : hasSchedule ? (
          /* Scheduled display */
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-text-primary font-medium">{formatDate(event.date)}</span>
              <span className="text-text-secondary">
                {formatTime(event.startTime)} – {formatTime(event.endTime)}
              </span>
              {duration && (
                <span className="text-xs text-text-muted bg-page px-2 py-0.5 rounded-full">{duration}</span>
              )}
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                <MapPin className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
                {event.location}
              </div>
            )}
          </div>
        ) : (
          /* Missing schedule nudge */
          <div className="space-y-1.5">
            <p className="text-sm text-text-muted">
              No schedule set yet.{' '}
              <span className="text-warning font-medium">
                Date, time, and location are required to schedule this event.
              </span>
            </p>
            {/* Show partial info if some fields exist */}
            {(event.date || event.startTime || event.location) && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted">
                {event.date && <span>📅 {formatDate(event.date)}</span>}
                {event.startTime && event.endTime && <span>🕐 {formatTime(event.startTime)} – {formatTime(event.endTime)}</span>}
                {event.location && <span>📍 {event.location}</span>}
              </div>
            )}
          </div>
        )}

        {/* Schedule missing warning (when not editing) */}
        {missingSchedule && !editing && (
          <p className="text-xs text-text-muted border-t border-border-default pt-2 mt-1">
            Click <span className="font-medium text-text-primary">Set schedule</span> above, then use the{' '}
            <span className="font-medium text-text-primary">Schedule</span> button to publish this event.
          </p>
        )}
      </section>

      {/* AI-generated notice — only shown for AI-planned events */}
      {event.aiGenerated && (
        <AiDisclaimer contentType="event details" />
      )}

      {/* Description */}
      {event.description && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Description</h3>
          <p className="text-text-secondary whitespace-pre-wrap">{event.description}</p>
        </section>
      )}

      {/* Details grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {event.location && (
          <DetailItem icon={<MapPin className="h-4 w-4" />} label="Location">
            {event.location}
          </DetailItem>
        )}

        {building && (
          <DetailItem
            icon={<div className="h-4 w-4 rounded" style={{ backgroundColor: building.brandColor }} />}
            label="Building"
          >
            {building.name}
          </DetailItem>
        )}

        {event.category && (
          <DetailItem icon={<Tag className="h-4 w-4" />} label="Category">
            {event.category}
          </DetailItem>
        )}

        {event.rsvpEnabled && (
          <DetailItem icon={<Users className="h-4 w-4" />} label="RSVP">
            {event.rsvpCount} registered
            {event.rsvpLimit && ` of ${event.rsvpLimit}`}
          </DetailItem>
        )}
      </section>

      {/* Tags */}
      {event.tags.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-page px-2.5 py-0.5 text-xs text-text-secondary">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Internal notes */}
      {event.whyItWorks && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Why it works</h3>
          <p className="text-sm text-text-muted whitespace-pre-wrap bg-page rounded-lg p-3">
            {event.whyItWorks}
          </p>
        </section>
      )}

      {/* Budget */}
      {event.budgetEstimate && (event.budgetEstimate.tier || event.budgetEstimate.amount) && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            Budget
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-text-secondary">
              <span className="font-medium text-text-primary capitalize">{event.budgetEstimate.tier}</span>
              {event.budgetEstimate.amount != null && (
                <> &mdash; ${event.budgetEstimate.amount.toLocaleString()}</>
              )}
            </p>
            {event.budgetEstimate.breakdown && (
              <p className="text-text-muted">{event.budgetEstimate.breakdown}</p>
            )}
          </div>
        </section>
      )}

      {/* Logistics */}
      {(event.setupAndSupplies || event.staffing || event.weatherPlan || event.accessibilityNotes) && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Logistics</h3>
          <div className="space-y-3 text-sm">
            {event.setupAndSupplies && (
              <div>
                <span className="font-medium text-text-primary">Setup & supplies:</span>{' '}
                <span className="text-text-secondary">{event.setupAndSupplies}</span>
              </div>
            )}
            {event.staffing && (
              <div>
                <span className="font-medium text-text-primary">Staffing:</span>{' '}
                <span className="text-text-secondary">{event.staffing}</span>
              </div>
            )}
            {event.weatherPlan && (
              <div>
                <span className="font-medium text-text-primary">Weather plan:</span>{' '}
                <span className="text-text-secondary">{event.weatherPlan}</span>
              </div>
            )}
            {event.accessibilityNotes && (
              <div>
                <span className="font-medium text-text-primary">Accessibility:</span>{' '}
                <span className="text-text-secondary">{event.accessibilityNotes}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Building amenities — useful reference when planning event details */}
      {building && (building.amenities?.length > 0 || building.customAmenities?.length > 0) && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Available amenities at {building.name}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {[...(building.amenities ?? []), ...(building.customAmenities ?? [])].map((a) => (
              <span
                key={a}
                className={
                  event.location && event.location.toLowerCase().includes(a.toLowerCase())
                    ? 'inline-flex items-center rounded-full bg-accent-primary/10 border border-accent-primary/30 px-2.5 py-0.5 text-xs text-accent-primary font-medium'
                    : 'inline-flex items-center rounded-full bg-page border border-border-default px-2.5 py-0.5 text-xs text-text-secondary'
                }
              >
                {a}
              </span>
            ))}
          </div>
          {event.location && (
            <p className="text-xs text-text-muted mt-2">
              Highlighted amenity matches the event location.
            </p>
          )}
        </section>
      )}

      {/* Measurement plan */}
      {event.measurementPlan && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Measurement plan</h3>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{event.measurementPlan}</p>
        </section>
      )}
    </div>
  )
}

function DetailItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-text-muted mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm text-text-primary">{children}</p>
      </div>
    </div>
  )
}
