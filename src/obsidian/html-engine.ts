/* ------------------------------------------------------------------ *
 *  HTML rendering engine — Desktop `window.print()` + on-screen
 *  preview. Kept deliberately (the two-engines model: HTML/CSS for
 *  desktop print + preview, vector-PDF for mobile).
 *
 *  Ported VERBATIM from main.js.reference:
 *    buildCss              — 505-628  (DIN-critical: --bk-din-* tokens,
 *                             envelope-window-critical — every value kept
 *                             exactly as in the reference)
 *    PRINT_WRAPPER_CSS      — 629-644
 *    STANDALONE_WRAPPER_CSS — 645-655
 *    buildStandaloneDoc     — 656-664
 *    SCREEN_PREVIEW_CSS     — 665-679
 *    PRESET_CSS             — 680-721
 *    buildLetterHtml        — 1010-1094 (was `buildLetterHtml(m)`, a method
 *                             on the plugin class; ported as a standalone
 *                             function. The rendered Markdown body reached
 *                             it via `m.bodyHtml` in the reference — here it
 *                             is an explicit third parameter `bodyHtml`
 *                             instead, so this module never needs `app`/
 *                             MarkdownRenderer, which stay in main.ts
 *                             (Task D4).)
 *    doPrint                — 1226-1258 (was a plugin method; ported as a
 *                             standalone function `doPrint(letterHtml, css)`)
 *    BriefkopfPreviewModal  — 1275-1368 (renamed to LetterheadPreviewModal
 *                             as a TS symbol only; internal DOM ids/classes
 *                             `briefkopf-*` / `bk-*` are load-bearing and
 *                             kept unchanged)
 *
 *  This file lives in src/obsidian (not src/core/src/vendor), so it MAY
 *  import `obsidian` — not restricted by `check:pure`.
 * ------------------------------------------------------------------ */

import { Modal, Notice, type App } from 'obsidian';
import { esc, escLines, normStil, toLines } from '../core/frontmatter';
import {
  STILE,
  LETTER_LABELS,
  type LetterheadSettings,
  type LetterLabelSet,
  PRINT_MARGIN_TOP_MM,
  PRINT_MARGIN_TOP_FOLLOW_MM,
  PRINT_MARGIN_BOTTOM_MM
} from '../core/model';
import { t } from '../i18n/strings';

/* ------------------------------------------------------------------ *
 *  buildCss — main.js.reference:505-628
 * ------------------------------------------------------------------ */

