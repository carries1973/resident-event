/**
 * Date utilities — Canadian format (Month D, YYYY)
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const

const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Format ISO date to Canadian format: "February 19, 2026" */
export function formatDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/** Format ISO date to short format: "Feb 19, 2026" */
export function formatDateShort(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return `${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/** Format time string "14:00" to "2:00 PM". Returns empty string for invalid input. */
export function formatTime(time: string): string {
  if (!time || !time.includes(':')) return ''
  const [hours, minutes] = time.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return ''
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

/** Format a date range: "February 1 – 28, 2026" or "January 15, 2026 – February 15, 2026" */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')

  if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
    return `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getDate()} – ${endDate.getDate()}, ${startDate.getFullYear()}`
  }
  return `${formatDate(start)} – ${formatDate(end)}`
}

/** Check if an ISO date is today */
export function isToday(iso: string): boolean {
  const today = new Date()
  const date = new Date(iso + 'T00:00:00')
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/** Check if an ISO date is in the past */
export function isPast(iso: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(iso + 'T00:00:00')
  return date < today
}

/** Check if an ISO date is within N days from today */
export function isWithinDays(iso: string, days: number): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso + 'T00:00:00')
  const diff = target.getTime() - today.getTime()
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000
}

/** Get days until an ISO date from today (negative if past) */
export function daysUntil(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

/** Get the number of days in a month */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Get the day of week (0=Sun) for the first day of a month */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

/** Get full month name from 1-indexed month */
export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? ''
}

/** Get short month name from 1-indexed month */
export function getShortMonthName(month: number): string {
  return SHORT_MONTH_NAMES[month - 1] ?? ''
}

/** Get day name constants */
export function getDayNames(): readonly string[] {
  return DAY_NAMES
}

export function getShortDayNames(): readonly string[] {
  return SHORT_DAY_NAMES
}

/**
 * Generate a calendar grid for a month.
 * Returns 5-6 rows of 7 columns. Cells outside the month are null.
 */
export function generateCalendarGrid(year: number, month: number): (number | null)[][] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const grid: (number | null)[][] = []
  let day = 1

  for (let row = 0; row < 6; row++) {
    const week: (number | null)[] = []
    for (let col = 0; col < 7; col++) {
      if (row === 0 && col < firstDay) {
        week.push(null)
      } else if (day > daysInMonth) {
        week.push(null)
      } else {
        week.push(day)
        day++
      }
    }
    grid.push(week)
    if (day > daysInMonth) break
  }

  return grid
}

/** Get today's date as ISO string (YYYY-MM-DD) */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Get relative time description: "2 hours ago", "in 3 days", "just now" */
export function relativeTime(isoDateTime: string): string {
  const now = new Date()
  const date = new Date(isoDateTime)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (diffMs < 0) {
    // Future
    const futureDays = Math.abs(diffDays)
    if (futureDays === 0) return 'today'
    if (futureDays === 1) return 'tomorrow'
    if (futureDays < 7) return `in ${futureDays} days`
    return formatDateShort(isoDateTime.split('T')[0])
  }

  // Past
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return formatDateShort(isoDateTime.split('T')[0])
}
