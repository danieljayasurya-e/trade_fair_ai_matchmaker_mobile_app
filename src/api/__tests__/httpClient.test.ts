import { createHttpClient } from '../httpClient';

const BASE = 'http://test.local';

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Partial<Response>>) {
  globalThis.fetch = jest.fn(impl) as unknown as typeof fetch;
}

const jsonResponse = (status: number, body: unknown): Partial<Response> => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

afterEach(() => jest.useRealTimers());

describe('http client', () => {
  it('parses a successful response', async () => {
    mockFetch(async () => jsonResponse(200, { exhibitorIds: ['ex-1'] }));
    const client = createHttpClient(BASE);
    await expect(client.getBookmarks('g1')).resolves.toEqual({ exhibitorIds: ['ex-1'] });
    expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE}/api/guests/g1/bookmarks`, expect.objectContaining({ method: 'GET' }));
  });

  it('saves and removes bookmarks with the id in the path and no body', async () => {
    mockFetch(async () => jsonResponse(200, { exhibitorIds: [] }));
    const client = createHttpClient(BASE);
    await client.addBookmark('g1', 'ex/1');
    await client.removeBookmark('g1', 'ex/1');
    const calls = (globalThis.fetch as jest.Mock).mock.calls as [string, RequestInit][];
    expect(calls.map(([url, init]) => [url, init.method, init.body])).toEqual([
      [`${BASE}/api/guests/g1/bookmarks/ex%2F1`, 'PUT', undefined],
      [`${BASE}/api/guests/g1/bookmarks/ex%2F1`, 'DELETE', undefined],
    ]);
  });

  it('fetches a guest for resync', async () => {
    const guest = { id: 'g1', updatedAt: '2026-10-30T09:15:22.481Z', name: 'A', industry: 'I', jobRole: 'R', seniority: 'S', companySize: '1-10', region: 'R', interests: ['T'], freeText: '' };
    mockFetch(async () => jsonResponse(200, guest));
    await expect(createHttpClient(BASE).getGuest('g1')).resolves.toEqual(guest);
    expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE}/api/guests/g1`, expect.objectContaining({ method: 'GET' }));
  });

  it('keeps the field list of a validation error', async () => {
    const fields = [{ field: 'name', message: 'Please enter your name' }];
    mockFetch(async () => jsonResponse(400, { error: { code: 'VALIDATION_ERROR', message: 'Invalid', details: { fields } } }));
    await expect(createHttpClient(BASE).getMeta()).rejects.toMatchObject({ code: 'VALIDATION_ERROR', details: { fields } });
  });

  it('maps the error envelope on 404', async () => {
    mockFetch(async () => jsonResponse(404, { error: { code: 'GUEST_NOT_FOUND', message: 'No such guest' } }));
    await expect(createHttpClient(BASE).getRecommendations('x')).rejects.toMatchObject({
      code: 'GUEST_NOT_FOUND',
      status: 404,
      message: 'No such guest',
    });
  });

  it('falls back to a status-based code when the error body is not the envelope', async () => {
    mockFetch(async () => jsonResponse(400, 'bad'));
    await expect(createHttpClient(BASE).getMeta()).rejects.toMatchObject({ code: 'BAD_REQUEST', status: 400 });
  });

  it('rejects responses that fail validation', async () => {
    mockFetch(async () => jsonResponse(200, { results: [{ score: 'NaN' }], latencyMs: 1, total: 1 }));
    await expect(createHttpClient(BASE).getRecommendations('g1')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('reports NETWORK when fetch throws', async () => {
    mockFetch(async () => {
      throw new TypeError('Network request failed');
    });
    await expect(createHttpClient(BASE).getMeta()).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('times out', async () => {
    jest.useFakeTimers();
    mockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const pending = createHttpClient(BASE, 10_000).getMeta();
    jest.advanceTimersByTime(10_001);
    await expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('reports ABORTED when the caller cancels', async () => {
    mockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const controller = new AbortController();
    const pending = createHttpClient(BASE).getMeta(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'ABORTED' });
  });
});
