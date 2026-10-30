import { create } from 'zustand';
import { DEFAULT_FILTERS, type Filters } from '../features/results/filtering';

type ListKey = 'industries' | 'halls' | 'products';

interface FiltersState extends Filters {
  set: (patch: Partial<Filters>) => void;
  toggle: (key: ListKey, value: string) => void;
  clearFilters: () => void;
}

export const useFilters = create<FiltersState>((set) => ({
  ...DEFAULT_FILTERS,
  set: (patch) => set(patch),
  toggle: (key, value) =>
    set((s) => ({
      [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value],
    })),
  // Keeps sort order and search text; those are not "filters" in the chip row.
  clearFilters: () => set({ minScore: 0, industries: [], halls: [], products: [] }),
}));

export function selectFilters(s: FiltersState): Filters {
  return {
    minScore: s.minScore,
    industries: s.industries,
    halls: s.halls,
    products: s.products,
    sortBy: s.sortBy,
    search: s.search,
  };
}
