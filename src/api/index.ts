import { env } from '../config/env';
import type { ApiClient } from './client';
import { createHttpClient } from './httpClient';
import { createMockClient } from './mock/mockClient';

export type ApiMode = ApiClient['kind'];

const clients: Partial<Record<ApiMode, ApiClient>> = {};

export function getClient(mode: ApiMode): ApiClient {
  return (clients[mode] ??=
    mode === 'mock' ? createMockClient() : createHttpClient(env.apiUrl, env.requestTimeoutMs));
}
