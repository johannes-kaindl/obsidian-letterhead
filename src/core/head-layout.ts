/* ------------------------------------------------------------------ *
 *  PDF · Letterhead HEAD pass — sender/contact, head separator,
 *  address field, info-block/date line, fold+hole marks — as absolute
 *  DrawOp[] on page 0.
 *
 *  Ported VERBATIM from main.js.reference:1892-1994 (the head portion of
 *  the old `layoutLetter`; the body/pagination portion — lines 1996-2033,
 *  the `page`/`y` cursor loop, Betreff/Anrede/body blocks/Gruß/
 *  Unterschrift/Anlagen — belongs to C5's `layoutBody`, NOT here).
 *
 *  Coordinate math (`baseAt`/`mmDown`, DIN mm offsets, separator-line
 *  calc, fold/hole mark positions) is envelope-window-critical — do not
 *  alter any numeric value or offset.
 * ------------------------------------------------------------------ */

import { mmToPt, yTopMmToPt, pageSizePt, PT_PER_MM } from '../vendor/kit/pdf/geometry';
import { textWidthPt } from '../vendor/kit/pdf/metrics';
import type { DrawOp } from '../vendor/kit/pdf';
import { dinGeometry, hexToRgb01, parseLenPt, styleFonts, STILE, type LetterModel, type LetterheadSettings } from './model';
import { normStil, asText } from './frontmatter';

// DIN letters are always A4 (matches main.js.reference's PAGE_W_PT=595.28 / PAGE_H_PT=841.89).
const { wPt: PAGE_W_PT, hPt: PAGE_H_PT } = pageSizePt('A4');

export interface LetterHeadLabels {
  telPrefix?: string;
  datum?: string;
  steuernummer?: string;
  ihrZeichen?: string;
  ihrSchreiben?: string;
  unserZeichen?: string;
  telefon?: string;
}

export interface LetterHeadModel extends LetterModel {
  senderName?: string;
  senderZusatz?: string;
  senderStrasse?: string;
  senderPlzOrt?: string;
  senderTelefon?: string;
  senderEmail?: string;
  senderWeb?: string;
  logo?: string;
  ruecksende?: string;
  recipient?: string[];
  infozeile?: string;
  ort?: string;
  datum?: string;
  steuernummer?: string;
  ihrZeichen?: string;
  ihrSchreiben?: string;
  unserZeichen?: string;
  telefonBezug?: string;
  infoExtra?: [string, string][];
  labels?: LetterHeadLabels;
}

export interface LayoutHeadResult {
  ops: DrawOp[];
  contentTopMm: number;
}

/* Positions the letterhead HEAD (name/contact/address/info-block/fold+hole
   marks) as absolute Draw-Ops (PDF-pt, origin bottom-left), all on page 0.
   The logo image is NOT drawn here — it is added by the orchestration (D4)
   as a separate image op, per main.js.reference:1924. */
