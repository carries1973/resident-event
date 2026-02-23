/**
 * Vitest setup file.
 *
 * Ensures that a functional localStorage is available for Zustand's
 * persist middleware in the jsdom test environment.
 */

// Some jsdom / Node versions provide a broken or missing localStorage.
// We provide a simple in-memory polyfill when needed.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  const store = new Map<string, string>()

  const localStorage: Storage = {
    getItem(key: string): string | null {
      return store.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      store.set(key, value)
    },
    removeItem(key: string): void {
      store.delete(key)
    },
    clear(): void {
      store.clear()
    },
    get length(): number {
      return store.size
    },
    key(index: number): string | null {
      const keys = Array.from(store.keys())
      return keys[index] ?? null
    },
  }

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorage,
    writable: true,
    configurable: true,
  })
}
