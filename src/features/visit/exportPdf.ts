import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import type { Route } from '../../api/schemas';
import { buildVisitPdfHtml } from './pdfHtml';

/** Renders the visit list to a PDF file and opens the system share sheet. */
export async function exportVisitPdf(guestName: string, route: Route): Promise<void> {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const { filePath } = await generatePDF({
    html: buildVisitPdfHtml({ guestName, date: now, route }),
    fileName: `visit-list-${stamp}`,
    padding: 24,
  });
  await Share.open({
    url: filePath.startsWith('file://') ? filePath : `file://${filePath}`,
    type: 'application/pdf',
    filename: `visit-list-${stamp}.pdf`,
    title: 'My visit list',
    failOnCancel: false,
  });
}
