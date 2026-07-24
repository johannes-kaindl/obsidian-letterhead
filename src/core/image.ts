/* ------------------------------------------------------------------ *
 *  Image · Rasterung (Runtime: Image/canvas) → JPEG-Bytes
 * ------------------------------------------------------------------ */
/* Rastert ein (ggf. SVG-)Bild aus seiner data:/resource-URL auf weißem
   Grund zu JPEG-Bytes für die PDF-Einbettung. Transparenz wird auf Weiß
   geflacht (Brief). Gibt null zurück, wenn keine Quelle oder ein Fehler
   — dann ohne Bild. Generalisierte Portierung von letterhead's
   `logoToJpeg` (main.js:1849-1877).

   Das <canvas> wird als Factory injiziert, nicht hier erzeugt: `createEl`/
   `activeDocument` sind Obsidian-Globals, die in core/ nichts verloren haben
   (PROF-OBS-04) — der Aufrufer in src/obsidian/main.ts liefert
   `() => createEl('canvas')`. So bleibt core/ frei von Obsidian-Globals und von
   rohem `document.createElement` (obsidianmd/prefer-create-el). */
/* `name: message` for any thrown value, so a failure reason can be shown to
   the user on a device without cable/remote debugging (iOS). */
function describeError(e: unknown): string {
  if (e instanceof DOMException || e instanceof Error) return `${e.name}: ${e.message}`;
  return String(e);
}

export async function imageToJpeg(
  src: string,
  makeCanvas: () => HTMLCanvasElement,
  maxWpx?: number
): Promise<{ data: Uint8Array; wPx: number; hPx: number } | { error: string } | null> {
  if (!src) return null;

  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('image failed to load'));
      im.src = src;
    });
  } catch (e) {
    console.error('Letterhead: image load failed', e);
    return { error: `load-failed: ${describeError(e)}` };
  }

  const naturalW = img.naturalWidth || img.width || 1;
  const naturalH = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, (maxWpx || 1200) / naturalW);
  const wPx = Math.max(1, Math.round(naturalW * scale));
  const hPx = Math.max(1, Math.round(naturalH * scale));
  const canvas = makeCanvas();
  canvas.width = wPx;
  canvas.height = hPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { error: 'no-2d-context' };
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, wPx, hPx);

  try {
    ctx.drawImage(img, 0, 0, wPx, hPx);
  } catch (e) {
    console.error('Letterhead: drawImage failed', e);
    return { error: `draw-failed: ${describeError(e)}` };
  }

  try {
    const b64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    const bin = atob(b64);
    const data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    return { data, wPx, hPx };
  } catch (e) {
    // WebKit (iOS/iPadOS) can make the canvas write-only after drawing an
    // SVG, regardless of same-origin/data-URI — a security restriction, not
    // a bug, and not reliably bypassable. Whether that's actually what's
    // happening on-device is unconfirmed — describeError() surfaces the real
    // e.name/e.message so the caller can show it instead of guessing.
    console.error('Letterhead: canvas read-back failed', e);
    return { error: `readback-failed: ${describeError(e)}` };
  }
}
