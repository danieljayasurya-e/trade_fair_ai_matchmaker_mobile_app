import { keys, readJson, writeJson } from '../../storage/storage';
import { ApiError, type ApiClient } from '../client';
import { guestInputSchema, type Guest, type GuestInput } from '../schemas';
import { planRoute } from '../../features/visit/route';
import { EXHIBITORS, META } from './fixtures';
import { recommend } from './scorer';

interface MockOptions {
  minDelayMs?: number;
  maxDelayMs?: number;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ApiError('ABORTED', 'Request was cancelled'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new ApiError('ABORTED', 'Request was cancelled'));
    });
  });
}

export function createMockClient({ minDelayMs = 150, maxDelayMs = 400 }: MockOptions = {}): ApiClient {
  const wait = (signal?: AbortSignal) =>
    delay(minDelayMs + Math.random() * (maxDelayMs - minDelayMs), signal);

  async function loadGuests(): Promise<Record<string, Guest>> {
    return (await readJson<Record<string, Guest>>(keys.mockGuests)) ?? {};
  }

  async function getGuest(id: string): Promise<Guest> {
    const guest = (await loadGuests())[id];
    if (!guest) throw new ApiError('NOT_FOUND', 'Guest not found', 404);
    return guest;
  }

  async function saveGuest(guest: Guest): Promise<Guest> {
    const all = await loadGuests();
    all[guest.id] = guest;
    await writeJson(keys.mockGuests, all);
    return guest;
  }

  function validate(input: GuestInput): GuestInput {
    const parsed = guestInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ApiError('BAD_REQUEST', 'Invalid guest profile', 400, parsed.error.issues);
    }
    return parsed.data;
  }

  async function readBookmarks(guestId: string): Promise<string[]> {
    return (await readJson<string[]>(keys.mockBookmarks(guestId))) ?? [];
  }

  return {
    kind: 'mock',
    async health() {
      return { ok: true, db: 'mock', model: 'mock-scorer' };
    },
    async getMeta(signal) {
      await wait(signal);
      return META;
    },
    async createGuest(input, signal) {
      await wait(signal);
      const now = new Date().toISOString();
      return saveGuest({ ...validate(input), id: `mock-${Date.now().toString(36)}`, updatedAt: now });
    },
    async updateGuest(id, input, signal) {
      await wait(signal);
      const existing = await getGuest(id);
      return saveGuest({ ...existing, ...validate(input), updatedAt: new Date().toISOString() });
    },
    async getRecommendations(guestId, signal) {
      const started = Date.now();
      const guest = await getGuest(guestId);
      await wait(signal);
      const { results, total } = recommend(guest, EXHIBITORS);
      return { results, total, latencyMs: Date.now() - started };
    },
    async getBookmarks(guestId, signal) {
      await wait(signal);
      return { exhibitorIds: await readBookmarks(guestId) };
    },
    async addBookmark(guestId, exhibitorId, signal) {
      await wait(signal);
      const ids = await readBookmarks(guestId);
      const next = ids.includes(exhibitorId) ? ids : [...ids, exhibitorId];
      await writeJson(keys.mockBookmarks(guestId), next);
      return { exhibitorIds: next };
    },
    async removeBookmark(guestId, exhibitorId, signal) {
      await wait(signal);
      const next = (await readBookmarks(guestId)).filter((id) => id !== exhibitorId);
      await writeJson(keys.mockBookmarks(guestId), next);
      return { exhibitorIds: next };
    },
    async getRoute(guestId, signal) {
      const guest = await getGuest(guestId);
      const ids = new Set(await readBookmarks(guestId));
      await wait(signal);
      const stalls = recommend(guest, EXHIBITORS, EXHIBITORS.length).results.filter((r) =>
        ids.has(r.exhibitor.id),
      );
      return planRoute(stalls);
    },
  };
}
