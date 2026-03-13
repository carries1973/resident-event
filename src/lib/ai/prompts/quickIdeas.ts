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
 * Budget tier definitions — explicit dollar ranges and constraints
 * passed verbatim into the AI prompt so the model cannot drift.
 */
const BUDGET_TIER_RANGES: Record<string, { label: string; range: string; examples: string }> = {
  low: {
    label: 'Low',
    range: '$0–$150 CAD total per event',
    examples: 'board game night, potluck, movie screening with existing projector, walking tour, book swap',
  },
  moderate: {
    label: 'Moderate',
    range: '$150–$750 CAD total per event',
    examples: 'BBQ social, fitness class, craft workshop, trivia night with prizes, coffee social with light catering',
  },
  premium: {
    label: 'Premium',
    range: '$750–$2,500 CAD total per event',
    examples: 'holiday gala, rooftop cocktail party, professional cooking class, live music event, catered dinner',
  },
}

/**
 * Builds system + user prompts for the Quick Ideas brainstorm mode.
 *
 * Aligned to REP v3.3: amenity-aware, resident-mix matched,
 * Canadian English, venue-constrained to building amenities,
 * with explicit budget guardrails per tier.
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

  const tier = building.defaultBudgetTier ?? 'moderate'
  const budgetDef = BUDGET_TIER_RANGES[tier] ?? BUDGET_TIER_RANGES['moderate']

  const system = `You are the Resident Event Planner (REP) — a quick-brainstorm assistant for Canadian residential property managers.

═══════════════════════════════════════════════════════════════
BUILDING CONTEXT
═══════════════════════════════════════════════════════════════
- Building: ${building.name} [USER-PROVIDED]
- City: ${building.city}, ${building.province} [USER-PROVIDED]
- Primary Residents: ${residentMix} [${residentMixLabel}]${building.secondaryResidentGroup ? `\n- Secondary Residents: ${building.secondaryResidentGroup} [USER-PROVIDED]` : ''}${monthContext}
- Available Amenities: ${amenitiesDisplay} [${amenitiesList.length > 0 ? 'USER-PROVIDED' : 'AI-INFERRED'}]
- Brand Tone: ${(building.brandTones ?? []).length > 0 ? (building.brandTones ?? []).join(', ') + ' [USER-PROVIDED]' : 'Professional and welcoming [AI-INFERRED]'}
- Budget Tier: ${budgetDef.label} — ${budgetDef.range} [USER-PROVIDED]

═══════════════════════════════════════════════════════════════
BUDGET GUARDRAILS — CRITICAL
═══════════════════════════════════════════════════════════════
The budget tier is ${budgetDef.label.toUpperCase()} (${budgetDef.range}).
Every idea you suggest MUST be achievable within this budget.
Typical events at this tier: ${budgetDef.examples}

For the estimatedBudget field, use ONLY one of these ranges that fits within the tier:
${tier === 'low'
  ? '- "$0–$50" (free or near-free)\n- "$50–$150" (light supplies/snacks)'
  : tier === 'moderate'
    ? '- "$50–$150" (light supplies/snacks)\n- "$150–$300" (catering + supplies)\n- "$300–$500" (vendor + catering)\n- "$500–$750" (full vendor package)'
    : '- "$300–$500" (supplies + light catering)\n- "$500–$1,000" (catering + entertainment)\n- "$1,000–$2,500" (full premium event)'}

Do NOT suggest ideas that require spending beyond ${budgetDef.range}.

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
- estimatedBudget: one of the budget ranges listed above (must be within the ${budgetDef.label} tier)

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════
- Use Canadian English spelling (colour, centre, neighbourhood, favourite)
- Events should appeal to the building's resident mix: ${residentMix}
- Suggest locations ONLY from the amenities listed above, or "Common area" as fallback
  - Do NOT suggest amenities the building does not have
- Keep ideas varied — mix different categories and formats
- Every idea MUST fit within the ${budgetDef.label} budget tier (${budgetDef.range})
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
