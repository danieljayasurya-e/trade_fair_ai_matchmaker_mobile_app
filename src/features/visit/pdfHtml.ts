import type { Recommendation, Route } from '../../api/schemas';
import { escapeHtml } from '../../utils/escapeHtml';
import { mapRows, placePins } from '../map/mapLayout';
import { HALL_NAME } from '../results/location';

interface VisitPdfInput {
  guestName: string;
  date: Date;
  route: Route;
  /** Every booth row in the hall, so the map shows empty rows too. */
  rows?: string[];
  /** Draw page margins in the HTML. Off where the PDF library applies its own (iOS). */
  pageMargins?: boolean;
}

const MARGIN_Y = '14mm';
const MARGIN_X = '13mm';

// The PDF has no theme, so these repeat the light palette in theme/theme.ts.
const C = {
  text: '#0F172A',
  muted: '#475569',
  border: '#E2E8F0',
  surfaceAlt: '#F1F5F9',
  accent: '#1D4ED8',
  accentSoft: '#DBEAFE',
  onAccentSoft: '#1E3A8A',
  teal: '#0F766E',
  tealSoft: '#CCFBF1',
  mint: '#5EEAD4',
  success: '#15803D',
  warning: '#B45309',
} as const;

function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

const LOGO = `<svg class="logo" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="9" fill="${C.accent}"/><rect x="6" y="6" width="17" height="17" rx="3.5" fill="#FFFFFF"/><rect x="13" y="13" width="17" height="17" rx="3.5" fill="${C.mint}"/><path d="M13 16.5A3.5 3.5 0 0 1 16.5 13H23V19.5A3.5 3.5 0 0 1 19.5 23H13Z" fill="${C.teal}"/></svg>`;

function scoreRing(score: number): string {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.muted;
  const dash = ((score / 100) * circumference).toFixed(1);
  return `<svg class="ring" width="44" height="44" viewBox="0 0 44 44" role="img" aria-label="${score} percent match"><circle cx="22" cy="22" r="${r}" fill="none" stroke="${C.border}" stroke-width="5"/><circle cx="22" cy="22" r="${r}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${dash} ${circumference.toFixed(1)}" transform="rotate(-90 22 22)"/><text x="22" y="26.5" text-anchor="middle" font-size="12" font-weight="700" fill="${C.text}">${score}</text></svg>`;
}

// Map geometry, in SVG units. The SVG scales to the page width.
const MAP_WIDTH = 900;
const MAP_GUTTER = 36;
const MAP_PIN = 22;
const MAP_LANE = 26;
const MAP_LANES = 2;
const MAP_ROW_GAP = 6;