export function buildCss(s: LetterheadSettings, stilKey: string | null | undefined): string {
  const stil = STILE[(normStil(stilKey) || 'sachlich') as keyof typeof STILE] || STILE.sachlich;
  const t2 = stil.tokens;
  const form = s.dinForm === 'A'
    ? { headTop: '12mm', f1: '87mm', f2: '192mm', addrTop: '27mm', infoTop: '32mm' }
    : { headTop: '14mm', f1: '105mm', f2: '210mm', addrTop: '45mm', infoTop: '50mm' };
  const font = String(s.fontFamily || '').trim() || t2.fontFamily;
  const fs = Number(s.fontSizePt) || t2.fontSizePt;
  const offset = Number(s.printOffsetTopMm) || 0;

  return `
  :root{
    /* --- Page geometry (DIN-critical: envelope-window alignment) ---
       All positions are measured from the PAPER edge; the components
       subtract --bk-print-margin-top (the @page margin) internally. */
    --bk-page-width:210mm; --bk-page-height:297mm;
    --bk-margin-left:25mm; --bk-margin-right:20mm;
    --bk-print-margin-top:${PRINT_MARGIN_TOP_MM}mm;
    --bk-print-margin-bottom:${PRINT_MARGIN_BOTTOM_MM}mm;
    --bk-print-offset:${offset}mm;
    --bk-din-head-top:calc(${form.headTop} + var(--bk-print-offset));
    --bk-din-address-top:calc(${form.addrTop} + var(--bk-print-offset)); --bk-din-address-left:25mm;
    --bk-din-address-width:85mm; --bk-din-address-height:40mm;
    --bk-din-info-top:calc(${form.infoTop} + var(--bk-print-offset)); --bk-din-info-width:64mm;
    --bk-din-dateline-top:calc(84mm + var(--bk-print-offset));
    --bk-din-fold-1:${form.f1}; --bk-din-fold-2:${form.f2}; --bk-din-hole:148.5mm;
    --bk-din-content-top:calc(98.46mm + var(--bk-print-offset));
    /* --- Typography (safe to customize) --- */
    --bk-font-family:${font};
    --bk-font-size:${fs}pt;
    --bk-line-height:${t2.lineHeight};
    /* --- Letterhead name (safe to customize) --- */
    --bk-name-font:${t2.nameFont};
    --bk-name-size:${t2.nameSize};
    --bk-name-weight:${t2.nameWeight};
    --bk-name-spacing:${t2.nameSpacing};
    --bk-name-transform:${t2.nameTransform};
    /* --- Colors (safe to customize) --- */
    --bk-color-text:${t2.colorText};
    --bk-color-muted:${t2.colorMuted};      /* info-block labels, head contact */
    --bk-color-rule:${t2.colorRule};        /* fold/hole marks + return-address underline */
    --bk-color-hairline:${t2.colorHairline};/* letterhead separator */
    /* --- Spacing (safe to customize) --- */
    --bk-space:${t2.space};                 /* base paragraph rhythm */
    --bk-block-gap:${t2.blockGap};          /* gap between letter blocks */
    --bk-signature-gap:${t2.signatureGap};  /* room for a handwritten signature */
  }
  .bk-letter{ position:relative; box-sizing:border-box; width:var(--bk-page-width);
    min-height:calc(var(--bk-page-height) - var(--bk-print-margin-top) - var(--bk-print-margin-bottom));
    margin:0 auto; background:#fff; color:var(--bk-color-text);
    font-family:var(--bk-font-family); font-size:var(--bk-font-size); line-height:var(--bk-line-height); }
  .bk-letter *{ box-sizing:border-box; }

  /* fold + hole marks (left margin / Heftrand) — paper-true positions */
  .bk-mark{ position:absolute; left:0; width:5mm; height:0; border-top:0.3mm solid var(--bk-color-rule); }
  .bk-mark.bk-lo{ width:8mm; }
  .bk-f1{ top:calc(var(--bk-din-fold-1) - var(--bk-print-margin-top)); }
  .bk-f2{ top:calc(var(--bk-din-fold-2) - var(--bk-print-margin-top)); }
  .bk-lo{ top:calc(var(--bk-din-hole) - var(--bk-print-margin-top)); }

  /* ---- DIN 5008 layout ---- */
  .bk-din .bk-head{ position:absolute; top:calc(var(--bk-din-head-top) - var(--bk-print-margin-top));
    left:var(--bk-margin-left); right:var(--bk-margin-right);
    display:flex; justify-content:space-between; align-items:flex-end; gap:12mm;
    padding-bottom:3mm; border-bottom:0.3mm solid var(--bk-color-hairline); }
  .bk-din .bk-head img{ max-height:calc(var(--bk-din-address-top) - var(--bk-din-head-top) - 8mm); max-width:90mm; }
  .bk-din .bk-head-name{ font-family:var(--bk-name-font); font-size:var(--bk-name-size);
    font-weight:var(--bk-name-weight); letter-spacing:var(--bk-name-spacing);
    text-transform:var(--bk-name-transform); line-height:1.1; white-space:nowrap; }
  .bk-din .bk-head-zusatz{ font-size:9pt; color:var(--bk-color-muted); margin-top:1mm; }
  .bk-din .bk-head-contact{ text-align:right; font-size:8.5pt; line-height:1.5; color:var(--bk-color-muted); }

  .bk-din .bk-address{ position:absolute; top:calc(var(--bk-din-address-top) - var(--bk-print-margin-top));
    left:var(--bk-din-address-left);
    width:var(--bk-din-address-width); height:var(--bk-din-address-height); overflow:hidden; }
  .bk-din .bk-return{ font-size:7pt; line-height:1.3; color:var(--bk-color-muted);
    padding-bottom:1.2mm; border-bottom:0.25mm solid var(--bk-color-rule);
    margin-bottom:4.5mm; white-space:nowrap; overflow:hidden; }
  .bk-din .bk-recipient{ white-space:pre-line; line-height:1.45; }

  .bk-din .bk-infoblock{ position:absolute; top:calc(var(--bk-din-info-top) - var(--bk-print-margin-top));
    right:var(--bk-margin-right);
    width:var(--bk-din-info-width); font-size:9pt; line-height:1.35; }
  .bk-din .bk-info-item{ display:flex; justify-content:space-between; align-items:baseline; gap:10px; padding:0.7mm 0; }
  .bk-din .bk-info-label{ color:var(--bk-color-muted); white-space:nowrap; }
  .bk-din .bk-info-value{ text-align:right; }

  .bk-din .bk-dateline{ position:absolute; top:calc(var(--bk-din-dateline-top) - var(--bk-print-margin-top));
    right:var(--bk-margin-right);
    text-align:right; font-size:var(--bk-font-size); line-height:1.4; white-space:nowrap; }

  .bk-din .bk-content{ margin-left:var(--bk-margin-left); margin-right:var(--bk-margin-right);
    padding-top:calc(var(--bk-din-content-top) - var(--bk-print-margin-top)); }

  /* ---- Modern layout ---- */
  .bk-modern{ padding:calc(var(--bk-margin-left) - var(--bk-print-margin-top)) var(--bk-margin-right)
    calc(var(--bk-margin-left) - var(--bk-print-margin-bottom)); }
  .bk-modern .bk-m-head{ display:flex; justify-content:space-between; align-items:flex-start;
    gap:10mm; margin-bottom:16mm; }
  .bk-modern .bk-m-logo{ max-height:22mm; max-width:80mm; }
  .bk-modern .bk-m-sender{ text-align:right; font-size:9pt; line-height:1.35; margin-left:auto; }
  .bk-modern .bk-m-name{ font-family:var(--bk-name-font); font-weight:var(--bk-name-weight);
    letter-spacing:var(--bk-name-spacing); text-transform:var(--bk-name-transform); font-size:12pt; }
  .bk-modern .bk-m-recipient{ white-space:pre-line; line-height:1.35; margin-bottom:12mm; }
  .bk-modern .bk-m-date{ text-align:right; margin-bottom:10mm; }

  /* ---- shared body blocks ---- */
  .bk-betreff{ font-weight:bold; margin:0 0 var(--bk-block-gap); }
  .bk-greeting{ margin:0 0 3mm; }
  .bk-body p{ margin:0 0 var(--bk-space); }
  .bk-body ul, .bk-body ol{ margin:0 0 var(--bk-space); padding-left:6mm; }
  .bk-body h1, .bk-body h2, .bk-body h3{ font-size:1em; font-weight:bold; margin:4mm 0 2mm; }
  .bk-body{ text-align:left; }
  .bk-closing{ margin-top:var(--bk-block-gap); }
  .bk-signature{ margin-top:var(--bk-signature-gap); white-space:pre-line; }
  .bk-enclosures{ margin-top:14mm; font-size:9.5pt; line-height:1.45; color:var(--bk-color-muted); }
  .bk-encl-label{ color:var(--bk-color-text); margin-bottom:1.6mm; }
  .bk-encl-list{ list-style:none; margin:0; padding:0; }
  .bk-encl-list li{ padding:0.3mm 0; }
  ${stil.extraCss || ''}
  ${s.customCss || ''}
  `;
}

