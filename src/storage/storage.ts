import { createMMKV } from 'react-native-mmkv';

// JSON wrapper over MMKV. MMKV is synchronous; the async signatures keep callers
// free to move to another store later. Failures never crash the app; reads fall back to null.

const mmkv = createMMKV({ id: 'mmipoc' });

export const keys = {
  guest: 'mmipoc:guest',
  modeOverride: 'mmipoc:modeOverride',
  mockGuests: 'mmipoc:mock:guests',
  mockBookmarks: (guestId: string) => `mmipoc:mock:bookmarks:${guestId}`,
  cachedRecommendations: (guestId: string) => `mmipoc:cache:recs:${guestId}`,
  bookmarkQueue: (mode: string, guestId: string) => `mmipoc:queue:bookmarks:${mode}:${guestId}`,
} as const;

/** Synchronous read, for seeding initial render (e.g. cached results when offline). */
export function readJsonSync<T>(key: string): T | null {
  try {
    const raw = mmkv.getString(key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export async function readJson<T>(key: string): Promise<T | null> {
  return readJsonSync<T>(key);
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    mmkv.set(key, JSON.stringify(value));
  } catch {
    // Best effort.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    mmkv.remove(key);
  } catch {
    // Best effort.
  }
}

/** Wipes everything this app stored. Used by tests and "Start over" debugging. */
export function clearAllStorage(): void {
  mmkv.clearAll();
}
