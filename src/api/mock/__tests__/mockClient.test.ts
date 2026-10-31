import { clearAllStorage } from '../../../storage/storage';
import { ApiError } from '../../client';
import { EXHIBITORS, SAMPLE_PROFILES } from '../fixtures';
import { createMockClient } from '../mockClient';

const profile = SAMPLE_PROFILES[0].profile;
const exhibitorId = EXHIBITORS[0].id;

beforeEach(() => {
  clearAllStorage();
});

describe('mock client', () => {
  const client = createMockClient({ minDelayMs: 0, maxDelayMs: 1 });

  it('creates a guest and returns recommendations with latency', async () => {
    const guest = await client.createGuest(profile);
    expect(guest.id).toMatch(/^mock-/);
    const res = await client.getRecommendations(guest.id);
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('rejects an invalid profile with BAD_REQUEST', async () => {
    await expect(client.createGuest({ ...profile, name: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('returns NOT_FOUND for an unknown guest', async () => {
    await expect(client.getRecommendations('nope')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('bumps updatedAt on update', async () => {
    const guest = await client.createGuest(profile);
    await new Promise<void>((r) => setTimeout(r, 5));
    const updated = await client.updateGuest(guest.id, { ...profile, interests: ['Laser Cleaning'] });
    expect(updated.interests).toEqual(['Laser Cleaning']);
    expect(updated.updatedAt > guest.updatedAt).toBe(true);
  });

  it('adds bookmarks idempotently and removes them', async () => {
    const guest = await client.createGuest(profile);
    await client.addBookmark(guest.id, exhibitorId);
    const twice = await client.addBookmark(guest.id, exhibitorId);
    expect(twice.exhibitorIds).toEqual([exhibitorId]);
    const removed = await client.removeBookmark(guest.id, exhibitorId);
    expect(removed.exhibitorIds).toEqual([]);
    const again = await client.removeBookmark(guest.id, 'not-saved');
    expect(again.exhibitorIds).toEqual([]);
  });

  it('rejects saving an unknown exhibitor', async () => {
    const guest = await client.createGuest(profile);
    await expect(client.addBookmark(guest.id, 'nope')).rejects.toMatchObject({ code: 'EXHIBITOR_NOT_FOUND', status: 404 });
  });

  it('returns a guest by id', async () => {
    const guest = await client.createGuest(profile);
    await expect(client.getGuest(guest.id)).resolves.toEqual(guest);
    await expect(client.getGuest('nope')).rejects.toMatchObject({ status: 404 });
  });

  it('orders the route by row, then booth in natural order', async () => {
    const guest = await client.createGuest(profile);
    const { results } = await client.getRecommendations(guest.id);
    const stalls = results.slice(0, 8).map((r) => r.exhibitor);
    for (const s of stalls) await client.addBookmark(guest.id, s.id);
    const route = await client.getRoute(guest.id);
    const rows = route.halls.map((h) => h.hall);
    expect(rows).toEqual([...new Set(stalls.map((s) => s.hall))].sort());
    for (const h of route.halls) {
      const numbers = h.stalls.map((s) => Number(s.exhibitor.booth.split(' ')[1]));
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    }
  });

  it('honours an abort signal', async () => {
    const slow = createMockClient({ minDelayMs: 200, maxDelayMs: 201 });
    const controller = new AbortController();
    const pending = slow.getMeta(controller.signal);
    controller.abort();
    await expect(pending).rejects.toBeInstanceOf(ApiError);
    await expect(pending).rejects.toMatchObject({ code: 'ABORTED' });
  });
});
