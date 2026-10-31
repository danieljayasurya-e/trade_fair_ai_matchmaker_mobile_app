import { naturalCompare } from '../../utils/naturalSort';

// The API gives a booth's row and number but no coordinates, so the map is a schematic:
// one track per row, with each booth placed along it by number.

export const MAP_MAX_BOOTH = 90;

export function boothNumber(booth: string): number {
  const m = booth.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 1;
}

/** Rows from the API plus any the stalls mention, in natural order. */
export function mapRows(metaRows: string[], stallRows: string[]): string[] {
  return [...new Set([...metaRows, ...stallRows])].sort(naturalCompare);
}

export interface Placeable {
  key: string;
  row: string;
  booth: string;
}

export interface Placed<T> {
  item: T;
  rowIndex: number;
  /** 0–1 along the row. */
  x: number;
  /** Which lane inside the row, so neighbouring pins don't cover each other. */
  lane: number;
}

/**
 * Places pins along their rows. `minGap` is the smallest distance (as a fraction of the row)
 * two pins in one lane may have. With no free lane, a pin goes in the lane with the most room.
 */
export function placePins<T extends Placeable>(pins: T[], rows: string[], minGap: number, laneCount: number): Placed<T>[] {
  const max = Math.max(MAP_MAX_BOOTH, ...pins.map((p) => boothNumber(p.booth)));
  const lastInLane = new Map<string, number[]>();
  const sorted = [...pins].sort(
    (a, b) => boothNumber(a.booth) - boothNumber(b.booth) || a.key.localeCompare(b.key),
  );

  const placed = new Map<string, Placed<T>>();
  for (const item of sorted) {
    const x = (boothNumber(item.booth) - 1) / (max - 1);
    const lanes = lastInLane.get(item.row) ?? Array.from({ length: laneCount }, () => -Infinity);
    let lane = lanes.findIndex((last) => x - last >= minGap);
    if (lane === -1) lane = lanes.indexOf(Math.min(...lanes));
    lanes[lane] = x;
    lastInLane.set(item.row, lanes);
    placed.set(item.key, { item, rowIndex: Math.max(0, rows.indexOf(item.row)), x, lane });
  }
  // Back in the caller's order, which is what the route line follows.
  return pins.map((p) => placed.get(p.key)!);
}
