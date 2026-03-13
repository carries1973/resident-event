/**
 * Data Backup Utilities
 *
 * JSON export/import for all app data stored in localStorage.
 * Handles all 5 Zustand persisted stores:
 *   - rei-app-store
 *   - rei-building-store
 *   - rei-event-store
 *   - rei-notification-store
 *   - rei-local-events-v1
 */

/** All persisted localStorage keys used by the app */
const STORE_KEYS = [
  'rei-app-store',
  'rei-building-store',
  'rei-event-store',
  'rei-notification-store',
  'rei-local-events-v1',
  'rei-quick-ideas-sessions',
] as const

type StoreKey = typeof STORE_KEYS[number]

/** Current backup format version */
const BACKUP_VERSION = 1

interface BackupPayload {
  version: number
  exportedAt: string
  data: Partial<Record<StoreKey, unknown>>
}

/**
 * Export all app data as a JSON string.
 *
 * Reads each Zustand store's persisted state from localStorage and
 * combines them into a single JSON object with version metadata.
 */
export function exportAllData(): string {
  const readStore = (key: string): unknown => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const data: Partial<Record<StoreKey, unknown>> = {}
  for (const key of STORE_KEYS) {
    data[key] = readStore(key)
  }

  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }

  return JSON.stringify(payload, null, 2)
}

/**
 * Import data from a JSON string, replacing all current data.
 *
 * Validates the backup format, then writes each store's data back to
 * localStorage. After a successful import the caller should reload the
 * page so Zustand rehydrates from the updated localStorage values.
 */
export function importAllData(json: string): { success: boolean; error?: string } {
  let parsed: BackupPayload

  try {
    parsed = JSON.parse(json)
  } catch {
    return { success: false, error: 'Invalid JSON file. The file could not be parsed.' }
  }

  // Validate top-level structure
  if (!parsed || typeof parsed !== 'object') {
    return { success: false, error: 'Invalid backup format. Expected a JSON object.' }
  }

  if (typeof parsed.version !== 'number') {
    return {
      success: false,
      error: 'Invalid backup file. Missing or invalid version field.',
    }
  }

  if (parsed.version > BACKUP_VERSION) {
    return {
      success: false,
      error: `Backup version ${parsed.version} is newer than this app supports (version ${BACKUP_VERSION}). Please update the app first.`,
    }
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    return { success: false, error: 'Invalid backup file. Missing data payload.' }
  }

  // Write each store back to localStorage
  // parsed.data is a Partial<Record<StoreKey, unknown>> — keys are the actual localStorage keys
  const storeMap: Record<string, unknown> = parsed.data as Record<string, unknown>

  try {
    for (const [key, value] of Object.entries(storeMap)) {
      if (value != null) {
        localStorage.setItem(key, JSON.stringify(value))
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      error: `Failed to write data to localStorage: ${message}`,
    }
  }

  return { success: true }
}

/**
 * Clear all app data from localStorage.
 *
 * Removes all known Zustand store keys AND any other keys with the
 * "rei-" prefix (catches future stores or renamed keys). After calling
 * this the page should be reloaded so stores reinitialise with defaults.
 */
export function clearAllData(): void {
  // Collect ALL keys first (snapshot), then remove — avoids iterator
  // mutation bugs where removing items shifts indices mid-loop.
  const allKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) allKeys.push(key)
  }
  // Remove every rei- prefixed key (covers all known stores + any future ones)
  for (const key of allKeys) {
    if (key.startsWith('rei-')) {
      localStorage.removeItem(key)
    }
  }
}

/**
 * Get current localStorage usage in bytes.
 *
 * Iterates all keys in localStorage and sums up the byte sizes of both
 * keys and values. Assumes a 5 MB total capacity (the standard browser
 * limit for localStorage).
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  const total = 5 * 1024 * 1024 // 5 MB

  let used = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key) ?? ''
      // Each char in JS is 2 bytes (UTF-16), but localStorage
      // implementations typically count single-byte chars as 1 byte
      // when measuring against the quota. We use the DOMString byte
      // length (chars * 2) for a conservative estimate.
      used += (key.length + value.length) * 2
    }
  }

  const percentage = total > 0 ? Math.round((used / total) * 100) : 0

  return { used, total, percentage }
}
