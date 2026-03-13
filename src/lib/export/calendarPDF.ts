/**
 * Calendar PDF Export
 *
 * Generates a building-branded monthly calendar PDF by capturing the live
 * calendar grid DOM element with html2canvas (preserving emojis, fonts, and
 * all styling exactly as seen on screen), then embedding that image into a
 * landscape letter PDF with a branded header and a legend page.
 *
 * Page 1: Branded header + calendar grid screenshot (with emojis)
 * Page 2 (legend): All observances with dates + all events with date/time/location
 */

import { jsPDF } from 'jspdf'
import domtoimage from 'dom-to-image-more'
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
  brandColor: string // hex, e.g. "#8F1D23"
  logoUrl?: string // data URL or undefined
  /** The live calendar grid DOM element to capture with html2canvas */
  calendarElement?: HTMLElement | null
}

/** Month names for header display */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Parse a hex colour string into RGB components.
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
  if (dateYear !== year) return `${monthName} ${day}, ${dateYear}`
  return `${monthName} ${day}`
}

/**
 * Truncate text with ellipsis if it exceeds maxWidth at the given font size.
 */
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
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
 * Draw the branded page header (logo + month/year title).
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
      const logoFormat = logoUrl.startsWith('data:image/jpeg') ? 'JPEG'
        : logoUrl.startsWith('data:image/png') ? 'PNG'
        : 'JPEG'
      const logoMaxHeight = 0.5
      const logoMaxWidth = 0.8
      doc.addImage(logoUrl, logoFormat, margin, margin, logoMaxWidth, logoMaxHeight)
      headerTextX = margin + logoMaxWidth + 0.15
    } catch {
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
 * Uses html2canvas to capture the live calendar grid (preserving emojis and
 * all styling), then embeds it into a landscape letter PDF with a branded
 * header. A legend page lists all observances and events with full details.
 */
export async function exportCalendarPDF(
  params: CalendarExportParams,
): Promise<void> {
  const { year, month, events, observances = [], buildingName, brandColor, logoUrl, calendarElement } = params
  const config = getDefaultExportConfig()

  // ── Gatekeeper check ──────────────────────────────────────────────
  assertExportConfig(config)

  // ── Page setup ────────────────────────────────────────────────────
  const doc = new jsPDF('landscape', 'in', 'letter')
  const pageWidth = 11
  const pageHeight = 8.5
  const margin = config.marginInches
  const printableWidth = pageWidth - margin * 2
  const brandRgb = hexToRgb(brandColor)
  const monthName = MONTH_NAMES[month - 1]
  const headerHeight = 0.65

  // ── Draw header ───────────────────────────────────────────────────
  await drawPageHeader(doc, {
    logoUrl,
    monthName,
    year,
    margin,
    brandRgb,
    monthHeaderFontSize: config.fontSize.monthHeader,
  })

  // ── Capture calendar grid with html2canvas ────────────────────────
  if (calendarElement) {
    try {
      // Capture the calendar grid at 2x scale for crisp rendering
      // dom-to-image-more handles modern CSS (oklch, etc.) correctly
      const imgData = await domtoimage.toPng(calendarElement, {
        width: calendarElement.offsetWidth * 2,
        height: calendarElement.offsetHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          backgroundColor: '#ffffff',
        },
      })
      const gridTop = margin + headerHeight
      const gridHeight = pageHeight - margin - gridTop

      // Embed the captured calendar image
      doc.addImage(imgData, 'PNG', margin, gridTop, printableWidth, gridHeight)
    } catch (err) {
      console.error('[CalendarPDF] html2canvas capture failed:', err)
      // Fallback: just show a message in the PDF
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(0x88, 0x88, 0x88)
      doc.text('Calendar grid could not be captured.', margin, margin + headerHeight + 0.5)
    }
  } else {
    // No element provided — show placeholder
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0x88, 0x88, 0x88)
    doc.text('No calendar element provided for capture.', margin, margin + headerHeight + 0.5)
  }

  // ══════════════════════════════════════════════════════════════════
  // ── PAGE 2: Legend ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════
  const monthObservances = observances.filter((o) => o.month === month)
  const monthEvents = events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00')
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })

  if (monthObservances.length > 0 || monthEvents.length > 0) {
    doc.addPage('letter', 'landscape')

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
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(sectionTitleSize)
      doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b)
      doc.text('Observances', leftColX, leftY)
      leftY += sectionGap

      doc.setDrawColor(brandRgb.r, brandRgb.g, brandRgb.b)
      doc.setLineWidth(0.5 / 72)
      doc.line(leftColX, leftY, leftColX + legendColWidth, leftY)
      leftY += afterSectionGap + 0.05

      const sorted = [...monthObservances].sort((a, b) => {
        if (a.day != null && b.day != null) return a.day - b.day
        if (a.day != null) return -1
        if (b.day != null) return 1
        return a.name.localeCompare(b.name)
      })

      for (const obs of sorted) {
        let dateLabel: string
        if (obs.day != null) {
          dateLabel = `${monthName} ${obs.day}`
        } else {
          dateLabel = `All of ${monthName}`
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(itemFontSize)
        const dateLabelWidth = doc.getTextWidth(dateLabel + '  ')

        doc.setTextColor(0x77, 0x77, 0x77)
        doc.text(dateLabel, leftColX, leftY)

        doc.setTextColor(0x22, 0x22, 0x22)
        doc.setFont('helvetica', 'normal')

        // Include emoji in the legend — jsPDF will skip what it can't render
        // but the name alone is fully descriptive
        const obsDisplayName = obs.emoji ? `${obs.emoji} ${obs.name}` : obs.name
        const obsName = truncateText(doc, obsDisplayName, legendColWidth - dateLabelWidth)
        doc.text(obsName, leftColX + dateLabelWidth, leftY)

        leftY += itemLineHeight
      }
    }

    // ── RIGHT COLUMN: Events ───────────────────────────────────────
    if (monthEvents.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(sectionTitleSize)
      doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b)
      doc.text('Resident Events', rightColX, rightY)
      rightY += sectionGap

      doc.setDrawColor(brandRgb.r, brandRgb.g, brandRgb.b)
      doc.setLineWidth(0.5 / 72)
      doc.line(rightColX, rightY, rightColX + legendColWidth, rightY)
      rightY += afterSectionGap + 0.05

      const sortedEvents = [...monthEvents].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        const aTime = a.startTime ?? ''
        const bTime = b.startTime ?? ''
        if (aTime !== bTime) return aTime.localeCompare(bTime)
        return a.name.localeCompare(b.name)
      })

      for (const event of sortedEvents) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(itemFontSize)
        doc.setTextColor(0x22, 0x22, 0x22)
        const eventNameText = truncateText(doc, event.name, legendColWidth)
        doc.text(eventNameText, rightColX, rightY)
        rightY += itemLineHeight * 0.85

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
        rightY += itemLineHeight + 0.04
      }
    }

    // ── Footer ──────────────────────────────────────────────────────
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
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(0xcc, 0xcc, 0xcc)
    doc.text(
      'Generated by Resident Event Planner · propertyconsultinggroup.ca',
      pageWidth - margin,
      footerY,
      { align: 'right' },
    )
  }

  // ── Save ──────────────────────────────────────────────────────────
  doc.save(`${buildingName}-Calendar-${monthName}-${year}.pdf`)
}
