import type { Route } from '../../api/schemas';
import { escapeHtml } from '../../utils/escapeHtml';

interface VisitPdfInput {
  guestName: string;
  date: Date;
  route: Route;
}

function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Printable visit list. Every exhibitor/guest string is escaped. */
export function buildVisitPdfHtml({ guestName, date, route }: VisitPdfInput): string {
  const total = route.halls.reduce((n, h) => n + h.stalls.length, 0);
  let stop = 0;

  const sections = route.halls
    .map((h) => {
      const rows = h.stalls
        .map((s) => {
          stop += 1;
          const matched = s.matchedOn.length > 0 ? s.matchedOn.join(', ') : 'General match';
          return `
        <tr>
          <td class="stop">${stop}</td>
          <td>
            <div class="name">${escapeHtml(s.exhibitor.name)}</div>
            <div class="reason">${escapeHtml(s.reason)}</div>
            <div class="matched">Matched on: ${escapeHtml(matched)}</div>
          </td>
          <td class="booth">${escapeHtml(s.exhibitor.booth)}</td>
          <td class="score">${s.score}%</td>
        </tr>`;
        })
        .join('');
      return `
    <h2>Hall ${escapeHtml(h.hall)} <span>· ${h.stalls.length} ${h.stalls.length === 1 ? 'stop' : 'stops'}</span></h2>
    <table>
      <thead><tr><th>#</th><th>Stall</th><th>Booth</th><th>Match</th></tr></thead>
      <tbody>${rows}
      </tbody>
    </table>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Roboto, "Noto Sans", "Noto Sans Devanagari", sans-serif; color: #121826; margin: 0; }
  header { border-bottom: 3px solid #1F5EFF; padding-bottom: 12px; margin-bottom: 16px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #5B6475; font-size: 13px; }
  h2 { font-size: 16px; margin: 20px 0 8px; color: #1F5EFF; }
  h2 span { color: #5B6475; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th { text-align: left; color: #5B6475; font-weight: 600; border-bottom: 1px solid #DCE1EA; padding: 6px 4px; }
  td { border-bottom: 1px solid #EEF1F7; padding: 8px 4px; vertical-align: top; }
  .stop { width: 24px; font-weight: 700; }
  .name { font-weight: 700; font-size: 13px; word-break: break-word; }
  .reason { color: #3A4252; margin-top: 2px; }
  .matched { color: #5B6475; margin-top: 2px; }
  .booth { white-space: nowrap; font-weight: 600; }
  .score { white-space: nowrap; text-align: right; }
  footer { margin-top: 24px; color: #5B6475; font-size: 11px; }
</style>
</head>
<body>
  <header>
    <h1>My visit list</h1>
    <div class="meta">${escapeHtml(guestName)} · ${formatDate(date)} · ${total} ${total === 1 ? 'stall' : 'stalls'}, ordered by hall and booth</div>
  </header>${sections}
  <footer>Trade Fair AI Matchmaker · Scores reflect profile fit only, no paid boosts.</footer>
</body>
</html>`;
}
