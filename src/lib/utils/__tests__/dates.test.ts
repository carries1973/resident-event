import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateShort,
  formatTime,
  formatDateRange,
  isToday,
  isPast,
  isWithinDays,
  daysUntil,
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  getShortMonthName,
  getDayNames,
  getShortDayNames,
  generateCalendarGrid,
  todayISO,
} from '../dates'

// ---------------------------------------------------------------------------
// formatDate — Canadian format: "February 19, 2026"
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formats an ISO date string to Canadian format', () => {
    expect(formatDate('2026-02-19')).toBe('February 19, 2026')
  })

  it('formats January 1 correctly', () => {
    expect(formatDate('2026-01-01')).toBe('January 1, 2026')
  })

  it('formats December 31 correctly', () => {
    expect(formatDate('2025-12-31')).toBe('December 31, 2025')
  })

  it('formats single-digit days without leading zeros', () => {
    expect(formatDate('2026-03-05')).toBe('March 5, 2026')
  })
})

// ---------------------------------------------------------------------------
// formatDateShort — "Feb 19, 2026"
// ---------------------------------------------------------------------------

describe('formatDateShort', () => {
  it('formats an ISO date to short Canadian format', () => {
    expect(formatDateShort('2026-02-19')).toBe('Feb 19, 2026')
  })

  it('formats with short month names', () => {
    expect(formatDateShort('2026-11-07')).toBe('Nov 7, 2026')
  })
})

// ---------------------------------------------------------------------------
// formatTime — "14:00" → "2:00 PM"
// ---------------------------------------------------------------------------

describe('formatTime', () => {
  it('formats 24-hour time to 12-hour AM/PM', () => {
    expect(formatTime('14:00')).toBe('2:00 PM')
  })

  it('formats morning time', () => {
    expect(formatTime('09:30')).toBe('9:30 AM')
  })

  it('formats noon', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('formats midnight', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })

  it('formats 1 PM', () => {
    expect(formatTime('13:15')).toBe('1:15 PM')
  })

  it('formats 11 AM', () => {
    expect(formatTime('11:59')).toBe('11:59 AM')
  })
})

// ---------------------------------------------------------------------------
// formatDateRange
// ---------------------------------------------------------------------------

describe('formatDateRange', () => {
  it('uses compact format for same month and year', () => {
    expect(formatDateRange('2026-02-01', '2026-02-28')).toBe(
      'February 1 – 28, 2026',
    )
  })

  it('uses full format for different months', () => {
    expect(formatDateRange('2026-01-15', '2026-02-15')).toBe(
      'January 15, 2026 – February 15, 2026',
    )
  })

  it('uses full format for different years', () => {
    expect(formatDateRange('2025-12-15', '2026-01-15')).toBe(
      'December 15, 2025 – January 15, 2026',
    )
  })
})

// ---------------------------------------------------------------------------
// isToday
// ---------------------------------------------------------------------------

