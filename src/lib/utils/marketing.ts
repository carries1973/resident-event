import { formatDate, formatTime } from './dates'
import type { Event } from '../types/event'

/**
 * Replace any placeholder tokens the AI may have left in marketing copy with
 * real values from the event and building.
 *
 * This is a safety net — the AI prompt instructs it to use real values
 * directly, but this resolves any stray tokens in previously-generated or
 * edge-case content before display and copy-paste.
 *
 * Tokens resolved:
 *   {BUILDING_NAME}  → actual building name
 *   {EVENT_NAME}     → actual event name
 *   {DATE}           → formatted event date (e.g. "March 9, 2026")
 *   {TIME}           → formatted time range (e.g. "6:00 PM – 8:00 PM")
 *   {RESIDENT_NAME}  → "Neighbour" (generic friendly fallback)
 *   {RSVP_LINK}      → human-readable placeholder note
 *   {QR_CODE}        → human-readable placeholder note
 *   {BUILDING_LOGO}  → human-readable placeholder note
 */
export function fillPlaceholders(
  text: string,
  event: Event,
  buildingName: string,
): string {
  const timeStr =
    event.startTime && event.endTime
      ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
      : event.startTime
        ? formatTime(event.startTime)
        : 'TBD'

  return text
    .replace(/\{BUILDING_NAME\}/gi, buildingName)
    .replace(/\{EVENT_NAME\}/gi, event.name)
    .replace(/\{DATE\}/gi, event.date ? formatDate(event.date) : 'TBD')
    .replace(/\{TIME\}/gi, timeStr)
    .replace(/\{RESIDENT_NAME\}/gi, 'Neighbour')
    .replace(/\{RSVP_LINK\}/gi, '[RSVP link — insert your link here]')
    .replace(/\{QR_CODE\}/gi, '[QR code]')
    .replace(/\{BUILDING_LOGO\}/gi, '[building logo]')
}

/**
 * Apply fillPlaceholders across an entire EventMarketing object, returning
 * a new object with all string fields resolved.
 */
export function fillMarketingPlaceholders(
  marketing: Event['marketing'],
  event: Event,
  buildingName: string,
): Event['marketing'] {
  if (!marketing) return marketing

  const fill = (text: string) => fillPlaceholders(text, event, buildingName)

  return {
    ...marketing,
    emailSubjectLines: marketing.emailSubjectLines.map(fill),
    emailBody: fill(marketing.emailBody),
    sms: fill(marketing.sms),
    posterCopy: {
      hook: fill(marketing.posterCopy.hook),
      cta: fill(marketing.posterCopy.cta),
      supportingText: fill(marketing.posterCopy.supportingText),
    },
    socialCaptions: marketing.socialCaptions.map(fill),
    visualPrompt: fill(marketing.visualPrompt),
    ...(marketing.campaignSequence
      ? {
          campaignSequence: {
            invitation: {
              subject: fill(marketing.campaignSequence.invitation.subject),
              body: fill(marketing.campaignSequence.invitation.body),
            },
            reminder: {
              subject: fill(marketing.campaignSequence.reminder.subject),
              body: fill(marketing.campaignSequence.reminder.body),
            },
            thankYou: {
              subject: fill(marketing.campaignSequence.thankYou.subject),
              body: fill(marketing.campaignSequence.thankYou.body),
            },
          },
        }
      : {}),
  }
}
