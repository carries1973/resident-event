import type { Building } from '../types/building'
import type { Event } from '../types/event'
import type { Observance } from '../types/observance'

export interface SearchResult {
  type: 'building' | 'event' | 'observance'
  id: string
  title: string
  subtitle: string
  url: string
}

/** Simple fuzzy search — checks if query words appear in the target string */
function matches(target: string, query: string): boolean {
  const lowerTarget = target.toLowerCase()
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return words.every((word) => lowerTarget.includes(word))
}

/** Search across buildings, events, and observances */
export function searchAll(
  query: string,
  buildings: Building[],
  events: Event[],
  observances: Observance[],
): SearchResult[] {
  if (!query.trim()) return []

  const results: SearchResult[] = []
  const maxPerCategory = 5

  // Search buildings
  let buildingCount = 0
  for (const b of buildings) {
    if (buildingCount >= maxPerCategory) break
    const searchText = `${b.name} ${b.city} ${b.address} ${b.province}`
    if (matches(searchText, query)) {
      results.push({
        type: 'building',
        id: b.id,
        title: b.name,
        subtitle: `${b.city}, ${b.province}`,
        url: `/buildings/${b.id}/edit`,
      })
      buildingCount++
    }
  }

  // Search events
  let eventCount = 0
  for (const e of events) {
    if (eventCount >= maxPerCategory) break
    const searchText = `${e.name} ${e.description} ${e.category} ${e.location} ${e.tags.join(' ')}`
    if (matches(searchText, query)) {
      results.push({
        type: 'event',
        id: e.id,
        title: e.name,
        subtitle: e.date ? `${e.category} · ${e.date}` : e.category || 'Draft event',
        url: `/events/${e.id}`,
      })
      eventCount++
    }
  }

  // Search observances
  let observanceCount = 0
  for (const o of observances) {
    if (observanceCount >= maxPerCategory) break
    const searchText = `${o.name} ${o.description ?? ''} ${o.type} ${o.eventIdeas?.join(' ') ?? ''}`
    if (matches(searchText, query)) {
      results.push({
        type: 'observance',
        id: o.id,
        title: `${o.emoji} ${o.name}`,
        subtitle: o.type.charAt(0).toUpperCase() + o.type.slice(1),
        url: '/observances',
      })
      observanceCount++
    }
  }

  return results
}
