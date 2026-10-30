import type {
  Bookmarks,
  Guest,
  GuestInput,
  Health,
  Meta,
  RecommendationsResponse,
  Route,
} from './schemas';

/** One interface, two implementations: the real HTTP API and the offline mock. */
export interface ApiClient {
  readonly kind: 'http' | 'mock';
  health(signal?: AbortSignal): Promise<Health>;
  getMeta(signal?: AbortSignal): Promise<Meta>;
  createGuest(input: GuestInput, signal?: AbortSignal): Promise<Guest>;
  updateGuest(id: string, input: GuestInput, signal?: AbortSignal): Promise<Guest>;
  getRecommendations(guestId: string, signal?: AbortSignal): Promise<RecommendationsResponse>;
  getBookmarks(guestId: string, signal?: AbortSignal): Promise<Bookmarks>;
  addBookmark(guestId: string, exhibitorId: string, signal?: AbortSignal): Promise<Bookmarks>;
  removeBookmark(guestId: string, exhibitorId: string, signal?: AbortSignal): Promise<Bookmarks>;
  getRoute(guestId: string, signal?: AbortSignal): Promise<Route>;
}

export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'INVALID_RESPONSE'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'SERVER'
  | (string & {});

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** Message safe to show to a guest. */
export function describeError(e: unknown): string {
  if (isApiError(e)) {
    switch (e.code) {
      case 'NETWORK':
        return "Can't reach the server. Check Wi-Fi or switch to demo data.";
      case 'TIMEOUT':
        return 'The server took too long to respond.';
      case 'INVALID_RESPONSE':
        return 'The server sent data we could not read.';
      default:
        return e.message;
    }
  }
  return 'Something went wrong.';
}
