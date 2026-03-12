import { useState, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import { Download, Image as ImageIcon, CalendarHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { toast } from 'sonner'
import type { Event } from '@/lib/types/event'
import { DEFAULT_OBSERVANCES } from '@/lib/data/observances'

interface EventPosterTabProps {
  event: Event
}

const POSTER_W = 1080
const POSTER_H = 1400

/**
 * Poster tab — renders a canvas-based poster using the building brand colour
 * and exports as PNG or print-ready PDF.
 *
 * Uses the native Canvas 2D API (no html2canvas) to avoid the oklch colour
 * parsing crash that html2canvas throws on Tailwind v4 / shadcn colour tokens.
 */
export function EventPosterTab({ event }: EventPosterTabProps) {
  const building = useBuildingStore((s) => s.getBuildingById(event.buildingId))
  const brandColor = building?.brandColor ?? '#3B7BF4'

  const [ctaOverride, setCtaOverride] = useState<string>('')
  const [exporting, setExporting] = useState(false)
  const [showObservance, setShowObservance] = useState(true)
  const [editingCta, setEditingCta] = useState(false)

  const nearbyObservance = useMemo(() => {
    if (!event.date) return null
    const d = new Date(event.date + 'T00:00:00')
    const month = d.getMonth() + 1
    const day = d.getDate()
    return DEFAULT_OBSERVANCES.find((obs) => {
      if (!obs.enabled) return false
      if (obs.type === 'theme') return false
      if (obs.month !== month) return false
      if (obs.day === undefined) return false
      return obs.day === day
    }) ?? null
  }, [event.date])

  function formatPosterDateTime(ev: Event): string {
    const parts: string[] = []
    if (ev.date) parts.push(formatDate(ev.date))
    if (ev.startTime) {
      const time = formatTime(ev.startTime)
      if (ev.endTime) {
        parts.push(`${time} – ${formatTime(ev.endTime)}`)
      } else {
        parts.push(time)
      }
    }
    return parts.join(' | ')
  }

  const displayName = event.name || 'Event Name'
  const displayDateTime = formatPosterDateTime(event)
  const displayLocation = event.location || ''
  const displayCTA = ctaOverride || event.marketing?.posterCopy?.cta || 'Join Us!'
  const buildingName = building?.name ?? 'Your Building'

  // ── Canvas rendering ─────────────────────────────────────────────

  async function buildCanvas(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    canvas.width = POSTER_W
    canvas.height = POSTER_H
    const ctx = canvas.getContext('2d')!

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, POSTER_H)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(1, '#f8f9fb')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, POSTER_W, POSTER_H)

    // Brand colour top bar
    ctx.fillStyle = brandColor
    ctx.fillRect(0, 0, POSTER_W, 18)

    // Brand colour bottom bar
    ctx.fillStyle = brandColor
    ctx.fillRect(0, POSTER_H - 18, POSTER_W, 18)

    // Building logo or initial circle
    if (building?.logoUrl) {
      try {
        const logoImg = await loadImg(building.logoUrl)
        const logoSize = 160
        const logoX = (POSTER_W - logoSize) / 2
        ctx.save()
        ctx.beginPath()
        ctx.arc(POSTER_W / 2, 130, logoSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(logoImg, logoX, 50, logoSize, logoSize)
        ctx.restore()
      } catch {
        drawInitialCircle(ctx, buildingName, brandColor)
      }
    } else {
      drawInitialCircle(ctx, buildingName, brandColor)
    }

    // Observance badge (if applicable and toggled on)
    if (nearbyObservance && showObservance) {
      ctx.save()
      ctx.font = '600 34px DM Sans, Inter, system-ui, sans-serif'
      const badgeText = `${nearbyObservance.emoji} ${nearbyObservance.name}`
      const badgeW = ctx.measureText(badgeText).width + 60
      const badgeH = 60
      const badgeX = (POSTER_W - badgeW) / 2
      const badgeY = 240
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 30)
      ctx.fill()
      ctx.fillStyle = '#444'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(badgeText, POSTER_W / 2, badgeY + badgeH / 2)
      ctx.restore()
    }

    // Decorative divider
    ctx.save()
    ctx.strokeStyle = brandColor
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.25
    ctx.beginPath()
    ctx.moveTo(120, 330)
    ctx.lineTo(POSTER_W - 120, 330)
    ctx.stroke()
    ctx.restore()

    // Event name — large hero text
    drawWrappedText(ctx, displayName, {
      x: POSTER_W / 2,
      y: 370,
      maxWidth: 900,
      fontSize: 88,
      fontWeight: '800',
      color: '#1a1d2e',
      align: 'center',
      lineHeight: 1.15,
    })

    // Date/time
    drawWrappedText(ctx, displayDateTime, {
      x: POSTER_W / 2,
      y: 640,
      maxWidth: 820,
      fontSize: 44,
      fontWeight: '600',
      color: '#444',
      align: 'center',
    })

    // Location
    if (displayLocation) {
      drawWrappedText(ctx, `📍 ${displayLocation}`, {
        x: POSTER_W / 2,
        y: 720,
        maxWidth: 820,
        fontSize: 38,
        fontWeight: '400',
        color: '#666',
        align: 'center',
      })
    }

    // Description (short)
    if (event.description) {
      const shortDesc = event.description.length > 160
        ? event.description.slice(0, 157) + '…'
        : event.description
      drawWrappedText(ctx, shortDesc, {
        x: POSTER_W / 2,
        y: 820,
        maxWidth: 820,
        fontSize: 32,
        fontWeight: '400',
        color: '#888',
        align: 'center',
        lineHeight: 1.5,
      })
    }

    // CTA pill
    drawCtaPill(ctx, displayCTA, POSTER_W / 2, 1060, brandColor)

    // QR placeholder
    drawQrPlaceholder(ctx, 878, 1180, 140)

    // Building name footer
    ctx.save()
    ctx.font = '400 30px DM Sans, Inter, system-ui, sans-serif'
    ctx.fillStyle = '#aaa'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(buildingName, POSTER_W / 2, 1340)
    ctx.restore()

    return canvas
  }

  async function handleExportPNG() {
    setExporting(true)
    try {
      const canvas = await buildCanvas()
      canvas.toBlob((blob) => {
        if (!blob) { toast.error('Failed to generate PNG.'); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${sanitize(event.name)}-Poster.png`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Poster exported as PNG')
      }, 'image/png')
    } catch (err) {
      console.error('[PosterExport] PNG export failed:', err)
      toast.error('Could not generate poster. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const canvas = await buildCanvas()
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 0.375
      const availW = pageW - margin * 2
      const availH = pageH - margin * 2
      const aspect = POSTER_W / POSTER_H
      let iW: number, iH: number
      if (aspect > availW / availH) {
        iW = availW; iH = availW / aspect
      } else {
        iH = availH; iW = availH * aspect
      }
      const xOff = margin + (availW - iW) / 2
      const yOff = margin + (availH - iH) / 2
      pdf.addImage(imgData, 'PNG', xOff, yOff, iW, iH)
      pdf.save(`${sanitize(event.name)}-Poster.pdf`)
      toast.success('Poster exported as PDF')
    } catch (err) {
      console.error('[PosterExport] PDF export failed:', err)
      toast.error('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleExportPNG} disabled={exporting}>
          <ImageIcon className="mr-1.5 h-4 w-4" />
          Export as PNG
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
          <Download className="mr-1.5 h-4 w-4" />
          Export as PDF
        </Button>
        {nearbyObservance && (
          <button
            onClick={() => setShowObservance((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              showObservance
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border-default text-text-muted hover:text-text-primary'
            }`}
          >
            <CalendarHeart className="h-3.5 w-3.5" />
            {nearbyObservance.emoji} {nearbyObservance.name}
            <span className="ml-1 opacity-60">{showObservance ? '✓' : '+'}</span>
          </button>
        )}
        {exporting && (
          <span className="text-sm text-text-muted animate-pulse">Generating export…</span>
        )}
      </div>

      <p className="text-sm text-text-muted">
        Edit the Call-to-Action text below, then export. The exported poster uses your
        building's brand colour and logo automatically.
      </p>

      {/* CTA override */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-primary whitespace-nowrap">
          Call-to-Action text
        </label>
        {editingCta ? (
          <input
            type="text"
            autoFocus
            defaultValue={displayCTA}
            onBlur={(e) => { setCtaOverride(e.target.value); setEditingCta(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setCtaOverride(e.currentTarget.value); setEditingCta(false) }
              if (e.key === 'Escape') setEditingCta(false)
            }}
            className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        ) : (
          <button
            onClick={() => setEditingCta(true)}
            className="flex-1 rounded border border-dashed border-border-default px-3 py-1.5 text-left text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            {displayCTA}
            <span className="ml-2 text-xs text-text-muted">(click to edit)</span>
          </button>
        )}
      </div>

      {/* Poster preview */}
      <div className="flex justify-center">
        <div
          className="w-full max-w-[380px] rounded-lg shadow-lg overflow-hidden border border-border-default"
          style={{ aspectRatio: '1080 / 1400' }}
        >
          {/* Brand top bar */}
          <div className="h-2" style={{ backgroundColor: brandColor }} />

          <div
            className="flex flex-col items-center justify-between px-5 py-4 bg-white"
            style={{ height: 'calc(100% - 16px)' }}
          >
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 w-full">
              {building?.logoUrl ? (
                <img
                  src={building.logoUrl}
                  alt={`${building.name} logo`}
                  className="h-14 w-auto object-contain rounded"
                />
              ) : (
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: brandColor }}
                >
                  {building?.name?.charAt(0) ?? 'B'}
                </div>
              )}

              {/* Observance badge */}
              {nearbyObservance && showObservance && (
                <span className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-full px-2 py-0.5">
                  {nearbyObservance.emoji} {nearbyObservance.name}
                </span>
              )}

              {/* Divider */}
              <div className="w-full h-px opacity-20" style={{ backgroundColor: brandColor }} />

              {/* Event name */}
              <p className="text-xl font-extrabold text-center leading-tight" style={{ color: brandColor }}>
                {displayName}
              </p>
            </div>

            {/* Details */}
            <div className="flex flex-col items-center gap-1.5 w-full text-center">
              <p className="text-xs font-semibold text-gray-700">{displayDateTime}</p>
              {displayLocation && (
                <p className="text-xs text-gray-500">📍 {displayLocation}</p>
              )}
              {event.description && (
                <p className="text-[10px] text-gray-400 line-clamp-2 max-w-[260px] mt-1">
                  {event.description}
                </p>
              )}
            </div>

            {/* CTA + QR + footer */}
            <div className="flex flex-col items-center gap-2 w-full">
              <span
                className="rounded-full px-4 py-1.5 text-sm font-bold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {displayCTA}
              </span>
              <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                <span className="text-[8px] text-gray-400">QR</span>
              </div>
              <p className="text-[10px] text-gray-400">{buildingName}</p>
            </div>
          </div>

          {/* Brand bottom bar */}
          <div className="h-2" style={{ backgroundColor: brandColor }} />
        </div>
      </div>

      <p className="text-xs text-text-muted text-center">
        Preview is approximate. The exported PNG/PDF renders at full 1080×1400px resolution.
      </p>
    </div>
  )
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
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

function drawInitialCircle(
  ctx: CanvasRenderingContext2D,
  name: string,
  color: string,
) {
  const cx = POSTER_W / 2
  const cy = 130
  const r = 80
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '700 72px DM Sans, Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.charAt(0).toUpperCase(), cx, cy + 4)
  ctx.restore()
}

interface TextOpts {
  x: number
  y: number
  maxWidth: number
  fontSize: number
  fontWeight: string
  color: string
  align: CanvasTextAlign
  lineHeight?: number
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, opts: TextOpts) {
  if (!text) return
  ctx.save()
  ctx.font = `${opts.fontWeight} ${opts.fontSize}px DM Sans, Inter, system-ui, sans-serif`
  ctx.fillStyle = opts.color
  ctx.textAlign = opts.align
  ctx.textBaseline = 'top'

  const lineH = opts.fontSize * (opts.lineHeight ?? 1.25)
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= opts.maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  const displayLines = lines.slice(0, 3)
  let y = opts.y
  for (const line of displayLines) {
    ctx.fillText(line, opts.x, y, opts.maxWidth)
    y += lineH
  }
  ctx.restore()
}

function drawCtaPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  brandColor: string,
) {
  ctx.save()
  const fontSize = 52
  ctx.font = `700 ${fontSize}px DM Sans, Inter, system-ui, sans-serif`
  const textW = Math.min(ctx.measureText(text).width, 700 - 48)
  const pillW = textW + 96
  const pillH = fontSize + 36
  const pillX = cx - pillW / 2
  const r = pillH / 2

  ctx.fillStyle = brandColor
  roundRect(ctx, pillX, y, pillW, pillH, r)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 4
  ctx.fillText(text, cx, y + pillH / 2, 700 - 48)
  ctx.restore()
}

function drawQrPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  roundRect(ctx, x, y, size, size, 12)
  ctx.fill()

  ctx.fillStyle = '#1a1d2e'
  const cell = (size - 20) / 7
  const grid = [
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
        ctx.fillRect(x + 10 + col * cell, y + 10 + row * cell, cell - 1, cell - 1)
      }
    }
  }

  ctx.fillStyle = 'rgba(26,29,46,0.5)'
  ctx.font = '18px DM Sans, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('RSVP', x + size / 2, y + size + 6)
  ctx.restore()
}
