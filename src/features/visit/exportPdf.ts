import { Platform } from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import type { Route } from '../../api/schemas';
import { buildVisitPdfHtml } from './pdfHtml';

/** Renders the visit list to a PDF file and opens the system share sheet. */
export async function exportVisitPdf(guestName: string, route: Route, rows: string[] = []): Promise<void> {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const { filePath } = await generatePDF({
    html: buildVisitPdfHtml({ guestName, date: now, route, rows, pageMargins: Platform.OS !== 'ios' }),
    fileName: `visit-list-${stamp}`,
    // A4 in points. Android ignores `padding` and prints edge to edge, so there the
    // margins are drawn by pdfHtml.ts; iOS uses this padding.
    width: 595,
    height: 842,
    padding: 36,
    bgColor: '#FFFFFF',
  });
  await Share.open({
    url: filePath.startsWith('file://') ? filePath : `file://${filePath}`,
    type: 'application/pdf',
    filename: `visit-list-${stamp}.pdf`,
    title: 'My visit list',
    failOnCancel: false,
  });
}
