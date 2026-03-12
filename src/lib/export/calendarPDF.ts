/**
 * Calendar PDF Export
 *
 * Generates a building-branded monthly calendar as a landscape-oriented
 * PDF using jsPDF. All layout values are governed by the locked export
 * contract enforced through gatekeeper assertions.
 *
 * The exported PDF uses the building's brand colour for the month header
 * and includes the building logo (if provided). No app branding appears
 * anywhere in the output.
 *
 * Page 1: Calendar grid with events (max 2 per cell) and observance names.
 * Page 2 (legend): All observances with dates + all events with date/time/location.
 */

import { jsPDF } from 'jspdf'
import { assertExportConfig, getDefaultExportConfig } from './gatekeeper'

export interface CalendarExportParams {
  year: number
  month: number // 1-12
  events: Array<{
    date: string
    name: string
    status: string
    startTime?: string
    endTime?: string
    location?: string
  }>
  observances?: Array<{
    day?: number
    name: string
    month: number
    emoji?: string
  }>
  buildingName: string
  brandColor: string // hex, e.g. "#2E8B8B"
  logoUrl?: string // data URL or undefined
}

/** Month names for header display */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Day-of-week headers (Sunday-first) */
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Parse a hex colour string into RGB components.
 * Accepts "#RRGGBB" or "RRGGBB" format.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

/**
 * Get the number of rows needed for a calendar month grid.
 * A month needs 5 or 6 rows depending on the starting day and total days.
 */
