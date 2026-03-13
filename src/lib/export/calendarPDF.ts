/**
 * Calendar PDF Export
 *
 * Generates a building-branded monthly calendar PDF using a programmatic
 * canvas-based approach. The calendar grid is drawn directly onto an
 * HTML Canvas element using the browser's 2D Canvas API, which natively
 * supports emoji rendering via the system emoji font stack.
 *
 * This approach avoids DOM-capture libraries (html2canvas, dom-to-image)
 * which fail on modern CSS colour functions like oklch().
 *
 * Page 1: Branded header + programmatically-drawn calendar grid (with emojis)
 * Page 2 (legend): All observances with dates + all events with date/time/location
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
  brandColor: string // hex, e.g. "#8F1D23"
  logoUrl?: string // data URL or undefined
  /** Unused — kept for API compatibility */
  calendarElement?: HTMLElement | null
}

/** Month names for header display */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Day-of-week headers */
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
 * Truncate canvas text to fit within maxWidth pixels.
 */
function canvasTruncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  const ellipsis = '…'
  let truncated = text
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + ellipsis
}

/**
 * Word-wrap canvas text into lines that fit within maxWidth pixels.
 * Returns an array of line strings.
 */
function canvasWrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // Handle emoji prefix (e.g. "🥞 National Pancake Day") — keep emoji on first line
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      // If a single word is too wide, truncate it
      if (ctx.measureText(word).width > maxWidth) {
        lines.push(canvasTruncate(ctx, word, maxWidth))
        current = ''
      } else {
        current = word
      }
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Draw the branded page header (logo + month/year title) using jsPDF.
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
 * Render the calendar grid onto an HTML Canvas element.
 * Uses the browser's native 2D canvas API which supports emoji rendering.
 *
 * @returns A data URL (PNG) of the rendered calendar grid.
 */