/* ------------------------------------------------------------------ *
 *  PRINT_WRAPPER_CSS — main.js.reference:629-644
 * ------------------------------------------------------------------ */

export const PRINT_WRAPPER_CSS = `
  #briefkopf-print-root{ display:none; }
  @media print{
    @page{ size:A4; margin:${PRINT_MARGIN_TOP_FOLLOW_MM}mm 0 ${PRINT_MARGIN_BOTTOM_MM}mm 0; }
    @page:first{ margin-top:${PRINT_MARGIN_TOP_MM}mm; }
    html, body{ margin:0 !important; padding:0 !important; background:#fff !important; height:auto !important; }
    body > *:not(#briefkopf-print-root){ display:none !important; }
    #briefkopf-print-root{ display:block !important; position:static !important; }
    .bk-body p{ orphans:2; widows:2; }
    .bk-signature, .bk-enclosures, .bk-closing{ break-inside:avoid; }
  }
`;

/* Wrapper for the standalone export file (iOS share path): unlike
   PRINT_WRAPPER_CSS, the letter must be visible on screen too (the user opens
   the file in Safari before printing), while keeping the same @page margins.
   main.js.reference:645-655 */
export const STANDALONE_WRAPPER_CSS = `
  @page{ size:A4; margin:${PRINT_MARGIN_TOP_FOLLOW_MM}mm 0 ${PRINT_MARGIN_BOTTOM_MM}mm 0; }
  @page:first{ margin-top:${PRINT_MARGIN_TOP_MM}mm; }
  html, body{ margin:0; padding:0; background:#fff; }
  .bk-body p{ orphans:2; widows:2; }
  .bk-signature, .bk-enclosures, .bk-closing{ break-inside:avoid; }
`;

