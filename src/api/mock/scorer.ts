import type { Factors, GuestInput, Recommendation } from '../schemas';
import type { MockExhibitor } from './fixtures';

// Deterministic stand-in for the real engine: token overlap instead of embeddings,
// tag overlap for interests, and the same two-way geometric-mean final score.

const STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'our', 'your', 'you', 'are', 'any', 'anything', 'that', 'this', 'from',
  'need', 'looking', 'interested', 'want', 'plus', 'into', 'also', 'all', 'can', 'use', 'new',
]);

export function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length < 3 || STOPWORDS.has(raw)) continue;
    // Crude stem so "laminate"/"laminates" and "sensor"/"sensors" meet.
    out.add(raw.length > 6 ? raw.slice(0, 6) : raw.replace(/s$/, ''));
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const round3 = (x: number) => Math.round(x * 1000) / 1000;

interface Scored {
  exhibitor: MockExhibitor;
  score: number;
  factors: Factors;
  matchedOn: string[];
  reason: string;
}

export function scoreExhibitor(guest: GuestInput, ex: MockExhibitor): Scored {
  const guestText = tokenize([guest.freeText, guest.jobRole, guest.industry, ...guest.interests].join(' '));
  const intentText = tokenize([guest.freeText, ...guest.interests].join(' '));
  const exText = tokenize([ex.name, ex.description, ...ex.products, ...ex.tags, ...ex.industries].join(' '));

  const shared = overlap(guestText, exText);
  const semantic = clamp01((2 * shared) / Math.sqrt(Math.max(1, guestText.size) * Math.max(1, exText.size)));

  const matchedOn = ex.tags.filter((tag) => guest.interests.includes(tag));
  const interest =
    guest.interests.length === 0 ? 0 : clamp01(matchedOn.length / Math.min(guest.interests.length, ex.tags.length));

  const matchedProducts = ex.products.filter((p) => overlap(tokenize(p), intentText) > 0);
  const verticalMatch = ex.industries.includes(guest.industry);
  const intent = clamp01(matchedProducts.length / ex.products.length + (verticalMatch ? 0.25 : 0));

  const fitParts = [
    ex.target.industries.includes(guest.industry),
    ex.target.seniorities.includes(guest.seniority),
    ex.target.companySizes.includes(guest.companySize),
  ];
  const buyerFit = fitParts.filter(Boolean).length / fitParts.length;

  const g2e = clamp01(0.4 * semantic + 0.4 * interest + 0.2 * intent);
  // Floor keeps a strong product fit visible even when the buyer profile is a partial match.
  const e2g = clamp01(0.25 + 0.75 * buyerFit);
  const score = Math.round(100 * Math.sqrt(g2e * e2g));

  const reasonParts: string[] = [];
  if (matchedProducts.length > 0) reasonParts.push(`Offers ${matchedProducts.slice(0, 2).join(' and ')}`);
  if (matchedOn.length > 0) reasonParts.push(`matches your interest in ${matchedOn.slice(0, 2).join(', ')}`);
  if (buyerFit >= 2 / 3) reasonParts.push(`targets ${guest.seniority} buyers in ${guest.industry}`);
  const reason =
    reasonParts.length > 0
      ? `${reasonParts.join('; ')}.`.replace(/^./, (c) => c.toUpperCase())
      : 'General overlap with your profile.';

  return {
    exhibitor: ex,
    score,
    factors: {
      semantic: round3(semantic),
      interest: round3(interest),
      intent: round3(intent),
      buyerFit: round3(buyerFit),
      g2e: round3(g2e),
      e2g: round3(e2g),
    },
    matchedOn,
    reason,
  };
}

export function recommend(
  guest: GuestInput,
  exhibitors: MockExhibitor[],
  limit = 30,
): { results: Recommendation[]; total: number } {
  const scored = exhibitors
    .map((ex) => scoreExhibitor(guest, ex))
    .filter((s) => s.factors.g2e > 0.05)
    .sort(
      (a, b) =>
        b.score - a.score || b.factors.g2e - a.factors.g2e || a.exhibitor.name.localeCompare(b.exhibitor.name),
    );

  const results = scored.slice(0, limit).map((s, i) => {
    const { tags: _tags, target: _target, ...exhibitor } = s.exhibitor;
    return {
      rank: i + 1,
      exhibitor,
      score: s.score,
      matchedOn: s.matchedOn,
      factors: s.factors,
      reason: s.reason,
    };
  });
  return { results, total: scored.length };
}
