import type { Building } from '@/lib/types/building'

interface LocalEventsPromptParams {
  building: Building
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
}

/**
 * Builds the system + user prompts for generating local community events.
 *
 * The AI reasons about what community events plausibly happen in the given
 * city and province during the requested time window — farmers markets,
 * festivals, parades, outdoor markets, cultural events, rec centre programs,
 * library events, sports tournaments, street fairs, etc.
 *
 * It does NOT invent events — it reasons about events that are typical or
 * historically recurring for that city and season.
 */
export function buildLocalEventsPrompt(params: LocalEventsPromptParams): {
  systemPrompt: string
  userMessage: string
} {
  const { building, startDate, endDate } = params

  const systemPrompt = `You are a Canadian community events researcher who knows what local events, markets, festivals, and public programming typically happen in cities across Canada throughout the year.

Your job is to suggest plausible LOCAL COMMUNITY EVENTS — things happening in the neighbourhood or city, NOT inside the apartment building — for a property manager to be aware of so they can plan around them or promote them to residents.

CITY CONTEXT:
- City: ${building.city}, ${building.province}
- Date window: ${startDate} to ${endDate}

WHAT TO SUGGEST:
Think about what recurring or typical events happen in ${building.city} during this period:
- Farmers markets and outdoor markets (which months they typically run)
- Annual festivals, street fairs, and parades
- Cultural or heritage events common to this city or province
- Seasonal rec centre and library programs that open for registration
- Sporting events (marathons, outdoor tournaments, cycling events)
- Arts and culture events (open galleries, outdoor concerts, film festivals)
- Civic/community events (neighbourhood clean-ups, outdoor skating rinks opening)
- Any Canadian national observances or provincial events that generate local programming

RULES:
1. Only suggest events that are PLAUSIBLE and TYPICAL for ${building.city} during this season — do NOT invent fictional events
2. Dates should fall within ${startDate} to ${endDate}
3. Use Canadian English spelling throughout
4. For recurring weekly/seasonal markets or events, include them on realistic dates
5. Be specific to ${building.city} where possible — mention real parks, districts, or venues by name if commonly known
6. Generate 8–15 events spread across the date window
7. Vary the categories: markets, festivals, arts, sports, community events
8. If uncertain about exact dates, use a plausible date within the month the event typically occurs
9. Omit the url field — leave it out entirely rather than guessing URLs

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
      "description": "1–2 sentence description of what this event is"
    }
  ]
}

startTime and endTime are optional — omit them for all-day events or events with unknown times.`

  const userMessage = `Generate local community events happening in or around ${building.city}, ${building.province} between ${startDate} and ${endDate}. Return JSON only.`

  return { systemPrompt, userMessage }
}
