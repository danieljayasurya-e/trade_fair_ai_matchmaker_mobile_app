import { ApiError, type ApiClient } from '../../../api/client';
import { clearAllStorage } from '../../../storage/storage';
import { applyOps, enqueueOp, flushQueue, loadQueue, queueOp } from '../queue';

beforeEach(() => clearAllStorage());

describe('enqueueOp / applyOps', () => {
  it('collapses ops for the same stall, last write wins', () => {
    let q = enqueueOp([], { exhibitorId: 'a', saved: true });
    q = enqueueOp(q, { exhibitorId: 'b', saved: true });
    q = enqueueOp(q, { exhibitorId: 'a', saved: false });
    expect(q).toEqual([
      { exhibitorId: 'b', saved: true },
      { exhibitorId: 'a', saved: false },
    ]);
  });

  it('applies pending ops on top of the server list', () => {
    expect(applyOps(['a', 'b'], [{ exhibitorId: 'a', saved: false }, { exhibitorId: 'c', saved: true }]).sort()).toEqual([
      'b',
      'c',
    ]);
  });
});

function fakeClient(fail?: (id: string) => boolean) {
  const calls: string[] = [];
  const client = {
    kind: 'http',
    addBookmark: jest.fn(async (_g: string, id: string) => {
      if (fail?.(id)) throw new ApiError('NETWORK', 'down');
      calls.push(`+${id}`);
      return { exhibitorIds: [] };
    }),
    removeBookmark: jest.fn(async (_g: string, id: string) => {
      if (fail?.(id)) throw new ApiError('NETWORK', 'down');
      calls.push(`-${id}`);
      return { exhibitorIds: [] };
    }),
  } as unknown as ApiClient;
  return { client, calls };
}

describe('offline queue persistence and flush', () => {
  it('persists queued ops per mode and guest', async () => {
    await queueOp('http', 'g1', { exhibitorId: 'a', saved: true });
    expect(await loadQueue('http', 'g1')).toEqual([{ exhibitorId: 'a', saved: true }]);
    expect(await loadQueue('http', 'g2')).toEqual([]);
    expect(await loadQueue('mock', 'g1')).toEqual([]);
  });

  it('replays ops in order and empties the queue', async () => {
    await queueOp('http', 'g1', { exhibitorId: 'a', saved: true });
    await queueOp('http', 'g1', { exhibitorId: 'b', saved: false });
    const { client, calls } = fakeClient();
    expect(await flushQueue(client, 'g1')).toBe(2);
    expect(calls).toEqual(['+a', '-b']);
    expect(await loadQueue('http', 'g1')).toEqual([]);
  });

  it('stops at the first failure and keeps the rest queued', async () => {
    await queueOp('http', 'g1', { exhibitorId: 'a', saved: true });
    await queueOp('http', 'g1', { exhibitorId: 'b', saved: true });
    await queueOp('http', 'g1', { exhibitorId: 'c', saved: true });
    const { client, calls } = fakeClient((id) => id === 'b');
    expect(await flushQueue(client, 'g1')).toBe(1);
    expect(calls).toEqual(['+a']);
    expect(await loadQueue('http', 'g1')).toEqual([
      { exhibitorId: 'b', saved: true },
      { exhibitorId: 'c', saved: true },
    ]);
  });
});