function routeMap(stops: Recommendation[], rows: string[]): string {
  const rowHeight = MAP_LANE * MAP_LANES + 4;
  const trackWidth = MAP_WIDTH - MAP_GUTTER;
  const usable = trackWidth - MAP_PIN;
  const height = rows.length * (rowHeight + MAP_ROW_GAP);

  const pins = stops.map((s, i) => ({ key: `${i}`, stop: i + 1, row: s.exhibitor.hall, booth: s.exhibitor.booth }));
  const placed = placePins(pins, rows, MAP_PIN / usable, MAP_LANES).map((p) => ({
    stop: p.item.stop,
    cx: MAP_GUTTER + MAP_PIN / 2 + p.x * usable,
    cy: p.rowIndex * (rowHeight + MAP_ROW_GAP) + 2 + MAP_LANE * (p.lane + 0.5),
  }));

  const tracks = rows
    .map((row, i) => {
      const y = i * (rowHeight + MAP_ROW_GAP);
      return `<text x="0" y="${y + rowHeight / 2 + 4}" font-size="12" font-weight="700" fill="${C.muted}">${escapeHtml(row)}</text><rect x="${MAP_GUTTER}" y="${y}" width="${trackWidth}" height="${rowHeight}" rx="6" fill="${C.surfaceAlt}" stroke="${C.border}"/>`;
    })
    .join('');
  const line =
    placed.length > 1
      ? `<polyline points="${placed.map((p) => `${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ')}" fill="none" stroke="${C.accent}" stroke-width="2" stroke-dasharray="5 4"/>`
      : '';
  const dots = placed
    .map(
      (p) =>
        `<circle cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="${MAP_PIN / 2}" fill="${C.accent}" stroke="#FFFFFF" stroke-width="2"/><text x="${p.cx.toFixed(1)}" y="${(p.cy + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">${p.stop}</text>`,
    )
    .join('');

  return `
  <section class="map">
    <h2>Your route in ${HALL_NAME}</h2>
    <svg class="map-svg" viewBox="0 0 ${MAP_WIDTH} ${height}" role="img" aria-label="Schematic map of your route">${tracks}${line}${dots}</svg>
    <div class="note">Schematic by booth row and number, not the official floor plan. Check booth signs on the floor.</div>
  </section>`;
}

function stallCard(s: Recommendation, stop: number): string {
  const e = s.exhibitor;
  const matched = s.matchedOn.length > 0 ? s.matchedOn : ['General match'];
  const place = [e.city, e.country].filter(Boolean).join(', ');
  const booths = [e.booth, ...e.otherBooths].join(', ');
  const meta = [`Booth ${booths}`, place, `Rank #${s.rank}`].filter(Boolean).join(' · ');
  return `
    <article class="stall">
      <div class="stop">${stop}</div>
      <div class="body">
        <div class="name">${escapeHtml(e.name)}</div>
        <div class="meta">${escapeHtml(meta)}</div>
        <div class="chips">${matched.map((m) => `<span class="chip">${escapeHtml(m)}</span>`).join('')}</div>
        <div class="reason">${escapeHtml(s.reason)}</div>
      </div>
      ${scoreRing(s.score)}
    </article>`;
}

/** Printable visit list, in the app's visual style. Every exhibitor/guest string is escaped. */
export function buildVisitPdfHtml({ guestName, date, route, rows = [], pageMargins = true }: VisitPdfInput): string {
  const stops = route.halls.flatMap((h) => h.stalls);
  const allRows = mapRows(rows, route.halls.map((h) => h.hall));
  let stop = 0;

  const sections = route.halls
    .map((h) => {
      const [first, ...rest] = h.stalls.map((s) => stallCard(s, ++stop));
      // The heading travels with its first stall so it is never stranded at the bottom of a page.
      return `
  <section class="row">
    <div class="keep">
      <h2>${HALL_NAME}, Row ${escapeHtml(h.hall)} <span>· ${plural(h.stalls.length, 'stop')}</span></h2>${first}
    </div>${rest.join('')}
  </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, Roboto, "Noto Sans", "Noto Sans Devanagari", sans-serif; color: ${C.text}; margin: 0; background: #FFFFFF; }
  /* Android prints with no margins, on every page. The empty header and footer rows repeat
     on each printed page, which gives real top and bottom margins throughout. */
  .sheet { width: 100%; border-collapse: collapse; }
  .sheet > thead td, .sheet > tfoot td { padding: 0; height: ${pageMargins ? MARGIN_Y : '0'}; }
  .sheet > tbody > tr > td { padding: 0 ${pageMargins ? MARGIN_X : '0'}; }
  header { display: flex; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid ${C.border}; }
  .logo { flex: 0 0 auto; }
  .brand { font-size: 12px; font-weight: 600; color: ${C.teal}; letter-spacing: 0.04em; text-transform: uppercase; }
  h1 { font-size: 22px; line-height: 28px; font-weight: 700; margin: 0; }
  .pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 0; }
  .pill { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: ${C.surfaceAlt}; color: ${C.text}; }
  .pill.guest { background: ${C.accentSoft}; color: ${C.onAccentSoft}; }
  h2 { font-size: 14px; line-height: 20px; font-weight: 700; margin: 0 0 8px; color: ${C.accent}; }
  h2 span { color: ${C.muted}; font-weight: 500; }
  .map { margin-top: 18px; page-break-inside: avoid; break-inside: avoid; }
  .map-svg { display: block; width: 100%; height: auto; }
  .note { margin-top: 6px; font-size: 10px; color: ${C.muted}; }
  .row { margin-top: 18px; }
  .keep { page-break-inside: avoid; break-inside: avoid; }
  .stall { display: flex; align-items: flex-start; gap: 12px; padding: 12px; margin-bottom: 8px; border: 1px solid ${C.border}; border-radius: 12px; page-break-inside: avoid; break-inside: avoid; }
  .stop { flex: 0 0 auto; width: 26px; height: 26px; line-height: 26px; border-radius: 50%; background: ${C.accent}; color: #FFFFFF; font-size: 12px; font-weight: 700; text-align: center; }
  .body { flex: 1 1 auto; min-width: 0; }
  .ring { flex: 0 0 auto; }
  .name { font-size: 13px; line-height: 18px; font-weight: 600; word-break: break-word; }
  .meta { margin-top: 2px; font-size: 11px; line-height: 15px; color: ${C.muted}; }
  .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  .chip { padding: 2px 7px; border-radius: 5px; background: ${C.tealSoft}; color: ${C.teal}; font-size: 10px; font-weight: 500; }
  .reason { margin-top: 6px; font-size: 11px; line-height: 15px; color: ${C.muted}; }
  footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid ${C.border}; color: ${C.muted}; font-size: 10px; line-height: 14px; }
</style>
</head>
<body>
<table class="sheet">
<thead><tr><td></td></tr></thead>
<tfoot><tr><td></td></tr></tfoot>
<tbody><tr><td>
  <header>
    ${LOGO}
    <div>
      <div class="brand">Matchmaker</div>
      <h1>Your visit list</h1>
    </div>
  </header>
  <div class="pills">
    <span class="pill guest">${escapeHtml(guestName)}</span>
    <span class="pill">${formatDate(date)}</span>
    <span class="pill">${plural(stops.length, 'stall')}, ordered by row and booth</span>
  </div>${routeMap(stops, allRows)}${sections}
  <footer>LASER World of PHOTONICS INDIA 2026. Rankings come only from how well profiles fit. No exhibitor pays for placement.</footer>
</td></tr></tbody>
</table>
</body>
</html>`;
}