/* Build a self-contained HTML document for the iOS share/print path. Pure:
   no Obsidian imports. letterHtml comes from buildLetterHtml (esc()-escaped),
   css from buildCss (includes the --bk-* tokens and the data:-URL logo).
   main.js.reference:656-664 */
export function buildStandaloneDoc(letterHtml: string, css: string): string {
  return `<!doctype html><html lang="de"><head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>Brief</title>` +
    `<style>${css}${STANDALONE_WRAPPER_CSS}</style>` +
    `</head><body>${letterHtml}</body></html>`;
}

/* main.js.reference:665-679 */
export const SCREEN_PREVIEW_CSS = `
  html,body{ margin:0; padding:0; }
  body{ background:#d9d9d9; padding:14px 0; }
  .bk-letter{ margin:0; }
  /* paginated preview: one .bk-sheet per printed page; .bk-page-clip is the
     page content area (@page margins), the letter copy inside is shifted up
     by the height of all previous pages — same slicing as the print engine */
  .bk-sheet{ position:relative; width:var(--bk-page-width); height:var(--bk-page-height);
    margin:0 auto 6mm; background:#fff; overflow:hidden;
    box-shadow:0 2px 14px rgba(0,0,0,.35); }
  .bk-sheet .bk-page-clip{ position:absolute; left:0; right:0; overflow:hidden; }
`;

/* Inert (fully commented) starter that pre-fills the Custom CSS field.
   "Reset preset" restores it. Kept identical to presets/briefkopf-theme.css.
   main.js.reference:680-721 */
export const PRESET_CSS = `/* =====================================================================
   Briefkopf – Custom CSS (optionaler Feinschliff)
   ---------------------------------------------------------------------
   Alles unten ist auskommentiert und damit wirkungslos. Zum Aktivieren
   eine Zeile aus ihrem Kommentar holen und den Wert anpassen.
   Stil (Style) und Infozeile (Info line) wählst du direkt in den
   Einstellungen — dieses Feld ist nur für Feinheiten darüber hinaus.
   "Reset preset" stellt diesen Ausgangszustand wieder her.
   Workflow: Zeile aktivieren -> "Open letter preview" -> prüfen.
   Alle Tokens und Klassen: docs/reference/theming.md
   ===================================================================== */

/* ---------- Typografie (SICHER) ---------- */
/* :root { --bk-font-family: "Helvetica Neue", Arial, sans-serif; } */
/* :root { --bk-font-size: 10pt; } */
/* :root { --bk-line-height: 1.45; } */

/* ---------- Name im Briefkopf (SICHER) ---------- */
/* :root { --bk-name-size: 15.5pt; } */
/* :root { --bk-name-weight: 600; } */
/* :root { --bk-name-spacing: 0.005em; } */
/* :root { --bk-name-transform: uppercase; } */

/* ---------- Farben (SICHER) ---------- */
/* :root { --bk-color-text: #1a1a1a; } */
/* :root { --bk-color-muted: #555555; } */
/* :root { --bk-color-rule: #000000; } */
/* :root { --bk-color-hairline: #c8c8c8; } */

/* ---------- Abstände (SICHER) ---------- */
/* :root { --bk-space: 2.6mm; } */
/* :root { --bk-block-gap: 6mm; } */
/* :root { --bk-signature-gap: 16mm; } */

/* ---------- Seitengeometrie (DIN-KRITISCH: Fensterkuvert!) ---------- */
/* :root { --bk-din-address-top: 45mm; } */
/* :root { --bk-margin-left: 25mm; } */

/* ---------- Beispiele: einzelne Komponenten ---------- */
/* .bk-betreff { color: #0a7d3c; } */
/* .bk-din .bk-head-name { letter-spacing: 0.3px; } */
`;

/* ------------------------------------------------------------------ *
 *  buildLetterHtml — main.js.reference:1010-1094 (was a plugin method,
 *  `buildLetterHtml(m)`). The reference read the rendered Markdown body
 *  off the model (`m.bodyHtml`, set at main.js.reference:923/989 by
 *  `renderMarkdownToHtml`, which needs `app` and stays in main.ts). Here
 *  it is passed explicitly as `bodyHtml` instead of living on the model.
 * ------------------------------------------------------------------ */

