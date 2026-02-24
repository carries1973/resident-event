import { useState, useCallback } from 'react'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Mail, Bell, Heart, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { generateAI, AiError } from '@/lib/ai/client'
import { parseAiResponse, aiMarketingSchema } from '@/lib/ai/schemas'
import type { AiMarketingOutput } from '@/lib/ai/schemas'
import { buildMarketingPrompt } from '@/lib/ai/prompts/marketing'
import { useEventStore } from '@/lib/store/eventStore'
import { useBuildingStore } from '@/lib/store/buildingStore'
import type { Event, EventMarketing } from '@/lib/types/event'

import { MarketingGenerating } from '@/features/marketing/MarketingGenerating'
import { EmailGenerator } from '@/features/marketing/EmailGenerator'
import { SocialGenerator } from '@/features/marketing/SocialGenerator'
import { PosterCopyGenerator } from '@/features/marketing/PosterCopyGenerator'
import { MarketingPreview } from '@/features/marketing/MarketingPreview'
import { AiDisclaimer } from '@/components/common/AiDisclaimer'

interface EventMarketingTabProps {
  event: Event
}

/**
 * Marketing tab within the Event Detail page.
 *
 * States:
 *   1. No building found                 -> error message
 *   2. No marketing data (idle)          -> EmptyState with generate CTA
 *   3. Loading (generating)              -> MarketingGenerating skeleton
 *   4. Error                             -> ErrorState with retry
 *   5. Has marketing data                -> full materials view
 */
