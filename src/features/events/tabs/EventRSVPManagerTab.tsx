import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import type { Event } from '@/lib/types/event'
import { useEventStore } from '@/lib/store/eventStore'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Download, UserPlus, QrCode, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EventRSVPManagerTabProps {
  event: Event
}

// ---------------------------------------------------------------------------
// QR Code panel
// ---------------------------------------------------------------------------

function RSVPQRCode({ eventId }: { eventId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rsvpUrl, setRsvpUrl] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const url = `${window.location.origin}/rsvp/${eventId}`
    setRsvpUrl(url)

    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 2,
      color: { dark: '#1A1D2E', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    }).catch(() => setError(true))
  }, [eventId])

  function copyLink() {
    if (!rsvpUrl) return
    navigator.clipboard.writeText(rsvpUrl)
    toast.success('RSVP link copied to clipboard')
  }

  function downloadQR() {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `rsvp-qr-${eventId.slice(0, 8)}.png`
    a.click()
    toast.success('QR code downloaded')
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border-default pb-2">
        <QrCode className="h-4 w-4 text-text-muted" />
        <h4 className="text-sm font-semibold text-text-primary">RSVP Link &amp; QR Code</h4>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* QR code */}
        <div className="flex-shrink-0">
          {error ? (
            <div className="w-[200px] h-[200px] rounded-lg border border-border-default flex items-center justify-center text-xs text-text-muted">
              Failed to generate QR
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="rounded-lg border border-border-default"
              style={{ imageRendering: 'pixelated' }}
            />
          )}
        </div>

        {/* Link + actions */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-xs text-text-muted font-medium mb-1">Public RSVP link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate rounded bg-page border border-border-default px-2 py-1.5 text-xs text-text-secondary">
                {rsvpUrl || `${window.location.origin}/rsvp/${eventId}`}
              </code>
              <button
                onClick={copyLink}
                title="Copy link"
                className="flex-shrink-0 rounded border border-border-default p-1.5 hover:bg-surface-hover transition-colors"
              >
                <Copy className="h-3.5 w-3.5 text-text-muted" />
              </button>
              <a
                href={`/rsvp/${eventId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open RSVP page"
                className="flex-shrink-0 rounded border border-border-default p-1.5 hover:bg-surface-hover transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
              </a>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Share this link or print the QR code on event flyers, bulletin boards, or digital screens so residents can register easily.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadQR} disabled={error}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download QR (PNG)
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy Link
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main RSVP Manager Tab
// ---------------------------------------------------------------------------

export function EventRSVPManagerTab({ event }: EventRSVPManagerTabProps) {
  const promoteFromWaitlist = useEventStore((s) => s.promoteFromWaitlist)
  const removeRSVP = useEventStore((s) => s.removeRSVP)
  const updateEvent = useEventStore((s) => s.updateEvent)

  if (!event.rsvpEnabled) {
    return (
      <div className="max-w-sm space-y-4 py-4">
        <div className="rounded-lg border border-border-default bg-surface p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">RSVP is not enabled for this event</p>
            <p className="text-sm text-text-secondary">Enable RSVP tracking to get a unique link, QR code, and attendance tracker residents can use to register.</p>
          </div>

          <ul className="space-y-1.5">
            {[
              'Unique public RSVP link for residents',
              'QR code to print on flyers & posters',
              'Live attendance count & capacity bar',
              'Automatic waitlist when capacity is reached',
              'Export attendee list as CSV',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-success font-bold shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <Button
            onClick={() => {
              updateEvent(event.id, { rsvpEnabled: true })
              toast.success('RSVP enabled — your link and QR code are ready!')
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Enable RSVP for This Event
          </Button>
        </div>
      </div>
    )
  }

  const capacityPercent = event.rsvpLimit
    ? Math.round((event.rsvpCount / event.rsvpLimit) * 100)
    : null

  const totalHeadcount = event.rsvpList.reduce((sum, r) => sum + r.guestCount, 0)
  const waitlistHeadcount = event.rsvpWaitlist.reduce((sum, r) => sum + r.guestCount, 0)

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
      {/* Summary header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-lg font-semibold text-text-primary">
            {event.rsvpCount} {event.rsvpCount === 1 ? 'registration' : 'registrations'}
            {event.rsvpList.length > 0 && (
              <span className="text-sm font-normal text-text-muted ml-1.5">
                ({totalHeadcount} total {totalHeadcount === 1 ? 'person' : 'people'})
              </span>
            )}
          </h3>
          {event.rsvpLimit && (
            <p className="text-sm text-text-muted">
              {event.rsvpLimit - event.rsvpCount} of {event.rsvpLimit} spots remaining
            </p>
          )}
          {event.rsvpWaitlist.length > 0 && (
            <p className="text-sm text-warning font-medium">
              {event.rsvpWaitlist.length} on waitlist ({waitlistHeadcount} {waitlistHeadcount === 1 ? 'person' : 'people'})
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Capacity bar */}
      {capacityPercent !== null && (
        <div className="space-y-1">
          <Progress
            value={Math.min(capacityPercent, 100)}
            className={cn(capacityPercent >= 80 ? '[&>div]:bg-warning' : '')}
          />
          <p className={cn('text-xs', capacityPercent >= 100 ? 'text-danger font-medium' : capacityPercent >= 80 ? 'text-warning font-medium' : 'text-text-muted')}>
            {capacityPercent >= 100 ? 'Event is full' : capacityPercent >= 80 ? 'Almost full!' : `${capacityPercent}% capacity`}
          </p>
        </div>
      )}

      {/* QR Code section */}
      <RSVPQRCode eventId={event.id} />

      {/* Confirmed RSVP list */}
      {event.rsvpList.length > 0 ? (
        <section>
          <h4 className="text-sm font-semibold text-text-primary mb-2">
            Confirmed ({event.rsvpList.length})
          </h4>
          <div className="rounded-lg border border-border-default overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-page">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-text-muted">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-text-muted hidden sm:table-cell">Unit</th>
                  <th className="text-center px-3 py-2 font-medium text-text-muted">Guests</th>
                  <th className="text-right px-3 py-2 font-medium text-text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {event.rsvpList.map((r) => (
                  <tr key={r.id} className="border-t border-border-default hover:bg-surface-hover transition-colors">
                    <td className="px-3 py-2">
                      <p className="text-text-primary font-medium">{r.name}</p>
                      {r.dietaryNotes && (
                        <p className="text-xs text-text-muted">{r.dietaryNotes}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-text-secondary hidden sm:table-cell">
                      {r.unitNumber ?? '—'}
                    </td>
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
              <tfoot className="border-t border-border-default bg-page">
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-text-muted hidden sm:table-cell">Total headcount</td>
                  <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-text-muted sm:hidden">Total headcount</td>
                  <td className="px-3 py-2 text-center text-sm font-bold text-text-primary">{totalHeadcount}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : (
        <div className="text-center py-6 rounded-lg border border-dashed border-border-default">
          <p className="text-text-muted text-sm">No RSVPs yet.</p>
          <p className="text-xs text-text-muted mt-1">Share the RSVP link above to start collecting registrations.</p>
        </div>
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
                  <th className="text-left px-3 py-2 font-medium text-text-muted hidden sm:table-cell">Unit</th>
                  <th className="text-center px-3 py-2 font-medium text-text-muted">Guests</th>
                  <th className="text-right px-3 py-2 font-medium text-text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {event.rsvpWaitlist.map((r) => (
                  <tr key={r.id} className="border-t border-border-default hover:bg-surface-hover transition-colors">
                    <td className="px-3 py-2 text-text-primary">{r.name}</td>
                    <td className="px-3 py-2 text-text-secondary hidden sm:table-cell">
                      {r.unitNumber ?? '—'}
                    </td>
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
    </div>
  )
}
