/**
 * Data Backup Utilities
 *
 * JSON export/import for all app data stored in localStorage.
 * Handles the 4 Zustand persisted stores:
 *   - rei-app-store
 *   - rei-building-store
 *   - rei-event-store
 *   - rei-notification-store
 */

const STORE_KEYS = [
  'rei-app-store',
  'rei-building-store',
  'rei-event-store',
  'rei-notification-store',
] as const

/** Current backup format version */
const BACKUP_VERSION = 1

interface BackupPayload {
  version: number
  exportedAt: string
  data: {
    app: unknown
    buildings: unknown
    events: unknown
    notifications: unknown
  }
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

  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      app: readStore('rei-app-store'),
      buildings: readStore('rei-building-store'),
      events: readStore('rei-event-store'),
      notifications: readStore('rei-notification-store'),
    },
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
  const storeMap: Record<string, unknown> = {
    'rei-app-store': parsed.data.app,
    'rei-building-store': parsed.data.buildings,
    'rei-event-store': parsed.data.events,
    'rei-notification-store': parsed.data.notifications,
  }

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
 * Removes all 4 Zustand store keys. After calling this the page should
 * be reloaded so stores reinitialise with their defaults.
 */
export function clearAllData(): void {
  for (const key of STORE_KEYS) {
    localStorage.removeItem(key)
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