export function layoutHead(model: LetterHeadModel, settings: LetterheadSettings): LayoutHeadResult {
  const g = dinGeometry(settings.dinForm);
  const off = Number(settings.printOffsetTopMm) || 0;
  const stilKey = (normStil(model.stil || settings.stil) || 'sachlich') as keyof typeof STILE;
  const fonts = styleFonts(stilKey);
  const tokens = (STILE[stilKey] || STILE.sachlich).tokens;
  const sizePt = Number(settings.fontSizePt) || tokens.fontSizePt;
  const nameSizePt = parseLenPt(tokens.nameSize, sizePt + 5);
  const contactPt = sizePt - 1.5;
  const upperName = String(tokens.nameTransform || '').indexOf('upper') >= 0;
  const TEXTCOL = hexToRgb01(tokens.colorText);
  const MUTED = hexToRgb01(tokens.colorMuted);
  const RULE = hexToRgb01(tokens.colorRule);
  const HAIRLINE = hexToRgb01(tokens.colorHairline);
  const leftPt = mmToPt(g.marginLeftMm);
  const rightEdge = PAGE_W_PT - mmToPt(g.marginRightMm);
  // DIN-Positionen sind Text-OBERKANTEN (wie CSS top); die Baseline liegt um die
  // Ascent tiefer. ascent≈0.78·Schriftgröße deckt die Core-14-Fonts gut ab.
  const ASCENT = 0.78;
  const baseAt = (topMm: number, szPt: number) => yTopMmToPt(topMm + off, PAGE_H_PT) - ASCENT * szPt;
  const mmDown = (pt: number) => pt / PT_PER_MM; // pt → mm (für Folgepositionen)
  const ops: DrawOp[] = [];
  const T = (page: number, x: number, y: number, str: unknown, fontKey: string, sz?: number, rgb?: [number, number, number]) => {
    if (str !== '' && str != null) ops.push({ page, kind: 'text', x, y, str: asText(str), fontKey, sizePt: sz || sizePt, rgb: rgb || TEXTCOL });
  };
  const L = (page: number, x1: number, y1: number, x2: number, y2: number, w: number, rgb?: [number, number, number]) =>
    ops.push({ page, kind: 'line', x1, y1, x2, y2, wPt: w, rgb: rgb || RULE });

  // ---- Seite 0: Briefkopf (Name links — Logo ergänzt die Orchestrierung als Bild) ----
  const headTopMm = g.headTopMm;
  if (!model.logo && model.senderName) {
    const nm = upperName ? String(model.senderName).toUpperCase() : model.senderName;
    T(0, leftPt, baseAt(headTopMm, nameSizePt), nm, fonts.name, nameSizePt);
    if (model.senderZusatz) T(0, leftPt, baseAt(headTopMm + mmDown(nameSizePt) + 1.2, 9), model.senderZusatz, fonts.body, 9, MUTED);
  }
  // Kontakt rechts (rechtsbündig, gleiche Oberkante wie der Name)
  const contact = [
    [model.senderStrasse, model.senderPlzOrt].filter(Boolean).join(' · '),
    [model.senderTelefon ? ((model.labels && model.labels.telPrefix) || '') + model.senderTelefon : '', model.senderEmail].filter(Boolean).join(' · '),
    model.senderWeb || ''
  ].filter(Boolean);
  for (let i = 0; i < contact.length; i++) {
    const wpt = textWidthPt(fonts.body, contactPt, contact[i]);
    T(0, rightEdge - wpt, baseAt(headTopMm + mmDown(i * contactPt * 1.4), contactPt), contact[i], fonts.body, contactPt, MUTED);
  }

  // Trennlinie unter dem Briefkopf (entspricht border-bottom von .bk-head)
  if (model.logo || model.senderName || contact.length) {
    const logoMm = model.logo ? Math.min(22, g.addrTopMm - headTopMm - 8) : 0;
    const nameBlockMm = (!model.logo && model.senderName) ? mmDown(nameSizePt) * 1.15 + (model.senderZusatz ? mmDown(9) * 1.2 : 0) : 0;
    const contactBlockMm = mmDown(contact.length * contactPt * 1.4);
    let sepMm = headTopMm + Math.max(nameBlockMm, contactBlockMm, logoMm, 5) + 1.5;
    if (sepMm > g.addrTopMm - 3) sepMm = g.addrTopMm - 3;
    L(0, leftPt, yTopMmToPt(sepMm + off, PAGE_H_PT), rightEdge, yTopMmToPt(sepMm + off, PAGE_H_PT), 0.3 * PT_PER_MM, HAIRLINE);
  }

  // ---- Anschriftfeld: Rücksendezeile + Empfänger ----
  let recipTopMm = g.addrTopMm;
  if (model.ruecksende) {
    T(0, leftPt, baseAt(g.addrTopMm, 7), model.ruecksende, fonts.body, 7, MUTED);
    const ulMm = g.addrTopMm + mmDown(7) + 1.2;
    L(0, leftPt, yTopMmToPt(ulMm + off, PAGE_H_PT), leftPt + mmToPt(g.addrWidthMm), yTopMmToPt(ulMm + off, PAGE_H_PT), 0.25 * PT_PER_MM, RULE);
    recipTopMm = g.addrTopMm + 9;
  }
  const recipientLines = model.recipient || [];
  for (let i = 0; i < recipientLines.length; i++) {
    T(0, leftPt, baseAt(recipTopMm + mmDown(i * sizePt * 1.4), sizePt), recipientLines[i], fonts.body, sizePt);
  }

  // ---- Infoblock oder Datumzeile ----
  if (model.infozeile === 'nurdatum') {
    const dl = (model.ort ? model.ort + ', ' : '') + model.datum;
    const wpt = textWidthPt(fonts.body, sizePt, dl);
    T(0, rightEdge - wpt, baseAt(g.dateTopMm, sizePt), dl, fonts.body, sizePt);
  } else {
    const L0 = model.labels || {};
    const rows: Array<[string, unknown]> = [];
    const add = (lab: string | undefined, val: unknown) => { if (val) rows.push([lab || '', val]); };
    add(L0.steuernummer, model.steuernummer); add(L0.ihrZeichen, model.ihrZeichen);
    add(L0.ihrSchreiben, model.ihrSchreiben); add(L0.unserZeichen, model.unserZeichen);
    add(L0.telefon, model.telefonBezug);
    for (const [k, v] of (model.infoExtra || [])) add(k, v);
    rows.push([L0.datum || 'Datum', model.datum]);
    const ix = rightEdge - mmToPt(64);
    for (let i = 0; i < rows.length; i++) {
      const yMm = g.infoTopMm + mmDown(i * 9 * 1.35);
      T(0, ix, baseAt(yMm, 9), rows[i][0], fonts.body, 9, MUTED);
      const vw = textWidthPt(fonts.body, 9, String(rows[i][1]));
      T(0, rightEdge - vw, baseAt(yMm, 9), String(rows[i][1]), fonts.body, 9);
    }
  }

  // ---- Falz-/Lochmarken (nur Seite 0, x1 = 0 am Blattrand) ----
  if (settings.showFoldMarks) {
    L(0, 0, yTopMmToPt(g.fold1Mm, PAGE_H_PT), mmToPt(5), yTopMmToPt(g.fold1Mm, PAGE_H_PT), 0.3 * PT_PER_MM);
    L(0, 0, yTopMmToPt(g.fold2Mm, PAGE_H_PT), mmToPt(5), yTopMmToPt(g.fold2Mm, PAGE_H_PT), 0.3 * PT_PER_MM);
  }
  if (settings.showHoleMark) {
    L(0, 0, yTopMmToPt(g.holeMm, PAGE_H_PT), mmToPt(8), yTopMmToPt(g.holeMm, PAGE_H_PT), 0.3 * PT_PER_MM);
  }

  return { ops, contentTopMm: g.contentTopMm };
}
