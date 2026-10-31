import type { Exhibitor, Factors, GuestInput, Insight, Recommendation } from '../schemas';

// Deterministic stand-in for the real engine: token overlap instead of embeddings,
// tag overlap for interests, and the contract's two-way score.

const STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'our', 'your', 'you', 'are', 'any', 'anything', 'that', 'this', 'from',
  'need', 'looking', 'interested', 'want', 'plus', 'into', 'also', 'all', 'can', 'use', 'new',
]);

export function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length < 3 || STOPWORDS.has(raw)) continue;
    // Crude stem so "laser"/"lasers" and "sensor"/"sensors" meet.
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
  exhibitor: Exhibitor;
  score: number;
  factors: Factors;
  matchedOn: string[];
  reason: string;
  insights: Insight[];
}

export function scoreExhibitor(guest: GuestInput, ex: Exhibitor): Scored {
  const guestText = tokenize([guest.freeText, guest.jobRole, guest.industry, ...guest.interests].join(' '));
  const intentText = tokenize(guest.freeText);
  const exText = tokenize([ex.name, ex.description, ...ex.products, ...ex.tags, ...ex.industries].join(' '));

  const shared = overlap(guestText, exText);
  const semantic = clamp01((2 * shared) / Math.sqrt(Math.max(1, guestText.size) * Math.max(1, exText.size)));

  const matchedOn = ex.tags.filter((tag) => guest.interests.includes(tag));
  const interest = guest.interests.length === 0 ? 0 : clamp01(matchedOn.length / guest.interests.length);

  const sellsToSector = ex.industries.includes(guest.industry);
  const offers = [...ex.tags, ...ex.products];
  const matchedOffers = offers.filter((p) => overlap(tokenize(p), intentText) > 0);
  const intent = clamp01((offers.length > 0 ? matchedOffers.length / offers.length : 0) + (sellsToSector ? 0.25 : 0));

  const buyerFit = sellsToSector ? 1 : 0;

  const g2e = clamp01(0.4 * semantic + 0.4 * interest + 0.2 * intent);
  const e2g = 0.7 + 0.3 * buyerFit;
  const score = Math.round(100 * Math.sqrt(g2e * e2g));

  const matchedProducts = ex.products.filter((p) => overlap(tokenize(p), intentText) > 0);
  const reasonParts: string[] = [];
  if (matchedProducts.length > 0) reasonParts.push(`Offers ${matchedProducts.slice(0, 2).join(' and ')}`);
  if (matchedOn.length > 0) reasonParts.push(`matches your interest in ${matchedOn.slice(0, 2).join(', ')}`);
  const reason =
    reasonParts.length > 0
      ? `${reasonParts.join('; ')}.`.replace(/^./, (c) => c.toUpperCase())
      : 'General overlap with your profile.';

  const insights: Insight[] = matchedOn.map((tag) => ({ label: tag, why: `Matches your interest “${tag}”.` }));
  if (sellsToSector) {
    insights.push({ label: `${guest.industry} buyers`, why: `They sell to ${guest.industry} businesses, like yours.` });
  }
  if (insights.length === 0) insights.push({ label: 'General match', why: reason });

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
    insights,
  };
}

export function recommend(
  guest: GuestInput,
  exhibitors: Exhibitor[],
  limit = 30,
): { results: Recommendation[]; total: number } {
  const scored = exhibitors
    .map((ex) => scoreExhibitor(guest, ex))
    .filter((s) => s.factors.g2e > 0.05)
    .sort(
      (a, b) =>
        b.score - a.score || b.factors.g2e - a.factors.g2e || a.exhibitor.name.localeCompare(b.exhibitor.name),
    );

  const results = scored.slice(0, limit).map((s, i) => ({ rank: i + 1, ...s }));
  return { results, total: scored.length };
}
