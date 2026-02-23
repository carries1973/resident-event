import { describe, it, expect } from 'vitest'
import {
  canTransitionStatus,
  isValidBuilding,
  isValidEvent,
  isValidEventForStatus,
  countFilledFields,
} from '../validation'
import type { EventStatus } from '../../types/common'

// ---------------------------------------------------------------------------
// canTransitionStatus — event status lifecycle
// ---------------------------------------------------------------------------

describe('canTransitionStatus', () => {
  // -----------------------------------------------------------------------
  // Valid transitions
  // -----------------------------------------------------------------------

  it('allows draft -> scheduled', () => {
    expect(canTransitionStatus('draft', 'scheduled')).toBe(true)
  })

  it('allows draft -> cancelled', () => {
    expect(canTransitionStatus('draft', 'cancelled')).toBe(true)
  })

  it('allows scheduled -> active', () => {
    expect(canTransitionStatus('scheduled', 'active')).toBe(true)
  })

  it('allows scheduled -> cancelled', () => {
    expect(canTransitionStatus('scheduled', 'cancelled')).toBe(true)
  })

  it('allows active -> needs_closeout', () => {
    expect(canTransitionStatus('active', 'needs_closeout')).toBe(true)
  })

  it('allows needs_closeout -> completed', () => {
    expect(canTransitionStatus('needs_closeout', 'completed')).toBe(true)
  })

  it('allows completed -> archived', () => {
    expect(canTransitionStatus('completed', 'archived')).toBe(true)
  })

  it('allows cancelled -> draft (reactivate)', () => {
    expect(canTransitionStatus('cancelled', 'draft')).toBe(true)
  })

  it('allows cancelled -> archived', () => {
    expect(canTransitionStatus('cancelled', 'archived')).toBe(true)
  })

  // -----------------------------------------------------------------------
  // Invalid transitions
  // -----------------------------------------------------------------------

  it('rejects draft -> completed', () => {
    expect(canTransitionStatus('draft', 'completed')).toBe(false)
  })

  it('rejects draft -> active', () => {
    expect(canTransitionStatus('draft', 'active')).toBe(false)
  })

  it('rejects draft -> needs_closeout', () => {
    expect(canTransitionStatus('draft', 'needs_closeout')).toBe(false)
  })

  it('rejects draft -> archived', () => {
    expect(canTransitionStatus('draft', 'archived')).toBe(false)
  })

  it('rejects active -> draft', () => {
    expect(canTransitionStatus('active', 'draft')).toBe(false)
  })

  it('rejects active -> scheduled', () => {
    expect(canTransitionStatus('active', 'scheduled')).toBe(false)
  })

  it('rejects active -> completed', () => {
    expect(canTransitionStatus('active', 'completed')).toBe(false)
  })

  it('rejects needs_closeout -> draft', () => {
    expect(canTransitionStatus('needs_closeout', 'draft')).toBe(false)
  })

  it('rejects completed -> draft', () => {
    expect(canTransitionStatus('completed', 'draft')).toBe(false)
  })

  it('rejects archived -> draft', () => {
    expect(canTransitionStatus('archived', 'draft')).toBe(false)
  })

  it('rejects archived -> scheduled', () => {
    expect(canTransitionStatus('archived', 'scheduled')).toBe(false)
  })

  it('rejects archived -> active', () => {
    expect(canTransitionStatus('archived', 'active')).toBe(false)
  })

  it('rejects archived -> needs_closeout', () => {
    expect(canTransitionStatus('archived', 'needs_closeout')).toBe(false)
  })

  it('rejects archived -> completed', () => {
    expect(canTransitionStatus('archived', 'completed')).toBe(false)
  })

  it('rejects archived -> cancelled', () => {
    expect(canTransitionStatus('archived', 'cancelled')).toBe(false)
  })

  // self-transitions are not valid
  it('rejects self-transition (draft -> draft)', () => {
    expect(canTransitionStatus('draft', 'draft')).toBe(false)
  })

  // exhaustive check: archived has no valid transitions
  it('archived has no valid transitions at all', () => {
    const allStatuses: EventStatus[] = [
      'draft', 'scheduled', 'active', 'needs_closeout',
      'completed', 'cancelled', 'archived',
    ]
    for (const target of allStatuses) {
      expect(canTransitionStatus('archived', target)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// isValidBuilding — minimum required fields
// ---------------------------------------------------------------------------

describe('isValidBuilding', () => {
  it('passes with all required fields', () => {
    const result = isValidBuilding({ name: 'The Windsor', city: 'Calgary', province: 'AB' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when name is missing', () => {
    const result = isValidBuilding({ city: 'Calgary', province: 'AB' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Building name is required.')
  })

  it('fails when city is missing', () => {
    const result = isValidBuilding({ name: 'The Windsor', province: 'AB' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('City is required.')
  })

  it('fails when province is missing', () => {
    const result = isValidBuilding({ name: 'The Windsor', city: 'Calgary' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Province is required.')
  })

  it('fails when all required fields are missing', () => {
    const result = isValidBuilding({})
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })

  it('rejects whitespace-only strings', () => {
    const result = isValidBuilding({ name: '  ', city: '', province: '  ' })
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// isValidEvent — minimum required fields for creation
// ---------------------------------------------------------------------------

describe('isValidEvent', () => {
  it('passes with name and buildingId', () => {
    const result = isValidEvent({ name: 'Pizza Night', buildingId: 'b1' })
    expect(result.valid).toBe(true)
  })

  it('fails without name', () => {
    const result = isValidEvent({ buildingId: 'b1' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Event name is required.')
  })

  it('fails without buildingId', () => {
    const result = isValidEvent({ name: 'Pizza Night' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Building is required.')
  })
})

// ---------------------------------------------------------------------------
// isValidEventForStatus — extra fields for scheduling
// ---------------------------------------------------------------------------

describe('isValidEventForStatus', () => {
  it('requires date, time, and location for scheduled status', () => {
    const result = isValidEventForStatus({ name: 'Test', buildingId: 'b1' }, 'scheduled')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Date is required to schedule an event.')
    expect(result.errors).toContain('Start time is required to schedule an event.')
    expect(result.errors).toContain('End time is required to schedule an event.')
    expect(result.errors).toContain('Location is required to schedule an event.')
  })

  it('passes with all fields for scheduled status', () => {
    const result = isValidEventForStatus(
      {
        name: 'Test',
        buildingId: 'b1',
        date: '2026-03-01',
        startTime: '14:00',
        endTime: '16:00',
        location: 'Lobby',
      },
      'scheduled',
    )
    expect(result.valid).toBe(true)
  })

  it('does not require extra fields for draft status', () => {
    const result = isValidEventForStatus({ name: 'Test', buildingId: 'b1' }, 'draft')
    expect(result.valid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// countFilledFields
// ---------------------------------------------------------------------------

describe('countFilledFields', () => {
  it('counts filled and total correctly', () => {
    const result = countFilledFields(
      { a: 'hello', b: '', c: null, d: 42, e: undefined },
      ['a', 'b', 'c', 'd', 'e'],
    )
    expect(result.filled).toBe(2) // a and d
    expect(result.total).toBe(5)
  })

  it('treats empty arrays as unfilled', () => {
    const result = countFilledFields({ tags: [] }, ['tags'])
    expect(result.filled).toBe(0)
  })

  it('treats non-empty arrays as filled', () => {
    const result = countFilledFields({ tags: ['wellness'] }, ['tags'])
    expect(result.filled).toBe(1)
  })
})