export function EventMarketingTab({ event }: EventMarketingTabProps) {
  const updateEvent = useEventStore((s) => s.updateEvent)
  const getBuildingById = useBuildingStore((s) => s.getBuildingById)

  const building = getBuildingById(event.buildingId)

  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // -----------------------------------------------------------------------
  // Generate all marketing materials
  // -----------------------------------------------------------------------
  const handleGenerate = useCallback(async () => {
    if (!building) return

    setIsGenerating(true)
    setError(null)

    try {
      const { system, user } = buildMarketingPrompt(event, building)
      const result = await generateAI({
        systemPrompt: system,
        userMessage: user,
      })

      const parsed = parseAiResponse<AiMarketingOutput>(
        result.text,
        aiMarketingSchema,
      )

      if (!parsed.success) {
        setError(parsed.error)
        return
      }

      updateEvent(event.id, { marketing: parsed.data as EventMarketing })
      toast.success('Marketing materials generated')
    } catch (err) {
      if (err instanceof AiError) {
        setError(err.message)
      } else {
        setError(
          'Something went wrong generating marketing materials. Please try again.',
        )
      }
    } finally {
      setIsGenerating(false)
    }
  }, [event, building, updateEvent])

  // -----------------------------------------------------------------------
  // Regenerate a single section
  // -----------------------------------------------------------------------
  const handleRegenerateSection = useCallback(
    async (section: string) => {
      if (!building || !event.marketing) return

      setError(null)

      const sectionLabel = sectionDisplayName(section)
      toast.info(`Regenerating ${sectionLabel}...`)

      try {
        const { system, user } = buildMarketingPrompt(event, building)
        const augmentedUser = `${user}\n\nIMPORTANT: Regenerate ONLY the "${section}" section. Keep everything else the same. Return the full JSON with all fields.`

        const result = await generateAI({
          systemPrompt: system,
          userMessage: augmentedUser,
        })

        const parsed = parseAiResponse<AiMarketingOutput>(
          result.text,
          aiMarketingSchema,
        )

        if (!parsed.success) {
          toast.error(`Failed to regenerate ${sectionLabel}.`)
          return
        }

        // Merge only the regenerated section into existing marketing data
        const merged: EventMarketing = {
          ...event.marketing,
          [section]: (parsed.data as Record<string, unknown>)[section],
        }

        updateEvent(event.id, { marketing: merged })
        toast.success(`${sectionLabel} regenerated`)
      } catch (err) {
        if (err instanceof AiError) {
          toast.error(err.message)
        } else {
          toast.error(`Failed to regenerate ${sectionLabel}. Please try again.`)
        }
      }
    },
    [event, building, updateEvent],
  )

  // -----------------------------------------------------------------------
  // Render: no building
  // -----------------------------------------------------------------------
  if (!building) {
    return (
      <ErrorState
        title="Building not found"
        message="The building associated with this event could not be found. It may have been deleted."
      />
    )
  }

  // -----------------------------------------------------------------------
  // Render: loading
  // -----------------------------------------------------------------------
  if (isGenerating) {
    return <MarketingGenerating />
  }

  // -----------------------------------------------------------------------
  // Render: error
  // -----------------------------------------------------------------------
  if (error && !event.marketing) {
    return (
      <ErrorState
        title="Generation failed"
        message={error}
        onRetry={handleGenerate}
      />
    )
  }

  // -----------------------------------------------------------------------
  // Render: empty state (no marketing data yet)
  // -----------------------------------------------------------------------
  if (!event.marketing) {
    return (
      <EmptyState
        icon={<Sparkles />}
        title="Marketing materials"
        description="Generate AI-powered email subject lines, SMS, social captions, poster copy, and more for this event."
        actionLabel="Generate Marketing Materials"
        onAction={handleGenerate}
      />
    )
  }

  // -----------------------------------------------------------------------
  // Render: marketing data populated
  // -----------------------------------------------------------------------
  const marketing = event.marketing

  return (
    <div className="space-y-8">
      {/* Header with Regenerate All */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Marketing Materials
        </h2>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          <RefreshCw className="h-4 w-4" />
          Regenerate All
        </Button>
      </div>

      {/* AI disclaimer */}
      <AiDisclaimer contentType="marketing copy" />

      {/* RSVP warning — shown when marketing copy references {RSVP_LINK} but RSVP is not enabled */}
      {!event.rsvpEnabled && (
        (() => {
          const allText = [
            ...(marketing?.emailSubjectLines ?? []),
            marketing?.emailBody ?? '',
            marketing?.sms ?? '',
            marketing?.campaignSequence?.invitation?.body ?? '',
            marketing?.campaignSequence?.reminder?.body ?? '',
          ].join(' ')
          const hasRsvpLink = /\{RSVP_LINK\}/i.test(allText) || /RSVP link/i.test(allText)
          return hasRsvpLink ? (
            <div className="rounded-lg border border-warning/40 bg-warning-light px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-text-primary">RSVP not enabled for this event</p>
                <p className="text-text-secondary mt-0.5">
                  The marketing copy includes an RSVP link, but RSVP is currently turned off. Enable RSVP in the Overview tab before sharing this content, or remove the RSVP references.
                </p>
              </div>
            </div>
          ) : null
        })()
      )}

      {/* Error banner (if section regeneration fails while data exists) */}
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Email section */}
      <EmailGenerator
        marketing={marketing}
        onRegenerateSection={handleRegenerateSection}
      />

      <Separator />

      {/* Campaign sequence section */}
      {marketing.campaignSequence && (
        <>
          <CampaignSequenceSection
            sequence={marketing.campaignSequence}
            onRegenerate={() => handleRegenerateSection('campaignSequence')}
          />
          <Separator />
        </>
      )}

      {/* Poster copy section */}
      <PosterCopyGenerator
        marketing={marketing}
        onRegenerateSection={handleRegenerateSection}
      />

      <Separator />

      {/* Social & visual section */}
      <SocialGenerator
        marketing={marketing}
        onRegenerateSection={handleRegenerateSection}
      />

      <Separator />

      {/* Collapsible preview */}
      <div className="space-y-3">
        <button
          onClick={() => setPreviewOpen((prev) => !prev)}
          className="flex w-full items-center justify-between text-sm font-semibold text-text-primary hover:text-primary transition-colors"
        >
          <span>Contextual Preview</span>
          {previewOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {previewOpen && (
          <MarketingPreview marketing={marketing} event={event} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Campaign sequence component
// ---------------------------------------------------------------------------

interface CampaignEmail {
  subject: string
  body: string
}

interface CampaignSequenceSectionProps {
  sequence: {
    invitation: CampaignEmail
    reminder: CampaignEmail
    thankYou: CampaignEmail
  }
  onRegenerate: () => void
}

/** Displays the three-email campaign sequence (Invitation → Reminder → Thank You). */
function CampaignSequenceSection({ sequence, onRegenerate }: CampaignSequenceSectionProps) {
  const emails = [
    {
      key: 'invitation',
      label: 'Invitation',
      timing: 'Send 7–10 days before event',
      icon: <Mail className="h-4 w-4 text-blue-500" />,
      data: sequence.invitation,
    },
    {
      key: 'reminder',
      label: 'Reminder',
      timing: 'Send 1–2 days before event',
      icon: <Bell className="h-4 w-4 text-amber-500" />,
      data: sequence.reminder,
    },
    {
      key: 'thankYou',
      label: 'Thank You',
      timing: 'Send 24–48 hours after event',
      icon: <Heart className="h-4 w-4 text-emerald-500" />,
      data: sequence.thankYou,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Campaign Email Sequence</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Three-email lifecycle sequence — Invitation → Reminder → Thank You
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRegenerate} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
        {emails.map(({ key, label, timing, icon, data }) => (
          <div
            key={key}
            className="rounded-lg border border-border-default bg-surface p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              {icon}
              <div>
                <p className="text-xs font-semibold text-text-primary">{label}</p>
                <p className="text-[10px] text-text-muted">{timing}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">Subject</p>
                <p className="text-xs text-text-primary font-medium leading-relaxed">{data.subject}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">Body</p>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{data.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map section keys to human-readable labels. */
function sectionDisplayName(section: string): string {
  const map: Record<string, string> = {
    emailSubjectLines: 'email subject lines',
    emailBody: 'email body',
    sms: 'SMS message',
    campaignSequence: 'campaign sequence',
    posterCopy: 'poster copy',
    socialCaptions: 'social captions',
    visualPrompt: 'visual prompt',
  }
  return map[section] ?? section
}
