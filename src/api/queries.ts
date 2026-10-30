import { onlineManager, QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { applyOps, flushQueue, loadQueue, queueOp } from '../features/bookmarks/queue';
import { useRankChanges } from '../store/rankChangesStore';
import { useSession } from '../store/sessionStore';
import { keys, readJsonSync, writeJson } from '../storage/storage';
import { getClient } from './index';
import { isApiError } from './client';
import { recommendationsResponseSchema, type Bookmarks, type GuestInput } from './schemas';

const NO_RETRY = new Set(['ABORTED', 'BAD_REQUEST', 'NOT_FOUND', 'INVALID_RESPONSE']);

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // One automatic retry with backoff, except for errors a retry can't fix.
        retry: (count, error) => count < 1 && !(isApiError(error) && NO_RETRY.has(error.code)),
        retryDelay: (attempt) => 800 * 2 ** attempt,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  });
}

export const queryKeys = {
  meta: (mode: string) => ['meta', mode] as const,
  recommendations: (mode: string, guestId: string) => ['recommendations', mode, guestId] as const,
  bookmarks: (mode: string, guestId: string) => ['bookmarks', mode, guestId] as const,
  route: (mode: string, guestId: string) => ['route', mode, guestId] as const,
};

function useApi() {
  const mode = useSession((s) => s.mode);
  // Demo data needs no network, so mock queries never pause while offline.
  const networkMode = mode === 'mock' ? ('always' as const) : ('online' as const);
  return { mode, client: getClient(mode), networkMode };
}

function readCachedRecommendations(guestId: string) {
  const parsed = recommendationsResponseSchema.safeParse(readJsonSync(keys.cachedRecommendations(guestId)));
  return parsed.success ? parsed.data : undefined;
}

export function useMeta() {
  const { mode, client, networkMode } = useApi();
  return useQuery({
    queryKey: queryKeys.meta(mode),
    queryFn: ({ signal }) => client.getMeta(signal),
    staleTime: Infinity,
    networkMode,
  });
}

export function useRecommendations() {
  const { mode, client, networkMode } = useApi();
  const guestId = useSession((s) => s.guest?.id);
  return useQuery({
    queryKey: queryKeys.recommendations(mode, guestId ?? ''),
    enabled: !!guestId,
    networkMode,
    // Last good results render instantly (and offline); marked stale so they refresh when possible.
    initialData: () => (guestId ? readCachedRecommendations(guestId) : undefined),
    initialDataUpdatedAt: 0,
    // TanStack Query aborts the signal when a newer request for the same key starts,
    // so a profile edit cancels the stale request and only the latest result renders.
    queryFn: async ({ signal }) => {
      const data = await client.getRecommendations(guestId!, signal);
      void writeJson(keys.cachedRecommendations(guestId!), data);
      return data;
    },
  });
}

export function useBookmarks() {
  const { mode, client, networkMode } = useApi();
  const guestId = useSession((s) => s.guest?.id);
  return useQuery({
    queryKey: queryKeys.bookmarks(mode, guestId ?? ''),
    enabled: !!guestId,
    networkMode,
    queryFn: async ({ signal }) => {
      const server = await client.getBookmarks(guestId!, signal);
      // Keep showing changes still waiting in the offline queue.
      return { exhibitorIds: applyOps(server.exhibitorIds, await loadQueue(mode, guestId!)) };
    },
  });
}

export function useVisitRoute() {
  const { mode, client, networkMode } = useApi();
  const guestId = useSession((s) => s.guest?.id);
  return useQuery({
    queryKey: queryKeys.route(mode, guestId ?? ''),
    enabled: !!guestId,
    networkMode,
    queryFn: ({ signal }) => client.getRoute(guestId!, signal),
  });
}

/**
 * Bookmark toggle with optimistic UI. Ignores repeat taps on a stall while its previous
 * toggle is in flight. On the live API, changes made offline (or failing with a network
 * error) are queued on the device and replayed by useSyncOnReconnect.
 */
