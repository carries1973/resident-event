import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'
import type { Building } from '../types/building'
import { createDefaultBuilding, ensureBuildingDefaults } from '../types/building'

interface BuildingState {
  buildings: Building[]
}

interface BuildingActions {
  addBuilding: (building: Building) => void
  createBuilding: (data: Partial<Building> & Pick<Building, 'name' | 'city' | 'province'>) => Building
  updateBuilding: (id: string, updates: Partial<Building>) => void
  deleteBuilding: (id: string) => void
  duplicateBuilding: (id: string) => Building | null
  getBuildingById: (id: string) => Building | undefined
  resetAll: () => void
}

const initialState: BuildingState = {
  buildings: [],
}

export const useBuildingStore = create<BuildingState & BuildingActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addBuilding: (building) =>
        set((state) => ({ buildings: [...state.buildings, building] })),

      createBuilding: (data) => {
        const building = createDefaultBuilding(data)
        set((state) => ({ buildings: [...state.buildings, building] }))
        return building
      },

      updateBuilding: (id, updates) =>
        set((state) => ({
          buildings: state.buildings.map((b) =>
            b.id === id
              ? { ...b, ...updates, updatedAt: new Date().toISOString() }
              : b,
          ),
        })),

      deleteBuilding: (id) =>
        set((state) => ({
          buildings: state.buildings.filter((b) => b.id !== id),
        })),

      duplicateBuilding: (id) => {
        const source = get().buildings.find((b) => b.id === id)
        if (!source) return null

        const now = new Date().toISOString()
        const duplicate: Building = {
          ...source,
          id: crypto.randomUUID(),
          name: `${source.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ buildings: [...state.buildings, duplicate] }))
        return duplicate
      },

      getBuildingById: (id) => get().buildings.find((b) => b.id === id),

      resetAll: () => set(initialState),
    }),
    {
      name: 'rei-building-store',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as BuildingState & BuildingActions
        if (version < 2) {
          // Ensure all buildings have default array fields (added in later schema revisions)
          return {
            ...state,
            buildings: (state.buildings ?? []).map(ensureBuildingDefaults),
          }
        }
        return state
      },
    },
  ),
)

/**
 * Hook that returns true once the building store has rehydrated from localStorage.
 * Use this to avoid flash-of-empty-state on pages that depend on persisted data.
 */
export function useBuildingStoreHydrated() {
  const [hydrated, setHydrated] = useState(useBuildingStore.persist.hasHydrated())

  useEffect(() => {
    if (hydrated) return
    const unsub = useBuildingStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    // Check again in case it finished between render and effect
    if (useBuildingStore.persist.hasHydrated()) {
      setHydrated(true)
    }
    return unsub
  }, [hydrated])

  return hydrated
}
