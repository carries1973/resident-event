import type { Event } from '@/lib/types/event'
import { useEventStore } from '@/lib/store/eventStore'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Download, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface EventRSVPManagerTabProps {
  event: Event
}

export function EventRSVPManagerTab({ event }: EventRSVPManagerTabProps) {
  const promoteFromWaitlist = useEventStore((s) => s.promoteFromWaitlist)
  const removeRSVP = useEventStore((s) => s.removeRSVP)

  if (!event.rsvpEnabled) {
    return (
      <div className="text-center py-8 text-text-muted">
        RSVP is not enabled for this event. Enable it in the event settings.
      </div>
    )
  }

  const capacityPercent = event.rsvpLimit
    ? Math.round((event.rsvpCount / event.rsvpLimit) * 100)
    : null

  function exportCSV() {
    const headers = ['Name', 'Unit', 'Guests', 'Dietary Notes', 'Accessibility', 'Registered', 'Status']
    const rows = [...event.rsvpList, ...event.rsvpWaitlist].map((r) => [
      r.name,
      r.unitNumber ?? '',
      String(r.guestCount),
      r.dietaryNotes ?? '',
      r.accessibilityNeeds ?? '',
      r.registeredAt,
      r.status,
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rsvp-${event.name.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('RSVP list exported')
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {event.rsvpCount} {event.rsvpCount === 1 ? 'person' : 'people'} registered
          </h3>
          {event.rsvpLimit && (
            <p className="text-sm text-text-muted">{event.rsvpLimit - event.rsvpCount} spots remaining</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Capacity bar */}
      {capacityPercent !== null && (
        <Progress value={Math.min(capacityPercent, 100)} />
      )}

      {/* RSVP list */}
      {event.rsvpList.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Confirmed</h4>
          <div className="rounded-lg border border-border-default overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-page">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-text-muted">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-text-muted">Unit</th>
                  <th className="text-center px-3 py-2 font-medium text-text-muted">Guests</th>
                  <th className="text-right px-3 py-2 font-medium text-text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {event.rsvpList.map((r) => (
                  <tr key={r.id} className="border-t border-border-default">
                    <td className="px-3 py-2 text-text-primary">{r.name}</td>
                    <td className="px-3 py-2 text-text-secondary">{r.unitNumber ?? '—'}</td>
                    <td className="px-3 py-2 text-center text-text-secondary">{r.guestCount}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => removeRSVP(event.id, r.id)}
                        className="text-xs text-danger hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Waitlist */}
      {event.rsvpWaitlist.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-text-primary mb-2">
            Waitlist ({event.rsvpWaitlist.length})
          </h4>
          <div className="rounded-lg border border-border-default overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-page">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-text-muted">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-text-muted">Unit</th>
                  <th className="text-center px-3 py-2 font-medium text-text-muted">Guests</th>
                  <th className="text-right px-3 py-2 font-medium text-text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {event.rsvpWaitlist.map((r) => (
                  <tr key={r.id} className="border-t border-border-default">
                    <td className="px-3 py-2 text-text-primary">{r.name}</td>
                    <td className="px-3 py-2 text-text-secondary">{r.unitNumber ?? '—'}</td>
                    <td className="px-3 py-2 text-center text-text-secondary">{r.guestCount}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => promoteFromWaitlist(event.id, r.id)}
                        className="h-7 text-xs"
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Promote
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {event.rsvpList.length === 0 && event.rsvpWaitlist.length === 0 && (
        <p className="text-center text-text-muted py-4">No RSVPs yet.</p>
      )}
    </div>
  )
}