function renderCalendarToCanvas(params: {
  year: number
  month: number
  events: CalendarExportParams['events']
  observances: NonNullable<CalendarExportParams['observances']>
  brandColor: string
  canvasWidth: number
  canvasHeight: number
}): string {
  const { year, month, events, observances, brandColor, canvasWidth, canvasHeight } = params

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')!

  // ── Colours ──────────────────────────────────────────────────────────
  const WHITE = '#ffffff'
  const GRID_LINE = '#e2e8f0'
  const HEADER_BG = '#f8fafc'
  const DAY_NUM_COLOR = '#1e293b'
  const DAY_NUM_TODAY = brandColor
  const OBS_COLOR = '#64748b'
  const EVENT_COLOR = brandColor
  const HEADER_TEXT = '#475569'
  const TODAY_BG = '#fef2f2'

  // ── Layout ────────────────────────────────────────────────────────────
  const PAD = 0
  const HEADER_ROW_H = Math.round(canvasHeight * 0.065) // day-of-week header
  const gridTop = PAD + HEADER_ROW_H
  const gridWidth = canvasWidth - PAD * 2
  const gridHeight = canvasHeight - PAD - gridTop

  // Determine number of rows needed
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = firstDay + daysInMonth
  const numRows = Math.ceil(totalCells / 7)

  const cellW = gridWidth / 7
  const cellH = gridHeight / numRows

  // Today for highlighting
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayDate = isCurrentMonth ? today.getDate() : -1

  // Build lookup maps
  const obsMap = new Map<number, Array<{ emoji?: string; name: string }>>()
  for (const obs of observances) {
    if (obs.month !== month) continue
    const day = obs.day ?? 0 // 0 = all month
    if (!obsMap.has(day)) obsMap.set(day, [])
    obsMap.get(day)!.push({ emoji: obs.emoji, name: obs.name })
  }

  const evtMap = new Map<number, string[]>()
  for (const evt of events) {
    const d = new Date(evt.date + 'T00:00:00')
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue
    const day = d.getDate()
    if (!evtMap.has(day)) evtMap.set(day, [])
    evtMap.get(day)!.push(evt.name)
  }

  // ── Background ────────────────────────────────────────────────────────
  ctx.fillStyle = WHITE
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // ── Day-of-week header row ────────────────────────────────────────────
  ctx.fillStyle = HEADER_BG
  ctx.fillRect(PAD, PAD, gridWidth, HEADER_ROW_H)

  const headerFontSize = Math.round(cellW * 0.13)
  ctx.font = `600 ${headerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  ctx.fillStyle = HEADER_TEXT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let col = 0; col < 7; col++) {
    const x = PAD + col * cellW + cellW / 2
    const y = PAD + HEADER_ROW_H / 2
    ctx.fillText(DAY_HEADERS[col], x, y)
  }

  // ── Grid cells ────────────────────────────────────────────────────────
  const dayNumFontSize = Math.round(cellW * 0.12)
  const obsFontSize = Math.round(cellW * 0.073)
  const evtFontSize = Math.round(cellW * 0.073)
  const lineH = obsFontSize * 1.45

  for (let i = 0; i < numRows * 7; i++) {
    const col = i % 7
    const row = Math.floor(i / 7)
    const dayNum = i - firstDay + 1
    const cellX = PAD + col * cellW
    const cellY = gridTop + row * cellH

    // Cell background
    if (dayNum === todayDate) {
      ctx.fillStyle = TODAY_BG
      ctx.fillRect(cellX, cellY, cellW, cellH)
    }

    // Cell border
    ctx.strokeStyle = GRID_LINE
    ctx.lineWidth = 1
    ctx.strokeRect(cellX, cellY, cellW, cellH)

    if (dayNum < 1 || dayNum > daysInMonth) continue

    // Day number
    const dayNumX = cellX + cellW - 8
    const dayNumY = cellY + dayNumFontSize + 6
    ctx.font = `700 ${dayNumFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    ctx.fillStyle = dayNum === todayDate ? DAY_NUM_TODAY : DAY_NUM_COLOR
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(String(dayNum), dayNumX, dayNumY)

    // Content area below day number
    const contentX = cellX + 6
    const contentMaxW = cellW - 12
    let contentY = dayNumY + dayNumFontSize + 4

    // Observances for this day
    const dayObs = obsMap.get(dayNum) ?? []
    const regularFont = `${obsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    const emojiFont = `${obsFontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    for (const obs of dayObs) {
      if (contentY + lineH > cellY + cellH - 4) break
      const label = obs.emoji ? `${obs.emoji} ${obs.name}` : obs.name
      // Measure with regular font (accurate for text), render with emoji font
      ctx.font = regularFont
      const lines = canvasWrapText(ctx, label, contentMaxW)
      ctx.font = emojiFont
      ctx.fillStyle = OBS_COLOR
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      for (const line of lines) {
        if (contentY + lineH > cellY + cellH - 4) break
        ctx.fillText(line, contentX, contentY)
        contentY += lineH
      }
    }

    // Events for this day
    const dayEvts = evtMap.get(dayNum) ?? []
    for (const evtName of dayEvts) {
      if (contentY + lineH > cellY + cellH - 4) break
      ctx.font = `600 ${evtFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      ctx.fillStyle = EVENT_COLOR
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const lines = canvasWrapText(ctx, evtName, contentMaxW)
      for (const line of lines) {
        if (contentY + lineH > cellY + cellH - 4) break
        ctx.fillText(line, contentX, contentY)
        contentY += lineH
      }
    }
  }

  // ── All-month observances banner at bottom ────────────────────────────
  const allMonthObs = obsMap.get(0) ?? []
  if (allMonthObs.length > 0) {
    const bannerH = Math.round(obsFontSize * 1.8)
    const bannerY = canvasHeight - bannerH
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(PAD, bannerY, gridWidth, bannerH)
    ctx.strokeStyle = GRID_LINE
    ctx.lineWidth = 1
    ctx.strokeRect(PAD, bannerY, gridWidth, bannerH)

    const labels = allMonthObs.map((o) => (o.emoji ? `${o.emoji} ${o.name}` : o.name)).join('  ·  ')
    ctx.font = `${obsFontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    ctx.fillStyle = OBS_COLOR
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(canvasTruncate(ctx, labels, gridWidth - 20), PAD + gridWidth / 2, bannerY + bannerH / 2)
  }

  return canvas.toDataURL('image/png')
}

/**
 * Export a monthly calendar as a PDF file.
 *
 * Draws the calendar grid programmatically using the browser's Canvas 2D API
 * (which natively supports emoji rendering), then embeds it into a landscape
 * letter PDF with a branded header. A legend page lists all observances and
 * events with full details.
 */
export async function exportCalendarPDF(
  params: CalendarExportParams,
): Promise<void> {
  const { year, month, events, observances = [], buildingName, brandColor, logoUrl } = params
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

  // ── Render calendar grid to canvas ───────────────────────────────
  // Canvas dimensions at 200 DPI for the printable area
  const DPI = 200
  const canvasW = Math.round(printableWidth * DPI)
  const gridAreaH = pageHeight - margin - (margin + headerHeight)
  const canvasH = Math.round(gridAreaH * DPI)

  try {
    const imgData = renderCalendarToCanvas({
      year,
      month,
      events,
      observances,
      brandColor,
      canvasWidth: canvasW,
      canvasHeight: canvasH,
    })

    const gridTop = margin + headerHeight
    doc.addImage(imgData, 'PNG', margin, gridTop, printableWidth, gridAreaH)
  } catch (err) {
    console.error('[CalendarPDF] Canvas render failed:', err)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(0x88, 0x88, 0x88)
    doc.text('Calendar grid could not be rendered.', margin, margin + headerHeight + 0.5)
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

        // Strip emoji from legend text since jsPDF Helvetica can't render them
        const obsName = truncateText(doc, obs.name, legendColWidth - dateLabelWidth)
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
