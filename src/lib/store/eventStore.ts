import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'
import type { Event, EventCloseout } from '../types/event'
import { createDefaultEvent } from '../types/event'
import type { EventStatus, RSVPEntry } from '../types/common'
import { canTransitionStatus } from '../utils/validation'

/**
 * Compute the real-time display status of an event.
 *
 * The store persists the last *explicit* status set by the user or system.
 * This function overlays automatic time-based transitions so the UI always
 * reflects the true lifecycle state without writing back to the store.
 *
 * Auto-transition rules:
 *   scheduled → active        when today's date matches the event date
 *   scheduled → needs_closeout when the event date has passed (missed window)
 *   active    → needs_closeout when the event end time has passed
 */
export function computeEventStatus(event: Event): EventStatus {
  const { status, date, endTime } = event

  // Auto-transition scheduled events based on today's date
  if (status === 'scheduled' && date) {
    const now = new Date()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const eventDate = new Date(date + 'T00:00:00')

    if (eventDate.getTime() === todayStart.getTime()) {
      // Event is today — mark as active (until end time passes)
      if (endTime) {
        const [hours, minutes] = endTime.split(':').map(Number)
        const eventEnd = new Date(date + 'T00:00:00')
        eventEnd.setHours(hours, minutes, 0, 0)
        if (now > eventEnd) {
          return 'needs_closeout'
        }
      }
      return 'active'
    }

    if (eventDate < todayStart) {
      // Event date has fully passed — needs closeout
      return 'needs_closeout'
    }
  }

  // Guard active events: if the event date is in the future the status
  // should display as scheduled (prevents a manually-set or stale 'active'
  // from showing "Happening Now" for a future event).
  if (status === 'active' && date) {
    const now = new Date()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const eventDate = new Date(date + 'T00:00:00')

    if (eventDate > todayStart) {
      // Event hasn't started yet — display as scheduled
      return 'scheduled'
    }

    // Event is today or past — check if end time has passed
    if (endTime) {
      const [hours, minutes] = endTime.split(':').map(Number)
      const eventEnd = new Date(date + 'T00:00:00')
      eventEnd.setHours(hours, minutes, 0, 0)
      if (now > eventEnd) {
        return 'needs_closeout'
      }
    }

    // Event is past with no end time — needs closeout
    if (eventDate < todayStart) {
      return 'needs_closeout'
    }
  }

  return status
}

interface EventState {
  events: Event[]
}

interface EventActions {
  addEvent: (event: Event) => void
  createEvent: (data: Partial<Event> & Pick<Event, 'name' | 'buildingId'>) => Event
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
  duplicateEvent: (id: string) => Event | null

  // Status transitions
  transitionStatus: (id: string, newStatus: EventStatus) => boolean

  // Closeout
  completeCloseout: (id: string, closeout: EventCloseout) => void
  skipCloseout: (id: string) => void

  // RSVP
  addRSVP: (eventId: string, entry: RSVPEntry) => void
  removeRSVP: (eventId: string, rsvpId: string) => void
  promoteFromWaitlist: (eventId: string, rsvpId: string) => void

  // Selectors
  getEventById: (id: string) => Event | undefined
  getEventsByBuilding: (buildingId: string) => Event[]
  getEventsByStatus: (status: EventStatus) => Event[]
  getEventsByDate: (date: string) => Event[]
  getUpcomingEvents: (days: number) => Event[]
  getEventsNeedingCloseout: () => Event[]
  getDraftEvents: () => Event[]

  // Reset
  resetAll: () => void
}

const initialState: EventState = {
  events: [],
}

