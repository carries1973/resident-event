import type { Event } from '@/lib/types/event'
import { formatDate, formatTime, todayISO } from '@/lib/utils/dates'

/**
 * CSV export utilities for RSVP lists, event reports, and closeout data.
 *
 * Each export function generates a CSV file and triggers a browser download.
 */

/**
 * Generates a CSV string from an array of headers and rows.
 * Handles comma escaping, double-quote escaping, and newlines in values.
 */
function toCSV(headers: string[], rows: string[][]): string {
  const escapeCell = (value: string): string => {
    // If the value contains a comma, double-quote, or newline, wrap in quotes
    // and escape any existing double-quotes by doubling them
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const headerLine = headers.map(escapeCell).join(',')
  const dataLines = rows.map((row) => row.map(escapeCell).join(','))

  return [headerLine, ...dataLines].join('\r\n')
}

/**
 * Triggers a file download in the browser by creating a temporary anchor element.
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Sanitises an event name for use in a filename.
 * Removes special characters and replaces spaces with hyphens.
 */
function sanitiseFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
}

/**
 * Export RSVP list for an event as a CSV download.
 *
 * Columns: Name, Unit, Guests, Dietary Notes, Accessibility Needs, Status, Registered At
 * Includes both confirmed and waitlisted entries.
 * Downloads as: {eventName}-RSVP-{date}.csv
 */
export function exportRSVPcsv(event: Event): void {
  const headers = [
    'Name',
    'Unit',
    'Guests',
    'Dietary Notes',
    'Accessibility Needs',
    'Status',
    'Registered At',
  ]

  const allEntries = [...event.rsvpList, ...event.rsvpWaitlist]

  const rows = allEntries.map((entry) => [
    entry.name,
    entry.unitNumber ?? '',
    String(entry.guestCount),
    entry.dietaryNotes ?? '',
    entry.accessibilityNeeds ?? '',
    entry.status === 'confirmed' ? 'Confirmed' : 'Waitlisted',
    entry.registeredAt ? formatDate(entry.registeredAt.split('T')[0]) : '',
  ])

  const csv = toCSV(headers, rows)
  const safeName = sanitiseFilename(event.name)
  const today = todayISO()
  downloadCSV(csv, `${safeName}-RSVP-${today}.csv`)
}

/**
 * Export event summary report for a building as a CSV download.
 *
 * Columns: Name, Date, Time, Location, Status, Category, RSVP Count, Budget Tier
 * Downloads as: {buildingName}-Events-{today}.csv
 */
export function exportEventReport(events: Event[], buildingName: string): void {
  const headers = [
    'Name',
    'Date',
    'Time',
    'Location',
    'Status',
    'Category',
    'RSVP Count',
    'Budget Tier',
  ]

  const rows = events.map((event) => {
    const timeRange =
      event.startTime && event.endTime
        ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
        : event.startTime
          ? formatTime(event.startTime)
          : ''

    return [
      event.name,
      event.date ? formatDate(event.date) : '',
      timeRange,
      event.location,
      event.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      event.category,
      String(event.rsvpCount),
      event.budgetEstimate.tier.replace(/\b\w/g, (c) => c.toUpperCase()),
    ]
  })

  const csv = toCSV(headers, rows)
  const safeName = sanitiseFilename(buildingName)
  const today = todayISO()
  downloadCSV(csv, `${safeName}-Events-${today}.csv`)
}

/**
 * Export closeout data for completed events as a CSV download.
 *
 * Filters to only events that have closeout data.
 * Columns: Name, Date, Expected Attendance, Actual Attendance, Budgeted Cost, Actual Cost, Feedback Summary
 * Downloads as: {buildingName}-Closeout-{today}.csv
 */
export function exportCloseoutReport(events: Event[], buildingName: string): void {
  const headers = [
    'Name',
    'Date',
    'Expected Attendance',
    'Actual Attendance',
    'Budgeted Cost',
    'Actual Cost',
    'Feedback Summary',
  ]

  const eventsWithCloseout = events.filter((event) => event.closeout != null)

  const rows = eventsWithCloseout.map((event) => {
    const closeout = event.closeout!
    return [
      event.name,
      event.date ? formatDate(event.date) : '',
      String(closeout.expectedAttendance),
      String(closeout.actualAttendance),
      closeout.budgetedCost != null ? `$${closeout.budgetedCost.toFixed(2)}` : '',
      closeout.actualCost != null ? `$${closeout.actualCost.toFixed(2)}` : '',
      closeout.feedbackSummary ?? '',
    ]
  })

  const csv = toCSV(headers, rows)
  const safeName = sanitiseFilename(buildingName)
  const today = todayISO()
  downloadCSV(csv, `${safeName}-Closeout-${today}.csv`)
}
