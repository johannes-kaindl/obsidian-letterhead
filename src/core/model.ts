/* ------------------------------------------------------------------ *
 *  Settings, styles ("Stile"), DIN geometry, and the letterhead ->
 *  kit-engine LayoutOptions bridge.
 *
 *  DEFAULT_SETTINGS / LETTER_LABELS / MONO_STACK / STILE / dinGeometry /
 *  parseLenPt / styleFonts / PRINT_MARGIN_* are ported VERBATIM from
 *  main.js.reference:37-171, :501-503, :1619-1645, :1882-1887 — do not
 *  alter any numeric value or token, they are DIN/envelope-critical.
 *
 *  hexToRgb01 is re-exported from the vendored kit (identical logic,
 *  already ported once — see src/vendor/kit/pdf/geometry.ts).
 *
 *  bodyLayoutOptions() is NEW: it bridges the letterhead style tokens
 *  to the kit engine's LayoutOptions for rendering the Markdown body.
 * ------------------------------------------------------------------ */

import { mmToPt, hexToRgb01 } from '../vendor/kit/pdf/geometry';
import { DEFAULT_OPTIONS, type LayoutOptions, type FontChoice } from '../vendor/kit/pdf';
import { normStil, asText } from './frontmatter';
import { DEFAULT_FILENAME_TEMPLATE } from './filename';

export { hexToRgb01 };

/* ------------------------------------------------------------------ *
 *  Settings
 * ------------------------------------------------------------------ */

export interface SenderSettings {
  name: string;
  zusatz: string;
  strasse: string;
  plzOrt: string;
  telefon: string;
  email: string;
  web: string;
}

export interface LetterheadSettings {
  theme: string;
  stil: string;
  infozeile: string;
  dinForm: string;
  sender: SenderSettings;
  returnAddressLine: string;
  showFoldMarks: boolean;
  showHoleMark: boolean;
  showLogo: boolean;
  logoPath: string;
  fontFamily: string;
  fontSizePt: string | number;
  locale: string;
  briefSprache: string;
  defaultGruss: string;
  printOffsetTopMm: number;
  customCss: string;
  mobileExport: string;
  /** Filename scheme for exported/printed letters — see core/filename.ts. */
  filenameTemplate: string;
  /** Where an exported PDF goes — see obsidian/output.ts (OutputMode). */
  outputMode: string;
  /** Vault-relative folder, only used when outputMode === 'customFolder'. */
  outputFolder: string;
}

export const DEFAULT_SETTINGS: LetterheadSettings = {
  theme: 'din5008',          // 'din5008' | 'modern'
  stil: 'sachlich',          // 'sachlich' | 'klassisch' | 'technisch'
  infozeile: 'vollstaendig', // 'vollstaendig' (Infoblock) | 'nurdatum' (Orts-/Datumszeile)
  dinForm: 'B',              // 'A' | 'B'  (letterhead 27mm vs 45mm)
  sender: {
    name: '',
    zusatz: '',
    strasse: '',
    plzOrt: '',
    telefon: '',
    email: '',
    web: ''
  },
  returnAddressLine: '',     // Rücksendeangabe; empty => auto from sender
  showFoldMarks: true,
  showHoleMark: true,
  showLogo: false,
  logoPath: '',              // vault-relative path to an image
  fontFamily: '',            // empty => style default
  fontSizePt: '',            // empty => style default
  locale: 'de-DE',
  briefSprache: 'de',        // letter label language ('de' | 'en'); UI language follows the app
  defaultGruss: '',          // empty => language default ("Mit freundlichen Grüßen" / "Kind regards")
  printOffsetTopMm: 0,       // shifts the letter content down (fold marks stay paper-true)
  customCss: '',
  mobileExport: 'pdf',        // 'pdf' (vector PDF, one tap) | 'print' (HTML/Quick Look)
  filenameTemplate: DEFAULT_FILENAME_TEMPLATE,  // existing installs migrate to '{notiz}' (spec A3)
  outputMode: 'nextToNote',   // existing installs migrate to 'share' (their current behaviour)
  outputFolder: ''
};

/* ------------------------------------------------------------------ *
 *  Languages — letter labels (printed letter, not plugin UI)
 * ------------------------------------------------------------------ */

export interface LetterLabelSet {
  anlage: string;
  anlagen: string;
  steuernummer: string;
  ihrZeichen: string;
  ihrSchreiben: string;
  unserZeichen: string;
  telefon: string;
  datum: string;
  telPrefix: string;
  closing: string;
  salutation: string;
}

export const LETTER_LABELS: Record<'de' | 'en', LetterLabelSet> = {
  de: {
    anlage: 'Anlage', anlagen: 'Anlagen',
    steuernummer: 'Steuernummer', ihrZeichen: 'Ihr Zeichen', ihrSchreiben: 'Ihr Schreiben',
    unserZeichen: 'Unser Zeichen', telefon: 'Telefon', datum: 'Datum',
    telPrefix: 'Tel. ',
    closing: 'Mit freundlichen Grüßen',
    salutation: 'Sehr geehrte Damen und Herren,'
  },
  en: {
    anlage: 'Enclosure', anlagen: 'Enclosures',
    steuernummer: 'Tax number', ihrZeichen: 'Your ref.', ihrSchreiben: 'Your letter',
    unserZeichen: 'Our ref.', telefon: 'Phone', datum: 'Date',
    telPrefix: 'Phone ',
    closing: 'Kind regards',
    salutation: 'Dear Sir or Madam,'
  }
};