/** The letter model as consumed by `buildLetterHtml`/`buildEnclosuresHtml` —
 *  everything `resolveLetter()` (main.ts, Task D4) assembles, minus the
 *  rendered Markdown body (passed separately, see module doc above). */
export interface LetterHtmlModel {
  recipient: string[];
  betreff: string;
  anrede: string;
  gruss: string;
  unterschrift: string;
  ort: string;
  datum: string;
  anlagen: string[];
  stil: string;
  infozeile: string;
  sprache: string;
  labels: LetterLabelSet;
  steuernummer: string;
  ihrZeichen: string;
  ihrSchreiben: string;
  unserZeichen: string;
  telefonBezug: string;
  infoExtra: Array<[string, string]>;
  senderName: string;
  senderZusatz: string;
  senderStrasse: string;
  senderPlzOrt: string;
  senderTelefon: string;
  senderEmail: string;
  senderWeb: string;
  ruecksende: string;
  logo: string;
}

/* main.js.reference:999-1008 */
function buildEnclosuresHtml(m: LetterHtmlModel): string {
  if (!m.anlagen || m.anlagen.length === 0) return '';
  const L = m.labels || LETTER_LABELS.de;
  const label = m.anlagen.length === 1 ? L.anlage : L.anlagen;
  const items = m.anlagen.map((a) => `<li>${esc(a)}</li>`).join('');
  return `<div class="bk-enclosures">
      <div class="bk-encl-label">${label}</div>
      <ul class="bk-encl-list">${items}</ul>
    </div>`;
}

export function buildLetterHtml(m: LetterHtmlModel, s: LetterheadSettings, bodyHtml: string): string {
  const marks =
    (s.showFoldMarks ? '<div class="bk-mark bk-f1"></div><div class="bk-mark bk-f2"></div>' : '') +
    (s.showHoleMark ? '<div class="bk-mark bk-lo"></div>' : '');
  const enclosures = buildEnclosuresHtml(m);

  if (s.theme === 'modern') {
    const senderLines = [m.senderZusatz, m.senderStrasse, m.senderPlzOrt, m.senderTelefon, m.senderEmail, m.senderWeb]
      .filter(Boolean).map((x) => `<div>${esc(x)}</div>`).join('');
    return `<div class="bk-letter bk-modern">
        ${marks}
        <header class="bk-m-head">
          ${m.logo ? `<img class="bk-m-logo" src="${m.logo}" alt="">` : '<div></div>'}
          <div class="bk-m-sender">
            ${m.senderName ? `<div class="bk-m-name">${esc(m.senderName)}</div>` : ''}
            ${senderLines}
          </div>
        </header>
        <section class="bk-m-recipient">${escLines(m.recipient)}</section>
        <div class="bk-m-date">${m.ort ? esc(m.ort) + ', ' : ''}${esc(m.datum)}</div>
        ${m.betreff ? `<div class="bk-betreff">${esc(m.betreff)}</div>` : ''}
        ${m.anrede ? `<div class="bk-anrede bk-greeting">${esc(m.anrede)}</div>` : ''}
        <div class="bk-body">${bodyHtml}</div>
        ${m.gruss ? `<div class="bk-gruss bk-closing">${esc(m.gruss)}</div>` : ''}
        ${m.unterschrift ? `<div class="bk-signatur bk-signature">${escLines(toLines(m.unterschrift))}</div>` : ''}
        ${enclosures}
      </div>`;
  }

  // DIN 5008 — letterhead: name (or logo) left, contact right, hairline below
  const contactLines = [
    [m.senderStrasse, m.senderPlzOrt].filter(Boolean).join(' · '),
    [m.senderTelefon ? (m.labels || LETTER_LABELS.de).telPrefix + m.senderTelefon : '', m.senderEmail].filter(Boolean).join(' · '),
    m.senderWeb || ''
  ].filter(Boolean).map((x) => `<div>${esc(x)}</div>`).join('');

  const headLeft = m.logo
    ? `<img src="${m.logo}" alt="">`
    : (m.senderName
      ? `<div><div class="bk-head-name">${esc(m.senderName)}</div>${m.senderZusatz ? `<div class="bk-head-zusatz">${esc(m.senderZusatz)}</div>` : ''}</div>`
      : '<div></div>');

  const head = (m.logo || m.senderName || contactLines)
    ? `<header class="bk-head">${headLeft}${contactLines ? `<div class="bk-head-contact">${contactLines}</div>` : ''}</header>`
    : '';

  // info zone: full info block (DIN Informationsblock) or a plain date line
  let infozone: string;
  if (m.infozeile === 'nurdatum') {
    infozone = `<div class="bk-dateline">${m.ort ? esc(m.ort) + ', ' : ''}${esc(m.datum)}</div>`;
  } else {
    const L = m.labels || LETTER_LABELS.de;
    const rows: Array<[string, string]> = [];
    const addRow = (label: string, val: string): void => { if (val) rows.push([label, val]); };
    addRow(L.steuernummer, m.steuernummer);
    addRow(L.ihrZeichen, m.ihrZeichen);
    addRow(L.ihrSchreiben, m.ihrSchreiben);
    addRow(L.unserZeichen, m.unserZeichen);
    addRow(L.telefon, m.telefonBezug);
    for (const [k, v] of m.infoExtra) addRow(k, v);
    rows.push([L.datum, m.datum]);
    infozone = `<div class="bk-infoblock">` + rows.map(([l, v]) =>
      `<div class="bk-info-item"><span class="bk-info-label">${esc(l)}</span><span class="bk-info-value">${esc(v)}</span></div>`
    ).join('') + `</div>`;
  }

  return `<div class="bk-letter bk-din">
      ${marks}
      ${head}
      <section class="bk-anschrift bk-address">
        ${m.ruecksende ? `<div class="bk-ruecksende bk-return">${esc(m.ruecksende)}</div>` : ''}
        <div class="bk-empf bk-recipient">${escLines(m.recipient)}</div>
      </section>
      ${infozone}
      <div class="bk-content">
        ${m.betreff ? `<div class="bk-betreff">${esc(m.betreff)}</div>` : ''}
        ${m.anrede ? `<div class="bk-anrede bk-greeting">${esc(m.anrede)}</div>` : ''}
        <div class="bk-body">${bodyHtml}</div>
        ${m.gruss ? `<div class="bk-gruss bk-closing">${esc(m.gruss)}</div>` : ''}
        ${m.unterschrift ? `<div class="bk-signatur bk-signature">${escLines(toLines(m.unterschrift))}</div>` : ''}
        ${enclosures}
      </div>
    </div>`;
}

