import type { Recommendation } from '../../../api/schemas';
import { buildVisitPdfHtml } from '../pdfHtml';
import { planRoute, savedStallsFrom } from '../route';

function rec(id: string, hall: string, booth: string, score = 80, extra: Partial<Recommendation> = {}): Recommendation {
  return {
    rank: 1,
    score,
    matchedOn: ['Robotics'],
    reason: 'Offers cobots.',
    factors: { semantic: 0, interest: 0, intent: 0, buyerFit: 0, g2e: 0, e2g: 0 },
    exhibitor: { id, name: `Stall ${id}`, description: '', products: [], industries: [], hall, booth },
    ...extra,
  };
}

describe('planRoute', () => {
  it('groups by hall and orders booths naturally', () => {
    const route = planRoute([rec('1', 'B', 'B-10'), rec('2', 'A', 'A-7'), rec('3', 'B', 'B-2'), rec('4', 'A', 'A-12')]);
    expect(route.halls.map((h) => h.hall)).toEqual(['A', 'B']);
    expect(route.halls[0].stalls.map((s) => s.exhibitor.booth)).toEqual(['A-7', 'A-12']);
    expect(route.halls[1].stalls.map((s) => s.exhibitor.booth)).toEqual(['B-2', 'B-10']);
  });

  it('is stable for identical booths', () => {
    const route = planRoute([rec('b', 'A', 'A-1'), rec('a', 'A', 'A-1')]);
    expect(route.halls[0].stalls.map((s) => s.exhibitor.id)).toEqual(['a', 'b']);
  });

  it('returns no halls for no stalls', () => {
    expect(planRoute([])).toEqual({ halls: [] });
  });
});

describe('savedStallsFrom', () => {
  it('keeps only saved ids, prefers earlier sources and sorts by score', () => {
    const fresh = rec('1', 'A', 'A-1', 60, { reason: 'fresh' });
    const stale = rec('1', 'A', 'A-1', 10, { reason: 'stale' });
    const other = rec('2', 'B', 'B-1', 90);
    const notSaved = rec('3', 'C', 'C-1', 99);
    const out = savedStallsFrom(new Set(['1', '2']), [fresh], [stale, other, notSaved]);
    expect(out.map((s) => s.exhibitor.id)).toEqual(['2', '1']);
    expect(out[1].reason).toBe('fresh');
  });
});

describe('buildVisitPdfHtml', () => {
  const date = new Date(2026, 9, 31);

  it('escapes exhibitor and guest text', () => {
    const evil = rec('1', 'A', 'A-1', 80, { reason: '<img src=x onerror=alert(1)>' });
    evil.exhibitor.name = 'Tom & Jerry <script>alert("x")</script>';
    const html = buildVisitPdfHtml({ guestName: '<b>Priya</b>', date, route: planRoute([evil]) });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>Priya</b>');
    expect(html).toContain('Tom &amp; Jerry &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;Priya&lt;/b&gt;');
  });

  it('works with one stall', () => {
    const html = buildVisitPdfHtml({ guestName: 'Asha', date, route: planRoute([rec('1', 'A', 'A-1')]) });
    expect(html).toContain('1 stall,');
    expect(html).toContain('1 stop');
    expect(html).toContain('31 Oct 2026');
  });

  it('works with 30 stalls and numbers stops across halls in route order', () => {
    const stalls = Array.from({ length: 30 }, (_, i) => rec(String(i), 'ABCDEF'[i % 6], `X-${i}`));
    const html = buildVisitPdfHtml({ guestName: 'Asha', date, route: planRoute(stalls) });
    expect(html).toContain('30 stalls,');
    expect(html.match(/class="stop"/g)).toHaveLength(30);
    expect(html).toContain('<td class="stop">30</td>');
  });

  it('shows "General match" when nothing matched', () => {
    const html = buildVisitPdfHtml({ guestName: 'A', date, route: planRoute([rec('1', 'A', 'A-1', 50, { matchedOn: [] })]) });
    expect(html).toContain('Matched on: General match');
  });

  it('keeps Hindi and emoji intact', () => {
    const r = rec('1', 'A', 'A-1');
    r.exhibitor.name = 'पैकेजिंग 🤖';
    expect(buildVisitPdfHtml({ guestName: 'A', date, route: planRoute([r]) })).toContain('पैकेजिंग 🤖');
  });
});
