// ---------------------------------------------------------------------------
// LocalEventsCard — Ticketmaster Discovery API integration
// ---------------------------------------------------------------------------
// Shows publicly listed community events near the building's city.
// Requires VITE_TICKETMASTER_API_KEY in .env to function.
// If the key is missing, shows a helpful setup prompt instead.
//
// API docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
// Free tier: 5,000 requests/day, no credit card required.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Loader2, MapPin, CalendarDays, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/utils/dates'

const TM_API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY as string | undefined

interface TicketmasterEvent {
  id: string
  name: string
  dates: {
    start: {
      localDate?: string
      localTime?: string
    }
  }
  url: string
  _embedded?: {
    venues?: Array<{
      name?: string
      city?: { name?: string }
    }>
  }
  classifications?: Array<{
    segment?: { name?: string }
    genre?: { name?: string }
  }>
}

interface LocalEventsCardProps {
  city: string
  /** Province code e.g. "AB" */
  province: string
}

const MAX_EVENTS = 8

/** Formats a local time string HH:mm:ss into "7:00 PM" */
function formatLocalTime(localTime?: string): string {
  if (!localTime) return ''
  const [hStr, mStr] = localTime.split(':')
  const h = parseInt(hStr, 10)
  const m = mStr ?? '00'
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m} ${period}`
}

export function LocalEventsCard({ city, province }: LocalEventsCardProps) {
  const [events, setEvents] = useState<TicketmasterEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchEvents = useCallback(async () => {
    if (!city.trim()) return
    if (!TM_API_KEY) {
      setFetched(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        apikey: TM_API_KEY,
        countryCode: 'CA',
        city: city.trim(),
        size: String(MAX_EVENTS),
        sort: 'date,asc',
        // Only show events in the next 90 days
        startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      })

      const res = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      )

      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid Ticketmaster API key.')
        if (res.status === 429) throw new Error('Rate limit reached. Try again in a moment.')
        throw new Error(`Ticketmaster error: ${res.status}`)
      }

      const data = await res.json()
      const list: TicketmasterEvent[] = data._embedded?.events ?? []
      setEvents(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local events.')
      setEvents([])
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }, [city])

  // Auto-fetch when city is set (debounced via component mount logic)
  useEffect(() => {
    if (city.trim().length >= 3) {
      fetchEvents()
    }
  }, [city, fetchEvents])

  // Don't render at all until a city is entered
  if (!city.trim()) return null

  // No API key configured
  if (!TM_API_KEY && fetched) {
    return (
      <div className="rounded-lg border border-border-default bg-surface-hover/50 p-4 mt-4">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">Local events search is not set up</p>
            <p className="text-xs text-text-muted mt-0.5">
              Add <code className="bg-surface border border-border-default rounded px-1 py-0.5 font-mono text-[11px]">VITE_TICKETMASTER_API_KEY</code> to your{' '}
              <code className="bg-surface border border-border-default rounded px-1 py-0.5 font-mono text-[11px]">.env</code> file to show publicly listed events near {city}.{' '}
              <a
                href="https://developer-acct.ticketmaster.com/user/register"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                Get a free API key →
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">
            Upcoming community events in {city}{province ? `, ${province}` : ''}
          </p>
        </div>
        {fetched && !loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchEvents}
            className="h-7 px-2 text-xs text-text-muted hover:text-text-primary"
            aria-label="Refresh local events"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-text-muted py-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching for events near {city}…
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}

      {!loading && !error && fetched && events.length === 0 && (
        <p className="text-sm text-text-muted py-2">
          No upcoming public events found near {city}. Try checking back closer to the date.
        </p>
      )}

      {!loading && events.length > 0 && (
        <ul className="space-y-2" role="list">
          {events.map((event) => {
            const venue = event._embedded?.venues?.[0]
            const venueCity = venue?.city?.name
            const venueName = venue?.name
            const segment = event.classifications?.[0]?.segment?.name
            const genre = event.classifications?.[0]?.genre?.name
            const categoryLabel = [segment, genre]
              .filter((s) => s && s !== 'Undefined')
              .join(' › ')

            const dateStr = event.dates.start.localDate
            const timeStr = event.dates.start.localTime
            const formattedDate = dateStr ? formatDateShort(dateStr) : ''
            const formattedTime = formatLocalTime(timeStr)

            return (
              <li key={event.id}>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-lg border border-border-default bg-surface p-3 hover:bg-surface-hover hover:border-accent-primary/30 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-primary transition-colors">
                      {event.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      {formattedDate && (
                        <span className="text-xs text-text-muted">
                          {formattedDate}{formattedTime ? ` · ${formattedTime}` : ''}
                        </span>
                      )}
                      {(venueName || venueCity) && (
                        <span className="text-xs text-text-muted flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {venueName ?? venueCity}
                        </span>
                      )}
                    </div>
                    {categoryLabel && (
                      <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-text-muted font-medium">
                        {categoryLabel}
                      </span>
                    )}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5 group-hover:text-accent-primary transition-colors" />
                </a>
              </li>
            )
          })}
        </ul>
      )}

      {!loading && events.length > 0 && (
        <p className="text-[10px] text-text-muted">
          Events sourced from{' '}
          <a
            href="https://www.ticketmaster.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Ticketmaster
          </a>
          . Use these as inspiration for resident programming.
        </p>
      )}
    </div>
  )
}
