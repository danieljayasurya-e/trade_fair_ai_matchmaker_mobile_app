import type { Guest } from '../../api/schemas';

/**
 * Last write wins by `updatedAt`. True when `incoming` is older than what we already have
 * for the same guest, so it must not overwrite local state.
 */
export function isStaleGuest(incoming: Guest, current: Guest | null): boolean {
  if (!current || current.id !== incoming.id) return false;
  const a = Date.parse(incoming.updatedAt);
  const b = Date.parse(current.updatedAt);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return a < b;
}
