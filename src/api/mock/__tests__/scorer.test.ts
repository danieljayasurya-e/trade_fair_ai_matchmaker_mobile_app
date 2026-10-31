import { exhibitorSchema, metaSchema, recommendationsResponseSchema } from '../../schemas';
import { EXHIBITORS, META, SAMPLE_PROFILES } from '../fixtures';
import { recommend } from '../scorer';

const [owner, procurement, lab] = SAMPLE_PROFILES.map((s) => s.profile);

describe('mock scorer', () => {
  it('has a valid snapshot: unique exhibitors across rows LA–LF', () => {
    expect(EXHIBITORS.length).toBeGreaterThan(100);
    expect(new Set(EXHIBITORS.map((e) => e.id)).size).toBe(EXHIBITORS.length);
    expect([...new Set(EXHIBITORS.map((e) => e.hall))].sort()).toEqual(META.halls);
    for (const e of EXHIBITORS) expect(exhibitorSchema.safeParse(e).success).toBe(true);
    expect(metaSchema.safeParse(META).success).toBe(true);
  });

  it('follows the contract score formula', () => {
    for (const r of recommend(owner, EXHIBITORS).results) {
      expect(r.score).toBeCloseTo(100 * Math.sqrt(r.factors.g2e * r.factors.e2g), -0.5);
      expect(r.factors.e2g).toBeCloseTo(0.7 + 0.3 * r.factors.buyerFit, 5);
      expect(r.insights.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    expect(recommend(owner, EXHIBITORS)).toEqual(recommend(owner, EXHIBITORS));
  });

  it('returns at most 30 results, ranked 1..n by descending score', () => {
    const { results } = recommend(owner, EXHIBITORS);
    expect(results.length).toBeLessThanOrEqual(30);
    results.forEach((r, i) => expect(r.rank).toBe(i + 1));
    for (let i = 1; i < results.length; i++) expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
  });

  it('produces output that passes the API schema', () => {
    for (const profile of [owner, procurement, lab]) {
      const { results, total } = recommend(profile, EXHIBITORS);
      expect(recommendationsResponseSchema.safeParse({ results, total, latencyMs: 1 }).success).toBe(true);
    }
  });

  it('puts stalls matching the guest interests at the top for each sample profile', () => {
    for (const p of [owner, procurement, lab]) {
      for (const r of recommend(p, EXHIBITORS).results.slice(0, 5)) expect(r.matchedOn.length).toBeGreaterThan(0);
    }
  });

  it('changes when the profile changes', () => {
    const before = recommend(owner, EXHIBITORS).results.map((r) => r.exhibitor.id);
    const after = recommend({ ...owner, interests: ['Quantum Technologies'] }, EXHIBITORS).results.map(
      (r) => r.exhibitor.id,
    );
    expect(after).not.toEqual(before);
  });

  it('reports matchedOn only from the guest interests', () => {
    for (const r of recommend(procurement, EXHIBITORS).results) {
      r.matchedOn.forEach((m) => expect(procurement.interests).toContain(m));
    }
  });

  it('handles empty, emoji and non-Latin free text without throwing', () => {
    for (const freeText of ['', '   ', '🤖🦾', 'हमें लेज़र मशीनें चाहिए', '<b>x</b>']) {
      expect(() => recommend({ ...owner, freeText }, EXHIBITORS)).not.toThrow();
    }
  });
});
