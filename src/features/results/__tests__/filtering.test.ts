import type { Recommendation } from '../../../api/schemas';
import { naturalCompare } from '../../../utils/naturalSort';
import { activeFilterCount, applyFilters, DEFAULT_FILTERS, facetsOf } from '../filtering';

function rec(rank: number, name: string, hall: string, booth: string, score: number, extra: Partial<Recommendation['exhibitor']> = {}): Recommendation {
  return {
    rank,
    score,
    matchedOn: [],
    reason: '',
    factors: { semantic: 0, interest: 0, intent: 0, buyerFit: 0, g2e: 0, e2g: 0 },
    exhibitor: { id: `ex-${rank}`, name, description: '', products: [], industries: [], hall, booth, ...extra },
  };
}

const results = [
  rec(1, 'Kinetix Automation', 'A', 'A-10', 92, { products: ['PLC controllers'], industries: ['Manufacturing'] }),
  rec(2, 'GreenWrap', 'B', 'B-2', 81, { products: ['Compostable pouches'], industries: ['FMCG'] }),
  rec(3, 'Axion CNC', 'A', 'A-2', 64, { products: ['5-axis machining'], industries: ['Automotive'] }),
  rec(4, 'SensIQ', 'C', 'C-5', 40, { products: ['Vibration sensors'], industries: ['Manufacturing'] }),
];

describe('applyFilters', () => {
  it('returns everything by rank with default filters', () => {
    expect(applyFilters(results, DEFAULT_FILTERS).map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it('filters by minimum score', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, minScore: 70 }).map((r) => r.rank)).toEqual([1, 2]);
  });

  it('filters by hall, industry and product', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, halls: ['A'] }).map((r) => r.rank)).toEqual([1, 3]);
    expect(applyFilters(results, { ...DEFAULT_FILTERS, industries: ['Manufacturing'] }).map((r) => r.rank)).toEqual([1, 4]);
    expect(applyFilters(results, { ...DEFAULT_FILTERS, products: ['Compostable pouches'] }).map((r) => r.rank)).toEqual([2]);
  });

  it('combines filters with AND', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, halls: ['A'], minScore: 70 }).map((r) => r.rank)).toEqual([1]);
  });

  it('searches name and products case-insensitively', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, search: 'kinetix' }).map((r) => r.rank)).toEqual([1]);
    expect(applyFilters(results, { ...DEFAULT_FILTERS, search: ' SENSORS ' }).map((r) => r.rank)).toEqual([4]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, search: 'zzz' })).toEqual([]);
  });

  it('sorts by hall and booth in natural order', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, sortBy: 'hall' }).map((r) => r.exhibitor.booth)).toEqual([
      'A-2',
      'A-10',
      'B-2',
      'C-5',
    ]);
  });

  it('sorts by name', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, sortBy: 'name' }).map((r) => r.exhibitor.name)).toEqual([
      'Axion CNC',
      'GreenWrap',
      'Kinetix Automation',
      'SensIQ',
    ]);
  });

  it('does not mutate its input', () => {
    const copy = [...results];
    applyFilters(results, { ...DEFAULT_FILTERS, sortBy: 'name' });
    expect(results).toEqual(copy);
  });
});

describe('facets and counts', () => {
  it('collects distinct facet values', () => {
    const f = facetsOf(results);
    expect(f.halls).toEqual(['A', 'B', 'C']);
    expect(f.industries).toEqual(['Automotive', 'FMCG', 'Manufacturing']);
  });

  it('counts active filters, ignoring sort and search', () => {
    expect(activeFilterCount({ ...DEFAULT_FILTERS, sortBy: 'name', search: 'x' })).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, minScore: 50, halls: ['A', 'B'] })).toBe(3);
  });
});

describe('naturalCompare', () => {
  it('orders booth numbers numerically', () => {
    expect(['B-10', 'B-2', 'A-30', 'B-1'].sort(naturalCompare)).toEqual(['A-30', 'B-1', 'B-2', 'B-10']);
  });
});