export function useToggleBookmark() {
  const { mode, client } = useApi();
  const guestId = useSession((s) => s.guest?.id) ?? '';
  const qc = useQueryClient();
  const key = queryKeys.bookmarks(mode, guestId);
  const pending = useRef(new Set<string>());

  const mutation = useMutation({
    mutationKey: ['toggleBookmark', mode, guestId],
    networkMode: 'always',
    mutationFn: async ({ exhibitorId, saved }: { exhibitorId: string; saved: boolean }): Promise<Bookmarks> => {
      const queueLocally = async () => {
        await queueOp(mode, guestId, { exhibitorId, saved });
        return qc.getQueryData<Bookmarks>(key) ?? { exhibitorIds: [] };
      };
      if (mode === 'http' && !onlineManager.isOnline()) return queueLocally();
      try {
        return saved ? await client.addBookmark(guestId, exhibitorId) : await client.removeBookmark(guestId, exhibitorId);
      } catch (e) {
        if (mode === 'http' && isApiError(e) && (e.code === 'NETWORK' || e.code === 'TIMEOUT')) return queueLocally();
        throw e;
      }
    },
    onMutate: async ({ exhibitorId, saved }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Bookmarks>(key);
      const ids = previous?.exhibitorIds ?? [];
      qc.setQueryData<Bookmarks>(key, {
        exhibitorIds: saved ? [...new Set([...ids, exhibitorId])] : ids.filter((id) => id !== exhibitorId),
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: (data) => {
      qc.setQueryData(key, data);
      void qc.invalidateQueries({ queryKey: queryKeys.route(mode, guestId) });
    },
    onSettled: (_d, _e, vars) => {
      pending.current.delete(vars.exhibitorId);
    },
  });

  const { mutate } = mutation;
  const toggle = useCallback(
    (exhibitorId: string, saved: boolean) => {
      if (pending.current.has(exhibitorId)) return;
      pending.current.add(exhibitorId);
      mutate({ exhibitorId, saved });
    },
    [mutate],
  );

  return { toggle, error: mutation.error };
}

export function useSaveGuest() {
  const { mode, client } = useApi();
  const guest = useSession((s) => s.guest);
  const setGuest = useSession((s) => s.setGuest);
  const showRankChanges = useRankChanges((s) => s.show);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: GuestInput) =>
      guest ? client.updateGuest(guest.id, input) : client.createGuest(input),
    onSuccess: async (saved) => {
      const recsKey = queryKeys.recommendations(mode, saved.id);
      const before = qc.getQueryData<{ results: { rank: number; exhibitor: { id: string } }[] }>(recsKey);
      if (guest && before) {
        showRankChanges(Object.fromEntries(before.results.map((r) => [r.exhibitor.id, r.rank])));
      }
      setGuest(saved);
      await qc.invalidateQueries({ queryKey: recsKey });
      void qc.invalidateQueries({ queryKey: queryKeys.route(mode, saved.id) });
    },
  });
}

/** When the network returns: replay queued bookmark changes, then resync everything for this guest. */
export function useSyncOnReconnect() {
  const qc = useQueryClient();
  const mode = useSession((s) => s.mode);
  const guestId = useSession((s) => s.guest?.id);

  useEffect(() => {
    if (mode !== 'http' || !guestId) return;
    const client = getClient(mode);
    const sync = async () => {
      await flushQueue(client, guestId);
      await qc.invalidateQueries({
        predicate: (q) => q.queryKey[1] === mode && q.queryKey[2] === guestId,
      });
    };
    if (onlineManager.isOnline()) void sync();
    let wasOnline = onlineManager.isOnline();
    return onlineManager.subscribe((online) => {
      if (online && !wasOnline) void sync();
      wasOnline = online;
    });
  }, [qc, mode, guestId]);
}
