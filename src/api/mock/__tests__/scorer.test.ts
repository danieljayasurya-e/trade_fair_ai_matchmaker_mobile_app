import { recommendationsResponseSchema } from '../../schemas';
import { EXHIBITORS, SAMPLE_PROFILES } from '../fixtures';
import { recommend } from '../scorer';

const [factoryOwner, packaging, startupCto] = SAMPLE_PROFILES.map((s) => s.profile);

describe('mock scorer', () => {
  it('has 60 exhibitors across halls A–F with unique ids', () => {
    expect(EXHIBITORS).toHaveLength(60);
    expect(new Set(EXHIBITORS.map((e) => e.id)).size).toBe(60);
    expect([...new Set(EXHIBITORS.map((e) => e.hall))].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('is deterministic', () => {
    expect(recommend(factoryOwner, EXHIBITORS)).toEqual(recommend(factoryOwner, EXHIBITORS));
  });

  it('returns at most 30 results, ranked 1..n by descending score', () => {
    const { results } = recommend(factoryOwner, EXHIBITORS);
    expect(results.length).toBeLessThanOrEqual(30);
    results.forEach((r, i) => expect(r.rank).toBe(i + 1));
    for (let i = 1; i < results.length; i++) expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
  });

  it('produces output that passes the API schema', () => {
    for (const profile of [factoryOwner, packaging, startupCto]) {
      const { results, total } = recommend(profile, EXHIBITORS);
      expect(recommendationsResponseSchema.safeParse({ results, total, latencyMs: 1 }).success).toBe(true);
    }
  });

  it('puts relevant halls at the top for each sample profile', () => {
    const topHalls = (p: typeof factoryOwner) =>
      recommend(p, EXHIBITORS).results.slice(0, 5).map((r) => r.exhibitor.hall);
    expect(topHalls(factoryOwner).filter((h) => h === 'A').length).toBeGreaterThanOrEqual(2);
    expect(topHalls(packaging).filter((h) => h === 'B').length).toBeGreaterThanOrEqual(3);
    expect(topHalls(startupCto).filter((h) => h === 'C').length).toBeGreaterThanOrEqual(3);
  });

  it('changes when the profile changes', () => {
    const before = recommend(factoryOwner, EXHIBITORS).results.map((r) => r.exhibitor.id);
    const after = recommend({ ...factoryOwner, interests: ['Sustainable Packaging'] }, EXHIBITORS).results.map(
      (r) => r.exhibitor.id,
    );
    expect(after).not.toEqual(before);
  });

  it('reports matchedOn only from the guest interests', () => {
    for (const r of recommend(packaging, EXHIBITORS).results) {
      r.matchedOn.forEach((m) => expect(packaging.interests).toContain(m));
    }
  });

  it('handles empty, emoji and non-Latin free text without throwing', () => {
    for (const freeText of ['', '   ', '🤖🦾', 'हमें पैकेजिंग मशीनें चाहिए', '<b>x</b>']) {
      expect(() => recommend({ ...factoryOwner, freeText }, EXHIBITORS)).not.toThrow();
    }
  });
});
