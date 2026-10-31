import { boothNumber, mapRows, MAP_MAX_BOOTH, placePins } from '../mapLayout';

const pin = (key: string, booth: string) => ({ key, booth, row: booth.split(' ')[0] });
const ROWS = ['LA', 'LB'];

describe('boothNumber', () => {
  it('reads the number from a booth code', () => {
    expect(boothNumber('LC 24')).toBe(24);
    expect(boothNumber('LD 06')).toBe(6);
    expect(boothNumber('unknown')).toBe(1);
  });
});

describe('mapRows', () => {
  it('merges meta and stall rows in natural order', () => {
    expect(mapRows(['LB', 'LA'], ['LC', 'LA'])).toEqual(['LA', 'LB', 'LC']);
  });
});

describe('placePins', () => {
  it('places booths along the row by number', () => {
    const [first, last] = placePins([pin('a', 'LA 1'), pin('b', `LB ${MAP_MAX_BOOTH}`)], ROWS, 0.02, 3);
    expect(first).toMatchObject({ rowIndex: 0, x: 0 });
    expect(last).toMatchObject({ rowIndex: 1, x: 1 });
  });

  it('keeps the caller order, which the route line follows', () => {
    const placed = placePins([pin('b', 'LA 50'), pin('a', 'LA 2')], ROWS, 0.02, 3);
    expect(placed.map((p) => p.item.key)).toEqual(['b', 'a']);
  });

  it('moves neighbours and shared booths to another lane', () => {
    const placed = placePins([pin('a', 'LA 43'), pin('b', 'LA 44'), pin('c', 'LA 44')], ROWS, 0.05, 3);
    expect(new Set(placed.map((p) => p.lane)).size).toBe(3);
  });

  it('still places every pin when lanes run out', () => {
    const many = Array.from({ length: 6 }, (_, i) => pin(String(i), 'LA 10'));
    const placed = placePins(many, ROWS, 0.05, 3);
    expect(placed).toHaveLength(6);
    for (const p of placed) expect(p.lane).toBeLessThan(3);
  });

  it('stretches the scale for a booth past the usual range', () => {
    const [p] = placePins([pin('a', 'LA 120')], ROWS, 0.02, 3);
    expect(p.x).toBe(1);
  });
});