function getCalendarRows(year: number, month: number): number {
  const firstDay = new Date(year, month - 1, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = firstDay + daysInMonth
  return Math.ceil(totalCells / 7)
}

/**
 * Truncate text with ellipsis if it exceeds maxWidth at the given font size.
 */
function truncateText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
): string {
  const textWidth = doc.getTextWidth(text)
  if (textWidth <= maxWidth) return text

  const ellipsis = '...'
  let truncated = text
  while (truncated.length > 0 && doc.getTextWidth(truncated + ellipsis) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + ellipsis
}

/**
 * Format a time string (HH:mm) into 12-hour display (e.g. "10:00 AM").
 */
function formatTime(time?: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Format a date string (YYYY-MM-DD) into "March 8" display format.
 */
function formatDateShort(dateStr: string, year: number): string {
  const date = new Date(dateStr + 'T00:00:00')
  const monthName = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const dateYear = date.getFullYear()
  // Only append year if it differs from the calendar year
  if (dateYear !== year) return `${monthName} ${day}, ${dateYear}`
  return `${monthName} ${day}`
}

/**
 * Draw the branded page header (logo + month/year title).
 * Returns the x-position where the month text starts (after logo if present).
 */
async function drawPageHeader(
  doc: jsPDF,
  params: {
    logoUrl?: string
    monthName: string
    year: number
    margin: number
    brandRgb: { r: number; g: number; b: number }
    monthHeaderFontSize: number
  },
): Promise<void> {
  const { logoUrl, monthName, year, margin, brandRgb, monthHeaderFontSize } = params
  let headerTextX = margin

  if (logoUrl) {
    try {
      // Auto-detect the image format from the data URL prefix so JPEG logos
      // don't cause a format mismatch error in jsPDF.
      const logoFormat = logoUrl.startsWith('data:image/jpeg') ? 'JPEG'
        : logoUrl.startsWith('data:image/png') ? 'PNG'
        : 'JPEG' // safe fallback for any other format
      const logoMaxHeight = 0.5
      const logoMaxWidth = 0.8
      doc.addImage(logoUrl, logoFormat, margin, margin, logoMaxWidth, logoMaxHeight)
      headerTextX = margin + logoMaxWidth + 0.15
    } catch {
      // Logo failed to render — continue without it rather than aborting export
      headerTextX = margin
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(monthHeaderFontSize)
  doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b)
  doc.text(`${monthName} ${year}`, headerTextX, margin + 0.35)
}

/**
 * Export a monthly calendar as a PDF file.
 *
 * This function:
 * 1. Validates the locked export config via gatekeeper assertions
 * 2. Builds a landscape letter-size PDF (11" x 8.5")
 * 3. Draws a branded header with optional logo and month/year
 * 4. Renders day-of-week headers
 * 5. Draws the calendar grid with events (max 2 per cell) and observance names
 * 6. Adds a legend page listing all observances and all events with details
 * 7. Saves the PDF with a building-branded filename
 */
export async function exportCalendarPDF(
  params: CalendarExportParams,
): Promise<void> {
  const { year, month, events, observances = [], buildingName, brandColor, logoUrl } = params
  const config = getDefaultExportConfig()

  // ── Gatekeeper check ──────────────────────────────────────────────
  assertExportConfig(config)

  // ── Page setup ────────────────────────────────────────────────────
  // Letter landscape: 11" wide x 8.5" tall, using inches as units
  const doc = new jsPDF('landscape', 'in', 'letter')

  const pageWidth = 11
  const pageHeight = 8.5
  const margin = config.marginInches // 0.5"
  const printableWidth = pageWidth - margin * 2 // 10"
  const printableHeight = pageHeight - margin * 2 // 7.5"

  const brandRgb = hexToRgb(brandColor)
  const monthName = MONTH_NAMES[month - 1]

  // ── Header area ───────────────────────────────────────────────────
  const headerHeight = 0.6 // Reserve 0.6" for header

  await drawPageHeader(doc, {
    logoUrl,
    monthName,
    year,
    margin,
    brandRgb,
    monthHeaderFontSize: config.fontSize.monthHeader,
  })

  // ── Day-of-week headers ───────────────────────────────────────────
  const gridTop = margin + headerHeight + 0.1
  const colWidth = printableWidth / 7
  const headerRowHeight = 0.3

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(config.fontSize.dayOfWeek) // 12pt
  doc.setTextColor(0x33, 0x33, 0x33) // #333333

  for (let col = 0; col < 7; col++) {
    const x = margin + col * colWidth
    const textWidth = doc.getTextWidth(DAY_HEADERS[col])
    doc.text(DAY_HEADERS[col], x + (colWidth - textWidth) / 2, gridTop + 0.2)
  }

  // ── Calendar grid ─────────────────────────────────────────────────
  const numRows = getCalendarRows(year, month)
  const gridContentTop = gridTop + headerRowHeight
  const availableGridHeight = printableHeight - headerHeight - 0.1 - headerRowHeight
  const cellHeight = Math.max(config.cellHeightInches, availableGridHeight / numRows)

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // Group events by day number for quick lookup
  const eventsByDay = new Map<
    number,
    Array<{ name: string; status: string; startTime?: string; endTime?: string; location?: string }>
  >()
  for (const event of events) {
    const eventDate = new Date(event.date + 'T00:00:00')
    if (eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month) {
      const day = eventDate.getDate()
      if (!eventsByDay.has(day)) {
        eventsByDay.set(day, [])
      }
      eventsByDay.get(day)!.push({
        name: event.name,
        status: event.status,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
      })
    }
  }

  // Group observances by day for quick lookup
  // day === undefined means month-long — we skip those in the grid (too many cells)
  const observancesByDay = new Map<number, Array<{ name: string; emoji?: string }>>()
  for (const obs of observances) {
    if (obs.day != null && obs.month === month) {
      if (!observancesByDay.has(obs.day)) {
        observancesByDay.set(obs.day, [])
      }
      observancesByDay.get(obs.day)!.push({ name: obs.name, emoji: obs.emoji })
    }
  }

  // Draw cell borders and content
  doc.setDrawColor(0xd0, 0xd0, 0xd0) // #D0D0D0
  doc.setLineWidth(0.5 / 72) // 0.5pt → inches

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < 7; col++) {
      const cellIndex = row * 7 + col
      const dayNum = cellIndex - firstDayOfWeek + 1

      const x = margin + col * colWidth
      const y = gridContentTop + row * cellHeight

      // Draw cell border
      doc.rect(x, y, colWidth, cellHeight)

      // Only render content for valid days of the month
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        // Day number: 10.5pt bold #333333, top-left of cell
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(config.fontSize.dayNumber) // 10.5pt
        doc.setTextColor(0x33, 0x33, 0x33)
        doc.text(String(dayNum), x + 0.05, y + 0.18)

        let contentY = y + 0.32 // cursor below day number
        const lineH = 0.15 // line height for cell content
        const maxTextWidth = colWidth - 0.1

        // ── Observances for this day (italic, muted grey, 8.5pt) ─────
        const dayObservances = observancesByDay.get(dayNum)
        if (dayObservances && dayObservances.length > 0) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8.5) // smaller than event text — visual hierarchy
          doc.setTextColor(0x77, 0x77, 0x77) // #777777

          const maxObs = 2 // never crowd the cell
          const displayObs = dayObservances.slice(0, maxObs)
          const emojiWidth = 0.14  // approximate width of one emoji character at 8.5pt
          const emojiGap = 0.03   // gap between emoji and text
          for (const obs of displayObs) {
            if (obs.emoji) {
              // Render the observance emoji — clean, colourful, instantly recognisable
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(8.5)
              doc.text(obs.emoji, x + 0.05, contentY)
              const obsText = truncateText(doc, obs.name, maxTextWidth - emojiWidth - emojiGap)
              doc.setTextColor(0x77, 0x77, 0x77)
              doc.text(obsText, x + 0.05 + emojiWidth + emojiGap, contentY)
            } else {
              // Fallback: no emoji — just render the name
              const obsText = truncateText(doc, obs.name, maxTextWidth)
              doc.setTextColor(0x77, 0x77, 0x77)
              doc.text(obsText, x + 0.05, contentY)
            }
            contentY += lineH
          }
          if (dayObservances.length > maxObs) {
            doc.setFillColor(0x99, 0x99, 0x99)
            doc.text(`+${dayObservances.length - maxObs} more`, x + 0.05, contentY)
            contentY += lineH
          }

          // Add a tiny gap between observances and events
          contentY += 0.02
        }

        // ── Events for this day ───────────────────────────────────────
        const dayEvents = eventsByDay.get(dayNum)
        if (dayEvents && dayEvents.length > 0) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(config.fontSize.eventText) // 9.5pt
          doc.setTextColor(0x44, 0x44, 0x44) // #444444

          const displayCount = Math.min(dayEvents.length, config.maxEventsPerCell)

          for (let i = 0; i < displayCount; i++) {
            const eventName = truncateText(doc, dayEvents[i].name, maxTextWidth)
            doc.text(eventName, x + 0.05, contentY)
            contentY += lineH
          }

          // Overflow indicator
          if (dayEvents.length > config.maxEventsPerCell) {
            const overflow = dayEvents.length - config.maxEventsPerCell
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(config.fontSize.eventText)
            doc.setTextColor(0x88, 0x88, 0x88) // #888888
            doc.text(`+${overflow} more`, x + 0.05, contentY)
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ── PAGE 2: Legend ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════
  // Only add the legend page if there are observances or events to list.
  const monthObservances = observances.filter((o) => o.month === month)
  const monthEvents = events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00')
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })

  if (monthObservances.length > 0 || monthEvents.length > 0) {
    doc.addPage('letter', 'landscape')

    // ── Legend page header ─────────────────────────────────────────
    await drawPageHeader(doc, {
      logoUrl,
      monthName,
      year,
      margin,
      brandRgb,
      monthHeaderFontSize: config.fontSize.monthHeader,
    })

    // Subtitle
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0x66, 0x66, 0x66)
    doc.text(`${monthName} ${year} — Observances & Events`, margin, margin + 0.55)

    // Divider line
    doc.setDrawColor(0xd0, 0xd0, 0xd0)
    doc.setLineWidth(0.5 / 72)
    doc.line(margin, margin + 0.65, pageWidth - margin, margin + 0.65)

    // ── Two-column layout ──────────────────────────────────────────
    const legendTop = margin + 0.8
    const colGap = 0.3
    const legendColWidth = (printableWidth - colGap) / 2
    const leftColX = margin
    const rightColX = margin + legendColWidth + colGap

    let leftY = legendTop
    let rightY = legendTop

    const sectionTitleSize = 10
    const itemFontSize = 9.5
    const itemLineHeight = 0.2
    const sectionGap = 0.12
    const afterSectionGap = 0.08

    // ── LEFT COLUMN: Observances ───────────────────────────────────
    if (monthObservances.length > 0) {
      // Section heading
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(sectionTitleSize)
      doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b)
      doc.text('Observances', leftColX, leftY)
      leftY += sectionGap

      // Thin rule under heading
      doc.setDrawColor(brandRgb.r, brandRgb.g, brandRgb.b)
      doc.setLineWidth(0.5 / 72)
      doc.line(leftColX, leftY, leftColX + legendColWidth, leftY)
      leftY += afterSectionGap + 0.05

      // Sort observances: day-specific first (by day), then month-long
      const sorted = [...monthObservances].sort((a, b) => {
        if (a.day != null && b.day != null) return a.day - b.day
        if (a.day != null) return -1
        if (b.day != null) return 1
        return a.name.localeCompare(b.name)
      })

      for (const obs of sorted) {
        // Date label
        let dateLabel: string
        if (obs.day != null) {
          dateLabel = `${monthName} ${obs.day}`
        } else {
          dateLabel = `All of ${monthName}` // month-long
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(itemFontSize)
        doc.setTextColor(0x33, 0x33, 0x33)

        // Date in grey, emoji + name in black
        const dateLabelWidth = doc.getTextWidth(dateLabel + '  ')
        doc.setTextColor(0x77, 0x77, 0x77)
        doc.text(dateLabel, leftColX, leftY)
        doc.setTextColor(0x22, 0x22, 0x22)
        doc.setFont('helvetica', 'normal')
        // Prepend emoji if available for a polished legend
        const obsDisplayName = obs.emoji ? `${obs.emoji}  ${obs.name}` : obs.name
        const obsName = truncateText(doc, obsDisplayName, legendColWidth - dateLabelWidth)
        doc.text(obsName, leftColX + dateLabelWidth, leftY)

        leftY += itemLineHeight
      }
    }

    // ── RIGHT COLUMN: Events ───────────────────────────────────────
    if (monthEvents.length > 0) {
      // Section heading
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(sectionTitleSize)
      doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b)
      doc.text('Resident Event Planner', rightColX, rightY)
      rightY += sectionGap

      // Thin rule under heading
      doc.setDrawColor(brandRgb.r, brandRgb.g, brandRgb.b)
      doc.setLineWidth(0.5 / 72)
      doc.line(rightColX, rightY, rightColX + legendColWidth, rightY)
      rightY += afterSectionGap + 0.05

      // Sort events by date then name
      const sortedEvents = [...monthEvents].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        const aTime = a.startTime ?? ''
        const bTime = b.startTime ?? ''
        if (aTime !== bTime) return aTime.localeCompare(bTime)
        return a.name.localeCompare(b.name)
      })

      for (const event of sortedEvents) {
        // Event name (bold)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(itemFontSize)
        doc.setTextColor(0x22, 0x22, 0x22)
        const eventNameText = truncateText(doc, event.name, legendColWidth)
        doc.text(eventNameText, rightColX, rightY)
        rightY += itemLineHeight * 0.85

        // Detail line: date + time + location (smaller, grey)
        const datePart = formatDateShort(event.date, year)
        const timePart =
          event.startTime && event.endTime
            ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
            : event.startTime
              ? formatTime(event.startTime)
              : ''
        const locationPart = event.location || ''

        const detailParts = [datePart, timePart, locationPart].filter(Boolean)
        const detailLine = detailParts.join('  ·  ')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(0x66, 0x66, 0x66)
        const detailText = truncateText(doc, detailLine, legendColWidth)
        doc.text(detailText, rightColX, rightY)
        rightY += itemLineHeight + 0.04 // extra gap between events
      }
    }

    // ── Footer note ────────────────────────────────────────────────
    const footerY = pageHeight - margin * 0.6
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(0xaa, 0xaa, 0xaa)
    doc.text(
      `${buildingName} · ${monthName} ${year} calendar`,
      pageWidth / 2,
      footerY,
      { align: 'center' },
    )
  }

  // ── Save ──────────────────────────────────────────────────────────
  doc.save(`${buildingName}-Calendar-${monthName}-${year}.pdf`)
}
