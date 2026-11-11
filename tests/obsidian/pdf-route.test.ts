// Der Haupt-Exportbefehl wählt den Weg selbst: am Desktop das Kit-Druckmodul (Chromium-PDF, Datei ohne
// Dialog), sonst die Vektor-Engine. Scheitert das Druckmodul, fällt der Export mit Hinweis auf das
// Vektor-PDF zurück, statt ohne Datei zu enden (Muster aus Paperize, Entscheidung Johannes 2026-11-11).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notices: string[] = [];
vi.mock('obsidian', () => ({
  Notice: class { constructor(m: string) { notices.push(m); } },
  Platform: { isDesktopApp: true },
  getLanguage: () => 'en',
}));

import { renderPdfBytes } from '../../src/obsidian/pdf-route';
import { PrintToPdfError } from '../../src/vendor/kit-obsidian/print-to-pdf';

const CHROMIUM = new Uint8Array([1]);
const VECTOR = new Uint8Array([2]);

describe('renderPdfBytes', () => {
  beforeEach(() => { notices.length = 0; });

  it('nimmt das Vektor-PDF, wenn es keinen Druckweg gibt (Telefon)', async () => {
    const vector = vi.fn(async () => VECTOR);
    const bytes = await renderPdfBytes({ chromium: null, vector });
    expect(bytes).toBe(VECTOR);
    expect(vector).toHaveBeenCalledTimes(1);
    expect(notices).toEqual([]);
  });

  it('nimmt das Chromium-PDF und baut das Vektor-PDF gar nicht erst', async () => {
    const vector = vi.fn(async () => VECTOR);
    const bytes = await renderPdfBytes({ chromium: async () => CHROMIUM, vector });
    expect(bytes).toBe(CHROMIUM);
    expect(vector).not.toHaveBeenCalled();
    expect(notices).toEqual([]);
  });

  it('fällt bei einem Fehler des Druckmoduls mit Hinweis auf das Vektor-PDF zurück', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const vector = vi.fn(async () => VECTOR);
    const bytes = await renderPdfBytes({
      chromium: async () => { throw new PrintToPdfError('empty', 'The document has no visible content'); },
      vector,
    });
    expect(bytes).toBe(VECTOR);
    expect(vector).toHaveBeenCalledTimes(1);
    expect(notices).toEqual(['Letterhead: The browser PDF failed, using the vector PDF instead.']);
    warn.mockRestore();
  });

  it('fällt auch bei einem fremden Fehler zurück (nicht nur bei PrintToPdfError)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bytes = await renderPdfBytes({ chromium: async () => { throw new Error('boom'); }, vector: async () => VECTOR });
    expect(bytes).toBe(VECTOR);
    warn.mockRestore();
  });

  it('reicht einen Fehler des Vektor-Wegs durch (kein zweiter Rückfall)', async () => {
    await expect(renderPdfBytes({ chromium: null, vector: async () => { throw new Error('vec'); } })).rejects.toThrow('vec');
  });
});