/* ------------------------------------------------------------------ *
 *  Built-in styles ("Stile")
 *
 *  Token sets for the three styles (matter-of-fact / classic / technical).
 *  No webfonts: the plugin must work offline (no network access), so the
 *  technical style uses the system monospace stack instead of an @import.
 *  (ui-monospace is intentionally omitted — unsupported on older Obsidian
 *  versions; the named system fonts below cover every platform.)
 * ------------------------------------------------------------------ */

export const MONO_STACK = '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

export interface StyleTokens {
  fontFamily: string;
  fontSizePt: number;
  lineHeight: string;
  colorText: string;
  colorMuted: string;
  colorRule: string;
  colorHairline: string;
  space: string;
  blockGap: string;
  signatureGap: string;
  nameFont: string;
  nameSize: string;
  nameWeight: string;
  nameSpacing: string;
  nameTransform: string;
}

export interface StyleDef {
  label: string;
  tokens: StyleTokens;
  extraCss: string;
}

export const STILE: Record<'sachlich' | 'klassisch' | 'technisch', StyleDef> = {
  sachlich: {
    label: 'Sachlich-modern',
    tokens: {
      fontFamily: '"Helvetica Neue", Arial, "Inter", system-ui, sans-serif',
      fontSizePt: 10,
      lineHeight: '1.45',
      colorText: '#1a1a1a', colorMuted: '#5a5a5a',
      colorRule: '#111111', colorHairline: '#cfcfcf',
      space: '2.6mm', blockGap: '6mm', signatureGap: '16mm',
      nameFont: 'var(--bk-font-family)', nameSize: '15.5pt',
      nameWeight: '600', nameSpacing: '0.005em', nameTransform: 'none'
    },
    extraCss: '.bk-betreff{ font-weight:700; letter-spacing:0; }'
  },
  klassisch: {
    label: 'Klassisch-seriös',
    tokens: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif',
      fontSizePt: 10,
      lineHeight: '1.5',
      colorText: '#1c1a17', colorMuted: '#5a554e',
      colorRule: '#1c1a17', colorHairline: '#c9c2b6',
      space: '2.8mm', blockGap: '6.5mm', signatureGap: '17mm',
      nameFont: 'var(--bk-font-family)', nameSize: '18pt',
      nameWeight: '600', nameSpacing: '0.005em', nameTransform: 'none'
    },
    extraCss: '.bk-betreff{ font-weight:700; }'
  },
  technisch: {
    label: 'Technisch-präzise',
    tokens: {
      fontFamily: '"Helvetica Neue", Arial, "Inter", system-ui, sans-serif',
      fontSizePt: 10,
      lineHeight: '1.5',
      colorText: '#15171a', colorMuted: '#6a7078',
      colorRule: '#15171a', colorHairline: '#d4d7da',
      space: '2.6mm', blockGap: '6mm', signatureGap: '16mm',
      nameFont: MONO_STACK, nameSize: '12.5pt',
      nameWeight: '600', nameSpacing: '0.12em', nameTransform: 'uppercase'
    },
    extraCss: `
      .bk-betreff{ font-weight:600; text-transform:uppercase; letter-spacing:0.07em; font-size:10.5pt; }
      .bk-din .bk-head-contact{ font-family:${MONO_STACK}; font-size:7.5pt; letter-spacing:0.02em; }
      .bk-din .bk-info-label{ font-family:${MONO_STACK}; font-size:7pt; letter-spacing:0.08em; text-transform:uppercase; }
      .bk-din .bk-return{ font-family:${MONO_STACK}; font-size:6.5pt; letter-spacing:0.04em; }
      .bk-din .bk-dateline{ font-family:${MONO_STACK}; font-size:9pt; letter-spacing:0.04em; }
      .bk-din .bk-encl-label{ font-family:${MONO_STACK}; font-size:7.5pt; letter-spacing:0.1em; text-transform:uppercase; }
    `
  }
};

/* ------------------------------------------------------------------ *
 *  Fixed @page margins (main.js:501-503): printers cannot print
 *  borderless, and without page margins multi-page letters break right
 *  at the paper edge. Page 1 keeps a small top margin (the DIN letterhead
 *  sits high by design); continuation pages get document-standard 25/20mm.
 * ------------------------------------------------------------------ */

export const PRINT_MARGIN_TOP_MM = 10;         // page 1
export const PRINT_MARGIN_TOP_FOLLOW_MM = 25;  // page 2+
export const PRINT_MARGIN_BOTTOM_MM = 20;      // all pages

/* Body-cursor aliases (main.js.reference:1611-1612) — used by body-ir.ts's
   own letterhead cursor for the frame elements around the Markdown body. */