export const useEventStore = create<EventState & EventActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addEvent: (event) =>
        set((state) => ({ events: [...state.events, event] })),

      createEvent: (data) => {
        const event = createDefaultEvent(data)
        set((state) => ({ events: [...state.events, event] }))
        return event
      },

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id
              ? { ...e, ...updates, updatedAt: new Date().toISOString() }
              : e,
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      duplicateEvent: (id) => {
        const source = get().events.find((e) => e.id === id)
        if (!source) return null

        const now = new Date().toISOString()
        const duplicate: Event = {
          ...source,
          id: crypto.randomUUID(),
          name: `${source.name} (Copy)`,
          status: 'draft',
          rsvpCount: 0,
          rsvpList: [],
          rsvpWaitlist: [],
          closeout: undefined,
          marketing: undefined,
          dayOfChecklist: source.dayOfChecklist.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
            completed: false,
          })),
          recurrenceParentId: undefined,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ events: [...state.events, duplicate] }))
        return duplicate
      },

      // Status transitions
      transitionStatus: (id, newStatus) => {
        const event = get().events.find((e) => e.id === id)
        if (!event) return false

        const currentStatus = computeEventStatus(event)
        if (!canTransitionStatus(currentStatus, newStatus)) return false

        set((state) => ({
          events: state.events.map((e) =>
            e.id === id
              ? { ...e, status: newStatus, updatedAt: new Date().toISOString() }
              : e,
          ),
        }))
        return true
      },

      // Closeout
      completeCloseout: (id, closeout) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id
              ? {
                  ...e,
                  closeout,
                  status: 'completed' as EventStatus,
                  updatedAt: new Date().toISOString(),
                }
              : e,
          ),
        })),

      skipCloseout: (id) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'completed' as EventStatus,
                  updatedAt: new Date().toISOString(),
                }
              : e,
          ),
        })),

      // RSVP
      addRSVP: (eventId, entry) =>
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e
            const isAtCapacity = e.rsvpLimit != null && e.rsvpCount >= e.rsvpLimit
            if (isAtCapacity) {
              return {
                ...e,
                rsvpWaitlist: [
                  ...e.rsvpWaitlist,
                  { ...entry, status: 'waitlisted' as const },
                ],
                updatedAt: new Date().toISOString(),
              }
            }
            return {
              ...e,
              rsvpList: [...e.rsvpList, { ...entry, status: 'confirmed' as const }],
              rsvpCount: e.rsvpCount + entry.guestCount,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      removeRSVP: (eventId, rsvpId) =>
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e
            const removed = e.rsvpList.find((r) => r.id === rsvpId)
            return {
              ...e,
              rsvpList: e.rsvpList.filter((r) => r.id !== rsvpId),
              rsvpWaitlist: e.rsvpWaitlist.filter((r) => r.id !== rsvpId),
              rsvpCount: removed
                ? e.rsvpCount - removed.guestCount
                : e.rsvpCount,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      promoteFromWaitlist: (eventId, rsvpId) =>
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e
            const entry = e.rsvpWaitlist.find((r) => r.id === rsvpId)
            if (!entry) return e
            return {
              ...e,
              rsvpList: [
                ...e.rsvpList,
                { ...entry, status: 'confirmed' as const },
              ],
              rsvpWaitlist: e.rsvpWaitlist.filter((r) => r.id !== rsvpId),
              rsvpCount: e.rsvpCount + entry.guestCount,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      // Selectors
      getEventById: (id) => get().events.find((e) => e.id === id),

      getEventsByBuilding: (buildingId) =>
        get().events.filter((e) => e.buildingId === buildingId),

      getEventsByStatus: (status) =>
        get().events.filter((e) => computeEventStatus(e) === status),

      getEventsByDate: (date) =>
        get().events.filter((e) => e.date === date),

      getUpcomingEvents: (days) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const cutoff = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
        return get().events.filter((e) => {
          if (!e.date) return false
          const eventDate = new Date(e.date + 'T00:00:00')
          const status = computeEventStatus(e)
          return (
            eventDate >= today &&
            eventDate <= cutoff &&
            (status === 'scheduled' || status === 'active')
          )
        })
      },

      getEventsNeedingCloseout: () =>
        get().events.filter((e) => computeEventStatus(e) === 'needs_closeout'),

      getDraftEvents: () =>
        get().events.filter((e) => computeEventStatus(e) === 'draft'),

      resetAll: () => set(initialState),
    }),
    {
      name: 'rei-event-store',
      version: 1,
    },
  ),
)

/**
 * Hook that returns true once the event store has rehydrated from localStorage.
 */
export function useEventStoreHydrated() {
  const [hydrated, setHydrated] = useState(useEventStore.persist.hasHydrated())

  useEffect(() => {
    if (hydrated) return
    const unsub = useEventStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    if (useEventStore.persist.hasHydrated()) {
      setHydrated(true)
    }
    return unsub
  }, [hydrated])

  return hydrated
}
