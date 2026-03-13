/**
 * Poster Compositor — v2
 *
 * Canvas-based compositing engine that stamps dynamic event content
 * onto a static PNG template at 1080×1400px.
 *
 * Design approach:
 *   1. Draw the template background image
 *   2. If the template has a contentPanel, draw a clean panel over the clear zone
 *   3. Render all text content inside the panel with proper hierarchy
 *   4. No individual backing strips — clean text with proper shadow/contrast
 *
 * Produces multiple output formats from a single composite:
 *   - Full portrait  1080×1400  (Instagram portrait, Facebook, lobby print)
 *   - Email header   1080×560   (top 40% crop)
 *   - Square crop    1080×1080  (Instagram square, Y 160–1240)
 *   - Print PDF      scaled to letter (8.5×11") via jsPDF
 *
 * Text rendering uses system fonts via Canvas 2D API.
 * Building logo is composited from the stored data URL.
 * QR code placeholder is drawn as a grid pattern.
 */

import { jsPDF } from 'jspdf'
import type { PosterTemplate, PosterTemplateZone } from '@/lib/data/posterTemplates'

// ── Canvas dimensions ─────────────────────────────────────────────
export const POSTER_WIDTH  = 1080
export const POSTER_HEIGHT = 1400

// ── Crop definitions ──────────────────────────────────────────────
export const CROPS = {
  /** Full poster (as-is) */
  full:   { x: 0,   y: 0,   w: POSTER_WIDTH, h: POSTER_HEIGHT },
  /** Email header — top 40% */
  email:  { x: 0,   y: 0,   w: POSTER_WIDTH, h: Math.round(POSTER_HEIGHT * 0.40) },
  /** Instagram/Facebook square — centre band */
  square: { x: 0,   y: 160, w: POSTER_WIDTH, h: POSTER_WIDTH },
} as const

export type CropKey = keyof typeof CROPS

// ── Font sizes (at 1080px canvas width) ──────────────────────────
const FONT = {
  eventName:    { size: 92, weight: '800', family: '"DM Sans", "Inter", system-ui, sans-serif' },
  dateTime:     { size: 44, weight: '600', family: '"DM Sans", "Inter", system-ui, sans-serif' },
  location:     { size: 36, weight: '400', family: '"DM Sans", "Inter", system-ui, sans-serif' },
  cta:          { size: 50, weight: '700', family: '"DM Sans", "Inter", system-ui, sans-serif' },
  buildingName: { size: 28, weight: '400', family: '"DM Sans", "Inter", system-ui, sans-serif' },
}

// ── Options ───────────────────────────────────────────────────────
export interface CompositorOptions {
  /** Template metadata (zones + overlay scheme) */
  template: PosterTemplate
  /** Event name (hero text) */
  eventName: string
  /** Date + time string (e.g., "March 15, 2026 | 6:00 PM – 9:00 PM") */
  dateTime: string
  /** Location string */
  location: string
  /** Call-to-action text */
  cta: string
  /** Building name */
  buildingName: string
  /** Building brand colour (hex, used for CTA and accent strokes) */
  brandColor: string
  /** Building logo data URL (optional) */
  logoDataUrl?: string
  /** Show QR placeholder */
  showQrPlaceholder?: boolean
}

export interface CompositorResult {
  /** Full 1080×1400 canvas */
  canvas: HTMLCanvasElement
  /** Export as PNG blob for a given crop */
  exportPng: (crop?: CropKey) => Promise<Blob>
  /** Export as print-ready PDF (letter portrait) */
  exportPdf: (eventName: string) => Promise<void>
  /** Export as PNG and trigger browser download */
  downloadPng: (filename: string, crop?: CropKey) => Promise<void>
}

// ── Main entry ────────────────────────────────────────────────────

/**
 * Loads the template PNG and composites all dynamic content onto a canvas.
 * Returns a CompositorResult with export helpers.
 */
