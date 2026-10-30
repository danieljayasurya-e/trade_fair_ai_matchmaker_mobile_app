import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { getClient, type ApiMode } from '../api';
import type { Guest } from '../api/schemas';
import { env } from '../config/env';
import { isStaleGuest } from '../features/profile/conflict';
import { keys, readJson, removeKey, writeJson } from '../storage/storage';

/** Why the app is in its current mode; shown on the Profile screen. */
export type ModeReason = 'env' | 'fallback' | 'override' | 'healthy' | 'offline';

interface StoredGuest {
  mode: ApiMode;
  guest: Guest;
}

interface SessionState {
  hydrated: boolean;
  mode: ApiMode;
  modeReason: ModeReason;
  guest: Guest | null;
  bootstrap: () => Promise<void>;
  /** Ignores a guest older than the one we have (last write wins by updatedAt). */
  setGuest: (guest: Guest) => void;
  clearGuest: () => Promise<void>;
  /** Hidden dev toggle: switch data source without rebuilding. Re-creates the guest in the new source. */
  switchMode: (mode: ApiMode) => Promise<void>;
}

const initialMode: Pick<SessionState, 'hydrated' | 'mode' | 'modeReason' | 'guest'> = {
  hydrated: false,
  mode: env.useMock ? 'mock' : 'http',
  modeReason: env.useMock ? 'env' : 'healthy',
  guest: null,
};

export const useSession = create<SessionState>((set, get) => ({
  ...initialMode,

  async bootstrap() {
    const [stored, override] = await Promise.all([
      readJson<StoredGuest>(keys.guest),
      readJson<ApiMode>(keys.modeOverride),
    ]);

    let mode: ApiMode;
    let modeReason: ModeReason;
    if (override) {
      mode = override;
      modeReason = 'override';
    } else if (env.useMock) {
      mode = 'mock';
      modeReason = 'env';
    } else {
      const net = await NetInfo.fetch().catch(() => null);
      if (net?.isConnected === false && stored?.mode === 'http') {
        // No network at launch but a live-API guest exists: stay live and show their cached results.
        mode = 'http';
        modeReason = 'offline';
      } else {
        try {
          await getClient('http').health();
          mode = 'http';
          modeReason = 'healthy';
        } catch {
          mode = 'mock';
          modeReason = 'fallback';
        }
      }
    }

    set({
      hydrated: true,
      mode,
      modeReason,
      // A guest belongs to the data source that created it.
      guest: stored && stored.mode === mode ? stored.guest : null,
    });
  },

  setGuest(guest) {
    if (isStaleGuest(guest, get().guest)) return;
    set({ guest });
    void writeJson(keys.guest, { mode: get().mode, guest } satisfies StoredGuest);
  },

  async clearGuest() {
    set({ guest: null });
    await removeKey(keys.guest);
  },

  async switchMode(mode) {
    const { guest } = get();
    await writeJson(keys.modeOverride, mode);
    let nextGuest: Guest | null = null;
    if (guest) {
      const { id: _id, updatedAt: _u, ...input } = guest;
      nextGuest = await getClient(mode).createGuest(input);
    }
    set({ mode, modeReason: 'override', guest: nextGuest });
    if (nextGuest) await writeJson(keys.guest, { mode, guest: nextGuest } satisfies StoredGuest);
    else await removeKey(keys.guest);
  },
}));

/** Test helper: back to a fresh, un-bootstrapped session. */
export function resetSession(): void {
  useSession.setState(initialMode);
}
