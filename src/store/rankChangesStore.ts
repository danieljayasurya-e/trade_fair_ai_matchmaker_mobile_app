import { create } from 'zustand';

export const RANK_BADGE_MS = 5_000;

interface RankChangesState {
  /** exhibitorId → rank before the last profile edit; null when no badges should show. */
  previous: Record<string, number> | null;
  show: (previous: Record<string, number>) => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useRankChanges = create<RankChangesState>((set) => ({
  previous: null,
  show(previous) {
    clearTimeout(timer);
    set({ previous });
    timer = setTimeout(() => set({ previous: null }), RANK_BADGE_MS);
  },
}));

/** Positive = moved up. 'new' = entered the list. 0 = unchanged or no comparison. */
export function rankDelta(previous: Record<string, number> | null, id: string, rank: number): number | 'new' {
  if (!previous) return 0;
  const before = previous[id];
  return before === undefined ? 'new' : before - rank;
}
