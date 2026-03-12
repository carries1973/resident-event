import type { Building } from '@/lib/types/building'
import { RESIDENT_OPTIONS } from '@/lib/data/residentTypes'

interface LocalEventsPromptParams {
  building: Building
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
}

/**
 * Builds the system + user prompts for generating local community events.
 *
 * The AI reasons about what community events plausibly happen in the given
 * city and province during the requested time window, then filters and ranks
 * them based on the building's specific resident demographics and nearby venues.
 *
 * Each event includes a "whyRelevant" field explaining why it matters to
 * this building's specific residents.
 */
export function buildLocalEventsPrompt(params: LocalEventsPromptParams): {
  systemPrompt: string
  userMessage: string
} {
  const { building, startDate, endDate } = params

  // Resolve full persona details for primary and secondary resident groups
  const primaryPersona = RESIDENT_OPTIONS.find((r) => r.id === building.primaryResidentGroup)
  const secondaryPersona = building.secondaryResidentGroup
    ? RESIDENT_OPTIONS.find((r) => r.id === building.secondaryResidentGroup)
    : null

  // Build resident context string
  const residentContext = [
    primaryPersona
      ? `Primary residents: ${primaryPersona.label} (age ${primaryPersona.ageRange}, income ${primaryPersona.incomeRange}). Interests: ${primaryPersona.interests.join(', ')}.`
      : '',
    secondaryPersona
      ? `Secondary residents: ${secondaryPersona.label} (age ${secondaryPersona.ageRange}, income ${secondaryPersona.incomeRange}). Interests: ${secondaryPersona.interests.join(', ')}.`
      : '',
  ].filter(Boolean).join('\n')

  // Build location context string
  const locationParts: string[] = []
  if (building.address) locationParts.push(`Address: ${building.address}`)
  if (building.postalCode) locationParts.push(`Postal code: ${building.postalCode}`)
  locationParts.push(`City: ${building.city}, ${building.province}`)
  if (building.nearbyVenues && building.nearbyVenues.length > 0) {
    locationParts.push(`Nearby venues/landmarks: ${building.nearbyVenues.join(', ')}`)
  }

  const systemPrompt = `You are a Canadian community events researcher and resident engagement specialist. You know what local events, markets, festivals, and public programming typically happen in cities across Canada throughout the year.

Your job is to suggest LOCAL COMMUNITY EVENTS — things happening in the neighbourhood or city, NOT inside the apartment building — that are specifically relevant to the residents of this building. The property manager will use these to:
1. Promote relevant events to residents (e.g. "Did you know the Farmers' Market is back this weekend?")
2. Plan in-building events around community events (e.g. avoid scheduling conflicts)
3. Inspire in-building programming that complements what's happening locally

BUILDING CONTEXT:
${locationParts.join('\n')}

RESIDENT DEMOGRAPHICS:
${residentContext || `General mixed-age urban renters`}

DATE WINDOW: ${startDate} to ${endDate}

WHAT TO SUGGEST:
Think about what recurring or typical events happen in ${building.city} during this period that would appeal to these specific residents:
- Farmers markets and outdoor markets (which months they typically run)
- Annual festivals, street fairs, and parades
- Cultural or heritage events aligned with resident interests
- Seasonal rec centre and library programs
- Sporting events (marathons, cycling events, outdoor tournaments)
- Arts and culture events (galleries, outdoor concerts, film festivals)
- Civic/community events (neighbourhood clean-ups, park events)
- Events near the building's specific neighbourhood or nearby venues

DEMOGRAPHIC FILTERING RULES:
- Prioritise events that match the interests and lifestyle of the PRIMARY resident group
- Include some events for the SECONDARY resident group if specified
- Exclude events that are clearly misaligned with the demographic (e.g. don't suggest toddler programs for a building of Urban Professionals unless they have a Young Family secondary group)
- Consider income level when suggesting events — suggest free/low-cost events for budget-conscious demographics, premium events for higher-income demographics
- Consider age range — active outdoor events for younger demographics, cultural and wellness events for mature demographics

QUALITY RULES:
1. Only suggest events that are PLAUSIBLE and TYPICAL for ${building.city} during this season
2. Dates must fall within ${startDate} to ${endDate}
3. Use Canadian English spelling throughout
4. Be specific to ${building.city} — mention real parks, districts, or venues by name if commonly known
5. If nearby venues are listed, prioritise events happening at or near those venues
6. Generate 8–15 events spread across the date window
7. Vary the categories: markets, festivals, arts, sports, community events
8. For each event, write a "whyRelevant" field (1 sentence) explaining specifically why THIS building's residents would enjoy or benefit from knowing about it
9. Omit the url field entirely

Return ONLY valid JSON matching this exact structure:
{
  "events": [
    {
      "name": "Event name",
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "location": "Venue or neighbourhood name",
      "category": "market|festival|arts|sports|community|other",
      "description": "1–2 sentence description of what this event is",
      "whyRelevant": "1 sentence explaining why this building's specific residents would value this event"
    }
  ]
}

startTime and endTime are optional — omit them for all-day events or events with unknown times.`

  const userMessage = `Generate local community events happening in or around ${building.city}, ${building.province} between ${startDate} and ${endDate} that are relevant to ${primaryPersona?.label ?? 'the residents'} living at ${building.name}${building.address ? ` (${building.address})` : ''}. Return JSON only.`

  return { systemPrompt, userMessage }
}