export async function compositePoster(opts: CompositorOptions): Promise<CompositorResult> {
  const canvas = document.createElement('canvas')
  canvas.width  = POSTER_WIDTH
  canvas.height = POSTER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D canvas context')

  // 1. Draw the template background image
  await drawTemplateBackground(ctx, opts.template.imagePath)

  // 2. Draw content panel (if defined) — clean overlay for text area
  const panel = opts.template.contentPanel
  if (panel) {
    drawContentPanel(ctx, panel)
  }

  // 3. Determine text colours based on template overlay scheme
  const scheme = opts.template.overlayScheme
  const textColor    = scheme === 'light' ? '#FFFFFF' : '#1A1D2E'
  const subTextColor = scheme === 'light' ? 'rgba(255,255,255,0.90)' : 'rgba(26,29,46,0.80)'
  const shadowColor  = scheme === 'light' ? 'rgba(0,0,0,0.60)' : 'rgba(0,0,0,0.15)'

  // For panels with white/light background, always use dark text
  const panelStyle = panel?.style
  const usesDarkText = panelStyle === 'white' || panelStyle === 'transparent-light' || scheme === 'dark'
  const finalTextColor    = usesDarkText ? '#1A1D2E' : '#FFFFFF'
  const finalSubTextColor = usesDarkText ? 'rgba(26,29,46,0.80)' : 'rgba(255,255,255,0.90)'
  const finalShadow       = usesDarkText ? undefined : shadowColor

  const zones = opts.template.zones

  // 4. Building logo
  if (opts.logoDataUrl) {
    await drawLogo(ctx, opts.logoDataUrl, zones.logo)
  }

  // 5. Event name — large hero text
  drawWrappedText(ctx, opts.eventName, zones.eventName, {
    ...FONT.eventName,
    color: finalTextColor,
    lineHeight: 1.12,
    shadowColor: finalShadow,
  })

  // 6. Accent divider line below event name
  const nameLines = estimateLineCount(ctx, opts.eventName, zones.eventName.maxWidth, FONT.eventName.size)
  const dividerY = zones.eventName.y + nameLines * FONT.eventName.size * 1.12 + 24
  if (dividerY < zones.dateTime.y - 20) {
    drawAccentDivider(ctx, dividerY, opts.brandColor, usesDarkText)
  }

  // 7. Date/time
  if (opts.dateTime) {
    drawWrappedText(ctx, opts.dateTime, zones.dateTime, {
      ...FONT.dateTime,
      color: finalSubTextColor,
      shadowColor: finalShadow,
    })
  }

  // 8. Location
  if (opts.location) {
    const locationText = `📍 ${opts.location}`
    drawWrappedText(ctx, locationText, zones.location, {
      ...FONT.location,
      color: finalSubTextColor,
      shadowColor: finalShadow,
    })
  }

  // 9. CTA pill — always uses brand colour
  drawCtaPill(ctx, opts.cta, zones.cta, opts.brandColor)

  // 10. QR code placeholder
  if (opts.showQrPlaceholder !== false) {
    drawQrPlaceholder(ctx, zones.qr, opts.brandColor, scheme)
  }

  // 11. Building name footer
  drawWrappedText(ctx, opts.buildingName, zones.buildingName, {
    ...FONT.buildingName,
    color: finalSubTextColor,
    shadowColor: finalShadow,
  })

  // ── Export helpers ───────────────────────────────────────────────

  async function exportPng(crop: CropKey = 'full'): Promise<Blob> {
    const { x, y, w, h } = CROPS[crop]
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width  = w
    cropCanvas.height = h
    const cropCtx = cropCanvas.getContext('2d')!
    cropCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h)
    return new Promise<Blob>((resolve, reject) => {
      cropCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null'))),
        'image/png',
      )
    })
  }

  async function exportPdf(eventName: string): Promise<void> {
    const blob = await exportPng('full')
    const url  = URL.createObjectURL(blob)
    const img  = await loadImage(url)
    URL.revokeObjectURL(url)

    // Letter portrait: 8.5" × 11" at 72dpi
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })
    const pageW = pdf.internal.pageSize.getWidth()   // 8.5
    const pageH = pdf.internal.pageSize.getHeight()  // 11
    const margin = 0.375

    const availW = pageW - margin * 2
    const availH = pageH - margin * 2
    const imgAspect = POSTER_WIDTH / POSTER_HEIGHT
    const pageAspect = availW / availH

    let iW: number, iH: number
    if (imgAspect > pageAspect) {
      iW = availW
      iH = availW / imgAspect
    } else {
      iH = availH
      iW = availH * imgAspect
    }

    const xOff = margin + (availW - iW) / 2
    const yOff = margin + (availH - iH) / 2

    pdf.addImage(img.src, 'PNG', xOff, yOff, iW, iH)
    const safeName = eventName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
    pdf.save(`${safeName}-Poster.pdf`)
  }

  async function downloadPng(filename: string, crop: CropKey = 'full'): Promise<void> {
    const blob = await exportPng(crop)
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { canvas, exportPng, exportPdf, downloadPng }
}

