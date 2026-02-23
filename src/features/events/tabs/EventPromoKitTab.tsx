// ---------------------------------------------------------------------------
// Promo Kit Tab — Clean copy blocks for Email, SMS, and Social
// ---------------------------------------------------------------------------
// Shows the marketing materials as ready-to-use copy blocks with:
//  - One-click copy to clipboard per block
//  - Unsplash featured image for the social block
//  - PDF download for email block
//  - Image+caption PNG download for social block
//  - All text fields are editable and saved back to the event
// ---------------------------------------------------------------------------

import { useState, useRef, useCallback } from 'react'
import {
  Copy,
  Check,
  Sparkles,
  Mail,
  MessageSquare,
  Share2,
  Download,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useEventStore } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import { generateAI, AiError } from '@/lib/ai/client'
import { parseAiResponse, aiMarketingSchema } from '@/lib/ai/schemas'
import type { AiMarketingOutput } from '@/lib/ai/schemas'
import { buildMarketingPrompt } from '@/lib/ai/prompts/marketing'
import type { Event, EventMarketing } from '@/lib/types/event'
import { formatDate, formatTime } from '@/lib/utils/dates'

// ---------------------------------------------------------------------------
// Unsplash integration
// ---------------------------------------------------------------------------

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined

interface UnsplashPhoto {
  id: string
  urls: { regular: string; small: string }
  alt_description: string | null
  user: { name: string; links: { html: string } }
}

async function fetchUnsplashPhoto(query: string): Promise<UnsplashPhoto | null> {
  if (!UNSPLASH_KEY) return null
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0] ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fillPlaceholders(text: string, event: Event, buildingName: string): string {
  return text
    .replace(/\{BUILDING_NAME\}/gi, buildingName)
    .replace(/\{EVENT_NAME\}/gi, event.name)
    .replace(/\{DATE\}/gi, event.date ? formatDate(event.date) : 'TBD')
    .replace(/\{TIME\}/gi,
      event.startTime && event.endTime
        ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
        : event.startTime ? formatTime(event.startTime) : 'TBD'
    )
    .replace(/\{RSVP_LINK\}/gi, '[RSVP link]')
    .replace(/\{QR_CODE\}/gi, '[QR code]')
    .replace(/\{BUILDING_LOGO\}/gi, '[building logo]')
}

// ---------------------------------------------------------------------------
// CopyBlock
// ---------------------------------------------------------------------------

interface CopyBlockProps {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  onSave: () => void
  rows?: number
  mono?: boolean
  charLimit?: number
}

