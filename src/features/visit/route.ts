import type { Recommendation, Route } from '../../api/schemas';
import { naturalCompare } from '../../utils/naturalSort';

/** Groups stalls by hall (A, B, C…) and orders each hall by booth in natural order (B-2 before B-10). */
export function planRoute(stalls: Recommendation[]): Route {
  const byHall = new Map<string, Recommendation[]>();
  for (const s of stalls) {
    const list = byHall.get(s.exhibitor.hall) ?? [];
    list.push(s);
    byHall.set(s.exhibitor.hall, list);
  }
  return {
    halls: [...byHall.entries()]
      .sort(([a], [b]) => naturalCompare(a, b))
      .map(([hall, list]) => ({
        hall,
        stalls: [...list].sort(
          (a, b) => naturalCompare(a.exhibitor.booth, b.exhibitor.booth) || a.exhibitor.id.localeCompare(b.exhibitor.id),
        ),
      })),
  };
}

/** Bookmarked stalls with full details, from whichever sources know them (route response, current results). */
export function savedStallsFrom(savedIds: ReadonlySet<string>, ...sources: Recommendation[][]): Recommendation[] {
  const byId = new Map<string, Recommendation>();
  for (const source of sources) {
    for (const r of source) {
      // Earlier sources win; callers pass the freshest first.
      if (savedIds.has(r.exhibitor.id) && !byId.has(r.exhibitor.id)) byId.set(r.exhibitor.id, r);
    }
  }
  return [...byId.values()].sort((a, b) => b.score - a.score || a.rank - b.rank);
}
