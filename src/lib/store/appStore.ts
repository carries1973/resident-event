import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Observance } from '@/lib/types/observance'

export type Theme = 'light' | 'dark'

export interface CalendarUIState {
  year: number
  month: number // 1-12
  statusFilters: string[]
  buildingFilter: string | null
  observanceTypeFilters: string[]
}

interface AppState {
  // Theme
  theme: Theme

  // Onboarding
  onboardingComplete: boolean

  // Current building (selected in top bar)
  currentBuildingId: string | null

  // Sidebar
  sidebarOpen: boolean

  // Calendar UI
  calendar: CalendarUIState

  // Disabled observance IDs (user can toggle off)
  disabledObservanceIds: string[]

  // Custom observances (user-added building-specific dates)
  customObservances: Observance[]
}

interface AppActions {
  // Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void

  // Onboarding
  completeOnboarding: () => void
  resetOnboarding: () => void

  // Building selector
  setCurrentBuildingId: (id: string | null) => void

  // Sidebar
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Calendar
  setCalendarMonth: (year: number, month: number) => void
  nextMonth: () => void
  prevMonth: () => void
  setCalendarStatusFilters: (filters: string[]) => void
  setCalendarBuildingFilter: (buildingId: string | null) => void
  setCalendarObservanceTypeFilters: (filters: string[]) => void

  // Observances
  toggleObservance: (id: string) => void
  setDisabledObservanceIds: (ids: string[]) => void
  addCustomObservance: (obs: Observance) => void
  removeCustomObservance: (id: string) => void

  // Reset
  resetAll: () => void
}

const now = new Date()
const initialCalendar: CalendarUIState = {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  statusFilters: [],
  buildingFilter: null,
  observanceTypeFilters: [],
}

const initialState: AppState = {
  theme: 'light',
  onboardingComplete: false,
  currentBuildingId: null,
  sidebarOpen: true,
  calendar: initialCalendar,
  disabledObservanceIds: [],
  customObservances: [],
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,

      // Theme
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light'
          document.documentElement.classList.toggle('dark', next === 'dark')
          return { theme: next }
        }),

      // Onboarding
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () => set({ onboardingComplete: false }),

      // Building selector
      setCurrentBuildingId: (id) => set({ currentBuildingId: id }),

      // Sidebar
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Calendar
      setCalendarMonth: (year, month) =>
        set((state) => ({ calendar: { ...state.calendar, year, month } })),
      nextMonth: () =>
        set((state) => {
          let { year, month } = state.calendar
          month++
          if (month > 12) {
            month = 1
            year++
          }
          return { calendar: { ...state.calendar, year, month } }
        }),
      prevMonth: () =>
        set((state) => {
          let { year, month } = state.calendar
          month--
          if (month < 1) {
            month = 12
            year--
          }
          return { calendar: { ...state.calendar, year, month } }
        }),
      setCalendarStatusFilters: (filters) =>
        set((state) => ({ calendar: { ...state.calendar, statusFilters: filters } })),
      setCalendarBuildingFilter: (buildingId) =>
        set((state) => ({ calendar: { ...state.calendar, buildingFilter: buildingId } })),
      setCalendarObservanceTypeFilters: (filters) =>
        set((state) => ({ calendar: { ...state.calendar, observanceTypeFilters: filters } })),

      // Observances
      toggleObservance: (id) =>
        set((state) => {
          const ids = state.disabledObservanceIds
          return {
            disabledObservanceIds: ids.includes(id)
              ? ids.filter((i) => i !== id)
              : [...ids, id],
          }
        }),
      setDisabledObservanceIds: (ids) => set({ disabledObservanceIds: ids }),
      addCustomObservance: (obs) =>
        set((state) => ({ customObservances: [...state.customObservances, obs] })),
      removeCustomObservance: (id) =>
        set((state) => ({
          customObservances: state.customObservances.filter((o) => o.id !== id),
          disabledObservanceIds: state.disabledObservanceIds.filter((i) => i !== id),
        })),

      // Reset
      resetAll: () => set(initialState),
    }),
    {
      name: 'rei-app-store',
      version: 1,
      // Exclude calendar year/month from persistence so the calendar always
      // opens on the actual current month rather than a stale persisted value.
      partialize: (state) => ({
        theme: state.theme,
        onboardingComplete: state.onboardingComplete,
        currentBuildingId: state.currentBuildingId,
        sidebarOpen: state.sidebarOpen,
        // Persist filters/building filter but NOT year/month
        calendar: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          statusFilters: state.calendar.statusFilters,
          buildingFilter: state.calendar.buildingFilter,
          observanceTypeFilters: state.calendar.observanceTypeFilters,
        },
        disabledObservanceIds: state.disabledObservanceIds,
        customObservances: state.customObservances,
      }),
      onRehydrateStorage: () => {
        return (state?: AppState & AppActions) => {
          if (!state) return

          // Sync theme class on rehydration
          document.documentElement.classList.toggle('dark', state.theme === 'dark')

          // Always reset calendar to current month on load, regardless of
          // what was persisted. This prevents stale month/year from localStorage.
          const now = new Date()
          state.calendar.year = now.getFullYear()
          state.calendar.month = now.getMonth() + 1
        }
      },
    },
  ),
)
