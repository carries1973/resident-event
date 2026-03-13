import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore, computeEventStatus } from '../eventStore'
import type { Event } from '../../types/event'
import type { RSVPEntry } from '../../types/common'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the Zustand store between tests */
function resetStore(): void {
  useEventStore.getState().resetAll()
}

/** Create a minimal event and add it to the store */
function createTestEvent(overrides?: Partial<Event>): Event {
  return useEventStore.getState().createEvent({
    name: 'Test Event',
    buildingId: 'building-1',
    ...overrides,
  })
}

/** Build an RSVP entry for testing */
function makeRSVP(overrides?: Partial<RSVPEntry>): RSVPEntry {
  return {
    id: crypto.randomUUID(),
    name: 'Jane Doe',
    guestCount: 1,
    registeredAt: new Date().toISOString(),
    status: 'confirmed',
    attendanceStatus: 'attending',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetStore()
})

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------

describe('createEvent', () => {
  it('creates an event with default fields', () => {
    const event = createTestEvent()
    expect(event.name).toBe('Test Event')
    expect(event.buildingId).toBe('building-1')
    expect(event.status).toBe('draft')
    expect(event.rsvpCount).toBe(0)
    expect(event.rsvpList).toEqual([])
    expect(event.rsvpWaitlist).toEqual([])
    expect(event.dayOfChecklist).toEqual([])
    expect(event.source).toBe('manual')
    expect(event.aiGenerated).toBe(false)
    expect(event.id).toBeTruthy()
    expect(event.createdAt).toBeTruthy()
    expect(event.updatedAt).toBeTruthy()
  })

  it('adds the event to the store', () => {
    const event = createTestEvent()
    const stored = useEventStore.getState().getEventById(event.id)
    expect(stored).toBeDefined()
    expect(stored!.name).toBe('Test Event')
  })

  it('applies overrides', () => {
    const event = createTestEvent({ name: 'Custom Name', category: 'Wellness' })
    expect(event.name).toBe('Custom Name')
    expect(event.category).toBe('Wellness')
  })
})

// ---------------------------------------------------------------------------
// updateEvent
// ---------------------------------------------------------------------------

describe('updateEvent', () => {
  it('modifies specific fields', () => {
    const event = createTestEvent()
    useEventStore.getState().updateEvent(event.id, { name: 'Updated Event' })
    const updated = useEventStore.getState().getEventById(event.id)
    expect(updated!.name).toBe('Updated Event')
  })

  it('sets the updatedAt timestamp on update', () => {
    // Create an event and force an old updatedAt directly in the store
    const event = createTestEvent()
    const pastDate = '2020-01-01T00:00:00.000Z'
    useEventStore.setState((state) => ({
      events: state.events.map((e) =>
        e.id === event.id ? { ...e, updatedAt: pastDate } : e,
      ),
    }))
    const before = useEventStore.getState().getEventById(event.id)!
    expect(before.updatedAt).toBe(pastDate)

    // Now perform the real update — updatedAt should be refreshed
    useEventStore.getState().updateEvent(event.id, { name: 'Changed' })
    const after = useEventStore.getState().getEventById(event.id)!
    expect(after.updatedAt).not.toBe(pastDate)
  })

  it('does not affect other events', () => {
    const event1 = createTestEvent({ name: 'Event 1' })
    const event2 = createTestEvent({ name: 'Event 2' })
    useEventStore.getState().updateEvent(event1.id, { name: 'Updated 1' })
    const stored2 = useEventStore.getState().getEventById(event2.id)
    expect(stored2!.name).toBe('Event 2')
  })
})

// ---------------------------------------------------------------------------
// deleteEvent
// ---------------------------------------------------------------------------

