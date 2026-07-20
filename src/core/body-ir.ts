/* ------------------------------------------------------------------ *
 *  Body-IR — cursor hand-off (main.js.reference:1996-2033).
 *
 *  Letterhead keeps its OWN cursor mechanic for the letter frame
 *  (Betreff/Anrede before the body, Gruß/Unterschrift/Anlagen after).
 *  Only the Markdown body is delegated to the vendored kit engine's
 *  `layoutDocument`, with the cursor position handed across the seam:
 *    - page 0 of the body begins at letterhead's CURRENT baseline (`y`),
 *      wired in via bodyLayoutOptions(model, settings, y) => page.startY;
 *    - body ops are shifted onto our page counter (`op.page + page`);
 *    - afterwards our own cursor resumes from res.endPage / res.endY.
 *
 *  Frame-element spacing is VERBATIM from the reference — do not drift.
 * ------------------------------------------------------------------ */

import { layoutDocument, type Block, type DrawOp } from '../vendor/kit/pdf';
import { wrapRuns, type WrapRun } from '../vendor/kit/pdf/wrap';
import { mmToPt, yTopMmToPt, pageSizePt } from '../vendor/kit/pdf/geometry';
import {
  styleFonts,
  STILE,
  parseLenPt,
  bodyLayoutOptions,
  dinGeometry,
  hexToRgb01,
  PRINT_BOTTOM_MM,
  PRINT_TOP_N_MM,
  type LetterModel,
  type LetterheadSettings
} from './model';

// DIN letters are always A4 (matches main.js.reference PAGE_H_PT=841.89).
const { hPt: PAGE_H_PT } = pageSizePt('A4');
const ASCENT = 0.78;

/** The printed-letter labels this pass needs (singular/plural Anlagen heading).
 *  Deliberately narrow, mirroring LetterHeadLabels in head-layout.ts: each
 *  consumer declares the shape it consumes, LetterModelResolved (main.ts) is
 *  the superset. */
export interface LetterBodyLabels {
  anlage?: string;
  anlagen?: string;
}

/** Consumer shape for the body/frame pass — see LetterHeadModel for the head's. */
export interface LetterBodyModel extends LetterModel {
  betreff?: string;
  anrede?: string;
  gruss?: string;
  unterschrift?: string;
  anlagen?: string[];
  labels?: LetterBodyLabels;
}

export function layoutBody(
  model: LetterBodyModel,
  settings: LetterheadSettings,
  markdownBody: Block[],
  contentTopMm: number
): { ops: DrawOp[]; pageCount: number } {
  const stilKey = (STILE[model.stil as keyof typeof STILE] ? model.stil : 'sachlich') as keyof typeof STILE;
  const stil = STILE[stilKey] || STILE.sachlich;
  const tokens = stil.tokens;
  const fonts = styleFonts(model.stil);
  const g = dinGeometry(settings.dinForm);
  const sizePt = Number(settings.fontSizePt) || tokens.fontSizePt;
  const lineH = parseFloat(tokens.lineHeight) || 1.45;
  const spacePt = parseLenPt(tokens.space, mmToPt(2.6));
  const blockGapPt = parseLenPt(tokens.blockGap, mmToPt(6));
  const sigGapPt = parseLenPt(tokens.signatureGap, mmToPt(16));
  const leftPt = mmToPt(g.marginLeftMm);
  const contentWidthPt = mmToPt(210 - g.marginLeftMm - g.marginRightMm);
  const TEXTCOL = hexToRgb01(tokens.colorText);
  const ops: DrawOp[] = [];

  // ---- letterhead cursor for frame elements (page 0 starts at contentTopMm) ----
  let page = 0;
  let y = yTopMmToPt(contentTopMm + (Number(settings.printOffsetTopMm) || 0), PAGE_H_PT) - ASCENT * sizePt;
  const bottomY = mmToPt(PRINT_BOTTOM_MM);
  const followTop = yTopMmToPt(PRINT_TOP_N_MM, PAGE_H_PT) - ASCENT * sizePt;
  const advance = (h: number): number => {
    if (y - h < bottomY) { page += 1; y = followTop; }
    const yy = y; y -= h; return yy;
  };
  const emitLines = (runs: WrapRun[], sz: number, gapAfter: number, indentPt = 0): void => {
    const lines = wrapRuns(runs, contentWidthPt - indentPt, sz);
    for (const ln of lines) {
      const yy = advance(sz * lineH);
      for (const seg of ln.segments) {
        ops.push({ page, kind: 'text', x: leftPt + indentPt + seg.xPt, y: yy, str: seg.text, fontKey: seg.fontKey, sizePt: sz, rgb: TEXTCOL });
      }
    }
    y -= gapAfter || 0;
  };

  // Betreff + Anrede (frame, before body)
  if (model.betreff) {
    const bt = model.stil === 'technisch' ? String(model.betreff).toUpperCase() : model.betreff;
    emitLines([{ text: bt, fontKey: fonts.bold }], sizePt, blockGapPt);
  }
  if (model.anrede) emitLines([{ text: model.anrede, fontKey: fonts.body }], sizePt, mmToPt(3));

  // ---- Markdown body via composable layoutDocument (cursor hand-off) ----
  if (markdownBody.length) {
    const opts = bodyLayoutOptions(model, settings, y); // startY = current baseline; followTopMm=25
    // layoutDocument pages are 0-based; offset onto our page counter.
    const res = layoutDocument(markdownBody, opts);
    for (const op of res.ops) ops.push({ ...op, page: op.page + page });
    page = page + res.endPage;
    y = res.endY;
  }

  // Gruß / Unterschrift / Anlagen (frame, after body — continue cursor from endY)
  if (model.gruss) { y -= Math.max(0, blockGapPt - spacePt); emitLines([{ text: model.gruss, fontKey: fonts.body }], sizePt, 0); }
  if (model.unterschrift) { y -= sigGapPt; emitLines([{ text: model.unterschrift, fontKey: fonts.body }], sizePt, 0); }
  if (model.anlagen && model.anlagen.length) {
    y -= mmToPt(10);
    const label = model.anlagen.length === 1 ? (model.labels && model.labels.anlage) : (model.labels && model.labels.anlagen);
    emitLines([{ text: label || 'Anlagen', fontKey: fonts.body }], 9.5, mmToPt(1.6));
    for (const a of model.anlagen) emitLines([{ text: a, fontKey: fonts.body }], 9.5, 0);
  }

  return { ops, pageCount: page + 1 };
}
