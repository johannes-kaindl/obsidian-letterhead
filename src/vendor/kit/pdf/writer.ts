// src/pure/pdf/writer.ts
// Pure PDF byte-writer. No Obsidian, no DOM.
// Ported from obsidian-letterhead/main.js

import { pdfTextBytes } from './encoding';
import { BASE_FONTS } from './metrics';

/* ------------------------------------------------------------------ *
 *  PDF · Writer (pur, Obsidian-frei) — minimaler Ein-Pass-Erzeuger
 * ------------------------------------------------------------------ */
function fmt(n: number): string { // kompakte Zahl, max 2 Nachkommastellen, kein -0
  const r = Math.round(n * 100) / 100;
  return (Object.is(r, -0) ? 0 : r).toString();
}

interface JpegEntry { name: string; u8: Uint8Array; wPx: number; hPx: number }

export class PdfPage {
  ops: string[];
  fonts: Set<string>;
  images: Set<string>;

  constructor() { this.ops = []; this.fonts = new Set(); this.images = new Set(); }
  text(x: number, y: number, str: string, fontKey: string, sizePt: number, rgb?: [number, number, number]) {
    const [r, g, b] = rgb || [0, 0, 0];
    this.fonts.add(fontKey);
    let lit = '('; for (const by of pdfTextBytes(str)) lit += String.fromCharCode(by); lit += ')';
    this.ops.push(`BT /${fontKey} ${fmt(sizePt)} Tf ${fmt(r)} ${fmt(g)} ${fmt(b)} rg ${fmt(x)} ${fmt(y)} Td ${lit} Tj ET`);
  }
  line(x1: number, y1: number, x2: number, y2: number, wPt: number, rgb?: [number, number, number]) {
    const [r, g, b] = rgb || [0, 0, 0];
    this.ops.push(`${fmt(r)} ${fmt(g)} ${fmt(b)} RG ${fmt(wPt)} w ${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`);
  }
  rect(x: number, y: number, w: number, h: number, rgb?: [number, number, number]) {
    const [r, g, b] = rgb || [0, 0, 0];
    this.ops.push(`${fmt(r)} ${fmt(g)} ${fmt(b)} rg ${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re f`);
  }
  image(name: string, x: number, y: number, w: number, h: number) {
    this.images.add(name);
    this.ops.push(`q ${fmt(w)} 0 0 ${fmt(h)} ${fmt(x)} ${fmt(y)} cm /${name} Do Q`);
  }
  _stream(): string { return this.ops.join('\n'); }
}

export class PdfWriter {
  pages: PdfPage[];
  jpegs: JpegEntry[];
  pageWPt: number;
  pageHPt: number;

  constructor(pageWPt = 595.28, pageHPt = 841.89) { this.pages = []; this.jpegs = []; this.pageWPt = pageWPt; this.pageHPt = pageHPt; }
  addPage(): PdfPage { const p = new PdfPage(); this.pages.push(p); return p; }
  addJpeg(u8: Uint8Array, wPx: number, hPx: number): string {
    const name = 'Im' + this.jpegs.length;
    this.jpegs.push({ name, u8, wPx, hPx });
    return name;
  }
  build(): Uint8Array {
    const strBytes = (s: string) => { const a: number[] = []; for (let i = 0; i < s.length; i++) a.push(s.charCodeAt(i) & 0xff); return a; };
    const usedFonts = new Set<string>();
    for (const p of this.pages) for (const f of p.fonts) usedFonts.add(f);
    const fontKeys = [...usedFonts];
    const fontObjNo: Record<string, number> = {}; const jpegObjNo: Record<string, number> = {};

    const catalogNo = 1, pagesNo = 2;
    let nextNo = 3;
    const pageNos: { page: number; content: number }[] = [];
    for (let i = 0; i < this.pages.length; i++) pageNos.push({ page: nextNo++, content: nextNo++ });
    for (const fk of fontKeys) fontObjNo[fk] = nextNo++;
    for (const j of this.jpegs) jpegObjNo[j.name] = nextNo++;

    const objs: number[][] = new Array<number[]>(nextNo - 1);
    const set = (no: number, bytes: number[]) => { objs[no - 1] = bytes; };

    set(catalogNo, strBytes(`${catalogNo} 0 obj\n<< /Type /Catalog /Pages ${pagesNo} 0 R >>\nendobj\n`));
    const kids = pageNos.map((pn) => `${pn.page} 0 R`).join(' ');
    set(pagesNo, strBytes(`${pagesNo} 0 obj\n<< /Type /Pages /Count ${this.pages.length} /Kids [${kids}] >>\nendobj\n`));

    for (let i = 0; i < this.pages.length; i++) {
      const p = this.pages[i]; const pn = pageNos[i];
      const fontRes = [...p.fonts].map((fk) => `/${fk} ${fontObjNo[fk]} 0 R`).join(' ');
      const imgRes = [...p.images].map((nm) => `/${nm} ${jpegObjNo[nm]} 0 R`).join(' ');
      const res = `<< /Font << ${fontRes} >>` + (imgRes ? ` /XObject << ${imgRes} >>` : '') + ` >>`;
      set(pn.page, strBytes(
        `${pn.page} 0 obj\n<< /Type /Page /Parent ${pagesNo} 0 R /MediaBox [0 0 ${fmt(this.pageWPt)} ${fmt(this.pageHPt)}] ` +
        `/Resources ${res} /Contents ${pn.content} 0 R >>\nendobj\n`));
      const stream = p._stream();
      set(pn.content, strBytes(`${pn.content} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`));
    }
    for (const fk of fontKeys) {
      const no = fontObjNo[fk];
      set(no, strBytes(`${no} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /${BASE_FONTS[fk]} /Encoding /WinAnsiEncoding >>\nendobj\n`));
    }
    for (const j of this.jpegs) {
      const no = jpegObjNo[j.name];
      const header = strBytes(
        `${no} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${j.wPx} /Height ${j.hPx} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.u8.length} >>\nstream\n`);
      const tail = strBytes(`\nendstream\nendobj\n`);
      set(no, header.concat(Array.from(j.u8), tail));
    }

    const out: number[] = [];
    for (const b of strBytes('%PDF-1.7\n%\xFF\xFF\xFF\xFF\n')) out.push(b);
    const offsets: number[] = [];
    for (let no = 1; no <= objs.length; no++) {
      offsets[no] = out.length;
      for (const b of objs[no - 1]) out.push(b);
    }
    const xrefStart = out.length;
    let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (let no = 1; no <= objs.length; no++) xref += String(offsets[no]).padStart(10, '0') + ' 00000 n \n';
    xref += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogNo} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    for (const b of strBytes(xref)) out.push(b);
    return Uint8Array.from(out);
  }
}
