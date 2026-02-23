/**
 * localStorage usage monitoring.
 * Warns when approaching browser storage limits.
 */

const ESTIMATED_TOTAL_KB = 5120 // 5MB — typical localStorage limit
const WARNING_THRESHOLD = 0.8   // Warn at 80%
const CRITICAL_THRESHOLD = 0.9  // Critical at 90%

export interface StorageUsage {
  usedKB: number
  totalKB: number
  percentage: number
}

/** Estimate current localStorage usage */
export function getStorageUsage(): StorageUsage {
  let usedBytes = 0

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) ?? ''
        // Each character in JS is 2 bytes (UTF-16)
        usedBytes += (key.length + value.length) * 2
      }
    }
  } catch {
    // If we can't access localStorage, return 0
  }

  const usedKB = Math.round(usedBytes / 1024)
  const percentage = Math.round((usedKB / ESTIMATED_TOTAL_KB) * 100)

  return { usedKB, totalKB: ESTIMATED_TOTAL_KB, percentage }
}

/** Get a warning message if storage is getting full, null otherwise */
export function getStorageWarning(): string | null {
  const { percentage } = getStorageUsage()

  if (percentage >= CRITICAL_THRESHOLD * 100) {
    return 'Storage is almost full! Export your data and consider removing old events.'
  }
  if (percentage >= WARNING_THRESHOLD * 100) {
    return 'Storage is getting full. Consider exporting and archiving old data.'
  }
  return null
}

/** Check if adding a data URL would push storage over the limit */
export function wouldExceedStorage(dataUrl: string): boolean {
  const additionalBytes = dataUrl.length * 2
  const { usedKB, totalKB } = getStorageUsage()
  const newUsedKB = usedKB + Math.round(additionalBytes / 1024)
  return newUsedKB > totalKB * CRITICAL_THRESHOLD
}
