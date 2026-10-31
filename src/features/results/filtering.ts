import type { Recommendation } from '../../api/schemas';
import { naturalCompare } from '../../utils/naturalSort';

export type SortBy = 'score' | 'hall' | 'name';

export interface Filters {
  minScore: number;
  industries: string[];
  /** Booth rows ("LC"); the API calls them halls. */
  halls: string[];
  /** Product categories: exhibitor tags from the taxonomy. */
  categories: string[];
  savedOnly: boolean;
  sortBy: SortBy;
  search: string;
}

export const DEFAULT_FILTERS: Filters = {
  minScore: 0,
  industries: [],
  halls: [],
  categories: [],
  savedOnly: false,
  sortBy: 'score',
  search: '',
};

export const MIN_SCORE_OPTIONS = [0, 60, 80] as const;

function matchesSearch(r: Recommendation, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    r.exhibitor.name.toLowerCase().includes(needle) ||
    r.exhibitor.booth.toLowerCase().includes(needle) ||
    r.exhibitor.products.some((p) => p.toLowerCase().includes(needle)) ||
    r.exhibitor.tags.some((t) => t.toLowerCase().includes(needle))
  );
}

export function applyFilters(
  results: Recommendation[],
  f: Filters,
  savedIds: ReadonlySet<string> = new Set(),
): Recommendation[] {
  const q = f.search.trim();
  const filtered = results.filter(
    (r) =>
      r.score >= f.minScore &&
      (f.industries.length === 0 || r.exhibitor.industries.some((i) => f.industries.includes(i))) &&
      (f.halls.length === 0 || f.halls.includes(r.exhibitor.hall)) &&
      (f.categories.length === 0 || r.exhibitor.tags.some((t) => f.categories.includes(t))) &&
      (!f.savedOnly || savedIds.has(r.exhibitor.id)) &&
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
  return (
    (f.minScore > 0 ? 1 : 0) + f.industries.length + f.halls.length + f.categories.length + (f.savedOnly ? 1 : 0)
  );
}

export interface Facet {
  value: string;
  count: number;
}

function toFacets(counts: Map<string, number>, compare: (a: string, b: string) => number): Facet[] {
  return [...counts.entries()]
    .sort(([a], [b]) => compare(a, b))
    .map(([value, count]) => ({ value, count }));
}

/** Distinct facet values in the current results with how many results have each, for the filter sheet. */
export function facetsOf(results: Recommendation[]) {
  const industries = new Map<string, number>();
  const halls = new Map<string, number>();
  const categories = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const r of results) {
    r.exhibitor.industries.forEach((i) => bump(industries, i));
    bump(halls, r.exhibitor.hall);
    r.exhibitor.tags.forEach((t) => bump(categories, t));
  }
  const alpha = (a: string, b: string) => a.localeCompare(b);
  return {
    industries: toFacets(industries, alpha),
    halls: toFacets(halls, naturalCompare),
    categories: toFacets(categories, alpha),
  };
}
