import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../appStore'
import type { Observance } from '../../types/observance'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the Zustand store between tests */
function resetStore(): void {
  useAppStore.getState().resetAll()
}

/** Create a test observance */
function makeObservance(overrides?: Partial<Observance>): Observance {
  return {
    id: crypto.randomUUID(),
    name: 'Test Observance',
    month: 1,
    type: 'national',
    emoji: '🎉',
    enabled: true,
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
// addCustomObservance
// ---------------------------------------------------------------------------

describe('addCustomObservance', () => {
  it('adds a custom observance to the list', () => {
    const obs = makeObservance({ name: 'Building Anniversary' })
    useAppStore.getState().addCustomObservance(obs)
    expect(useAppStore.getState().customObservances).toHaveLength(1)
    expect(useAppStore.getState().customObservances[0].name).toBe('Building Anniversary')
  })

  it('adds multiple observances', () => {
    useAppStore.getState().addCustomObservance(makeObservance({ name: 'First' }))
    useAppStore.getState().addCustomObservance(makeObservance({ name: 'Second' }))
    expect(useAppStore.getState().customObservances).toHaveLength(2)
  })

  it('preserves all observance fields', () => {
    const obs = makeObservance({
      name: 'National BBQ Day',
      month: 7,
      day: 15,
      type: 'theme',
      emoji: '🔥',
      description: 'Time for grilling!',
      eventIdeas: ['Rooftop BBQ', 'Grill competition'],
      enabled: true,
    })
    useAppStore.getState().addCustomObservance(obs)
    const stored = useAppStore.getState().customObservances[0]
    expect(stored.name).toBe('National BBQ Day')
    expect(stored.month).toBe(7)
    expect(stored.day).toBe(15)
    expect(stored.type).toBe('theme')
    expect(stored.emoji).toBe('🔥')
    expect(stored.description).toBe('Time for grilling!')
    expect(stored.eventIdeas).toEqual(['Rooftop BBQ', 'Grill competition'])
  })
})

// ---------------------------------------------------------------------------
// removeCustomObservance
// ---------------------------------------------------------------------------

describe('removeCustomObservance', () => {
  it('removes a custom observance from the list', () => {
    const obs = makeObservance({ name: 'To Remove' })
    useAppStore.getState().addCustomObservance(obs)
    expect(useAppStore.getState().customObservances).toHaveLength(1)
    useAppStore.getState().removeCustomObservance(obs.id)
    expect(useAppStore.getState().customObservances).toHaveLength(0)
  })

  it('also cleans up disabledObservanceIds for the removed observance', () => {
    const obs = makeObservance({ name: 'Will Be Disabled' })
    useAppStore.getState().addCustomObservance(obs)
    // Disable the observance
    useAppStore.getState().toggleObservance(obs.id)
    expect(useAppStore.getState().disabledObservanceIds).toContain(obs.id)
    // Remove it
    useAppStore.getState().removeCustomObservance(obs.id)
    expect(useAppStore.getState().disabledObservanceIds).not.toContain(obs.id)
  })

  it('does not affect other observances', () => {
    const obs1 = makeObservance({ name: 'Stay' })
    const obs2 = makeObservance({ name: 'Remove' })
    useAppStore.getState().addCustomObservance(obs1)
    useAppStore.getState().addCustomObservance(obs2)
    useAppStore.getState().removeCustomObservance(obs2.id)
    expect(useAppStore.getState().customObservances).toHaveLength(1)
    expect(useAppStore.getState().customObservances[0].name).toBe('Stay')
  })
})

// ---------------------------------------------------------------------------
// toggleObservance
// ---------------------------------------------------------------------------

describe('toggleObservance', () => {
  it('adds an observance ID to disabledObservanceIds when toggled off', () => {
    const id = 'obs-123'
    useAppStore.getState().toggleObservance(id)
    expect(useAppStore.getState().disabledObservanceIds).toContain(id)
  })

  it('removes an observance ID from disabledObservanceIds when toggled back on', () => {
    const id = 'obs-456'
    useAppStore.getState().toggleObservance(id) // off
    useAppStore.getState().toggleObservance(id) // on
    expect(useAppStore.getState().disabledObservanceIds).not.toContain(id)
  })

  it('handles multiple independent toggles', () => {
    useAppStore.getState().toggleObservance('a')
    useAppStore.getState().toggleObservance('b')
    useAppStore.getState().toggleObservance('c')
    expect(useAppStore.getState().disabledObservanceIds).toEqual(['a', 'b', 'c'])
    useAppStore.getState().toggleObservance('b')
    expect(useAppStore.getState().disabledObservanceIds).toEqual(['a', 'c'])
  })
})

// ---------------------------------------------------------------------------
// setDisabledObservanceIds
// ---------------------------------------------------------------------------

describe('setDisabledObservanceIds', () => {
  it('replaces the entire disabled list', () => {
    useAppStore.getState().toggleObservance('x')
    useAppStore.getState().setDisabledObservanceIds(['y', 'z'])
    expect(useAppStore.getState().disabledObservanceIds).toEqual(['y', 'z'])
  })
})

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

describe('theme', () => {
  it('defaults to light', () => {
    expect(useAppStore.getState().theme).toBe('light')
  })

  it('toggleTheme switches between light and dark', () => {
    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe('dark')
    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe('light')
  })

  it('setTheme sets a specific theme', () => {
    useAppStore.getState().setTheme('dark')
    expect(useAppStore.getState().theme).toBe('dark')
  })
})

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

describe('onboarding', () => {
  it('defaults to not complete', () => {
    expect(useAppStore.getState().onboardingComplete).toBe(false)
  })

  it('completeOnboarding sets to true', () => {
    useAppStore.getState().completeOnboarding()
    expect(useAppStore.getState().onboardingComplete).toBe(true)
  })

  it('resetOnboarding sets to false', () => {
    useAppStore.getState().completeOnboarding()
    useAppStore.getState().resetOnboarding()
    expect(useAppStore.getState().onboardingComplete).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Calendar UI state
// ---------------------------------------------------------------------------

describe('calendar navigation', () => {
  it('nextMonth increments the month', () => {
    useAppStore.getState().setCalendarMonth(2026, 3)
    useAppStore.getState().nextMonth()
    expect(useAppStore.getState().calendar.month).toBe(4)
    expect(useAppStore.getState().calendar.year).toBe(2026)
  })

  it('nextMonth wraps from December to January of next year', () => {
    useAppStore.getState().setCalendarMonth(2026, 12)
    useAppStore.getState().nextMonth()
    expect(useAppStore.getState().calendar.month).toBe(1)
    expect(useAppStore.getState().calendar.year).toBe(2027)
  })

  it('prevMonth decrements the month', () => {
    useAppStore.getState().setCalendarMonth(2026, 5)
    useAppStore.getState().prevMonth()
    expect(useAppStore.getState().calendar.month).toBe(4)
    expect(useAppStore.getState().calendar.year).toBe(2026)
  })

  it('prevMonth wraps from January to December of previous year', () => {
    useAppStore.getState().setCalendarMonth(2026, 1)
    useAppStore.getState().prevMonth()
    expect(useAppStore.getState().calendar.month).toBe(12)
    expect(useAppStore.getState().calendar.year).toBe(2025)
  })
})

// ---------------------------------------------------------------------------
// Building selector
// ---------------------------------------------------------------------------

describe('building selector', () => {
  it('defaults to null', () => {
    expect(useAppStore.getState().currentBuildingId).toBeNull()
  })

  it('sets and clears building ID', () => {
    useAppStore.getState().setCurrentBuildingId('b1')
    expect(useAppStore.getState().currentBuildingId).toBe('b1')
    useAppStore.getState().setCurrentBuildingId(null)
    expect(useAppStore.getState().currentBuildingId).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

describe('sidebar', () => {
  it('defaults to open', () => {
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })

  it('toggleSidebar flips the state', () => {
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(false)
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// resetAll
// ---------------------------------------------------------------------------

describe('resetAll', () => {
  it('resets all state to initial values', () => {
    useAppStore.getState().completeOnboarding()
    useAppStore.getState().setTheme('dark')
    useAppStore.getState().setCurrentBuildingId('b1')
    useAppStore.getState().addCustomObservance(makeObservance())
    useAppStore.getState().toggleObservance('obs-1')

    useAppStore.getState().resetAll()

    expect(useAppStore.getState().onboardingComplete).toBe(false)
    expect(useAppStore.getState().theme).toBe('light')
    expect(useAppStore.getState().currentBuildingId).toBeNull()
    expect(useAppStore.getState().customObservances).toHaveLength(0)
    expect(useAppStore.getState().disabledObservanceIds).toHaveLength(0)
  })
})
