import { useEffect, useRef, useState, useMemo } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Download, Image, CalendarHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { toast } from 'sonner'
import type { Event } from '@/lib/types/event'
import { DEFAULT_OBSERVANCES } from '@/lib/data/observances'

interface EventPosterTabProps {
  event: Event
}

/**
 * Poster tab — preview-based poster layout with inline editable text fields
 * and PNG/PDF export. NOT a full WYSIWYG editor.
 *
 * Uses the building's brand colour and logo for branded output.
 */
export function EventPosterTab({ event }: EventPosterTabProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  const building = useBuildingStore((s) => s.getBuildingById(event.buildingId))
  const brandColor = building?.brandColor ?? '#3B7BF4'

  // Local state for editable text overrides (does not mutate the event)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [exporting, setExporting] = useState(false)
  const [showObservance, setShowObservance] = useState(true)

  // Find an observance that falls in the same month as the event
  const nearbyObservance = useMemo(() => {
    if (!event.date) return null
    const d = new Date(event.date + 'T00:00:00')
    const month = d.getMonth() + 1 // 1-based
    const day = d.getDate()

    // Look for enabled observances within ±7 days of the event date
    return DEFAULT_OBSERVANCES.find((obs) => {
      if (!obs.enabled) return false
      if (obs.month !== month) return false
      if (obs.day === undefined) return true // month-long observance always matches
      return Math.abs(obs.day - day) <= 7
    }) ?? null
  }, [event.date])

  // Resolved display values (overrides take precedence)
  const displayName = overrides.name ?? event.name
  const displayDateTime = overrides.dateTime ?? formatPosterDateTime(event)
  const displayLocation = overrides.location ?? event.location
  const displayCTA =
    overrides.cta ?? event.marketing?.posterCopy?.cta ?? 'Join Us!'

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

  function handleFieldClick(field: string) {
    setEditingField(field)
  }

  function handleFieldBlur(field: string, value: string) {
    setOverrides((prev) => ({ ...prev, [field]: value }))
    setEditingField(null)
  }

  function handleFieldKeyDown(
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    value: string,
  ) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFieldBlur(field, value)
    }
    if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  async function captureCanvas(): Promise<HTMLCanvasElement | null> {
    if (!posterRef.current) return null
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      })
      return canvas
    } catch {
      toast.error('Failed to capture poster. Please try again.')
      return null
    }
  }

  async function handleExportPNG() {
    setExporting(true)
    try {
      const canvas = await captureCanvas()
      if (!canvas) return

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate PNG.')
          return
        }
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${event.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}-Poster.png`
        anchor.style.display = 'none'
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
        toast.success('Poster exported as PNG')
      }, 'image/png')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const canvas = await captureCanvas()
      if (!canvas) return

      const imgData = canvas.toDataURL('image/png')
      // Poster is portrait — use a standard letter page
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Scale image to fit page with margins
      const margin = 0.5
      const availableWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - margin * 2
      const imgAspect = canvas.width / canvas.height
      const pageAspect = availableWidth / availableHeight

      let imgWidth: number
      let imgHeight: number
      if (imgAspect > pageAspect) {
        imgWidth = availableWidth
        imgHeight = availableWidth / imgAspect
      } else {
        imgHeight = availableHeight
        imgWidth = availableHeight * imgAspect
      }

      const x = margin + (availableWidth - imgWidth) / 2
      const y = margin + (availableHeight - imgHeight) / 2

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
      pdf.save(
        `${event.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}-Poster.pdf`,
      )
      toast.success('Poster exported as PDF')
    } catch {
      toast.error('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPNG}
          disabled={exporting}
        >
          <Image className="mr-1.5 h-4 w-4" />
          Export as PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={exporting}
        >
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
          <span className="text-sm text-text-muted">Generating export...</span>
        )}
      </div>

      <p className="text-sm text-text-muted">
        Click any text field on the poster to edit it. Changes are for this
        preview only and will not modify the event.
      </p>

      {/* Poster preview */}
      <div className="flex justify-center">
        <div
          ref={posterRef}
          className="w-full max-w-[400px] bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ aspectRatio: '2 / 3' }}
        >
          {/* Brand colour accent bar */}
          <div className="h-3" style={{ backgroundColor: brandColor }} />

          <div className="flex flex-col items-center justify-between h-[calc(100%-12px)] px-6 py-6">
            {/* Top section: logo + event name */}
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Building logo */}
              {building?.logoUrl ? (
                <img
                  src={building.logoUrl}
                  alt={`${building.name} logo`}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: brandColor }}
                >
                  {building?.name?.charAt(0) ?? 'B'}
                </div>
              )}

              {/* Event name — editable */}
              <EditableField
                value={displayName}
                field="name"
                editing={editingField === 'name'}
                onFieldClick={handleFieldClick}
                onFieldBlur={handleFieldBlur}
                onFieldKeyDown={handleFieldKeyDown}
                className="text-2xl font-bold text-center leading-tight"
                style={{ color: brandColor }}
              />
            </div>

            {/* Middle section: details */}
            <div className="flex flex-col items-center gap-3 w-full">
              {/* Date & Time — editable */}
              <EditableField
                value={displayDateTime}
                field="dateTime"
                editing={editingField === 'dateTime'}
                onFieldClick={handleFieldClick}
                onFieldBlur={handleFieldBlur}
                onFieldKeyDown={handleFieldKeyDown}
                className="text-base font-medium text-gray-700 text-center"
              />

              {/* Location — editable */}
              <EditableField
                value={displayLocation}
                field="location"
                editing={editingField === 'location'}
                onFieldClick={handleFieldClick}
                onFieldBlur={handleFieldBlur}
                onFieldKeyDown={handleFieldKeyDown}
                className="text-sm text-gray-600 text-center"
              />

              {/* Observance tie-in badge */}
              {nearbyObservance && showObservance && (
                <div className="flex items-center justify-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1">
                  <span className="text-sm">{nearbyObservance.emoji}</span>
                  <span className="text-xs text-gray-500">{nearbyObservance.name}</span>
                </div>
              )}

              {/* Description (short, non-editable) */}
              {event.description && (
                <p className="text-xs text-gray-500 text-center max-w-[280px] line-clamp-3 mt-1">
                  {event.description}
                </p>
              )}
            </div>

            {/* Bottom section: CTA + QR + building name */}
            <div className="flex flex-col items-center gap-4 w-full">
              {/* CTA — editable */}
              <EditableField
                value={displayCTA}
                field="cta"
                editing={editingField === 'cta'}
                onFieldClick={handleFieldClick}
                onFieldBlur={handleFieldBlur}
                onFieldKeyDown={handleFieldKeyDown}
                className="text-lg font-bold text-center"
                style={{ color: brandColor }}
              />

              {/* QR code placeholder */}
              <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-[10px] text-gray-400 text-center leading-tight">
                  QR Code
                </span>
              </div>

              {/* Building name */}
              <p className="text-xs text-gray-400 text-center">
                {building?.name ?? 'Your Building'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Editable field sub-component ---------- */

interface EditableFieldProps {
  value: string
  field: string
  editing: boolean
  onFieldClick: (field: string) => void
  onFieldBlur: (field: string, value: string) => void
  onFieldKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: string,
    value: string,
  ) => void
  className?: string
  style?: React.CSSProperties
}

function EditableField({
  value,
  field,
  editing,
  onFieldClick,
  onFieldBlur,
  onFieldKeyDown,
  className = '',
  style,
}: EditableFieldProps) {
  const [localValue, setLocalValue] = useState(value)

  // Sync local value when the source value changes (e.g., from overrides)
  useEffect(() => {
    if (!editing && localValue !== value) {
      setLocalValue(value)
    }
  }, [value, editing]) // eslint-disable-line react-hooks/exhaustive-deps

  if (editing) {
    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onFieldBlur(field, localValue)}
        onKeyDown={(e) => onFieldKeyDown(e, field, localValue)}
        autoFocus
        className={`bg-blue-50 border border-blue-300 rounded px-2 py-1 outline-none w-full ${className}`}
        style={style}
      />
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onFieldClick(field)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFieldClick(field)
        }
      }}
      className={`cursor-pointer hover:bg-blue-50/50 rounded px-2 py-1 transition-colors ${className}`}
      style={style}
      title="Click to edit"
    >
      {value || '(Click to edit)'}
    </div>
  )
}