function CopyBlock({ label, icon, value, onChange, onSave, rows = 4, mono = false, charLimit }: CopyBlockProps) {
  const [copied, setCopied] = useState(false)
  const [dirty, setDirty] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleChange(v: string) {
    onChange(v)
    setDirty(true)
  }

  function handleSave() {
    onSave()
    setDirty(false)
    toast.success('Saved.')
  }

  const overLimit = charLimit != null && value.length > charLimit

  return (
    <div className="rounded-lg border border-border-default bg-surface-hover overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-page border-b border-border-default">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-text-primary uppercase tracking-wider">
          {icon}
          {label}
        </span>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={handleSave}>
              Save
            </Button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5 text-success" /><span className="text-success">Copied!</span></>
            ) : (
              <><Copy className="h-3.5 w-3.5" /><span>Copy</span></>
            )}
          </button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={rows}
        className={`rounded-none border-0 bg-transparent resize-none focus-visible:ring-0 text-sm text-text-primary ${mono ? 'font-mono' : ''}`}
      />
      {charLimit != null && (
        <div className={`px-3 pb-2 text-xs text-right ${overLimit ? 'text-danger' : 'text-text-muted'}`}>
          {value.length}/{charLimit}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface EventPromoKitTabProps {
  event: Event
}

export function EventPromoKitTab({ event }: EventPromoKitTabProps) {
  const updateEvent = useEventStore((s) => s.updateEvent)
  const getBuildingById = useBuildingStore((s) => s.getBuildingById)
  const building = getBuildingById(event.buildingId)

  const [isGenerating, setIsGenerating] = useState(false)
  const [unsplashPhoto, setUnsplashPhoto] = useState<UnsplashPhoto | null>(null)
  const [unsplashLoading, setUnsplashLoading] = useState(false)
  const socialImageRef = useRef<HTMLImageElement>(null)

  // Local editable copies of the three blocks (synced from event.marketing)
  const [emailSubject, setEmailSubject] = useState(
    event.marketing?.emailSubjectLines?.[0] ?? ''
  )
  const [emailBody, setEmailBody] = useState(event.marketing?.emailBody ?? '')
  const [smsText, setSmsText] = useState(event.marketing?.sms ?? '')
  const [socialCaption, setSocialCaption] = useState(
    event.marketing?.socialCaptions?.[0] ?? ''
  )

  const buildingName = building?.name ?? 'your building'

  // Fill placeholders on rendered values (used for PDF/export and display)
  const filledEmailSubject = fillPlaceholders(emailSubject, event, buildingName)
  const filledEmailBody = fillPlaceholders(emailBody, event, buildingName)

  // ── Generate materials if none exist ──
  const handleGenerate = useCallback(async () => {
    if (!building) return
    setIsGenerating(true)
    try {
      const { system, user } = buildMarketingPrompt(event, building)
      const result = await generateAI({ systemPrompt: system, userMessage: user })
      const parsed = parseAiResponse<AiMarketingOutput>(result.text, aiMarketingSchema)
      if (!parsed.success) { toast.error('Generation failed.'); return }
      const m = parsed.data as EventMarketing
      updateEvent(event.id, { marketing: m })
      setEmailSubject(m.emailSubjectLines?.[0] ?? '')
      setEmailBody(m.emailBody ?? '')
      setSmsText(m.sms ?? '')
      setSocialCaption(m.socialCaptions?.[0] ?? '')
      toast.success('Promo kit generated')
    } catch (err) {
      toast.error(err instanceof AiError ? err.message : 'Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [event, building, updateEvent])

  // ── Fetch Unsplash image ──
  const handleFetchImage = useCallback(async () => {
    if (!UNSPLASH_KEY) {
      toast.error('Add VITE_UNSPLASH_ACCESS_KEY to your .env file to enable Unsplash images.')
      return
    }
    setUnsplashLoading(true)
    const query = [event.name, event.category, event.location].filter(Boolean).join(' ')
    const photo = await fetchUnsplashPhoto(query)
    setUnsplashPhoto(photo)
    setUnsplashLoading(false)
    if (!photo) toast.error('No image found. Try a different search.')
  }, [event])

  // ── Save callbacks ──
  function saveEmailSubject() {
    if (!event.marketing) return
    updateEvent(event.id, {
      marketing: { ...event.marketing, emailSubjectLines: [emailSubject, ...(event.marketing.emailSubjectLines?.slice(1) ?? [])] }
    })
  }
  function saveEmailBody() {
    if (!event.marketing) return
    updateEvent(event.id, { marketing: { ...event.marketing, emailBody } })
  }
  function saveSms() {
    if (!event.marketing) return
    updateEvent(event.id, { marketing: { ...event.marketing, sms: smsText } })
  }
  function saveSocial() {
    if (!event.marketing) return
    const updated = [socialCaption, ...(event.marketing.socialCaptions?.slice(1) ?? [])]
    updateEvent(event.id, { marketing: { ...event.marketing, socialCaptions: updated } })
  }

  // ── PDF download for email ──
  async function handleDownloadEmailPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(`Subject: ${filledEmailSubject}`, 14, 20)
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(filledEmailBody, 180)
    doc.text(lines, 14, 32)
    doc.save(`${event.name.replace(/\s+/g, '-')}-email.pdf`)
  }

  // ── PNG download for social ──
  async function handleDownloadSocialPng() {
    const { default: html2canvas } = await import('html2canvas')
    const el = document.getElementById('promo-social-block')
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2, useCORS: true })
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${event.name.replace(/\s+/g, '-')}-social.png`
    link.click()
  }

  // ── Empty / generating states ──
  if (!building) {
    return <p className="text-sm text-text-muted">Building not found for this event.</p>
  }

  if (isGenerating) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <p className="text-xs text-text-muted text-center">Generating promo kit…</p>
      </div>
    )
  }

  if (!event.marketing) {
    return (
      <EmptyState
        icon={<Share2 />}
        title="Promo Kit"
        description="Generate ready-to-use email, SMS, and social copy for this event with one click."
        actionLabel="Generate Promo Kit"
        onAction={handleGenerate}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Promo Kit</h2>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>

      {/* ── Email block ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            Email
          </h3>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleDownloadEmailPdf}>
            <Download className="h-3 w-3" />
            PDF
          </Button>
        </div>
        <CopyBlock
          label="Subject line"
          icon={null}
          value={emailSubject}
          onChange={setEmailSubject}
          onSave={saveEmailSubject}
          rows={1}
        />
        <CopyBlock
          label="Body"
          icon={null}
          value={emailBody}
          onChange={setEmailBody}
          onSave={saveEmailBody}
          rows={6}
        />
      </div>

      {/* ── SMS block ── */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" />
          SMS
        </h3>
        <CopyBlock
          label="Text message"
          icon={null}
          value={smsText}
          onChange={setSmsText}
          onSave={saveSms}
          rows={3}
          mono
          charLimit={160}
        />
      </div>

      {/* ── Social block ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <Share2 className="h-4 w-4" />
            Social Media
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={handleFetchImage}
              disabled={unsplashLoading}
            >
              <Sparkles className="h-3 w-3" />
              {unsplashLoading ? 'Loading…' : 'Get Image'}
            </Button>
            {unsplashPhoto && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleDownloadSocialPng}>
                <Download className="h-3 w-3" />
                PNG
              </Button>
            )}
          </div>
        </div>

        {/* Social exportable block */}
        <div id="promo-social-block" className="rounded-lg overflow-hidden border border-border-default">
          {/* Unsplash image */}
          {unsplashLoading && (
            <Skeleton className="w-full h-48" />
          )}
          {!unsplashLoading && unsplashPhoto && (
            <div className="relative">
              <img
                ref={socialImageRef}
                src={unsplashPhoto.urls.regular}
                alt={unsplashPhoto.alt_description ?? event.name}
                className="w-full object-cover max-h-72"
                crossOrigin="anonymous"
              />
              <a
                href={unsplashPhoto.user.links.html + '?utm_source=resident_event_ideas&utm_medium=referral'}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-1 right-2 text-[10px] text-white/70 flex items-center gap-0.5 hover:text-white transition-colors"
              >
                Photo by {unsplashPhoto.user.name} on Unsplash
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          )}
          {!unsplashLoading && !unsplashPhoto && !UNSPLASH_KEY && (
            <div className="bg-surface-hover px-4 py-3 text-xs text-text-muted border-b border-border-default">
              Add <code className="font-mono bg-page px-1 rounded">VITE_UNSPLASH_ACCESS_KEY</code> to your .env to enable stock photos.
            </div>
          )}
          {!unsplashLoading && !unsplashPhoto && UNSPLASH_KEY && (
            <div className="bg-surface-hover px-4 py-3 text-xs text-text-muted border-b border-border-default flex items-center justify-between">
              <span>No image loaded — click "Get Image" to fetch one.</span>
            </div>
          )}

          {/* Caption */}
          <CopyBlock
            label="Caption"
            icon={null}
            value={socialCaption}
            onChange={setSocialCaption}
            onSave={saveSocial}
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}
