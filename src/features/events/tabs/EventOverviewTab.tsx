import type { Event } from '@/lib/types/event'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { MapPin, Clock, Users, Tag, DollarSign } from 'lucide-react'

interface EventOverviewTabProps {
  event: Event
}

export function EventOverviewTab({ event }: EventOverviewTabProps) {
  const building = useBuildingStore((s) => s.buildings.find((b) => b.id === event.buildingId))

  return (
    <div className="space-y-6">
      {/* Description */}
      {event.description && (
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Description</h3>
          <p className="text-text-secondary whitespace-pre-wrap">{event.description}</p>
        </section>
      )}

      {/* Details grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {event.date && (
          <DetailItem icon={<Clock className="h-4 w-4" />} label="Date & time">
            {formatDate(event.date)}
            {event.startTime && event.endTime && (
              <span className="text-text-muted ml-1">
                {formatTime(event.startTime)} – {formatTime(event.endTime)}
              </span>
            )}
          </DetailItem>
        )}

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
