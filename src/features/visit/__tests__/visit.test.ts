import type { Recommendation } from '../../../api/schemas';
import { buildVisitPdfHtml } from '../pdfHtml';
import { planRoute, savedStallsFrom } from '../route';

function rec(id: string, hall: string, booth: string, score = 80, extra: Partial<Recommendation> = {}): Recommendation {
  return {
    rank: 1,
    score,
    matchedOn: ['Laser Sources'],
    reason: 'Offers lasers.',
    insights: [],
    factors: { semantic: 0, interest: 0, intent: 0, buyerFit: 0, g2e: 0, e2g: 0 },
    exhibitor: { id, name: `Stall ${id}`, description: '', products: [], tags: [], industries: [], hall, booth, otherBooths: [], city: '', country: '' },
    ...extra,
  };
}

describe('planRoute', () => {
  it('groups by row and orders booths naturally', () => {
    const route = planRoute([rec('1', 'LB', 'LB 10'), rec('2', 'LA', 'LA 7'), rec('3', 'LB', 'LB 2'), rec('4', 'LA', 'LA 12')]);
    expect(route.halls.map((h) => h.hall)).toEqual(['LA', 'LB']);
    expect(route.halls[0].stalls.map((s) => s.exhibitor.booth)).toEqual(['LA 7', 'LA 12']);
    expect(route.halls[1].stalls.map((s) => s.exhibitor.booth)).toEqual(['LB 2', 'LB 10']);
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
    expect(html).toContain('<div class="stop">30</div>');
  });

  it('shows "General match" when nothing matched', () => {
    const html = buildVisitPdfHtml({ guestName: 'A', date, route: planRoute([rec('1', 'A', 'A-1', 50, { matchedOn: [] })]) });
    expect(html).toContain('<span class="chip">General match</span>');
  });

  it('draws the map with every row, numbered stops and a route line', () => {
    const route = planRoute([rec('1', 'LA', 'LA 2'), rec('2', 'LC', 'LC 40')]);
    const html = buildVisitPdfHtml({ guestName: 'A', date, route, rows: ['LA', 'LB', 'LC'] });
    expect(html).toContain('Schematic by booth row and number');
    expect(html).toContain('>LB</text>');
    expect(html.match(/<polyline /g)).toHaveLength(1);
    expect(html.match(/>2<\/text>/g)).toHaveLength(1);
  });

  it('draws no route line for a single stop', () => {
    const html = buildVisitPdfHtml({ guestName: 'A', date, route: planRoute([rec('1', 'LA', 'LA 2')]) });
    expect(html).not.toContain('<polyline');
  });

  it('shows the match score, location and extra booths', () => {
    const r = rec('1', 'LB', 'LB 61', 84);
    r.exhibitor.otherBooths = ['LA 26'];
    r.exhibitor.city = 'Pune';
    r.exhibitor.country = 'India';
    const html = buildVisitPdfHtml({ guestName: 'A', date, route: planRoute([r]) });
    expect(html).toContain('84 percent match');
    expect(html).toContain('Booth LB 61, LA 26 · Pune, India · Rank #1');
    expect(html).toContain('Hall 1, Row LB');
  });

  it('draws repeating page margins unless the platform adds its own', () => {
    const route = planRoute([rec('1', 'LA', 'LA 2')]);
    expect(buildVisitPdfHtml({ guestName: 'A', date, route })).toContain('height: 14mm');
    expect(buildVisitPdfHtml({ guestName: 'A', date, route, pageMargins: false })).not.toContain('height: 14mm');
  });

  it('keeps Hindi and emoji intact', () => {
    const r = rec('1', 'A', 'A-1');
    r.exhibitor.name = 'पैकेजिंग 🤖';
    expect(buildVisitPdfHtml({ guestName: 'A', date, route: planRoute([r]) })).toContain('पैकेजिंग 🤖');
  });
});