// ── Drawing helpers ───────────────────────────────────────────────

async function drawTemplateBackground(
  ctx: CanvasRenderingContext2D,
  imagePath: string,
): Promise<void> {
  try {
    const img = await loadImage(imagePath)
    ctx.drawImage(img, 0, 0, POSTER_WIDTH, POSTER_HEIGHT)
  } catch {
    // Template image not found — draw a branded placeholder background
    const grad = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT)
    grad.addColorStop(0,   '#1A1D2E')
    grad.addColorStop(0.5, '#2A3050')
    grad.addColorStop(1,   '#1A1D2E')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

    ctx.setLineDash([20, 12])
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 4
    ctx.strokeRect(30, 30, POSTER_WIDTH - 60, POSTER_HEIGHT - 60)
    ctx.setLineDash([])

    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '28px DM Sans, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Template image not found', POSTER_WIDTH / 2, POSTER_HEIGHT / 2 - 20)
    ctx.font = '22px DM Sans, system-ui, sans-serif'
    ctx.fillText('Place your PNG in /public/poster-templates/', POSTER_WIDTH / 2, POSTER_HEIGHT / 2 + 20)
  }
}

/**
 * Draws the unified content panel over the template's clear zone.
 * This replaces the old per-element backing strips.
 */
function drawContentPanel(
  ctx: CanvasRenderingContext2D,
  panel: NonNullable<import('@/lib/data/posterTemplates').PosterTemplate['contentPanel']>,
): void {
  const { x, y, width, height, style, radius = 0 } = panel

  ctx.save()

  let bg: string
  switch (style) {
    case 'white':
      bg = 'rgba(255,255,255,0.92)'
      break
    case 'dark':
      bg = 'rgba(15,17,30,0.88)'
      break
    case 'transparent-light':
      bg = 'rgba(255,255,255,0.15)'
      break
    case 'transparent-dark':
    default:
      // No panel — text will render directly on the template with shadows
      ctx.restore()
      return
  }

  ctx.fillStyle = bg

  if (radius > 0) {
    roundRect(ctx, x, y, width, height, radius)
    ctx.fill()

    // Subtle border for white panels
    if (style === 'white') {
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  } else {
    ctx.fillRect(x, y, width, height)
  }

  ctx.restore()
}

/**
 * Draws a thin accent divider line below the event name.
 */
function drawAccentDivider(
  ctx: CanvasRenderingContext2D,
  y: number,
  brandColor: string,
  darkMode: boolean,
): void {
  ctx.save()
  ctx.strokeStyle = darkMode ? brandColor : 'rgba(255,255,255,0.50)'
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.60
  ctx.beginPath()
  ctx.moveTo(160, y)
  ctx.lineTo(POSTER_WIDTH - 160, y)
  ctx.stroke()
  ctx.restore()
}

interface TextOptions {
  size: number
  weight: string
  family: string
  color: string
  lineHeight?: number
  shadowColor?: string
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  zone: PosterTemplateZone,
  opts: TextOptions,
): void {
  if (!text) return

  ctx.save()

  const fontSpec = `${opts.weight} ${opts.size}px ${opts.family}`
  ctx.font = fontSpec
  ctx.fillStyle = opts.color
  ctx.textAlign = (zone.align ?? 'center') as CanvasTextAlign
  ctx.textBaseline = 'top'

  if (opts.shadowColor) {
    ctx.shadowColor   = opts.shadowColor
    ctx.shadowBlur    = 10
    ctx.shadowOffsetY = 2
  }

  const lineH = opts.size * (opts.lineHeight ?? 1.25)
  const maxW  = zone.maxWidth

  // Word-wrap
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxW) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  // Draw each line (limit to 3 lines to stay within zone)
  const maxLines = 3
  const displayLines = lines.slice(0, maxLines)
  let y = zone.y

  for (const line of displayLines) {
    ctx.fillText(line, zone.x, y, maxW)
    y += lineH
  }

  ctx.restore()
}