describe('deleteEvent', () => {
  it('removes an event from the list', () => {
    const event = createTestEvent()
    expect(useEventStore.getState().events).toHaveLength(1)
    useEventStore.getState().deleteEvent(event.id)
    expect(useEventStore.getState().events).toHaveLength(0)
    expect(useEventStore.getState().getEventById(event.id)).toBeUndefined()
  })

  it('does not affect other events', () => {
    const event1 = createTestEvent({ name: 'Event 1' })
    const event2 = createTestEvent({ name: 'Event 2' })
    useEventStore.getState().deleteEvent(event1.id)
    expect(useEventStore.getState().events).toHaveLength(1)
    expect(useEventStore.getState().getEventById(event2.id)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// duplicateEvent
// ---------------------------------------------------------------------------

describe('duplicateEvent', () => {
  it('creates a copy with "(Copy)" appended to the name', () => {
    const event = createTestEvent({ name: 'Movie Night' })
    const duplicate = useEventStore.getState().duplicateEvent(event.id)
    expect(duplicate).not.toBeNull()
    expect(duplicate!.name).toBe('Movie Night (Copy)')
  })

  it('sets duplicate status to draft', () => {
    const event = createTestEvent()
    // Manually set the source event as scheduled
    useEventStore.getState().updateEvent(event.id, {
      status: 'scheduled',
      date: '2026-06-01',
      startTime: '10:00',
      endTime: '12:00',
      location: 'Lobby',
    })
    const duplicate = useEventStore.getState().duplicateEvent(event.id)
    expect(duplicate!.status).toBe('draft')
  })

  it('resets RSVP data on the duplicate', () => {
    const event = createTestEvent()
    useEventStore.getState().addRSVP(event.id, makeRSVP())
    const duplicate = useEventStore.getState().duplicateEvent(event.id)
    expect(duplicate!.rsvpCount).toBe(0)
    expect(duplicate!.rsvpList).toEqual([])
    expect(duplicate!.rsvpWaitlist).toEqual([])
  })

  it('clears closeout and marketing on the duplicate', () => {
    const event = createTestEvent()
    const duplicate = useEventStore.getState().duplicateEvent(event.id)
    expect(duplicate!.closeout).toBeUndefined()
    expect(duplicate!.marketing).toBeUndefined()
  })

  it('generates a new unique ID', () => {
    const event = createTestEvent()
    const duplicate = useEventStore.getState().duplicateEvent(event.id)
    expect(duplicate!.id).not.toBe(event.id)
  })

  it('adds the duplicate to the store', () => {
    const event = createTestEvent()
    const duplicate = useEventStore.getState().duplicateEvent(event.id)
    expect(useEventStore.getState().events).toHaveLength(2)
    expect(useEventStore.getState().getEventById(duplicate!.id)).toBeDefined()
  })

  it('returns null for a non-existent event ID', () => {
    const result = useEventStore.getState().duplicateEvent('nonexistent-id')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// transitionStatus
// ---------------------------------------------------------------------------

describe('transitionStatus', () => {
  it('allows valid transition: draft -> scheduled', () => {
    const event = createTestEvent({
      date: '2099-06-01',
      startTime: '10:00',
      endTime: '12:00',
      location: 'Lobby',
    })
    const result = useEventStore.getState().transitionStatus(event.id, 'scheduled')
    expect(result).toBe(true)
    expect(useEventStore.getState().getEventById(event.id)!.status).toBe('scheduled')
  })

  it('allows valid transition: draft -> cancelled', () => {
    const event = createTestEvent()
    const result = useEventStore.getState().transitionStatus(event.id, 'cancelled')
    expect(result).toBe(true)
    expect(useEventStore.getState().getEventById(event.id)!.status).toBe('cancelled')
  })

  it('allows valid transition: cancelled -> draft (reactivate)', () => {
    const event = createTestEvent()
    useEventStore.getState().transitionStatus(event.id, 'cancelled')
    const result = useEventStore.getState().transitionStatus(event.id, 'draft')
    expect(result).toBe(true)
    expect(useEventStore.getState().getEventById(event.id)!.status).toBe('draft')
  })

  it('rejects invalid transition: draft -> completed', () => {
    const event = createTestEvent()
    const result = useEventStore.getState().transitionStatus(event.id, 'completed')
    expect(result).toBe(false)
    expect(useEventStore.getState().getEventById(event.id)!.status).toBe('draft')
  })

  it('rejects invalid transition: active -> draft', () => {
    const event = createTestEvent({ status: 'active', date: '2026-02-20', endTime: '23:59' })
    const result = useEventStore.getState().transitionStatus(event.id, 'draft')
    expect(result).toBe(false)
  })

  it('returns false for a non-existent event ID', () => {
    const result = useEventStore.getState().transitionStatus('nonexistent', 'scheduled')
    expect(result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// addRSVP — confirmed list vs waitlist
// ---------------------------------------------------------------------------

describe('addRSVP', () => {
  it('adds to rsvpList when under limit', () => {
    const event = createTestEvent({ rsvpEnabled: true, rsvpLimit: 10 })
    const entry = makeRSVP({ guestCount: 2 })
    useEventStore.getState().addRSVP(event.id, entry)
    const updated = useEventStore.getState().getEventById(event.id)!
    expect(updated.rsvpList).toHaveLength(1)
    expect(updated.rsvpList[0].status).toBe('confirmed')
    expect(updated.rsvpCount).toBe(2)
  })

  it('adds to rsvpWaitlist when at capacity', () => {
    const event = createTestEvent({ rsvpEnabled: true, rsvpLimit: 2, rsvpCount: 2 })
    const entry = makeRSVP({ guestCount: 1 })
    useEventStore.getState().addRSVP(event.id, entry)
    const updated = useEventStore.getState().getEventById(event.id)!
    expect(updated.rsvpWaitlist).toHaveLength(1)
    expect(updated.rsvpWaitlist[0].status).toBe('waitlisted')
    // rsvpCount should NOT increment for waitlisted entries
    expect(updated.rsvpCount).toBe(2)
  })

  it('adds to rsvpList when no limit is set', () => {
    const event = createTestEvent({ rsvpEnabled: true })
    const entry = makeRSVP({ guestCount: 3 })
    useEventStore.getState().addRSVP(event.id, entry)
    const updated = useEventStore.getState().getEventById(event.id)!
    expect(updated.rsvpList).toHaveLength(1)
    expect(updated.rsvpCount).toBe(3)
  })

  it('increments rsvpCount by guest count', () => {
    const event = createTestEvent({ rsvpEnabled: true })
    useEventStore.getState().addRSVP(event.id, makeRSVP({ guestCount: 2 }))
    useEventStore.getState().addRSVP(event.id, makeRSVP({ guestCount: 3 }))
    const updated = useEventStore.getState().getEventById(event.id)!
    expect(updated.rsvpCount).toBe(5)
    expect(updated.rsvpList).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// removeRSVP
// ---------------------------------------------------------------------------

describe('removeRSVP', () => {
  it('removes an RSVP and decrements count', () => {
    const event = createTestEvent({ rsvpEnabled: true })
    const entry = makeRSVP({ guestCount: 2 })
    useEventStore.getState().addRSVP(event.id, entry)
    useEventStore.getState().removeRSVP(event.id, entry.id)
    const updated = useEventStore.getState().getEventById(event.id)!
    expect(updated.rsvpList).toHaveLength(0)
    expect(updated.rsvpCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// promoteFromWaitlist
// ---------------------------------------------------------------------------

describe('promoteFromWaitlist', () => {
  it('moves a waitlisted entry to confirmed list', () => {
    const event = createTestEvent({ rsvpEnabled: true, rsvpLimit: 1, rsvpCount: 1 })
    const waitEntry = makeRSVP({ guestCount: 1 })
    useEventStore.getState().addRSVP(event.id, waitEntry) // goes to waitlist
    // Now promote
    useEventStore.getState().promoteFromWaitlist(event.id, waitEntry.id)
    const updated = useEventStore.getState().getEventById(event.id)!
    expect(updated.rsvpWaitlist).toHaveLength(0)
    expect(updated.rsvpList).toHaveLength(1)
    expect(updated.rsvpList[0].status).toBe('confirmed')
    expect(updated.rsvpCount).toBe(2) // original 1 + promoted 1
  })
})

// ---------------------------------------------------------------------------
// computeEventStatus — auto-transitions based on date/time
// ---------------------------------------------------------------------------

describe('computeEventStatus', () => {
  it('returns draft for a draft event regardless of date', () => {
    const event = createTestEvent({ status: 'draft', date: '2020-01-01' })
    expect(computeEventStatus(event)).toBe('draft')
  })

  it('auto-transitions scheduled -> active on event day', () => {
    // Use today's date so the condition eventDate <= today is true
    const today = new Date()
    const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const event = createTestEvent({ status: 'scheduled', date: isoToday })
    expect(computeEventStatus(event)).toBe('active')
  })

  it('keeps scheduled status for a future-dated scheduled event', () => {
    const event = createTestEvent({ status: 'scheduled', date: '2099-12-31' })
    expect(computeEventStatus(event)).toBe('scheduled')
  })

  it('auto-transitions active -> needs_closeout after end time passes', () => {
    // Use yesterday's date and a past end time
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const isoYesterday = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    const event = createTestEvent({
      status: 'active',
      date: isoYesterday,
      endTime: '00:01',
    })
    expect(computeEventStatus(event)).toBe('needs_closeout')
  })

  it('shows active event with future date as scheduled (event has not started yet)', () => {
    // An event manually set to 'active' but with a future date should display
    // as 'scheduled' — it hasn't started yet. This is the correct business logic:
    // computeEventStatus guards against stale 'active' status for future events.
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isoTomorrow = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
    const event = createTestEvent({
      status: 'active',
      date: isoTomorrow,
      endTime: '23:59',
    })
    // Future-dated active events are guarded back to 'scheduled' display
    expect(computeEventStatus(event)).toBe('scheduled')
  })

  it('keeps active status for an event happening today before end time', () => {
    // An active event on today's date with a future end time should stay active
    const today = new Date()
    const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const event = createTestEvent({
      status: 'active',
      date: isoToday,
      endTime: '23:59',
    })
    expect(computeEventStatus(event)).toBe('active')
  })

  it('returns the stored status for completed events', () => {
    const event = createTestEvent({ status: 'completed' })
    expect(computeEventStatus(event)).toBe('completed')
  })

  it('returns the stored status for cancelled events', () => {
    const event = createTestEvent({ status: 'cancelled' })
    expect(computeEventStatus(event)).toBe('cancelled')
  })

  it('returns the stored status for archived events', () => {
    const event = createTestEvent({ status: 'archived' })
    expect(computeEventStatus(event)).toBe('archived')
  })
})

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('selectors', () => {
  it('getEventsByBuilding filters by buildingId', () => {
    createTestEvent({ buildingId: 'b1' })
    createTestEvent({ buildingId: 'b2' })
    createTestEvent({ buildingId: 'b1' })
    const results = useEventStore.getState().getEventsByBuilding('b1')
    expect(results).toHaveLength(2)
  })

  it('getEventsByDate filters by date', () => {
    createTestEvent({ date: '2026-03-01' })
    createTestEvent({ date: '2026-03-02' })
    createTestEvent({ date: '2026-03-01' })
    const results = useEventStore.getState().getEventsByDate('2026-03-01')
    expect(results).toHaveLength(2)
  })

  it('getDraftEvents returns only draft events', () => {
    createTestEvent({ name: 'Draft One' })
    createTestEvent({ name: 'Draft Two' })
    const scheduled = createTestEvent({ name: 'Scheduled', date: '2099-12-31' })
    useEventStore.getState().transitionStatus(scheduled.id, 'scheduled')
    const drafts = useEventStore.getState().getDraftEvents()
    expect(drafts).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// resetAll
// ---------------------------------------------------------------------------

describe('resetAll', () => {
  it('clears all events', () => {
    createTestEvent()
    createTestEvent()
    useEventStore.getState().resetAll()
    expect(useEventStore.getState().events).toHaveLength(0)
  })
})
