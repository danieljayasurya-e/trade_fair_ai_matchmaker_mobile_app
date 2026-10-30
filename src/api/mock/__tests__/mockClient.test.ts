import { clearAllStorage } from '../../../storage/storage';
import { ApiError } from '../../client';
import { SAMPLE_PROFILES } from '../fixtures';
import { createMockClient } from '../mockClient';

const profile = SAMPLE_PROFILES[0].profile;

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
    const updated = await client.updateGuest(guest.id, { ...profile, interests: ['Robotics'] });
    expect(updated.interests).toEqual(['Robotics']);
    expect(updated.updatedAt > guest.updatedAt).toBe(true);
  });

  it('adds bookmarks idempotently and removes them', async () => {
    const guest = await client.createGuest(profile);
    await client.addBookmark(guest.id, 'ex-a01');
    const twice = await client.addBookmark(guest.id, 'ex-a01');
    expect(twice.exhibitorIds).toEqual(['ex-a01']);
    const removed = await client.removeBookmark(guest.id, 'ex-a01');
    expect(removed.exhibitorIds).toEqual([]);
  });

  it('orders the route by hall, then booth in natural order', async () => {
    const guest = await client.createGuest(profile);
    for (const id of ['ex-b04', 'ex-a10', 'ex-a01', 'ex-a04']) await client.addBookmark(guest.id, id);
    const route = await client.getRoute(guest.id);
    expect(route.halls.map((h) => h.hall)).toEqual(['A', 'B']);
    expect(route.halls[0].stalls.map((s) => s.exhibitor.booth)).toEqual(['A-2', 'A-10', 'A-30']);
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