/* ------------------------------------------------------------------ *
 *  doPrint — main.js.reference:1226-1258 (was a plugin method)
 * ------------------------------------------------------------------ */

export function doPrint(letterHtml: string, css: string): void {
  const oldRoot = document.getElementById('briefkopf-print-root');
  if (oldRoot) oldRoot.remove();
  const oldStyle = document.getElementById('briefkopf-print-style');
  if (oldStyle) oldStyle.remove();

  const style = document.createElement('style');
  style.id = 'briefkopf-print-style';
  style.textContent = css + PRINT_WRAPPER_CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'briefkopf-print-root';
  /* innerHTML is safe here: letterHtml is generated by buildLetterHtml from
     esc()-escaped frontmatter strings plus Obsidian's own MarkdownRenderer
     output — no raw user HTML is ever interpolated. */
  root.innerHTML = letterHtml;
  document.body.appendChild(root);

  let done = false;
  const cleanup = (): void => {
    if (done) return;
    done = true;
    root.remove();
    style.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  // give layout + embedded images a tick, then open the print/save-as-PDF dialog
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      new Notice(t('notice_print_failed'));
      cleanup();
    }
  }, 150);
  // safety net for platforms that never fire 'afterprint' (some iOS cases)
  setTimeout(cleanup, 60000);
}

/* ------------------------------------------------------------------ *
 *  Preview modal — main.js.reference:1275-1368 (was `BriefkopfPreviewModal`;
 *  renamed to `LetterheadPreviewModal` as a TS symbol only — the internal
 *  DOM ids/classes `bk-preview-stage`, `briefkopf-preview-modal`,
 *  `briefkopf-preview-frame`, `briefkopf-preview-actions` are unchanged.)
 * ------------------------------------------------------------------ */

/** Minimal host contract the modal needs from the plugin: triggering the
 *  export flow when the user clicks "Export PDF" in the preview. */
export interface LetterheadPreviewHost {
  exportLetter(): void | Promise<void>;
}

