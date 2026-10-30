import type { ApiClient } from '../../api/client';
import { keys, readJson, writeJson } from '../../storage/storage';

/** A bookmark change made while offline, replayed when the network returns. */
export interface BookmarkOp {
  exhibitorId: string;
  saved: boolean;
}

/** Adds an op; a later op for the same stall replaces the earlier one (last write wins). */
export function enqueueOp(queue: BookmarkOp[], op: BookmarkOp): BookmarkOp[] {
  return [...queue.filter((q) => q.exhibitorId !== op.exhibitorId), op];
}

/** Applies pending ops on top of a bookmark list (e.g. the server's) so the UI shows the queued intent. */
export function applyOps(ids: string[], queue: BookmarkOp[]): string[] {
  const set = new Set(ids);
  for (const op of queue) {
    if (op.saved) set.add(op.exhibitorId);
    else set.delete(op.exhibitorId);
  }
  return [...set];
}

export async function loadQueue(mode: string, guestId: string): Promise<BookmarkOp[]> {
  return (await readJson<BookmarkOp[]>(keys.bookmarkQueue(mode, guestId))) ?? [];
}

export async function queueOp(mode: string, guestId: string, op: BookmarkOp): Promise<BookmarkOp[]> {
  const next = enqueueOp(await loadQueue(mode, guestId), op);
  await writeJson(keys.bookmarkQueue(mode, guestId), next);
  return next;
}

/**
 * Replays queued ops in order. Stops at the first failure and keeps the rest queued.
 * Returns how many ops were sent.
 */
export async function flushQueue(client: ApiClient, guestId: string): Promise<number> {
  const queue = await loadQueue(client.kind, guestId);
  let sent = 0;
  for (const op of queue) {
    try {
      if (op.saved) await client.addBookmark(guestId, op.exhibitorId);
      else await client.removeBookmark(guestId, op.exhibitorId);
      sent += 1;
    } catch {
      break;
    }
  }
  await writeJson(keys.bookmarkQueue(client.kind, guestId), queue.slice(sent));
  return sent;
}
