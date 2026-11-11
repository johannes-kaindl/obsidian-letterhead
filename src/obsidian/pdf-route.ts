/* ------------------------------------------------------------------ *
 *  Weg des Haupt-Exportbefehls: am Desktop das Kit-Druckmodul (Chromium-PDF
 *  aus dem HTML-Brief, Datei ohne Dialog), sonst die Vektor-Engine.
 *
 *  Scheitert das Druckmodul (Zeitgrenze, leeres Dokument, kein <webview>),
 *  fällt der Export mit einem Hinweis auf das Vektor-PDF zurück, statt ohne
 *  Datei zu enden. Das Vektor-PDF ist die Rückfallebene, die es auf jeder
 *  Plattform gibt; ihr Fehler wird nicht noch einmal aufgefangen.
 * ------------------------------------------------------------------ */

import { Notice } from 'obsidian';
import { t } from '../i18n/strings';

export interface PdfRoute {
  /** `null` = es gibt keinen Druckweg (Telefon, kein <webview>). */
  chromium: (() => Promise<Uint8Array>) | null;
  vector: () => Promise<Uint8Array>;
}

export async function renderPdfBytes(route: PdfRoute): Promise<Uint8Array> {
  if (route.chromium) {
    try {
      return await route.chromium();
    } catch (e) {
      console.warn('Letterhead: browser PDF failed, using the vector PDF', e);
      new Notice(t('notice_browser_pdf_failed'));
    }
  }
  return route.vector();
}