export class LetterheadPreviewModal extends Modal {
  private plugin: LetterheadPreviewHost;
  private html: string;
  private css: string;
  private resizeObserver: ResizeObserver | null = null;

  constructor(app: App, plugin: LetterheadPreviewHost, html: string, css: string) {
    super(app);
    this.plugin = plugin;
    this.html = html;
    this.css = css;
  }

  onOpen(): void {
    this.modalEl.addClass('briefkopf-preview-modal');
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: t('modal_title') });

    const frame = contentEl.createEl('iframe', { cls: 'briefkopf-preview-frame' });
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8">
      <style>${this.css}${SCREEN_PREVIEW_CSS}</style></head>
      <body><div id="bk-preview-stage">${this.html}</div></body></html>`;

    /* Slice the flowing letter into A4 sheets — same cut positions as the
       print engine (@page margins: page 1 vs. continuation pages). */
    const paginate = (): void => {
      try {
        const doc = frame.contentDocument;
        const stage = doc && doc.getElementById('bk-preview-stage');
        const letter = stage && stage.querySelector('.bk-letter');
        if (!letter || !doc || stage.dataset.paginated) return;
        const probe = doc.createElement('div');
        probe.style.cssText = 'position:absolute;visibility:hidden;height:100mm;width:10mm;';
        doc.body.appendChild(probe);
        const mm = probe.offsetHeight / 100;
        probe.remove();
        const h1 = Math.round((297 - PRINT_MARGIN_TOP_MM - PRINT_MARGIN_BOTTOM_MM) * mm);
        const hN = Math.round((297 - PRINT_MARGIN_TOP_FOLLOW_MM - PRINT_MARGIN_BOTTOM_MM) * mm);
        const total = (letter as HTMLElement).offsetHeight;
        const pages = total <= h1 ? 1 : 1 + Math.ceil((total - h1) / hN);
        const frag = doc.createDocumentFragment();
        for (let i = 0; i < pages; i++) {
          const sheet = doc.createElement('div');
          sheet.className = 'bk-sheet';
          const clip = doc.createElement('div');
          clip.className = 'bk-page-clip';
          clip.style.top = (i === 0 ? PRINT_MARGIN_TOP_MM : PRINT_MARGIN_TOP_FOLLOW_MM) + 'mm';
          clip.style.height = (i === 0 ? h1 : hN) + 'px';
          const copy = letter.cloneNode(true) as HTMLElement;
          copy.style.marginTop = (i === 0 ? 0 : -(h1 + (i - 1) * hN)) + 'px';
          clip.appendChild(copy);
          sheet.appendChild(clip);
          frag.appendChild(sheet);
        }
        stage.textContent = '';
        stage.appendChild(frag);
        stage.dataset.paginated = '1';
      } catch (e) { /* leave the un-paginated letter visible */ }
    };

    /* Fit a whole A4 sheet into the frame. CSS `zoom` is ignored by iOS
       WebKit, so scale the stage with transform (works on every platform).
       Height is tracked so the frame scrolls correctly after scaling. */
    const fitPreview = (): void => {
      try {
        const doc = frame.contentDocument;
        const stage = doc && doc.getElementById('bk-preview-stage');
        const sheet = stage && (doc!.querySelector('.bk-sheet') || doc!.querySelector('.bk-letter'));
        if (!stage || !sheet || !doc) return;
        stage.style.transformOrigin = 'top center';
        stage.style.transform = 'none';
        const pageW = (sheet as HTMLElement).offsetWidth || 794;
        const z = Math.min(1, (frame.clientWidth - 20) / pageW);
        stage.style.transform = `scale(${z})`;
        doc.body.style.height = Math.ceil(stage.getBoundingClientRect().height + 28) + 'px';
      } catch (e) { /* cross-origin or detached frame — leave unscaled */ }
    };
    frame.addEventListener('load', () => { paginate(); fitPreview(); });
    this.resizeObserver = new ResizeObserver(fitPreview);
    this.resizeObserver.observe(frame);

    const actions = contentEl.createDiv({ cls: 'briefkopf-preview-actions' });
    const exportBtn = actions.createEl('button', { text: t('modal_export'), cls: 'mod-cta' });
    exportBtn.onclick = () => { this.close(); void this.plugin.exportLetter(); };
    const closeBtn = actions.createEl('button', { text: t('modal_close') });
    closeBtn.onclick = () => this.close();
  }

  onClose(): void {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
    this.contentEl.empty();
  }
}
