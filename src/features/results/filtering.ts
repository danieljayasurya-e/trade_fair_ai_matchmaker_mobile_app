import type { Recommendation } from '../../api/schemas';
import { naturalCompare } from '../../utils/naturalSort';

export type SortBy = 'score' | 'hall' | 'name';

export interface Filters {
  minScore: number;
  industries: string[];
  halls: string[];
  products: string[];
  sortBy: SortBy;
  search: string;
}

export const DEFAULT_FILTERS: Filters = {
  minScore: 0,
  industries: [],
  halls: [],
  products: [],
  sortBy: 'score',
  search: '',
};

export const MIN_SCORE_OPTIONS = [0, 50, 70, 85] as const;

function matchesSearch(r: Recommendation, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    r.exhibitor.name.toLowerCase().includes(needle) ||
    r.exhibitor.products.some((p) => p.toLowerCase().includes(needle))
  );
}

export function applyFilters(results: Recommendation[], f: Filters): Recommendation[] {
  const q = f.search.trim();
  const filtered = results.filter(
    (r) =>
      r.score >= f.minScore &&
      (f.industries.length === 0 || r.exhibitor.industries.some((i) => f.industries.includes(i))) &&
      (f.halls.length === 0 || f.halls.includes(r.exhibitor.hall)) &&
      (f.products.length === 0 || r.exhibitor.products.some((p) => f.products.includes(p))) &&
      matchesSearch(r, q),
  );

  const sorted = [...filtered];
  switch (f.sortBy) {
    case 'score':
      sorted.sort((a, b) => a.rank - b.rank);
      break;
    case 'hall':
      sorted.sort(
        (a, b) => naturalCompare(a.exhibitor.booth, b.exhibitor.booth) || a.rank - b.rank,
      );
      break;
    case 'name':
      sorted.sort((a, b) => a.exhibitor.name.localeCompare(b.exhibitor.name) || a.rank - b.rank);
      break;
  }
  return sorted;
}

/** Number of active filters, excluding sort and search. */
export function activeFilterCount(f: Filters): number {
  return (f.minScore > 0 ? 1 : 0) + f.industries.length + f.halls.length + f.products.length;
}

/** Distinct facet values present in the current results, for the filter sheet. */
export function facetsOf(results: Recommendation[]) {
  const industries = new Set<string>();
  const halls = new Set<string>();
  const products = new Set<string>();
  for (const r of results) {
    r.exhibitor.industries.forEach((i) => industries.add(i));
    halls.add(r.exhibitor.hall);
    r.exhibitor.products.forEach((p) => products.add(p));
  }
  return {
    industries: [...industries].sort(),
    halls: [...halls].sort(naturalCompare),
    products: [...products].sort(),
  };
}
