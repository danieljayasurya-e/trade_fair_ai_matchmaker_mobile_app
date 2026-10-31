import type { Exhibitor } from '../../api/schemas';

/** `hall` in the API is a booth row; the whole show is in one hall. */
export const HALL_NAME = 'Hall 1';

export function rowLabel(row: string): string {
  return `Row ${row}`;
}

/** "Hall 1 · Booth LC 24 · Bengaluru, India" */
export function fullLocation(e: Exhibitor): string {
  const place = [e.city, e.country].filter(Boolean).join(', ');
  return [HALL_NAME, `Booth ${e.booth}`, place].filter(Boolean).join(' · ');
}

/** "Arjun Mehta" → "Arjun M." */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

/** Up to two capital initials, for avatars. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/** The AI-written descriptions can carry citation marks like "[1][3]". */
export function cleanDescription(text: string): string {
  return text.replace(/\s*\[\d+\]/g, '').trim();
}