export const PRINT_TOP_N_MM = PRINT_MARGIN_TOP_FOLLOW_MM; // 25 (Folgeseiten)
export const PRINT_BOTTOM_MM = PRINT_MARGIN_BOTTOM_MM;    // 20 (alle Seiten)

/* ------------------------------------------------------------------ *
 *  PDF · Einheiten & Geometrie (pur, Obsidian-frei)
 * ------------------------------------------------------------------ */

export interface DinGeometry {
  headTopMm: number;
  addrTopMm: number;
  infoTopMm: number;
  fold1Mm: number;
  fold2Mm: number;
  holeMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  addrWidthMm: number;
  dateTopMm: number;
  contentTopMm: number;
}

/* Spiegel der DIN-Tokens aus buildCss() — kuvert-kritisch, nicht ändern ohne
   Render-Check. headTop/addrTop/infoTop/fold je Form, Rest konstant. */
export function dinGeometry(dinForm: string): DinGeometry {
  const f = String(dinForm) === 'A'
    ? { headTopMm: 12, addrTopMm: 27, infoTopMm: 32, fold1Mm: 87, fold2Mm: 192 }
    : { headTopMm: 14, addrTopMm: 45, infoTopMm: 50, fold1Mm: 105, fold2Mm: 210 };
  return Object.assign(f, {
    holeMm: 148.5, marginLeftMm: 25, marginRightMm: 20,
    addrWidthMm: 85, dateTopMm: 84, contentTopMm: 98.46
  });
}

/* Stil-Token-Länge ("18pt" | "6.5mm" | Zahl) → Punkte. */
export function parseLenPt(v: unknown, fallbackPt: number): number {
  const s = asText(v).trim();
  let m: RegExpExecArray | null;
  if ((m = /^(-?[\d.]+)\s*mm$/.exec(s))) return mmToPt(parseFloat(m[1]));
  if ((m = /^(-?[\d.]+)\s*pt$/.exec(s))) return parseFloat(m[1]);
  const n = parseFloat(s);
  return isFinite(n) ? n : fallbackPt;
}

/* ------------------------------------------------------------------ *
 *  PDF · Brief-Layout-Engine (pur) — Modell-Felder → Draw-Ops
 * ------------------------------------------------------------------ */

export interface StyleFonts {
  body: string;
  bold: string;
  italic: string;
  name: string;
}

/* stilKey is optional because callers may pass a raw, unvalidated frontmatter
   value: normStil() handles null/undefined explicitly and falls through to the
   sans default, which is the intended behaviour for an unset style. */
export function styleFonts(stilKey: string | undefined): StyleFonts {
  const k = normStil(stilKey);
  if (k === 'klassisch') return { body: 'times', bold: 'timesB', italic: 'timesI', name: 'timesB' };
  if (k === 'technisch') return { body: 'helv', bold: 'helvB', italic: 'helvI', name: 'courB' };
  return { body: 'helv', bold: 'helvB', italic: 'helvI', name: 'helvB' };
}

/* ------------------------------------------------------------------ *
 *  NEW: letterhead style tokens -> kit-engine LayoutOptions bridge.
 *  Used for rendering the Markdown body with the vendored kit PDF
 *  layout engine, positioned to start right after the DIN head/address
 *  block (page.startY). Continuation pages fall back to the document-
 *  standard 25mm top margin (page.followTopMm).
 * ------------------------------------------------------------------ */

export interface LetterModel {
  stil?: string;
  [key: string]: unknown;
}

export function bodyLayoutOptions(
  model: LetterModel,
  settings: LetterheadSettings,
  startY: number
): LayoutOptions {
  const g = dinGeometry(settings.dinForm);
  const stilKey = (normStil(model.stil || settings.stil) || 'sachlich') as keyof typeof STILE;
  const stil = STILE[stilKey] || STILE.sachlich;
  const tokens = stil.tokens;
  const sizePt = Number(settings.fontSizePt) || tokens.fontSizePt;
  const lineHeight = parseFloat(tokens.lineHeight) || DEFAULT_OPTIONS.fonts.lineHeight;
  const fontChoice: FontChoice =
    stilKey === 'klassisch' ? 'serif' : stilKey === 'technisch' ? 'mono' : 'sans';

  return {
    ...DEFAULT_OPTIONS,
    page: {
      ...DEFAULT_OPTIONS.page,
      marginMm: {
        top: PRINT_MARGIN_TOP_MM,
        right: g.marginRightMm,
        bottom: PRINT_MARGIN_BOTTOM_MM,
        left: g.marginLeftMm
      },
      startY,
      followTopMm: PRINT_MARGIN_TOP_FOLLOW_MM
    },
    fonts: {
      ...DEFAULT_OPTIONS.fonts,
      body: fontChoice,
      baseSizePt: sizePt,
      lineHeight
    },
    colors: {
      ...DEFAULT_OPTIONS.colors,
      text: tokens.colorText,
      muted: tokens.colorMuted,
      rule: tokens.colorRule,
      tableBorder: tokens.colorHairline
    },
    frame: { title: null, pageNumbers: false, runningHeaderFooter: null }
  };
}
