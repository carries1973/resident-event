/**
 * Poster Templates Page — Resources → Poster Templates
 *
 * Browser for the Canva-designed 1080×1400px poster templates.
 * Users browse, pick a template, select an event, and the app composites
 * dynamic fields (logo, event name, date, location, CTA, QR) onto the art.
 *
 * One composite → multiple downloads:
 *   Full portrait  1080×1400   (Instagram portrait, Facebook, lobby print)
 *   Square crop    1080×1080   (Instagram square)
 *   Email header   1080×560    (top 40% crop)
 *   Print PDF      8.5×11"     (letter portrait via jsPDF)
 */

import { useState, useCallback, useEffect } from 'react'
import {
  ImageIcon,
  Search,
  Download,
  Sparkles,
  ChevronLeft,
  Instagram,
  Mail,
  Printer,
  Square,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useBuildingStore, useBuildingStoreHydrated } from '@/lib/store/buildingStore'
import { useEventStore, useEventStoreHydrated } from '@/lib/store/eventStore'
import { useAppStore } from '@/lib/store/appStore'
import { formatDate, formatTime } from '@/lib/utils/dates'
import {
  POSTER_CATEGORIES,
  searchPosterTemplates,
  type PosterTemplate,
  type PosterCategory,
} from '@/lib/data/posterTemplates'
import {
  compositePoster,
  type CropKey,
  type CompositorResult,
} from '@/lib/export/posterCompositor'
import type { Event } from '@/lib/types/event'

// ── Types ─────────────────────────────────────────────────────────

type PageStep = 'browse' | 'compose' | 'export'

// ── Page ──────────────────────────────────────────────────────────