/**
 * Estimates how many lines a text block will wrap to.
 */
function estimateLineCount(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
): number {
  ctx.save()
  ctx.font = `800 ${fontSize}px "DM Sans", "Inter", system-ui, sans-serif`
  const words = text.split(' ')
  let lines = 1
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      lines++
      current = word
    }
  }
  ctx.restore()
  return Math.min(lines, 3)
}

function drawCtaPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  zone: PosterTemplateZone,
  brandColor: string,
): void {
  if (!text) return

  ctx.save()

  const fontSize = FONT.cta.size
  ctx.font = `${FONT.cta.weight} ${fontSize}px ${FONT.cta.family}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const textW    = Math.min(ctx.measureText(text).width, zone.maxWidth - 48)
  const pillW    = textW + 96
  const pillH    = fontSize + 36
  const pillX    = zone.x - pillW / 2
  const pillY    = zone.y
  const radius   = pillH / 2

  // Drop shadow for the pill
  ctx.shadowColor   = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur    = 16
  ctx.shadowOffsetY = 4

  // Pill background
  ctx.beginPath()
  ctx.moveTo(pillX + radius, pillY)
  ctx.lineTo(pillX + pillW - radius, pillY)
  ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + radius)
  ctx.lineTo(pillX + pillW, pillY + pillH - radius)
  ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - radius, pillY + pillH)
  ctx.lineTo(pillX + radius, pillY + pillH)
  ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - radius)
  ctx.lineTo(pillX, pillY + radius)
  ctx.quadraticCurveTo(pillX, pillY, pillX + radius, pillY)
  ctx.closePath()
  ctx.fillStyle = brandColor
  ctx.fill()

  // CTA text (white on coloured pill always reads well)
  ctx.shadowColor  = 'rgba(0,0,0,0.20)'
  ctx.shadowBlur   = 4
  ctx.shadowOffsetY = 1
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(text, zone.x, zone.y + pillH / 2, zone.maxWidth - 48)

  ctx.restore()
}

function drawQrPlaceholder(
  ctx: CanvasRenderingContext2D,
  zone: PosterTemplateZone,
  _brandColor: string,
  scheme: 'light' | 'dark',
): void {
  const size = Math.min(zone.maxWidth ?? 130, zone.maxHeight ?? 130)
  const x    = zone.x
  const y    = zone.y

  ctx.save()

  // Background
  const bg = 'rgba(255,255,255,0.95)'
  ctx.fillStyle = bg
  ctx.shadowColor   = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur    = 8
  ctx.shadowOffsetY = 2
  ctx.beginPath()
  roundRect(ctx, x, y, size, size, 10)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // QR grid pattern (7×7 simplified representation)
  const fg = '#1A1D2E'
  ctx.fillStyle = fg
  const cell  = (size - 20) / 7
  const grid  = [
    [1,1,1,1,1,1,0],
    [1,0,0,0,0,1,0],
    [1,0,1,0,0,1,1],
    [1,0,0,0,1,1,0],
    [1,0,1,1,0,1,0],
    [1,0,0,0,0,1,0],
    [1,1,1,1,1,1,1],
  ]
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (grid[row][col]) {
        ctx.fillRect(
          x + 10 + col * cell,
          y + 10 + row * cell,
          cell - 1,
          cell - 1,
        )
      }
    }
  }

  // "RSVP" label below QR
  ctx.fillStyle = scheme === 'light' ? 'rgba(255,255,255,0.80)' : 'rgba(26,29,46,0.60)'
  ctx.font = '18px "DM Sans", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('RSVP', x + size / 2, y + size + 6)

  ctx.restore()
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  dataUrl: string,
  zone: PosterTemplateZone,
): Promise<void> {
  try {
    const img = await loadImage(dataUrl)
    const maxW = zone.maxWidth
    const maxH = zone.maxHeight ?? 100
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
    const w = img.naturalWidth  * scale
    const h = img.naturalHeight * scale
    const x = zone.x - w / 2   // centre on zone.x
    const y = zone.y
    ctx.drawImage(img, x, y, w, h)
  } catch {
    // Logo failed to load — skip silently
  }
}

// ── Utilities ─────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/** Draws a rounded rectangle path (no fill/stroke — caller handles that) */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