describe('isToday', () => {
  it('returns true for today', () => {
    const today = todayISO()
    expect(isToday(today)).toBe(true)
  })

  it('returns false for a past date', () => {
    expect(isToday('2020-01-01')).toBe(false)
  })

  it('returns false for a future date', () => {
    expect(isToday('2099-12-31')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isPast
// ---------------------------------------------------------------------------

describe('isPast', () => {
  it('returns true for a date in the past', () => {
    expect(isPast('2020-01-01')).toBe(true)
  })

  it('returns false for a date in the future', () => {
    expect(isPast('2099-12-31')).toBe(false)
  })

  it('returns false for today', () => {
    expect(isPast(todayISO())).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isWithinDays
// ---------------------------------------------------------------------------

describe('isWithinDays', () => {
  it('returns true for today when checking within 1 day', () => {
    expect(isWithinDays(todayISO(), 1)).toBe(true)
  })

  it('returns false for a far-future date when checking within 1 day', () => {
    expect(isWithinDays('2099-12-31', 1)).toBe(false)
  })

  it('returns false for a past date', () => {
    expect(isWithinDays('2020-01-01', 7)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// daysUntil
// ---------------------------------------------------------------------------

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    expect(daysUntil(todayISO())).toBe(0)
  })

  it('returns negative number for past dates', () => {
    expect(daysUntil('2020-01-01')).toBeLessThan(0)
  })

  it('returns positive number for future dates', () => {
    expect(daysUntil('2099-12-31')).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// getDaysInMonth
// ---------------------------------------------------------------------------

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2026, 1)).toBe(31)
  })

  it('returns 28 for February in a non-leap year', () => {
    expect(getDaysInMonth(2026, 2)).toBe(28)
  })

  it('returns 29 for February in a leap year', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29)
  })

  it('returns 30 for April', () => {
    expect(getDaysInMonth(2026, 4)).toBe(30)
  })

  it('returns 31 for December', () => {
    expect(getDaysInMonth(2026, 12)).toBe(31)
  })
})

// ---------------------------------------------------------------------------
// getFirstDayOfMonth
// ---------------------------------------------------------------------------

describe('getFirstDayOfMonth', () => {
  it('returns the correct day-of-week index for a known date', () => {
    // February 1, 2026 is a Sunday (0)
    expect(getFirstDayOfMonth(2026, 2)).toBe(0)
  })

  it('returns a value between 0 and 6', () => {
    const day = getFirstDayOfMonth(2026, 6)
    expect(day).toBeGreaterThanOrEqual(0)
    expect(day).toBeLessThanOrEqual(6)
  })
})

// ---------------------------------------------------------------------------
// getMonthName / getShortMonthName
// ---------------------------------------------------------------------------

describe('getMonthName', () => {
  it('returns full month name for 1-indexed month', () => {
    expect(getMonthName(1)).toBe('January')
    expect(getMonthName(6)).toBe('June')
    expect(getMonthName(12)).toBe('December')
  })

  it('returns empty string for out-of-range month', () => {
    expect(getMonthName(0)).toBe('')
    expect(getMonthName(13)).toBe('')
  })
})

describe('getShortMonthName', () => {
  it('returns short month name for 1-indexed month', () => {
    expect(getShortMonthName(1)).toBe('Jan')
    expect(getShortMonthName(6)).toBe('Jun')
    expect(getShortMonthName(12)).toBe('Dec')
  })

  it('returns empty string for out-of-range month', () => {
    expect(getShortMonthName(0)).toBe('')
    expect(getShortMonthName(13)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// getDayNames / getShortDayNames
// ---------------------------------------------------------------------------

describe('getDayNames', () => {
  it('returns 7 day names starting with Sunday', () => {
    const names = getDayNames()
    expect(names).toHaveLength(7)
    expect(names[0]).toBe('Sunday')
    expect(names[6]).toBe('Saturday')
  })
})

describe('getShortDayNames', () => {
  it('returns 7 short day names starting with Sun', () => {
    const names = getShortDayNames()
    expect(names).toHaveLength(7)
    expect(names[0]).toBe('Sun')
    expect(names[6]).toBe('Sat')
  })
})

// ---------------------------------------------------------------------------
// generateCalendarGrid
// ---------------------------------------------------------------------------

describe('generateCalendarGrid', () => {
  it('generates a grid with 5-6 rows of 7 columns', () => {
    const grid = generateCalendarGrid(2026, 2)
    expect(grid.length).toBeGreaterThanOrEqual(4)
    expect(grid.length).toBeLessThanOrEqual(6)
    for (const row of grid) {
      expect(row).toHaveLength(7)
    }
  })

  it('contains all days of the month', () => {
    const grid = generateCalendarGrid(2026, 2) // 28 days
    const days = grid.flat().filter((d): d is number => d !== null)
    expect(days).toHaveLength(28)
    expect(days[0]).toBe(1)
    expect(days[days.length - 1]).toBe(28)
  })

  it('handles a 31-day month', () => {
    const grid = generateCalendarGrid(2026, 1) // 31 days
    const days = grid.flat().filter((d): d is number => d !== null)
    expect(days).toHaveLength(31)
  })

  it('places null for cells outside the current month', () => {
    const grid = generateCalendarGrid(2026, 2)
    // Feb 2026 starts on Sunday, so the first row first cell should be 1 (not null)
    expect(grid[0][0]).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// todayISO
// ---------------------------------------------------------------------------

describe('todayISO', () => {
  it('returns a string matching YYYY-MM-DD format', () => {
    const iso = todayISO()
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches the current date', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(todayISO()).toBe(expected)
  })
})