export function PosterTemplatesPage() {
  const buildings         = useBuildingStore((s) => s.buildings)
  const events            = useEventStore((s) => s.events)
  const currentBuildingId = useAppStore((s) => s.currentBuildingId)
  const buildingsHydrated = useBuildingStoreHydrated()
  const eventsHydrated    = useEventStoreHydrated()
  const hydrated          = buildingsHydrated && eventsHydrated

  // Selected building — starts empty, then resolves once stores rehydrate
  const [buildingId, setBuildingId] = useState<string>('')

  // Once stores have rehydrated, set the building from currentBuildingId or first building
  useEffect(() => {
    if (!hydrated) return
    if (buildingId) return // already set — don't override user's selection
    const resolved = currentBuildingId ?? buildings[0]?.id ?? ''
    if (resolved) setBuildingId(resolved)
  }, [hydrated, currentBuildingId, buildings, buildingId])

  const building = buildings.find((b) => b.id === buildingId)

  // Filter state
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState<PosterCategory | 'all'>('all')

  // Step & selection
  const [step, setStep]                             = useState<PageStep>('browse')
  const [selectedTemplate, setSelectedTemplate]     = useState<PosterTemplate | null>(null)
  const [selectedEventId, setSelectedEventId]       = useState<string>('')
  const [ctaOverride, setCtaOverride]               = useState<string>('')

  // Compositor state
  const [compositing, setCompositing]               = useState(false)
  const [result, setResult]                         = useState<CompositorResult | null>(null)
  const [previewUrl, setPreviewUrl]                 = useState<string | null>(null)
  const [downloading, setDownloading]               = useState<string | null>(null)

  // Filter templates
  const filtered = (
    category === 'all'
      ? searchPosterTemplates(search)
      : searchPosterTemplates(search).filter((t) => t.category === category)
  )

  // Events for the selected building — all non-archived, non-cancelled statuses
  // (draft events are included so property managers can prep posters before scheduling)
  const buildingEvents = events.filter(
    (e) =>
      e.buildingId === buildingId &&
      e.status !== 'archived' &&
      e.status !== 'cancelled',
  )

  const selectedEvent: Event | undefined = buildingEvents.find((e) => e.id === selectedEventId)

  // ── Step 1: Browse ───────────────────────────────────────────────

  function handleSelectTemplate(template: PosterTemplate) {
    setSelectedTemplate(template)
    setStep('compose')
    setResult(null)
    setPreviewUrl(null)
    setCtaOverride('')
  }

  // ── Step 2: Compose ──────────────────────────────────────────────

  const handleComposite = useCallback(async () => {
    if (!building || !selectedTemplate || !selectedEvent) return

    setCompositing(true)
    setResult(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)

    try {
      // Build date/time string
      const dateStr = selectedEvent.date ? formatDate(selectedEvent.date) : ''
      const timeStr = selectedEvent.startTime
        ? selectedEvent.endTime
          ? `${formatTime(selectedEvent.startTime)} – ${formatTime(selectedEvent.endTime)}`
          : formatTime(selectedEvent.startTime)
        : ''
      const dateTime = [dateStr, timeStr].filter(Boolean).join(' | ')

      const compositor = await compositePoster({
        template:    selectedTemplate,
        eventName:   selectedEvent.name,
        dateTime,
        location:    selectedEvent.location || '',
        cta:         ctaOverride || selectedEvent.marketing?.posterCopy?.cta || 'Join Us!',
        buildingName: building.name,
        brandColor:  building.brandColor,
        logoDataUrl: building.logoUrl,
        showQrPlaceholder: false,
      })

      setResult(compositor)

      // Generate preview thumbnail
      const blob = await compositor.exportPng('full')
      const url  = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setStep('export')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Compositing failed. Please try again.'
      toast.error(msg)
    } finally {
      setCompositing(false)
    }
  }, [building, selectedTemplate, selectedEvent, ctaOverride, previewUrl])

  // ── Step 3: Export ───────────────────────────────────────────────

  async function handleDownloadPng(crop: CropKey, label: string) {
    if (!result || !selectedEvent) return
    const safeName = selectedEvent.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
    const suffixes: Record<CropKey, string> = {
      full:   'Portrait-1080x1400',
      square: 'Square-1080x1080',
      email:  'Email-Header-1080x560',
    }
    setDownloading(crop)
    try {
      await result.downloadPng(`${safeName}-Poster-${suffixes[crop]}.png`, crop)
      toast.success(`${label} downloaded`)
    } catch {
      toast.error(`Failed to download ${label}`)
    } finally {
      setDownloading(null)
    }
  }

  async function handleDownloadPdf() {
    if (!result || !selectedEvent) return
    setDownloading('pdf')
    try {
      await result.exportPdf(selectedEvent.name)
      toast.success('Print PDF downloaded')
    } catch {
      toast.error('Failed to export PDF')
    } finally {
      setDownloading(null)
    }
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setResult(null)
    setStep('browse')
    setSelectedTemplate(null)
    setSelectedEventId('')
    setCtaOverride('')
    setCompositing(false)
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Poster Templates</h1>
          <p className="text-text-secondary text-sm mt-1">
            Pick a template, select an event, and download ready-to-use social, email, and print assets.
          </p>
        </div>
        {step !== 'browse' && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 shrink-0">
            <ChevronLeft className="h-4 w-4" />
            Back to templates
          </Button>
        )}
      </div>

      {/* Building selector — always visible so user knows which building is active */}
      {step === 'browse' && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-text-primary shrink-0">Building</label>
          {!hydrated ? (
            <div className="h-9 w-[240px] animate-pulse rounded-md bg-muted" />
          ) : buildings.length === 0 ? (
            <span className="text-sm text-text-muted">
              No buildings yet.{' '}
              <a href="/buildings/new" className="text-accent-primary underline underline-offset-2">
                Add one →
              </a>
            </span>
          ) : (
            <Select value={buildingId} onValueChange={(id) => {
              setBuildingId(id)
              setSelectedEventId('') // clear event selection when switching buildings
            }}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm shrink-0"
                        style={{ backgroundColor: b.brandColor }}
                      />
                      {b.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* ── STEP 1: Browse ───────────────────────────────────────── */}
      {step === 'browse' && (
        <BrowseStep
          templates={filtered}
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={(c) => setCategory(c as PosterCategory | 'all')}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      {/* ── STEP 2: Compose ──────────────────────────────────────── */}
      {step === 'compose' && selectedTemplate && (
        <ComposeStep
          template={selectedTemplate}
          building={building}
          events={buildingEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          ctaOverride={ctaOverride}
          onCtaChange={setCtaOverride}
          compositing={compositing}
          onComposite={handleComposite}
        />
      )}

      {/* ── STEP 3: Export ───────────────────────────────────────── */}
      {step === 'export' && selectedTemplate && previewUrl && result && (
        <ExportStep
          event={selectedEvent}
          previewUrl={previewUrl}
          downloading={downloading}
          onDownloadPng={handleDownloadPng}
          onDownloadPdf={handleDownloadPdf}
          onRecomposite={() => setStep('compose')}
        />
      )}
    </div>
  )
}

// ── Browse Step ───────────────────────────────────────────────────

interface BrowseStepProps {
  templates: PosterTemplate[]
  search: string
  onSearchChange: (s: string) => void
  category: PosterCategory | 'all'
  onCategoryChange: (c: string) => void
  onSelectTemplate: (t: PosterTemplate) => void
}

function BrowseStep({
  templates,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onSelectTemplate,
}: BrowseStepProps) {
  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {POSTER_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.emoji} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="h-10 w-10 text-text-muted mb-3" />
          <p className="text-text-secondary font-medium">No templates match your search</p>
          <p className="text-text-muted text-sm mt-1">Try a different keyword or category</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelectTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Upload nudge */}
      <div className="rounded-lg border border-dashed border-border-default bg-surface-hover/30 p-6 text-center">
        <p className="text-sm font-medium text-text-primary mb-1">
          Want to add your own Canva templates?
        </p>
        <p className="text-text-muted text-xs max-w-sm mx-auto">
          Export your Canva designs as 1080×1400px PNGs and drop them in{' '}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">
            /public/poster-templates/
          </code>{' '}
          — they'll appear here automatically.
        </p>
      </div>
    </div>
  )
}

// ── Template Card ─────────────────────────────────────────────────

function TemplateCard({
  template,
  onSelect,
}: {
  template: PosterTemplate
  onSelect: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const cat = POSTER_CATEGORIES.find((c) => c.id === template.category)

  return (
    <div className="group rounded-xl border border-border-default bg-surface overflow-hidden shadow-card hover:shadow-elevated transition-shadow">
      {/* Thumbnail */}
      <div
        className="relative bg-muted overflow-hidden cursor-pointer"
        style={{ aspectRatio: '3 / 4' }}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
        aria-label={`Select ${template.name} template`}
      >
        {!imgError ? (
          <img
            src={template.thumbnailPath}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Placeholder when thumbnail not found */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-sidebar to-sidebar/80 gap-3">
            <span className="text-4xl">
              {cat?.emoji ?? '🎨'}
            </span>
            <span className="text-xs text-white/60 text-center px-4">{template.name}</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-text-primary shadow">
            Use Template →
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary leading-snug">{template.name}</p>
          <Badge variant="secondary" className="text-xs shrink-0">
            {cat?.emoji} {cat?.label ?? template.category}
          </Badge>
        </div>
        <p className="text-xs text-text-muted leading-snug">{template.description}</p>
        <Button size="sm" className="w-full gap-1.5" onClick={onSelect}>
          <Sparkles className="h-3.5 w-3.5" />
          Use Template
        </Button>
      </div>
    </div>
  )
}

// ── Compose Step ──────────────────────────────────────────────────

interface ComposeStepProps {
  template: PosterTemplate
  building: ReturnType<typeof useBuildingStore.getState>['buildings'][0] | undefined
  events: Event[]
  selectedEventId: string
  onSelectEvent: (id: string) => void
  ctaOverride: string
  onCtaChange: (s: string) => void
  compositing: boolean
  onComposite: () => void
}

function ComposeStep({
  template,
  building,
  events,
  selectedEventId,
  onSelectEvent,
  ctaOverride,
  onCtaChange,
  compositing,
  onComposite,
}: ComposeStepProps) {
  const [thumbnailError, setThumbnailError] = useState(false)
  const cat = POSTER_CATEGORIES.find((c) => c.id === template.category)

  const canGenerate = !!selectedEventId && !!building

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      {/* Template preview column */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-primary">Template</p>
        <div className="rounded-xl border border-border-default overflow-hidden shadow-card">
          <div style={{ aspectRatio: '3 / 4' }} className="bg-muted">
            {!thumbnailError ? (
              <img
                src={template.thumbnailPath}
                alt={template.name}
                className="w-full h-full object-cover"
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-sidebar to-sidebar/80 gap-3">
                <span className="text-5xl">{cat?.emoji ?? '🎨'}</span>
                <span className="text-sm text-white/70">{template.name}</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold text-text-primary">{template.name}</p>
            <p className="text-xs text-text-muted mt-0.5">{template.description}</p>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-text-primary">Configure Your Poster</h2>
          <p className="text-text-secondary text-sm">
            Select an event — the app will stamp its details onto the template automatically.
          </p>
        </div>

        {/* Event selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Event <span className="text-danger">*</span>
          </label>
          {events.length === 0 ? (
            <div className="rounded-lg border border-border-default bg-surface-hover/30 px-4 py-3 text-sm text-text-muted">
              No events found for this building.{' '}
              <a href="/events/new" className="text-accent-primary underline underline-offset-2">
                Create one first →
              </a>
            </div>
          ) : (
            <Select value={selectedEventId} onValueChange={onSelectEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    <span className="flex items-center gap-2">
                      <span>{ev.name}</span>
                      {ev.date && (
                        <span className="text-text-muted text-xs">
                          · {formatDate(ev.date)}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* CTA override */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Call-to-Action text
            <span className="ml-1.5 text-text-muted font-normal text-xs">(optional override)</span>
          </label>
          <Input
            placeholder='e.g., "RSVP by March 10" or "Join Us!"'
            value={ctaOverride}
            onChange={(e) => onCtaChange(e.target.value)}
            maxLength={40}
          />
          <p className="text-xs text-text-muted">
            Defaults to the CTA from your event's marketing copy if blank.
          </p>
        </div>

        {/* Building info preview */}
        {building && (
          <div className="rounded-lg border border-border-default bg-surface p-4 space-y-2">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Will be stamped automatically
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-24 shrink-0">Brand colour</span>
                <span
                  className="inline-block h-4 w-4 rounded-sm border border-border-default shrink-0"
                  style={{ backgroundColor: building.brandColor }}
                />
                <span className="font-mono text-xs text-text-secondary">{building.brandColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-24 shrink-0">Logo</span>
                {building.logoUrl ? (
                  <img src={building.logoUrl} alt="logo" className="h-6 w-auto object-contain" />
                ) : (
                  <span className="text-text-muted text-xs italic">None uploaded</span>
                )}
              </div>

            </div>
          </div>
        )}

        <Button
          size="lg"
          className="w-full gap-2"
          disabled={!canGenerate || compositing}
          onClick={onComposite}
        >
          {compositing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Compositing poster…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Poster
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Export Step ───────────────────────────────────────────────────

interface ExportFormat {
  key: CropKey | 'pdf'
  label: string
  description: string
  dimensions: string
  icon: React.ReactNode
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    key:         'full',
    label:       'Instagram Portrait / Facebook',
    description: 'Full 1080×1400px portrait — ideal for Instagram and Facebook posts',
    dimensions:  '1080 × 1400 px',
    icon:        <Instagram className="h-5 w-5" />,
  },
  {
    key:         'square',
    label:       'Instagram Square',
    description: 'Centre-cropped 1080×1080px square — perfect for Instagram grid',
    dimensions:  '1080 × 1080 px',
    icon:        <Square className="h-5 w-5" />,
  },
  {
    key:         'email',
    label:       'Email Header',
    description: 'Top 40% crop — ideal as an email campaign header image',
    dimensions:  '1080 × 560 px',
    icon:        <Mail className="h-5 w-5" />,
  },
  {
    key:         'pdf',
    label:       'Print PDF (Letter)',
    description: 'Scaled to 8.5×11" for lobby printing or physical flyers',
    dimensions:  '8.5 × 11 in',
    icon:        <Printer className="h-5 w-5" />,
  },
]

interface ExportStepProps {
  event: Event | undefined
  previewUrl: string
  downloading: string | null
  onDownloadPng: (crop: CropKey, label: string) => Promise<void>
  onDownloadPdf: () => Promise<void>
  onRecomposite: () => void
}

function ExportStep({
  event,
  previewUrl,
  downloading,
  onDownloadPng,
  onDownloadPdf,
  onRecomposite,
}: ExportStepProps) {
  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/8 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-text-primary">
            Your poster is ready!
          </p>
          <p className="text-text-muted text-xs mt-0.5">
            Download in any format below. The same design adapts to every output automatically.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto shrink-0 gap-1.5"
          onClick={onRecomposite}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Edit & Regenerate
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Preview */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-primary">Preview</p>
          <div
            className="rounded-xl border border-border-default overflow-hidden shadow-elevated"
            style={{ aspectRatio: '3 / 4' }}
          >
            <img
              src={previewUrl}
              alt="Poster preview"
              className="w-full h-full object-cover"
            />
          </div>
          {event && (
            <p className="text-xs text-text-muted text-center">
              {event.name}
              {event.date && <> · {formatDate(event.date)}</>}
            </p>
          )}
        </div>

        {/* Export options */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-0.5">Download Options</h2>
            <p className="text-text-muted text-sm">
              Each format is generated from the same composite — no re-rendering needed.
            </p>
          </div>

          <div className="space-y-3">
            {EXPORT_FORMATS.map((fmt) => {
              const isLoading = downloading === fmt.key
              return (
                <div
                  key={fmt.key}
                  className="flex items-center gap-4 rounded-lg border border-border-default bg-surface p-4"
                >
                  <div className="p-2 rounded-lg bg-muted text-text-muted">
                    {fmt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{fmt.label}</p>
                    <p className="text-xs text-text-muted">{fmt.description}</p>
                    <p className="text-xs font-mono text-text-muted/70 mt-0.5">{fmt.dimensions}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    disabled={isLoading || !!downloading}
                    onClick={() => {
                      if (fmt.key === 'pdf') {
                        onDownloadPdf()
                      } else {
                        onDownloadPng(fmt.key as CropKey, fmt.label)
                      }
                    }}
                  >
                    {isLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {isLoading ? 'Exporting…' : 'Download'}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Tip */}
          <div className="rounded-lg bg-surface-hover/40 border border-border-subtle px-4 py-3 text-xs text-text-muted space-y-1">
            <p className="font-medium text-text-secondary">💡 Tips</p>
            <p>• Use <strong>Instagram Portrait</strong> for Stories and Feed posts (scroll-stopping tall format)</p>
            <p>• Use <strong>Square</strong> for a consistent Instagram grid look</p>
            <p>• Use <strong>Email Header</strong> as the hero image in Mailchimp or resident email blasts</p>
            <p>• Use <strong>Print PDF</strong> and print on letter paper for physical lobby flyers</p>
          </div>
        </div>
      </div>
    </div>
  )
}
