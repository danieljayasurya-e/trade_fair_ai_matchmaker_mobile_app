import type { Recommendation } from '../../../api/schemas';
import { naturalCompare } from '../../../utils/naturalSort';
import { activeFilterCount, applyFilters, DEFAULT_FILTERS, facetsOf } from '../filtering';

function rec(rank: number, name: string, hall: string, booth: string, score: number, extra: Partial<Recommendation['exhibitor']> = {}): Recommendation {
  return {
    rank,
    score,
    matchedOn: [],
    reason: '',
    insights: [],
    factors: { semantic: 0, interest: 0, intent: 0, buyerFit: 0, g2e: 0, e2g: 0 },
    exhibitor: { id: `ex-${rank}`, name, description: '', products: [], tags: [], industries: [], hall, booth, otherBooths: [], city: '', country: '', ...extra },
  };
}

const results = [
  rec(1, 'Kinetix Automation', 'LA', 'LA 10', 92, { products: ['PLC controllers'], tags: ['Controllers & Software'], industries: ['Manufacturing'] }),
  rec(2, 'GreenWrap', 'LB', 'LB 2', 81, { products: ['Compostable pouches'], tags: ['Laser Cleaning'], industries: ['FMCG'] }),
  rec(3, 'Axion CNC', 'LA', 'LA 2', 64, { products: ['5-axis machining'], tags: ['Laser Cleaning', 'Motion & Positioning'], industries: ['Automotive'] }),
  rec(4, 'SensIQ', 'LC', 'LC 5', 40, { products: ['Vibration sensors'], tags: ['Sensors & Detectors'], industries: ['Manufacturing'] }),
];

describe('applyFilters', () => {
  it('returns everything by rank with default filters', () => {
    expect(applyFilters(results, DEFAULT_FILTERS).map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it('filters by minimum score', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, minScore: 70 }).map((r) => r.rank)).toEqual([1, 2]);
  });

  it('filters by row, industry and product category', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, halls: ['LA'] }).map((r) => r.rank)).toEqual([1, 3]);
    expect(applyFilters(results, { ...DEFAULT_FILTERS, industries: ['Manufacturing'] }).map((r) => r.rank)).toEqual([1, 4]);
    expect(applyFilters(results, { ...DEFAULT_FILTERS, categories: ['Laser Cleaning'] }).map((r) => r.rank)).toEqual([2, 3]);
  });

  it('keeps only saved stalls when asked', () => {
    const saved = new Set(['ex-2', 'ex-4']);
    expect(applyFilters(results, { ...DEFAULT_FILTERS, savedOnly: true }, saved).map((r) => r.rank)).toEqual([2, 4]);
    expect(applyFilters(results, DEFAULT_FILTERS, saved)).toHaveLength(4);
  });

  it('combines filters with AND', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, halls: ['LA'], minScore: 70 }).map((r) => r.rank)).toEqual([1]);
  });

  it('searches name, products and booth case-insensitively', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, search: 'kinetix' }).map((r) => r.rank)).toEqual([1]);
    expect(applyFilters(results, { ...DEFAULT_FILTERS, search: ' SENSORS ' }).map((r) => r.rank)).toEqual([4]);
    expect(applyFilters(results, { ...DEFAULT_FILTERS, search: 'lb 2' }).map((r) => r.rank)).toEqual([2]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, search: 'zzz' })).toEqual([]);
  });

  it('sorts by hall and booth in natural order', () => {
    expect(applyFilters(results, { ...DEFAULT_FILTERS, sortBy: 'hall' }).map((r) => r.exhibitor.booth)).toEqual([
      'LA 2',
      'LA 10',
      'LB 2',
      'LC 5',
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
  it('collects distinct facet values with counts', () => {
    const f = facetsOf(results);
    expect(f.halls).toEqual([
      { value: 'LA', count: 2 },
      { value: 'LB', count: 1 },
      { value: 'LC', count: 1 },
    ]);
    expect(f.industries.map((i) => i.value)).toEqual(['Automotive', 'FMCG', 'Manufacturing']);
    expect(f.categories).toContainEqual({ value: 'Laser Cleaning', count: 2 });
  });

  it('counts active filters, ignoring sort and search', () => {
    expect(activeFilterCount({ ...DEFAULT_FILTERS, sortBy: 'name', search: 'x' })).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, minScore: 60, halls: ['LA', 'LB'], savedOnly: true })).toBe(4);
  });
});

describe('naturalCompare', () => {
  it('orders booth numbers numerically', () => {
    expect(['LB 10', 'LB 2', 'LA 30', 'LB 1'].sort(naturalCompare)).toEqual(['LA 30', 'LB 1', 'LB 2', 'LB 10']);
    expect(['LD 06', 'LD 5', 'LD 10'].sort(naturalCompare)).toEqual(['LD 5', 'LD 06', 'LD 10']);
  });
});
