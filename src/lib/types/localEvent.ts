import type { UUID, ISODate, ISODateTime, TimeString } from './common'

export interface LocalEvent {
  id: UUID
  name: string
  date: ISODate           // YYYY-MM-DD
  startTime?: TimeString  // HH:mm (optional — some events are all-day)
  endTime?: TimeString
  location: string        // e.g., "Prince's Island Park"
  url?: string            // Link to event listing (optional)
  description?: string
  category: LocalEventCategory
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type LocalEventCategory =
  | 'market'
  | 'festival'
  | 'arts'
  | 'sports'
  | 'community'
  | 'other'

export const LOCAL_EVENT_CATEGORY_LABELS: Record<LocalEventCategory, string> = {
  market: 'Farmers Market / Market',
  festival: 'Festival / Fair',
  arts: 'Arts & Culture',
  sports: 'Sports / Recreation',
  community: 'Community / Civic',
  other: 'Other',
}

/** Colour class for local events — distinct amber/teal from in-building event status colours */
export const LOCAL_EVENT_COLOUR = {
  dot: 'bg-amber-500',
  pill: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800',
  text: 'text-amber-800 dark:text-amber-300',
  badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
}

export function createDefaultLocalEvent(overrides: Partial<LocalEvent> & Pick<LocalEvent, 'name' | 'date'>): LocalEvent {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    location: '',
    category: 'community',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
