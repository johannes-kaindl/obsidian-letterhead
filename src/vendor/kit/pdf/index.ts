// src/pure/pdf/index.ts
import { pageSizePt } from './geometry';
import { PdfWriter } from './writer';
import { layoutDocument } from './layout';
import { Block } from './ir';
import { LayoutOptions } from './options';

export * from './ir';
export * from './options';
export { layoutDocument } from './layout';
export type { DrawOp } from './layout';

// End-to-end: IR + options → PDF bytes. Synchronous; images must be pre-decoded.
export function renderPdf(doc: Block[], options: LayoutOptions): Uint8Array {
  const { pageCount, ops } = layoutDocument(doc, options);
  const { wPt, hPt } = pageSizePt(options.page.size);
  const writer = new PdfWriter(wPt, hPt);
  const pages = [];
  for (let i = 0; i < pageCount; i++) pages.push(writer.addPage());
  const imgNames = new Map<Uint8Array, string>();
  for (const op of ops) {
    const pg = pages[op.page] || pages[pages.length - 1];
    if (op.kind === 'text') pg.text(op.x, op.y, op.str, op.fontKey, op.sizePt, op.rgb);
    else if (op.kind === 'line') pg.line(op.x1, op.y1, op.x2, op.y2, op.wPt, op.rgb);
    else if (op.kind === 'rect') pg.rect(op.x, op.y, op.w, op.h, op.rgb);
    else if (op.kind === 'image') {
      let name = imgNames.get(op.data);
      if (!name) { name = writer.addJpeg(op.data, op.wPx, op.hPx); imgNames.set(op.data, name); }
      pg.image(name, op.x, op.y, op.w, op.h);
    }
  }
  return writer.build();
}
