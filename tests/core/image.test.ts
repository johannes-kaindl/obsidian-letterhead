// @vitest-environment happy-dom
//
// imageToJpeg bekommt das <canvas> als Factory injiziert, statt es selbst über
// `activeDocument.createElement('canvas')` zu erzeugen (obsidianmd/prefer-create-el).
// Der Aufrufer (src/obsidian/main.ts) liefert `() => createEl('canvas')` — so bleibt
// core/ frei von Obsidian-Globals UND von rohem createElement.
//
// Getestet wird der DI-Kontrakt + die Null-Pfade + der Byte-Roundtrip. Das ECHTE
// Pixel-Rendering (ctx.drawImage → toDataURL mit realen Daten) kann happy-dom nicht
// leisten (getContext('2d') → null, kein Canvas-Backend) — das bleibt Geraete-Abnahme,
// genau wie window.print() in do-print.test.ts.
import { describe, it, expect, vi } from 'vitest';
import { imageToJpeg } from '../../src/vendor/kit/pdf/image';

const PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function makeFakeCanvas(dataUrl: string | null): HTMLCanvasElement {
  const ctx = dataUrl === null ? null : { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toDataURL: vi.fn(() => dataUrl ?? ''),
  };
  return canvas as unknown as HTMLCanvasElement;
}

describe('imageToJpeg — canvas injected, not created via document', () => {
  it('returns null for an empty src without touching the canvas factory', async () => {
    const factory = vi.fn(() => makeFakeCanvas('data:image/jpeg;base64,QUJD'));
    expect(await imageToJpeg('', factory)).toBeNull();
    expect(factory).not.toHaveBeenCalled();
  });

  it('uses the injected factory and returns null when the 2d context is unavailable', async () => {
    const factory = vi.fn(() => makeFakeCanvas(null)); // getContext → null
    const out = await imageToJpeg(PX, factory);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(out).toBeNull();
  });

  it('rasterizes through the injected canvas and decodes the jpeg bytes', async () => {
    const canvas = makeFakeCanvas('data:image/jpeg;base64,QUJD'); // atob("QUJD") === "ABC"
    const factory = vi.fn(() => canvas);
    const out = await imageToJpeg(PX, factory);
    expect(out).not.toBeNull();
    expect(Array.from(out!.data)).toEqual([65, 66, 67]); // "ABC"
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });
});
