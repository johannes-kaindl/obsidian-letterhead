// src/pure/pdf/wrap.ts
// Pure PDF line wrapping (AFM-accurate). No Obsidian, no DOM.
// Ported from obsidian-letterhead/main.js

import { textWidthPt } from './metrics';

export interface WrapRun { text: string; fontKey: string }
export interface WrapSegment { text: string; fontKey: string; xPt: number }
export interface WrapLine { segments: WrapSegment[]; widthPt: number }

/* ------------------------------------------------------------------ *
 *  PDF · Textumbruch (pur) — AFM-genaue Zeilen
 * ------------------------------------------------------------------ */
/* Bricht eine Folge stilisierter Runs in Zeilen ≤ maxWidthPt. Wörter sind
   durch Whitespace getrennt; Stilwechsel (fontKey) bleiben erhalten. Ein zu
   langes Einzelwort bleibt ungebrochen in eigener Zeile. */
type Tok = { w: string; fontKey: string; space: boolean };

export function wrapRuns(runs: WrapRun[], maxWidthPt: number, sizePt: number): WrapLine[] {
  const widthOf = (t: Tok) => textWidthPt(t.fontKey, sizePt, t.w);
  const raw: Tok[] = [];
  for (const r of runs) {
    const parts = String(r.text).split(/(\s+)/);
    for (const part of parts) {
      if (part === '') continue;
      raw.push({ w: /^\s+$/.test(part) ? ' ' : part, fontKey: r.fontKey, space: /^\s+$/.test(part) });
    }
  }
  // Normalise: a non-space token that renders to zero width (e.g. an emoji fully
  // dropped by WinAnsi encoding) leaves a "ghost" — drop it, and collapse the
  // consecutive spaces it would strand so headings/lines start flush.
  const toks: Tok[] = [];
  for (const t of raw) {
    if (!t.space && widthOf(t) === 0) continue;
    if (t.space && (toks.length === 0 || toks[toks.length - 1].space)) continue;
    toks.push(t);
  }
  const lines = [];
  let cur = [], curW = 0;
  for (const t of toks) {
    const tw = widthOf(t);
    if (t.space) { if (cur.length === 0) continue; cur.push(t); curW += tw; continue; }
    if (curW + tw > maxWidthPt && cur.length > 0) {
      while (cur.length && cur[cur.length - 1].space) curW -= widthOf(cur.pop()!);
      lines.push(cur); cur = []; curW = 0;
    }
    cur.push(t); curW += tw;
  }
  if (cur.length) { while (cur.length && cur[cur.length - 1].space) cur.pop(); lines.push(cur); }
  return lines.map((lineToks) => {
    const segs = []; let x = 0;
    for (const t of lineToks) {
      const last = segs[segs.length - 1];
      if (last && last.fontKey === t.fontKey) last.text += t.w;
      else segs.push({ text: t.w, fontKey: t.fontKey, xPt: x });
      x += widthOf(t);
    }
    return { segments: segs, widthPt: x };
  });
}
