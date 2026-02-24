export type UUID = string
export type ISODate = string      // YYYY-MM-DD
export type ISODateTime = string  // ISO 8601
export type HexColour = string    // #RRGGBB
export type TimeString = string   // HH:mm

export interface ChecklistItem {
  id: UUID
  text: string
  completed: boolean
  assignedTo?: string
  dueTime?: TimeString
  category: 'setup' | 'during' | 'teardown'
}

export interface StaffRole {
  id: UUID
  role: string
  assignedTo: string
  responsibilities: string
}

export type AttendanceStatus = 'attending' | 'maybe' | 'not_attending'

export interface RSVPEntry {
  id: UUID
  name: string
  email?: string
  unitNumber?: string
  guestCount: number
  attendanceStatus: AttendanceStatus
  dietaryNotes?: string
  accessibilityNeeds?: string
  registeredAt: ISODateTime
  status: 'confirmed' | 'waitlisted'
}

export type BudgetTier = 'low' | 'moderate' | 'premium'

export type PropertyType = 'rental_apartment' | 'condo' | 'mixed_use' | 'townhomes'

export type PrimaryUse = 'long_term_rental' | 'owner_occupied' | 'mixed'

export type ObservanceType = 'national' | 'cultural' | 'religious' | 'theme'

export type EventStatus = 'draft' | 'scheduled' | 'active' | 'needs_closeout' | 'completed' | 'cancelled' | 'archived'

export type EventSource = 'manual' | 'ai_planner' | 'brainstorm'

export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly'

/** Valid status transitions — used by validation utilities */
export const EVENT_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['draft', 'active', 'cancelled'],  // draft = unconfirm
  active: ['needs_closeout'],
  needs_closeout: ['completed'],
  completed: ['archived'],
  cancelled: ['draft', 'archived'],  // draft = reactivate
  archived: [],
}

/** Canadian provinces and territories */
export const CANADIAN_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
] as const
