import { create } from 'zustand';

interface MatchTimingState {
  /** End-to-end time of the last recommendations request; null until one finishes this session. */
  ms: number | null;
  set: (ms: number) => void;
}

export const useMatchTiming = create<MatchTimingState>((set) => ({
  ms: null,
  set: (ms) => set({ ms }),
}));

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)} s`;
}
