import { get, set, del } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'

/**
 * Adapts idb-keyval to Zustand's async `StateStorage` interface, so the
 * whole store persists to IndexedDB instead of localStorage. IndexedDB is
 * async (won't block the UI thread) and isn't capped at ~5MB, which matters
 * once boards carry base64 cover images.
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}
