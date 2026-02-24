import type { Event } from '@/lib/types/event'
import type { Building } from '@/lib/types/building'

/**
 * Builds system + user prompts for marketing materials generation.
 *
 * Aligned to REP v3.3 marketing output specification — expanded with the
 * full Resident Event Marketing Corpus (pre-event → event-day → post-event
 * campaign sequence):
 *
 * - Resident Comms Kit (email subjects, body, SMS — 5 subject options)
 * - Full campaign sequence: Invitation → Reminder → Thank You
 * - Marketing Copy (poster, social, visual prompt)
 * - Design Specs (Canva dimensions, layout, export formats)
 * - Canadian English compliance
 * - Building brand alignment
 */
export function buildMarketingPrompt(
  event: Event,
  building: Building,
): { system: string; user: string } {
  const system = `You are a Canadian residential property marketing specialist generating a complete event marketing campaign for a multifamily residential building.

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
MARKETING CORPUS — CAMPAIGN SEQUENCE
═══════════════════════════════════════════════════════════════
This campaign follows a proven residential event sequence:
  PRE-EVENT  → Invitation, interest-building, RSVP drive
  EVENT-DAY  → Last-minute reminder, what to expect
  POST-EVENT → Thank you, photo recap, feedback request, next-event teaser

Apply this sequence across all outputs below.

═══════════════════════════════════════════════════════════════
INSTRUCTIONS — GENERATE A COMPLETE MARKETING PACKAGE
═══════════════════════════════════════════════════════════════

Return a JSON object with these exact keys:

──── SECTION 1: RESIDENT COMMS KIT ────

1. "emailSubjectLines": array of 5 email subject lines (varied approaches):
   - Direct/informational: "You're invited: {EVENT_NAME} on {DATE}"
   - Curiosity-driven: builds interest without giving everything away
   - Benefit-focused: what the resident gets by attending
   - Urgency/scarcity: spots filling, don't miss out
   - Personalized/warm: neighbour-to-neighbour tone

2. "emailBody": string, maximum 150 words, warm and inviting tone.
   Structure: greeting → event overview → what to expect (2-3 bullet points) → CTA with {RSVP_LINK}

3. "sms": string, maximum 160 characters, include event name, date, time, and {RSVP_LINK}

──── SECTION 2: CAMPAIGN EMAIL SEQUENCE ────

4. "campaignSequence": object with three campaign emails:

   a) "invitation": the primary invite sent 7-10 days before. Fields:
      - "subject": string (invitation subject line)
      - "body": string (150 words max, warm, clear value prop, CTA with {RSVP_LINK})

   b) "reminder": sent 1-2 days before. Fields:
      - "subject": string (reminder subject — create urgency without panic)
      - "body": string (100 words max, confirm details, "Add to Calendar" CTA, what to bring/expect)

   c) "thankYou": sent 24-48 hours after event. Fields:
      - "subject": string (appreciation subject, e.g. "Thanks for making {EVENT_NAME} awesome!")
      - "body": string (100 words max, gratitude + highlights + feedback CTA + teaser for next event)

──── SECTION 3: MARKETING COPY ────

5. "posterCopy": object with:
   - "hook": catchy headline for the poster (10 words max)
   - "cta": clear call-to-action from this list of proven CTAs:
     Reserve Your Spot | RSVP Now | Confirm Your Attendance | Join Us |
     Sign Up Today | Don't Miss Out | Save Your Seat | Mark Your Calendar
   - "supportingText": 1-2 sentences of supporting details (date, time, location)

6. "socialCaptions": array of 3 social media captions for Instagram/Facebook:
   - Casual/friendly: neighbour-to-neighbour tone
   - Informative: all the details clearly stated
   - Enthusiastic/hype: gets people excited, uses energy and emojis

7. "visualPrompt": string describing the ideal poster or social media image
   (suitable for DALL-E or Canva AI image generation — describe mood, colours, people, setting)

8. "colorPalette": array of 3-4 hex colour codes complementing ${building.brandColor ?? '#8F1D23'}

9. "iconSuggestions": array of 3-4 relevant icon names (e.g., "coffee-cup", "music-note", "sun")

──── SECTION 4: DESIGN SPECIFICATIONS ────

10. "designSpecs": array of recommended marketing assets, each with:
    - "format": string (e.g., "Instagram Post", "Email Header", "Flyer 8.5x11")
    - "dimensions": string (e.g., "1080x1080px", "600x200px", "8.5x11in")
    - "headline": string — headline text for this specific format
    - "supportingText": string — CTA or body text tailored for this format
    - "layoutNotes": string — recommended visual layout
    - "exportFormat": string — "PNG for social", "PDF Print for flyers", "JPG for emails"

    Generate specs for these 4 formats:
    a) Instagram/Facebook Post (1080x1080px)
    b) Email Header (600x200px)
    c) Printable Flyer (8.5x11in) — for lobby/elevator/bulletin board
    d) SMS-Friendly Short Link Card (format note only, no image needed)

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════
- Use Canadian English spelling throughout (colour, centre, neighbourhood, favourite, honour)
- No PII references — never include real resident names or unit numbers
- Use these placeholders where appropriate:
  {BUILDING_NAME}, {EVENT_NAME}, {DATE}, {TIME}, {RSVP_LINK}, {QR_CODE}, {BUILDING_LOGO}, {RESIDENT_NAME}
- Tone must match: ${(building.brandTones ?? []).length > 0 ? (building.brandTones ?? []).join(', ') : 'Professional and welcoming'}
- Language must be accessible, inclusive, and free of jargon
- All visuals and layouts should follow Canadian accessibility and branding practices
- Campaign sequence must feel connected — same voice and event energy across all three emails
- Return valid JSON only. No markdown fences, no explanation, no extra text.`

  const user = `Generate a complete marketing campaign package for this resident event:

- Event Name: ${event.name}
- Date: ${event.date}
- Time: ${event.startTime}${event.endTime ? ` to ${event.endTime}` : ''}
- Location: ${event.location || 'TBD'}
- Description: ${event.description || 'No description provided'}
- Category: ${event.category || 'Community'}
- Expected Attendance: ${event.rsvpLimit ? `Up to ${event.rsvpLimit} residents` : 'Open to all residents'}

Generate all sections: Comms Kit (5 email subjects, email body, SMS), Campaign Sequence (invitation, reminder, thank you), Marketing Copy (poster, social, visual), and Design Specs.`

  return { system, user }
}
