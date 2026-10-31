const CHUNK = /(\d+)|(\D+)/g;

/** Natural order for booth codes: "LA 2" sorts before "LA 10". Independent of the JS engine's Intl support. */
export function naturalCompare(a: string, b: string): number {
  const ca = a.toLowerCase().match(CHUNK) ?? [];
  const cb = b.toLowerCase().match(CHUNK) ?? [];
  for (let i = 0; i < Math.min(ca.length, cb.length); i++) {
    const x = ca[i];
    const y = cb[i];
    if (x === y) continue;
    const nx = /^\d/.test(x);
    const ny = /^\d/.test(y);
    if (nx && ny) return Number(x) - Number(y) || x.length - y.length;
    if (nx !== ny) return nx ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return ca.length - cb.length;
}
