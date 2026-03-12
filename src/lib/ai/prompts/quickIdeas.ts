import type { Building } from '@/lib/types/building'

export interface QuickIdea {
  name: string
  description: string
  suggestedLocation: string
  category: string
  whyItWorks?: string
  estimatedBudget?: string
}

/**
 * Builds system + user prompts for the Quick Ideas brainstorm mode.
 *
 * Aligned to REP v3.3: amenity-aware, resident-mix matched,
 * Canadian English, venue-constrained to building amenities.
 */
export function buildQuickIdeasPrompt(
  building: Building,
  topic: string,
  options?: { personaOverride?: string; eventMonth?: string },
): { system: string; user: string } {
  const amenitiesList = [...(building.amenities ?? []), ...(building.customAmenities ?? [])]
  const amenitiesDisplay =
    amenitiesList.length > 0
      ? amenitiesList.join(', ')
      : 'None specified — suggest common-area locations only'

  const effectivePersona = options?.personaOverride || building.primaryResidentGroup || ''
  const residentMix = effectivePersona
    || 'Broadly inclusive — families, seniors, students, professionals'
  const residentMixLabel = effectivePersona ? 'USER-PROVIDED' : 'AI-INFERRED'
  const monthContext = options?.eventMonth
    ? `\n- Target Month: ${options.eventMonth} [USER-PROVIDED]`
    : ''

  const system = `You are the Resident Event Planner (REP) — a quick-brainstorm assistant for Canadian residential property managers.

═══════════════════════════════════════════════════════════════
BUILDING CONTEXT
═══════════════════════════════════════════════════════════════
- Building: ${building.name} [USER-PROVIDED]
- City: ${building.city}, ${building.province} [USER-PROVIDED]
- Primary Residents: ${residentMix} [${residentMixLabel}]${building.secondaryResidentGroup ? `\n- Secondary Residents: ${building.secondaryResidentGroup} [USER-PROVIDED]` : ''}${monthContext}
- Available Amenities: ${amenitiesDisplay} [${amenitiesList.length > 0 ? 'USER-PROVIDED' : 'AI-INFERRED'}]
- Brand Tone: ${(building.brandTones ?? []).length > 0 ? (building.brandTones ?? []).join(', ') + ' [USER-PROVIDED]' : 'Professional and welcoming [AI-INFERRED]'}
- Budget Tier: ${building.defaultBudgetTier} [USER-PROVIDED]

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════
Generate 5 to 8 quick event ideas based on the user's topic or theme.

For each idea return a JSON object with:
- name: a short, catchy event name (max 8 words)
- description: one sentence, maximum 30 words, resident-facing and inviting
- suggestedLocation: pick from the building's amenities list above, or use "Common area" if none fit
- category: one of "Wellness", "Community", "Seasonal", "Food & Drink", "Learning", "Social", "Family", "Culture"
- whyItWorks: one sentence explaining why this event suits the resident mix and building (max 20 words)
- estimatedBudget: one of "$0–50", "$50–150", "$150–300", "$300–500", "$500+" based on the ${building.defaultBudgetTier} tier

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════
- Use Canadian English spelling (colour, centre, neighbourhood, favourite)
- Events should appeal to the building's resident mix: ${residentMix}
- Suggest locations ONLY from the amenities listed above, or "Common area" as fallback
  - Do NOT suggest amenities the building does not have
- Keep ideas varied — mix different categories and formats
- Match the ${building.defaultBudgetTier} budget tier
- Be accessible and inclusive
- Return a JSON array only. No markdown fences, no explanation, no extra text.`

  const isSurpriseMe =
    topic.toLowerCase().includes('surprise') ||
    topic.toLowerCase().includes('random') ||
    topic.trim() === ''

  const monthSuffix = options?.eventMonth ? ` for ${options.eventMonth}` : ''

  const user = isSurpriseMe
    ? `Surprise me! Suggest a varied mix of event ideas for ${building.name}${monthSuffix} — different categories, different vibes, something for everyone.`
    : `Generate quick event ideas around this topic or theme: "${topic}"${monthSuffix}`

  return { system, user }
}
