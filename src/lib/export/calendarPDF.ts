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
 */

import { jsPDF } from 'jspdf'
import { assertExportConfig, getDefaultExportConfig } from './gatekeeper'

export interface CalendarExportParams {
  year: number
  month: number // 1-12
  events: Array<{ date: string; name: string; status: string }>
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
 * Export a monthly calendar as a PDF file.
 *
 * This function:
 * 1. Validates the locked export config via gatekeeper assertions
 * 2. Builds a landscape letter-size PDF (11" x 8.5")
 * 3. Draws a branded header with optional logo and month/year
 * 4. Renders day-of-week headers
 * 5. Draws the calendar grid with events (max 2 per cell)
 * 6. Saves the PDF with a building-branded filename
 */
export async function exportCalendarPDF(
  params: CalendarExportParams,
): Promise<void> {
  const { year, month, events, buildingName, brandColor, logoUrl } = params
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
  let headerTextX = margin

  // Logo (if provided)
  if (logoUrl) {
    try {
      const logoMaxHeight = 0.5 // inches
      const logoMaxWidth = 0.8 // inches
      doc.addImage(logoUrl, 'PNG', margin, margin, logoMaxWidth, logoMaxHeight)
      headerTextX = margin + logoMaxWidth + 0.15
    } catch {
      // If logo fails to load, continue without it
      headerTextX = margin
    }
  }

  // Month/Year title: 26pt bold, building brand colour
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(config.fontSize.monthHeader) // 26pt
  doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b)
  doc.text(`${monthName} ${year}`, headerTextX, margin + 0.35)

  // ── Day-of-week headers ───────────────────────────────────────────
  const gridTop = margin + headerHeight + 0.1
  const colWidth = printableWidth / 7
  const headerRowHeight = 0.3

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(config.fontSize.dayOfWeek) // 12pt
  doc.setTextColor(0x33, 0x33, 0x33) // #333333

  for (let col = 0; col < 7; col++) {
    const x = margin + col * colWidth
    // Centre the header text within the column
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
  const eventsByDay = new Map<number, Array<{ name: string; status: string }>>()
  for (const event of events) {
    const eventDate = new Date(event.date + 'T00:00:00')
    if (eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month) {
      const day = eventDate.getDate()
      if (!eventsByDay.has(day)) {
        eventsByDay.set(day, [])
      }
      eventsByDay.get(day)!.push({ name: event.name, status: event.status })
    }
  }

  // Draw cell borders and content
  doc.setDrawColor(0xd0, 0xd0, 0xd0) // #D0D0D0
  doc.setLineWidth(0.5 / 72) // 0.5pt converted to inches (72pt = 1in)

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

        // Events for this day
        const dayEvents = eventsByDay.get(dayNum)
        if (dayEvents && dayEvents.length > 0) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(config.fontSize.eventText) // 9.5pt
          doc.setTextColor(0x44, 0x44, 0x44) // #444444

          const eventStartY = y + 0.35
          const eventLineHeight = 0.16
          const maxTextWidth = colWidth - 0.1 // 0.05" padding on each side

          const displayCount = Math.min(dayEvents.length, config.maxEventsPerCell)

          for (let i = 0; i < displayCount; i++) {
            const eventName = truncateText(doc, dayEvents[i].name, maxTextWidth)
            doc.text(eventName, x + 0.05, eventStartY + i * eventLineHeight)
          }

          // Overflow indicator
          if (dayEvents.length > config.maxEventsPerCell) {
            const overflow = dayEvents.length - config.maxEventsPerCell
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(config.fontSize.eventText) // 9.5pt
            doc.setTextColor(0x88, 0x88, 0x88) // #888888
            doc.text(
              `+${overflow} more`,
              x + 0.05,
              eventStartY + displayCount * eventLineHeight,
            )
          }
        }
      }
    }
  }

  // ── Save ──────────────────────────────────────────────────────────
  doc.save(`${buildingName}-Calendar-${monthName}-${year}.pdf`)
}
