import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'
import { type LocalEvent, createDefaultLocalEvent } from '@/lib/types/localEvent'

interface LocalEventState {
  localEvents: LocalEvent[]

  // CRUD
  createLocalEvent: (data: Pick<LocalEvent, 'name' | 'date'> & Partial<LocalEvent>) => LocalEvent
  updateLocalEvent: (id: string, changes: Partial<LocalEvent>) => void
  deleteLocalEvent: (id: string) => void
}

export const useLocalEventStore = create<LocalEventState>()(
  persist(
    (set, _get) => ({
      localEvents: [],

      createLocalEvent(data) {
        const event = createDefaultLocalEvent(data)
        set((s) => ({ localEvents: [...s.localEvents, event] }))
        return event
      },

      updateLocalEvent(id, changes) {
        set((s) => ({
          localEvents: s.localEvents.map((e) =>
            e.id === id ? { ...e, ...changes, updatedAt: new Date().toISOString() } : e,
          ),
        }))
      },

      deleteLocalEvent(id) {
        set((s) => ({ localEvents: s.localEvents.filter((e) => e.id !== id) }))
      },
    }),
    {
      name: 'rei-local-events-v1',
    },
  ),
)

/**
 * Hook that returns true once the local event store has rehydrated from localStorage.
 */
export function useLocalEventStoreHydrated() {
  const [hydrated, setHydrated] = useState(useLocalEventStore.persist.hasHydrated())

  useEffect(() => {
    if (hydrated) return
    const unsub = useLocalEventStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    // Re-check in case it hydrated between the useState init and useEffect
    if (useLocalEventStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [hydrated])

  return hydrated
}
