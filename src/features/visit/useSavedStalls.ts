import { useMemo } from 'react';
import { useBookmarks, useRecommendations, useVisitRoute } from '../../api/queries';
import { planRoute, savedStallsFrom } from './route';

/**
 * Bookmarks are the source of truth for *which* stalls; details come from the route
 * response (covers stalls outside the current top 30) or, offline, from the results.
 */
export function useSavedStalls() {
  const recs = useRecommendations();
  const bookmarks = useBookmarks();
  const routeQuery = useVisitRoute();

  return useMemo(() => {
    const ids = new Set(bookmarks.data?.exhibitorIds ?? []);
    const fromRoute = routeQuery.data?.halls.flatMap((h) => h.stalls) ?? [];
    const saved = savedStallsFrom(ids, fromRoute, recs.data?.results ?? []);
    return { saved, savedIds: ids, route: planRoute(saved) };
  }, [bookmarks.data, routeQuery.data, recs.data]);
}
