/* ------------------------------------------------------------------ *
 *  Image · Rasterung (Runtime: Image/canvas) → JPEG-Bytes
 * ------------------------------------------------------------------ */
/* Rastert ein (ggf. SVG-)Bild aus seiner data:/resource-URL auf weißem
   Grund zu JPEG-Bytes für die PDF-Einbettung. Transparenz wird auf Weiß
   geflacht (Brief). Gibt null zurück, wenn keine Quelle oder ein Fehler
   — dann ohne Bild. Generalisierte Portierung von letterhead's
   `logoToJpeg` (main.js:1849-1877). */
export async function imageToJpeg(
  src: string,
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
    const canvas = activeDocument.createElement('canvas');
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
    console.error('Letterhead: image rasterization failed', e);
    return null;
  }
}
