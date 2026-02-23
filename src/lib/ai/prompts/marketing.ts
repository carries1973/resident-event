import type { Event } from '@/lib/types/event'
import type { Building } from '@/lib/types/building'

/**
 * Builds system + user prompts for marketing materials generation.
 *
 * Aligned to REP v3.3 marketing output specification:
 * - Resident Comms Kit (email subjects, body, SMS)
 * - Marketing Copy (poster, social, visual prompt)
 * - Design Specs (Canva dimensions, layout, export formats)
 * - Canadian English compliance
 * - Building brand alignment
 */
export function buildMarketingPrompt(
  event: Event,
  building: Building,
): { system: string; user: string } {
  const system = `You are a Canadian residential property marketing specialist generating materials for an event at a multifamily residential building.

═══════════════════════════════════════════════════════════════
BUILDING BRAND
═══════════════════════════════════════════════════════════════
- Building: ${building.name}
- City: ${building.city}, ${building.province}
- Tone: ${(building.brandTones ?? []).length > 0 ? (building.brandTones ?? []).join(', ') : 'Professional and welcoming'}
- Brand Colour: ${building.brandColor ?? '#8F1D23'}
${(building.wordsToUse ?? []).length > 0 ? `- Words to use: ${(building.wordsToUse ?? []).join(', ')}` : ''}
${(building.wordsToAvoid ?? []).length > 0 ? `- Words to avoid: ${(building.wordsToAvoid ?? []).join(', ')}` : ''}
- Primary Residents: ${building.primaryResidentGroup || 'General residents'}${building.secondaryResidentGroup ? `\n- Secondary Residents: ${building.secondaryResidentGroup}` : ''}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS — GENERATE A COMPLETE MARKETING PACKAGE
═══════════════════════════════════════════════════════════════

Return a JSON object with these exact keys:

──── SECTION 1: RESIDENT COMMS KIT ────

1. "emailSubjectLines": array of 3 email subject lines (one direct, one curiosity-driven, one benefit-focused)
2. "emailBody": string, maximum 150 words, warm and inviting tone, include {RSVP_LINK} placeholder
3. "sms": string, maximum 160 characters, include event name, date, and time

──── SECTION 2: MARKETING COPY ────

4. "posterCopy": object with:
   - "hook": catchy headline for the poster
   - "cta": clear call-to-action (e.g., "RSVP today!" or "Save your spot!")
   - "supportingText": 1-2 sentences of supporting details

5. "socialCaptions": array of 3 social media captions for Instagram/Facebook (one casual, one informative, one enthusiastic)

6. "visualPrompt": string describing the ideal poster or social media image (suitable for DALL-E or Canva AI image generation)

7. "colorPalette": array of 3-4 hex colour codes complementing ${building.brandColor ?? '#8F1D23'}

8. "iconSuggestions": array of 3-4 relevant icon names (e.g., "coffee-cup", "music-note", "sun")

──── SECTION 3: DESIGN SPECIFICATIONS ────

9. "designSpecs": array of recommended marketing assets, each with:
   - "format": string (e.g., "Instagram Post", "Email Header", "Flyer 8.5x11", "Facebook Post", "Twitter/X Post", "Website Banner", "Printable PDF Flyer")
   - "dimensions": string (e.g., "1080x1080px", "600x200px", "8.5x11in")
   - "headline": string — the headline text for this specific format
   - "supportingText": string — CTA or body text tailored for this format
   - "layoutNotes": string — recommended visual layout (text position, focal point, image placement)
   - "exportFormat": string — recommended export type ("PNG for social", "PDF Print for flyers", "JPG for emails", "MP4/GIF for animated")

   Generate specs for at least these 3 formats:
   a) Instagram/Facebook Post (1080x1080px) — social sharing
   b) Email Header (600x200px) — for email campaigns
   c) Printable Flyer (8.5x11in) — for lobby/elevator posting

   Optionally include additional formats if relevant to the event type.

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════
- Use Canadian English spelling throughout (colour, centre, neighbourhood, favourite, honour)
- No PII references — never include real resident names or unit numbers
- Use these placeholders where appropriate: {BUILDING_NAME}, {EVENT_NAME}, {DATE}, {TIME}, {RSVP_LINK}, {QR_CODE}, {BUILDING_LOGO}
- Tone must match: ${(building.brandTones ?? []).length > 0 ? (building.brandTones ?? []).join(', ') : 'Professional and welcoming'}
- Language must be accessible and inclusive
- All visuals and layouts should follow Canadian accessibility and branding practices
- Return valid JSON only. No markdown fences, no explanation, no extra text.`

  const user = `Generate a complete marketing package for this event:

- Event Name: ${event.name}
- Date: ${event.date}
- Time: ${event.startTime}${event.endTime ? ` to ${event.endTime}` : ''}
- Location: ${event.location || 'TBD'}
- Description: ${event.description || 'No description provided'}
- Category: ${event.category || 'Community'}`

  return { system, user }
}
