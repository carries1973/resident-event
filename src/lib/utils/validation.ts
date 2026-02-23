import type { Building } from '../types/building'
import type { Event } from '../types/event'
import type { EventStatus } from '../types/common'
import { EVENT_STATUS_TRANSITIONS } from '../types/common'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/** Validate a building has the minimum required fields */
export function isValidBuilding(b: Partial<Building>): ValidationResult {
  const errors: string[] = []

  if (!b.name?.trim()) errors.push('Building name is required.')
  if (!b.city?.trim()) errors.push('City is required.')
  if (!b.province?.trim()) errors.push('Province is required.')

  return { valid: errors.length === 0, errors }
}

/** Check if a status transition is valid */
export function canTransitionStatus(from: EventStatus, to: EventStatus): boolean {
  return EVENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/** Validate an event has the minimum required fields for a given transition */
export function isValidEventForStatus(e: Partial<Event>, targetStatus: EventStatus): ValidationResult {
  const errors: string[] = []

  if (!e.name?.trim()) errors.push('Event name is required.')
  if (!e.buildingId) errors.push('Building is required.')

  if (targetStatus === 'scheduled') {
    if (!e.date) errors.push('Date is required to schedule an event.')
    if (!e.startTime) errors.push('Start time is required to schedule an event.')
    if (!e.endTime) errors.push('End time is required to schedule an event.')
    if (!e.location?.trim()) errors.push('Location is required to schedule an event.')
  }

  return { valid: errors.length === 0, errors }
}

/** Validate an event has required fields for creation */
export function isValidEvent(e: Partial<Event>): ValidationResult {
  const errors: string[] = []

  if (!e.name?.trim()) errors.push('Event name is required.')
  if (!e.buildingId) errors.push('Building is required.')

  return { valid: errors.length === 0, errors }
}

/** Check how many fields in a section are filled */
export function countFilledFields(obj: Record<string, unknown>, fields: string[]): { filled: number; total: number } {
  let filled = 0
  for (const field of fields) {
    const val = obj[field]
    if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      filled++
    }
  }
  return { filled, total: fields.length }
}
