// src/pure/pdf/geometry.ts
// Pure PDF geometry helpers. No Obsidian, no DOM.
export const PT_PER_MM = 2.8346456693;

export function mmToPt(mm: number): number {
  return Number(mm) * PT_PER_MM;
}

// A4 = 210×297mm, Letter = 215.9×279.4mm, in PDF points (1pt = 1/72in).
export function pageSizePt(size: 'A4' | 'Letter'): { wPt: number; hPt: number } {
  if (size === 'Letter') return { wPt: 612, hPt: 792 };
  return { wPt: 595.28, hPt: 841.89 };
}

// Top-anchored millimetre → PDF point (origin bottom-left).
export function yTopMmToPt(yMm: number, pageHPt: number): number {
  return pageHPt - mmToPt(yMm);
}

export function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
