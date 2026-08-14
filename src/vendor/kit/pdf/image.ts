// vendored from obsidian-kit@0.26.1, src/pure/pdf/image.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
/* ------------------------------------------------------------------ *
 *  Image · Rasterung (Runtime: Image/canvas) → JPEG-Bytes
 * ------------------------------------------------------------------ */
/* Rastert ein (ggf. SVG-)Bild aus seiner data:/resource-URL auf weißem
   Grund zu JPEG-Bytes für die PDF-Einbettung. Transparenz wird auf Weiß
   geflacht (Brief). Gibt null zurück, wenn keine Quelle oder ein Fehler
   — dann ohne Bild.

   Das <canvas> wird als Factory injiziert, nicht hier erzeugt: `createEl`/
   `activeDocument` sind Obsidian-Globals, die in pure/ nichts verloren haben
   — der Aufrufer im jeweiligen Plugin liefert `() => createEl('canvas')`. So
   bleibt dieses Modul frei von Obsidian-Globals und von rohem
   `document.createElement` (obsidianmd/prefer-create-el). */
export async function imageToJpeg(
  src: string,
  makeCanvas: () => HTMLCanvasElement,
  maxWpx?: number
): Promise<{ data: Uint8Array; wPx: number; hPx: number } | null> {
  if (!src) return null;
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
    const naturalW = img.naturalWidth || img.width || 1;
    const naturalH = img.naturalHeight || img.height || 1;
    const scale = Math.min(1, (maxWpx || 1200) / naturalW);
    const wPx = Math.max(1, Math.round(naturalW * scale));
    const hPx = Math.max(1, Math.round(naturalH * scale));
    const canvas = makeCanvas();
    canvas.width = wPx;
    canvas.height = hPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, wPx, hPx);
    ctx.drawImage(img, 0, 0, wPx, hPx);
    const b64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    const bin = atob(b64);
    const data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    return { data, wPx, hPx };
  } catch (e) {
    console.error('obsidian-kit: image rasterization failed', e);
    return null;
  }
}
