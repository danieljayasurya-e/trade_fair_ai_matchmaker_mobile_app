import type { z } from 'zod';
import { ApiError, type ApiClient } from './client';
import {
  apiErrorBodySchema,
  bookmarksSchema,
  guestSchema,
  healthSchema,
  metaSchema,
  recommendationsResponseSchema,
  routeSchema,
} from './schemas';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs: number;
}

export function createHttpClient(baseUrl: string, defaultTimeoutMs = 10_000): ApiClient {
  async function request<T>(
    method: Method,
    path: string,
    schema: z.ZodType<T>,
    { body, signal, timeoutMs }: RequestOptions = { timeoutMs: defaultTimeoutMs },
  ): Promise<T> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onCallerAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', onCallerAbort);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch {
      if (timedOut) throw new ApiError('TIMEOUT', `Request timed out after ${timeoutMs} ms`);
      if (signal?.aborted) throw new ApiError('ABORTED', 'Request was cancelled');
      // Covers no network, wrong IP and cleartext HTTP blocked by the OS.
      throw new ApiError('NETWORK', `Can't reach ${baseUrl}`);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onCallerAbort);
    }

    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // Empty or non-JSON body; handled below.
    }

    if (!res.ok) {
      const parsed = apiErrorBodySchema.safeParse(json);
      const code =
        res.status === 404 ? 'NOT_FOUND' : res.status === 400 ? 'BAD_REQUEST' : 'SERVER';
      throw new ApiError(
        parsed.success ? parsed.data.error.code : code,
        parsed.success ? parsed.data.error.message : `Server error (${res.status})`,
        res.status,
        parsed.success ? parsed.data.error.details : undefined,
      );
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ApiError('INVALID_RESPONSE', 'Response failed validation', res.status, parsed.error.issues);
    }
    return parsed.data;
  }

  const opts = (signal?: AbortSignal, body?: unknown, timeoutMs = defaultTimeoutMs) => ({
    signal,
    body,
    timeoutMs,
  });
  const guestPath = (id: string) => `/api/guests/${encodeURIComponent(id)}`;
  const bookmarkPath = (id: string, exhibitorId: string) =>
    `${guestPath(id)}/bookmarks/${encodeURIComponent(exhibitorId)}`;

  return {
    kind: 'http',
    health: (signal) => request('GET', '/api/health', healthSchema, opts(signal, undefined, 3_000)),
    getMeta: (signal) => request('GET', '/api/meta', metaSchema, opts(signal)),
    createGuest: (input, signal) => request('POST', '/api/guests', guestSchema, opts(signal, input)),
    getGuest: (id, signal) => request('GET', guestPath(id), guestSchema, opts(signal)),
    updateGuest: (id, input, signal) => request('PUT', guestPath(id), guestSchema, opts(signal, input)),
    getRecommendations: (id, signal) =>
      request('GET', `${guestPath(id)}/recommendations`, recommendationsResponseSchema, opts(signal)),
    getBookmarks: (id, signal) => request('GET', `${guestPath(id)}/bookmarks`, bookmarksSchema, opts(signal)),
    addBookmark: (id, exhibitorId, signal) =>
      request('PUT', bookmarkPath(id, exhibitorId), bookmarksSchema, opts(signal)),
    removeBookmark: (id, exhibitorId, signal) =>
      request('DELETE', bookmarkPath(id, exhibitorId), bookmarksSchema, opts(signal)),
    getRoute: (id, signal) => request('GET', `${guestPath(id)}/route`, routeSchema, opts(signal)),
  };
}
