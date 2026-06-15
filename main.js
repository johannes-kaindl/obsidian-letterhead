'use strict';

/*
 * Briefkopf – Letter Generator for Obsidian
 * Copyright (C) 2026 Johannes Kaindl — AGPL-3.0-or-later
 *
 * Turns the active note into a formatted business letter:
 *   - metadata (sender / recipient / subject / date / info block) from frontmatter
 *   - two layouts: "DIN 5008" (German standard, window-envelope ready) and "Modern"
 *   - three built-in styles (sachlich / klassisch / technisch), two info-line modes
 *   - PDF export via the OS print dialog  ->  works on desktop AND iPhone/iPad
 *
 * Dependency-free vanilla JS, so this file is also the source — drop it in and go.
 */

const obsidian = require('obsidian');

/* ------------------------------------------------------------------ *
 *  Settings
 * ------------------------------------------------------------------ */

const DEFAULT_SETTINGS = {
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
  customCss: ''
};

/* ------------------------------------------------------------------ *
 *  Languages
 *
 *  Two independent axes:
 *  - LETTER_LABELS: the language of the printed letter (enclosure label,
 *    info-block labels, default closing). Setting "Letter language",
 *    overridable per letter via the `sprache` frontmatter field.
 *  - UI_STRINGS: the plugin UI (settings, commands, notices). English by
 *    default, localized automatically when the Obsidian app language matches.
 * ------------------------------------------------------------------ */

const LETTER_LABELS = {
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

function normSprache(v) {
  if (v == null) return null;
  const k = norm(v);
  if (k === 'de' || k === 'deutsch' || k === 'german' || k === 'dede') return 'de';
  if (k === 'en' || k === 'englisch' || k === 'english' || k === 'engb' || k === 'enus') return 'en';
  return null;
}

/* ------------------------------------------------------------------ *
 *  Built-in styles ("Stile")
 *
 *  Token sets for the three styles (matter-of-fact / classic / technical).
 *  No webfonts: the plugin must work offline (no network access), so the
 *  technical style uses the system monospace stack instead of an @import.
 *  (ui-monospace is intentionally omitted — unsupported on older Obsidian
 *  versions; the named system fonts below cover every platform.)
 * ------------------------------------------------------------------ */

const MONO_STACK = '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

const STILE = {
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
 *  UI strings (English default, German when the app language is German)
 * ------------------------------------------------------------------ */

const UI_STRINGS = {
  en: {
    cmd_export: 'Export letter as PDF / print',
    cmd_preview: 'Open letter preview',
    cmd_insert_fm: 'Insert letter frontmatter into note',
    notice_open_note: 'Letterhead: Open a Markdown note first.',
    notice_fm_added: 'Letterhead: Frontmatter fields added.',
    notice_fm_failed: 'Letterhead: Could not update the frontmatter.',
    notice_logo_failed: 'Letterhead: Could not load the logo – ',
    notice_no_recipient: 'Letterhead: No recipient in the frontmatter (field "empfaenger").',
    notice_print_failed: 'Letterhead: Printing is not possible.',
    modal_title: 'Letter preview',
    modal_export: 'Export PDF',
    modal_close: 'Close',
    share_title: 'Export to PDF on iPhone / iPad',
    share_intro: 'The letter was saved as a file. To make a PDF from it:',
    share_step1: 'Tap "Quick Look".',
    share_step2: 'Tap the Share button (bottom right).',
    share_step3: 'Choose "Print".',
    share_step4: 'Pinch the print preview open with two fingers — it becomes the finished PDF.',
    share_step5: 'Tap Share again, then "Save to Files".',
    share_open: 'Open',
    notice_share_failed: 'Letterhead: Could not hand the file to the system.',
    set_layout: 'Layout', set_layout_desc: 'Base layout of the letter.',
    opt_layout_din: 'DIN 5008 (German standard)', opt_layout_modern: 'Modern / international',
    set_style: 'Style',
    set_style_desc: 'Complete look: font, colors, spacing, letterhead. Override per letter via "stil".',
    opt_style_a: 'A · Sachlich (neutral sans)', opt_style_b: 'B · Klassisch (serif)', opt_style_c: 'C · Technisch (monospaced accents)',
    set_infoline: 'Info line',
    set_infoline_desc: 'Full: info block on the right. Date only: a plain place/date line. Override per letter via "infozeile".',
    opt_info_full: 'Full (info block)', opt_info_date: 'Date only',
    set_dinform: 'DIN 5008 form',
    set_dinform_desc: 'Address field position: Form A 27 mm, Form B 45 mm (standard).',
    head_sender: 'Sender profile',
    sender_intro: 'Default sender; override per letter via the "absender" frontmatter list.',
    f_name: 'Name', f_company: 'Company / addition', f_street: 'Street', f_city: 'Postal code and city',
    f_phone: 'Phone', f_email: 'Email', f_web: 'Website',
    set_return: 'Return address line',
    set_return_desc: 'Line above the recipient address. Empty = automatic.',
    ph_automatic: 'automatic',
    head_elements: 'Elements',
    set_fold: 'Fold marks', set_fold_desc: 'Two marks for folding to fit a window envelope (DIN 5008).',
    set_hole: 'Hole mark', set_hole_desc: 'Mark at 148.5 mm for filing.',
    set_offset: 'Print offset top (mm)',
    set_offset_desc: 'Shifts the content down if the address sits too high in the envelope window (try 2–4 mm).',
    set_logo: 'Show logo', set_logo_desc: 'Replaces the name in the letterhead with an image.',
    set_logopath: 'Logo path', set_logopath_desc: 'Vault-relative path to an image, e.g. assets/logo.png',
    head_typo: 'Typography & language',
    set_font: 'Font (CSS font-family)',
    set_font_desc: 'Empty = style default (shown as placeholder).',
    set_fontsize: 'Font size (pt)',
    set_fontsize_desc: 'Empty = style default (shown as placeholder).',
    set_locale: 'Date locale', set_locale_desc: 'For example de-DE, en-GB, en-US — controls the date format.',
    set_letterlang: 'Letter language',
    set_letterlang_desc: 'Language of the printed labels. Override per letter via "sprache".',
    opt_lang_de: 'Deutsch', opt_lang_en: 'English',
    set_closing: 'Default closing',
    set_closing_desc: 'Empty = language default.',
    head_fm: 'Frontmatter (per letter)',
    fm_intro: 'Per-note fields, overriding the settings above. Keys are case-insensitive; English aliases work too.',
    set_insertfm: 'Insert frontmatter template',
    set_insertfm_desc: 'Adds the letter fields to the active note without touching existing values.',
    btn_insertfm: 'Insert into active note',
    fm_empfaenger: 'Recipient address as a list — one item per envelope line.',
    fm_absender: 'Sender as a list (name first; phone, email and web are detected automatically). Alternative: the individual fields absender_name, absender_strasse, absender_plz_ort, …',
    fm_betreff: 'Subject line.',
    fm_anrede: 'Salutation, e.g. "Sehr geehrte Frau Beispiel,".',
    fm_ort: 'Place for the place/date line.',
    fm_datum: 'ISO date (2026-06-10); empty = today.',
    fm_anlagen: 'Enclosures as a list — one item per enclosure.',
    fm_gruss: 'Closing; default from the settings.',
    fm_unterschrift: 'Name below the closing; default = sender name.',
    fm_stil: 'sachlich · klassisch · technisch (overrides the style setting).',
    fm_infozeile: 'vollstaendig · nurdatum (overrides the info line setting).',
    fm_sprache: 'de · en (overrides the letter language setting).',
    fm_refs: 'Fixed rows in the info block; empty fields are omitted.',
    fm_info: 'Custom info block rows: flat fields info_1 … info_4 ("Label: value") or an info map.',
    head_advanced: 'Advanced',
    set_css: 'Custom CSS (optional)',
    set_css_desc: 'Loaded last and wins. The default content is fully commented out and has no effect.',
    btn_preset: 'Reset preset'
  },
  de: {
    cmd_export: 'Brief als PDF exportieren / drucken',
    cmd_preview: 'Brief-Vorschau öffnen',
    cmd_insert_fm: 'Brief-Frontmatter in Notiz einfügen',
    notice_open_note: 'Letterhead: Bitte zuerst eine Markdown-Notiz öffnen.',
    notice_fm_added: 'Letterhead: Frontmatter-Felder ergänzt.',
    notice_fm_failed: 'Letterhead: Frontmatter konnte nicht ergänzt werden.',
    notice_logo_failed: 'Letterhead: Logo konnte nicht geladen werden – ',
    notice_no_recipient: 'Letterhead: Kein Empfänger im Frontmatter (Feld „empfaenger").',
    notice_print_failed: 'Letterhead: Druck nicht möglich.',
    modal_title: 'Brief-Vorschau',
    modal_export: 'PDF-Export',
    modal_close: 'Schließen',
    share_title: 'PDF-Export auf iPhone / iPad',
    share_intro: 'Der Brief wurde als Datei gespeichert. So wird ein PDF daraus:',
    share_step1: '„Schnellansicht" (Quick Look) antippen.',
    share_step2: 'Unten rechts auf das Teilen-Symbol tippen.',
    share_step3: '„Drucken" wählen.',
    share_step4: 'Die Druckvorschau mit zwei Fingern aufziehen — daraus wird das fertige PDF.',
    share_step5: 'Erneut auf das Teilen-Symbol tippen, dann „In Dateien sichern".',
    share_open: 'Öffnen',
    notice_share_failed: 'Letterhead: Datei konnte nicht ans System übergeben werden.',
    set_layout: 'Layout', set_layout_desc: 'Grundlayout des Briefs.',
    opt_layout_din: 'DIN 5008 (deutscher Standard)', opt_layout_modern: 'Modern / international',
    set_style: 'Stil',
    set_style_desc: 'Komplettes Erscheinungsbild: Schrift, Farben, Abstände, Briefkopf. Pro Brief per „stil" überschreibbar.',
    opt_style_a: 'A · Sachlich (neutral serifenlos)', opt_style_b: 'B · Klassisch (Serife)', opt_style_c: 'C · Technisch (monospaced Akzente)',
    set_infoline: 'Infozeile',
    set_infoline_desc: 'Vollständig: Infoblock rechts. Nur Datum: schlichte Orts-/Datumszeile. Pro Brief per „infozeile" überschreibbar.',
    opt_info_full: 'Vollständig (Infoblock)', opt_info_date: 'Nur Datum',
    set_dinform: 'DIN-5008-Form',
    set_dinform_desc: 'Anschrift-Position: Form A 27 mm, Form B 45 mm (Standard).',
    head_sender: 'Absender-Profil',
    sender_intro: 'Standard-Absender; pro Brief per Frontmatter-Liste „absender" überschreibbar.',
    f_name: 'Name', f_company: 'Zusatz / Firma', f_street: 'Straße', f_city: 'PLZ und Ort',
    f_phone: 'Telefon', f_email: 'E-Mail', f_web: 'Website',
    set_return: 'Rücksendeangabe',
    set_return_desc: 'Zeile über der Empfängeranschrift. Leer = automatisch.',
    ph_automatic: 'automatisch',
    head_elements: 'Elemente',
    set_fold: 'Faltmarken', set_fold_desc: 'Zwei Markierungen zum Falten fürs Fensterkuvert (DIN 5008).',
    set_hole: 'Lochmarke', set_hole_desc: 'Markierung bei 148,5 mm zum Abheften.',
    set_offset: 'Druckversatz oben (mm)',
    set_offset_desc: 'Schiebt den Inhalt nach unten, falls die Anschrift im Kuvertfenster zu hoch sitzt (2–4 mm probieren).',
    set_logo: 'Logo anzeigen', set_logo_desc: 'Ersetzt den Namen im Briefkopf durch ein Bild.',
    set_logopath: 'Logo-Pfad', set_logopath_desc: 'Vault-relativer Pfad zu einer Bilddatei, z. B. assets/logo.png',
    head_typo: 'Typografie & Sprache',
    set_font: 'Schriftart (CSS font-family)',
    set_font_desc: 'Leer = Stil-Standard (als Platzhalter angezeigt).',
    set_fontsize: 'Schriftgröße (pt)',
    set_fontsize_desc: 'Leer = Stil-Standard (als Platzhalter angezeigt).',
    set_locale: 'Datums-Locale', set_locale_desc: 'z. B. de-DE, en-GB, en-US — bestimmt das Datumsformat.',
    set_letterlang: 'Briefsprache',
    set_letterlang_desc: 'Sprache der gedruckten Labels. Pro Brief per „sprache" überschreibbar.',
    opt_lang_de: 'Deutsch', opt_lang_en: 'Englisch',
    set_closing: 'Standard-Grußformel',
    set_closing_desc: 'Leer = Sprach-Standard.',
    head_fm: 'Frontmatter (pro Brief)',
    fm_intro: 'Felder pro Notiz, überschreiben die Einstellungen oben. Schlüssel case-insensitive; englische Aliasse funktionieren ebenso.',
    set_insertfm: 'Frontmatter-Vorlage einfügen',
    set_insertfm_desc: 'Ergänzt die Brief-Felder in der aktiven Notiz — vorhandene Werte bleiben unangetastet.',
    btn_insertfm: 'In aktive Notiz einfügen',
    fm_empfaenger: 'Empfängeranschrift als Liste — ein Listenpunkt pro Kuvertzeile.',
    fm_absender: 'Absender als Liste (Name zuerst; Telefon, E-Mail und Web werden automatisch erkannt). Alternativ Einzelfelder absender_name, absender_strasse, absender_plz_ort, …',
    fm_betreff: 'Betreffzeile.',
    fm_anrede: 'Anrede, z. B. „Sehr geehrte Frau Beispiel,".',
    fm_ort: 'Ort für die Orts-/Datumszeile.',
    fm_datum: 'ISO-Datum (2026-06-10); leer = heute.',
    fm_anlagen: 'Anlagenvermerk als Liste — ein Listenpunkt pro Anlage.',
    fm_gruss: 'Grußformel; Standard aus den Einstellungen.',
    fm_unterschrift: 'Name unter dem Gruß; Standard = Absendername.',
    fm_stil: 'sachlich · klassisch · technisch (überschreibt die Stil-Einstellung).',
    fm_infozeile: 'vollstaendig · nurdatum (überschreibt die Infozeilen-Einstellung).',
    fm_sprache: 'de · en (überschreibt die Briefsprache-Einstellung).',
    fm_refs: 'Feste Zeilen im Infoblock; leere Felder werden weggelassen.',
    fm_info: 'Eigene Infoblock-Zeilen: flache Felder info_1 … info_4 („Label: Wert") oder eine info-Map.',
    head_advanced: 'Erweitert',
    set_css: 'Eigenes CSS (optional)',
    set_css_desc: 'Wird zuletzt geladen und gewinnt. Der Standard-Inhalt ist komplett auskommentiert und wirkungslos.',
    btn_preset: 'Preset zurücksetzen'
  }
};

/* App language detection, most reliable source first:
   1. obsidian.getLanguage() — official API (Obsidian >= 1.8)
   2. moment.locale() — Obsidian keeps it on the app language
   English is the default and the fallback for every missing key. */
function detectUiLang() {
  try {
    if (typeof obsidian.getLanguage === 'function') {
      const l = obsidian.getLanguage();
      if (l) return String(l).toLowerCase().startsWith('de') ? 'de' : 'en';
    }
  } catch (e) { /* fall through */ }
  try {
    const m = window.moment && window.moment.locale && window.moment.locale();
    if (m && String(m).toLowerCase().startsWith('de')) return 'de';
  } catch (e) { /* no window (tests) — default to English */ }
  return 'en';
}

const UI_LANG = detectUiLang();

function t(key) {
  return (UI_STRINGS[UI_LANG] && UI_STRINGS[UI_LANG][key]) || UI_STRINGS.en[key] || key;
}

/* Accepts setting values and frontmatter spellings: a/b/c, German names,
   English-ish aliases. Returns a STILE key or null. */
function normStil(v) {
  if (v == null) return null;
  const k = norm(v);
  if (k === 'a' || k === 'sachlich' || k === 'sachlichmodern' || k === 'modern' || k === 'sans') return 'sachlich';
  if (k === 'b' || k === 'klassisch' || k === 'klassischserioes' || k === 'klassischseriös' || k === 'classic' || k === 'serif') return 'klassisch';
  if (k === 'c' || k === 'technisch' || k === 'technischpraezise' || k === 'technischpräzise' || k === 'tech' || k === 'mono') return 'technisch';
  return null;
}

/* 'vollstaendig' (full info block) | 'nurdatum' (place + date line). */
function normInfozeile(v) {
  if (v == null) return null;
  const k = norm(v);
  if (k === 'vollstaendig' || k === 'vollständig' || k === 'voll' || k === 'full' || k === 'infoblock' || k === 'bezugszeichen') return 'vollstaendig';
  if (k === 'nurdatum' || k === 'datum' || k === 'minimal' || k === 'dateonly' || k === 'date') return 'nurdatum';
  return null;
}

/* ------------------------------------------------------------------ *
 *  Frontmatter field resolution (German-first, with aliases)
 * ------------------------------------------------------------------ */

const ALIASES = {
  recipient:   ['empfaenger', 'empfänger', 'recipient', 'an', 'to', 'adresse', 'anschrift'],
  betreff:     ['betreff', 'subject', 're', 'thema'],
  anrede:      ['anrede', 'salutation', 'greeting'],
  gruss:       ['gruss', 'gruß', 'grußformel', 'grussformel', 'closing', 'signoff'],
  unterschrift:['unterschrift', 'signatur', 'signature', 'gezeichnet'],
  ort:         ['ort', 'place', 'city', 'stadt'],
  datum:       ['datum', 'date'],
  anlagen:     ['anlagen', 'anlage', 'attachments', 'enclosures'],
  absender:    ['absender', 'sender', 'von', 'from'],
  stil:        ['stil', 'style', 'design', 'variante'],
  sprache:     ['sprache', 'language', 'lang', 'briefsprache'],
  infozeile:   ['infozeile', 'layout'],
  info:        ['info', 'bezugszeichen', 'infoblock'],
  steuernummer:['steuernummer', 'steuernr', 'st_nr', 'tax_number'],
  ihrZeichen:  ['ihr_zeichen', 'ihrzeichen', 'your_ref', 'yourref'],
  ihrSchreiben:['ihr_schreiben', 'ihrschreiben', 'ihrschreibenvom', 'your_letter'],
  unserZeichen:['unser_zeichen', 'unserzeichen', 'our_ref', 'ourref'],
  telefonBezug:['telefon_bezug', 'durchwahl', 'phone'],
  sName:       ['absender_name', 'absendername', 'sender_name', 'sendername'],
  sZusatz:     ['absender_zusatz', 'absenderzusatz', 'firma', 'company'],
  sStrasse:    ['absender_strasse', 'absenderstrasse', 'absender_straße', 'sender_street'],
  sPlzOrt:     ['absender_plz_ort', 'absenderplzort', 'absender_ort', 'sender_city'],
  sTelefon:    ['absender_telefon', 'absendertelefon'],
  sEmail:      ['absender_email', 'absenderemail'],
  sWeb:        ['absender_web', 'absenderweb', 'website']
};

function norm(k) { return String(k).toLowerCase().replace(/[\s_\-.]+/g, ''); }

function buildFmIndex(fm) {
  const idx = {};
  if (fm && typeof fm === 'object') {
    for (const k of Object.keys(fm)) idx[norm(k)] = fm[k];
  }
  return idx;
}

function getField(idx, aliases) {
  for (const a of aliases) {
    const v = idx[norm(a)];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function toLines(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
}

/* Frontmatter `absender:` as a plain list (one envelope line per item):
   first line = name, the rest is classified — phone/e-mail/web are detected,
   "12345 Ort" => PLZ+Ort, a line containing a digit => street, else Zusatz. */
function parseAbsenderLines(lines) {
  const r = { name: '', zusatz: '', strasse: '', plzOrt: '', telefon: '', email: '', web: '' };
  if (!lines || lines.length === 0) return r;
  r.name = lines[0];
  for (const line of lines.slice(1)) {
    if (!r.email && /@/.test(line)) r.email = line.replace(/^e-?mail\s*:?\s*/i, '');
    else if (!r.web && /^(www\.|https?:\/\/)/i.test(line)) r.web = line;
    else if (!r.telefon && (/^(tel\.?|telefon|fon|mobil)\b/i.test(line) || /^[+0][\d\s\-\/().]{5,}$/.test(line)))
      r.telefon = line.replace(/^(tel\.?|telefon|fon|mobil)\s*:?\s*/i, '');
    else if (!r.plzOrt && /^\d{4,5}\s+\S/.test(line)) r.plzOrt = line;
    else if (!r.strasse && /\d/.test(line)) r.strasse = line;
    else if (!r.zusatz) r.zusatz = line;
    else if (!r.strasse) r.strasse = line;
  }
  return r;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function escLines(lines) { return (lines || []).map(esc).join('\n'); }

// Base64-encodes a local vault file (the user's configured logo) for an inline data:
// URL — the plugin's only btoa() use. No network fetch, no obfuscation; see SECURITY.md.
function arrayBufferToBase64(buf) {
  let bin = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/* ------------------------------------------------------------------ *
 *  CSS generation (layout + style)
 *
 *  All visual values are exposed as CSS custom properties ("design
 *  tokens") in :root. The selected Stil provides the token defaults;
 *  the optional "Eigenes CSS" setting is appended last and wins.
 *  Geometry tokens marked DIN-critical keep the address block aligned
 *  with a DIN-long window envelope — change them only deliberately.
 * ------------------------------------------------------------------ */

/* Fixed @page margins: printers cannot print borderless, and without page
   margins multi-page letters break right at the paper edge. All DIN tokens
   stay paper-relative; the components subtract the first-page top margin
   internally. Page 1 keeps a small top margin (the DIN letterhead sits high
   by design); continuation pages get document-standard 25/20 mm. */
const PRINT_MARGIN_TOP_MM = 10;         // page 1
const PRINT_MARGIN_TOP_FOLLOW_MM = 25;  // page 2+
const PRINT_MARGIN_BOTTOM_MM = 20;      // all pages

function buildCss(s, stilKey) {
  const stil = STILE[normStil(stilKey) || 'sachlich'] || STILE.sachlich;
  const t = stil.tokens;
  const form = s.dinForm === 'A'
    ? { headTop: '12mm', f1: '87mm', f2: '192mm', addrTop: '27mm', infoTop: '32mm' }
    : { headTop: '14mm', f1: '105mm', f2: '210mm', addrTop: '45mm', infoTop: '50mm' };
  const font = String(s.fontFamily || '').trim() || t.fontFamily;
  const fs = Number(s.fontSizePt) || t.fontSizePt;
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
    --bk-line-height:${t.lineHeight};
    /* --- Letterhead name (safe to customize) --- */
    --bk-name-font:${t.nameFont};
    --bk-name-size:${t.nameSize};
    --bk-name-weight:${t.nameWeight};
    --bk-name-spacing:${t.nameSpacing};
    --bk-name-transform:${t.nameTransform};
    /* --- Colors (safe to customize) --- */
    --bk-color-text:${t.colorText};
    --bk-color-muted:${t.colorMuted};      /* info-block labels, head contact */
    --bk-color-rule:${t.colorRule};        /* fold/hole marks + return-address underline */
    --bk-color-hairline:${t.colorHairline};/* letterhead separator */
    /* --- Spacing (safe to customize) --- */
    --bk-space:${t.space};                 /* base paragraph rhythm */
    --bk-block-gap:${t.blockGap};          /* gap between letter blocks */
    --bk-signature-gap:${t.signatureGap};  /* room for a handwritten signature */
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

const PRINT_WRAPPER_CSS = `
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
   the file in Safari before printing), while keeping the same @page margins. */
const STANDALONE_WRAPPER_CSS = `
  @page{ size:A4; margin:${PRINT_MARGIN_TOP_FOLLOW_MM}mm 0 ${PRINT_MARGIN_BOTTOM_MM}mm 0; }
  @page:first{ margin-top:${PRINT_MARGIN_TOP_MM}mm; }
  html, body{ margin:0; padding:0; background:#fff; }
  .bk-body p{ orphans:2; widows:2; }
  .bk-signature, .bk-enclosures, .bk-closing{ break-inside:avoid; }
`;

/* Build a self-contained HTML document for the iOS share/print path. Pure:
   no Obsidian imports. letterHtml comes from buildLetterHtml (esc()-escaped),
   css from buildCss (includes the --bk-* tokens and the data:-URL logo). */
function buildStandaloneDoc(letterHtml, css) {
  return `<!doctype html><html lang="de"><head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>Brief</title>` +
    `<style>${css}${STANDALONE_WRAPPER_CSS}</style>` +
    `</head><body>${letterHtml}</body></html>`;
}

const SCREEN_PREVIEW_CSS = `
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
   "Reset preset" restores it. Kept identical to presets/briefkopf-theme.css. */
const PRESET_CSS = `/* =====================================================================
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
 *  Plugin
 * ------------------------------------------------------------------ */

class BriefkopfPlugin extends obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new BriefkopfSettingTab(this.app, this));

    this.addRibbonIcon('mail', t('cmd_export'), () => this.exportLetter());

    this.addCommand({
      id: 'export-letter',
      name: t('cmd_export'),
      callback: () => this.exportLetter()
    });
    this.addCommand({
      id: 'open-preview',
      name: t('cmd_preview'),
      callback: () => this.previewLetter()
    });
    this.addCommand({
      id: 'insert-frontmatter',
      name: t('cmd_insert_fm'),
      callback: () => this.insertFrontmatterTemplate()
    });
  }

  /* Adds the most important letter fields to the active note's frontmatter
     without touching existing values (uses Obsidian's processFrontMatter). */
  async insertFrontmatterTemplate() {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== 'md') {
      new obsidian.Notice(t('notice_open_note'));
      return;
    }
    const now = new Date();
    const iso = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    /* Template keys follow the letter language: German keys for German
       letters, the English aliases for English letters. All fields the
       plugin understands are inserted (empty = setting/language default),
       so everything stays editable right in the properties view. */
    const lang = normSprache(this.settings.briefSprache) || 'de';
    const K = lang === 'en'
      ? { recipient: 'recipient', betreff: 'subject', anrede: 'salutation', ort: 'place',
          datum: 'date', anlagen: 'enclosures', gruss: 'closing', unterschrift: 'signature',
          stil: 'style', infozeile: 'layout', sprache: 'language' }
      : { recipient: 'empfaenger', betreff: 'betreff', anrede: 'anrede', ort: 'ort',
          datum: 'datum', anlagen: 'anlagen', gruss: 'gruss', unterschrift: 'unterschrift',
          stil: 'stil', infozeile: 'infozeile', sprache: 'sprache' };
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        const has = (...keys) => keys.some((k) => fm[k] !== undefined);
        if (!has('empfaenger', 'empfänger', 'recipient', 'an', 'to', 'adresse', 'anschrift')) {
          fm[K.recipient] = ['', '', '', ''];
        }
        if (!has('betreff', 'subject', 'thema')) fm[K.betreff] = '';
        if (!has('anrede', 'salutation')) fm[K.anrede] = (LETTER_LABELS[lang] || LETTER_LABELS.de).salutation;
        if (!has('ort', 'place', 'stadt', 'city')) fm[K.ort] = '';
        if (!has('datum', 'date')) fm[K.datum] = iso;
        if (!has('anlagen', 'anlage', 'attachments', 'enclosures')) fm[K.anlagen] = [];
        if (!has('gruss', 'gruß', 'grussformel', 'closing', 'signoff')) fm[K.gruss] = this.settings.defaultGruss || (LETTER_LABELS[lang] || LETTER_LABELS.de).closing;
        if (!has('unterschrift', 'signatur', 'signature', 'gezeichnet')) fm[K.unterschrift] = (this.settings.sender && this.settings.sender.name) || '';
        if (!has('stil', 'style', 'design', 'variante')) fm[K.stil] = '';
        if (!has('infozeile', 'layout')) fm[K.infozeile] = '';
        if (!has('sprache', 'language', 'lang', 'briefsprache')) fm[K.sprache] = lang;
        /* Custom info block: the plugin renders the flat fields info_1..info_4
           (see writeLetterModel / the i=1..4 loop), so seed all four here. */
        for (let i = 1; i <= 4; i++) {
          if (!has('info_' + i, 'info' + i, 'infoblock_' + i, 'info_block_' + i)) fm['info_' + i] = '';
        }
      });
      new obsidian.Notice(t('notice_fm_added'));
    } catch (e) {
      console.error('Letterhead: frontmatter insert failed', e);
      new obsidian.Notice(t('notice_fm_failed'));
    }
  }

  async loadSettings() {
    const data = (await this.loadData()) || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    this.settings.sender = Object.assign({}, DEFAULT_SETTINGS.sender, data.sender || {});
    /* Migration <= 1.0.0: the "Bezugszeichenzeile" toggle became the
       Infozeile dropdown; font settings were always-on and now mean
       "override the style default" (old defaults => unset). */
    let migrated = false;
    if (data.infozeile === undefined && data.showBezugszeichen === false) {
      this.settings.infozeile = 'nurdatum';
      migrated = true;
    }
    if (data.fontFamily === 'Helvetica, Arial, sans-serif') { this.settings.fontFamily = ''; migrated = true; }
    if (data.fontSizePt === 11) { this.settings.fontSizePt = ''; migrated = true; }
    if (data.defaultGruss === 'Mit freundlichen Grüßen') { this.settings.defaultGruss = ''; migrated = true; }
    /* If a design-variant file (design/css/briefkopf-*.css) was pasted into
       "Eigenes CSS", adopt it as the built-in Stil/Infozeile and clear the
       field — the variants ship built in since 1.1.0. */
    const cc = typeof this.settings.customCss === 'string' ? this.settings.customCss : '';
    if (/Briefkopf · (VARIANTE [ABC]|LAYOUT-ADD-ON)/.test(cc)) {
      const v = cc.match(/VARIANTE ([ABC])/);
      if (v && data.stil === undefined) {
        this.settings.stil = { A: 'sachlich', B: 'klassisch', C: 'technisch' }[v[1]];
      }
      if (/LAYOUT-ADD-ON/.test(cc) && data.infozeile === undefined) {
        this.settings.infozeile = 'nurdatum';
      }
      this.settings.customCss = '';
      migrated = true;
    }
    /* Custom CSS field: pre-fill with the inert commented preset; also
       replaces the old ACTIVE preset (it pinned tokens and fought the
       Style setting) and the cleared field after a variant migration. */
    if (this.settings.customCss === undefined || this.settings.customCss === '' ||
        (typeof this.settings.customCss === 'string' &&
         this.settings.customCss.includes('Briefkopf – CSS-Preset'))) {
      if (this.settings.customCss !== PRESET_CSS) {
        this.settings.customCss = PRESET_CSS;
        migrated = true;
      }
    }
    if (migrated) await this.saveData(this.settings);
  }

  async saveSettings() { await this.saveData(this.settings); }

  /* ---- rendering helpers ---- */

  stripFrontmatter(content) {
    if (content.startsWith('---')) {
      const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
      if (m) return content.slice(m[0].length);
    }
    return content;
  }

  async renderMarkdownToHtml(markdown, sourcePath) {
    const comp = new obsidian.Component();
    const tmp = document.createElement('div');
    try {
      if (obsidian.MarkdownRenderer && typeof obsidian.MarkdownRenderer.render === 'function') {
        await obsidian.MarkdownRenderer.render(this.app, markdown, tmp, sourcePath, comp);
      } else {
        await obsidian.MarkdownRenderer.renderMarkdown(markdown, tmp, sourcePath, comp);
      }
    } catch (e) {
      console.error('Letterhead: markdown render failed', e);
    }
    const html = tmp.innerHTML;
    comp.unload();
    return html;
  }

  formatDate(value) {
    let d;
    if (value == null || value === '') d = new Date();
    else if (value instanceof Date) d = value;
    else { d = new Date(value); if (isNaN(d.getTime())) return String(value); }
    try { return d.toLocaleDateString(this.settings.locale || 'de-DE'); }
    catch (e) { return d.toLocaleDateString('de-DE'); }
  }

  async loadLogo() {
    const p = (this.settings.logoPath || '').trim();
    if (!this.settings.showLogo || !p) return '';
    try {
      const ab = await this.app.vault.adapter.readBinary(obsidian.normalizePath(p));
      const ext = p.split('.').pop().toLowerCase();
      const mime = ext === 'png' ? 'image/png'
        : ext === 'svg' ? 'image/svg+xml'
        : ext === 'gif' ? 'image/gif'
        : ext === 'webp' ? 'image/webp'
        : 'image/jpeg';
      return `data:${mime};base64,${arrayBufferToBase64(ab)}`;
    } catch (e) {
      new obsidian.Notice(t('notice_logo_failed') + p);
      return '';
    }
  }

  /* ---- resolve the active note into a letter model ---- */

  async resolveLetter() {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== 'md') {
      new obsidian.Notice(t('notice_open_note'));
      return null;
    }
    const cache = this.app.metadataCache.getFileCache(file);
    const idx = buildFmIndex(cache && cache.frontmatter);
    const s = this.settings;

    const content = await this.app.vault.cachedRead(file);
    const body = this.stripFrontmatter(content);
    const bodyHtml = await this.renderMarkdownToHtml(body, file.path);

    /* sender precedence: specific field > `absender:` list > settings profile */
    const abs = parseAbsenderLines(toLines(getField(idx, ALIASES.absender)));
    const senderName    = getField(idx, ALIASES.sName)    || abs.name    || s.sender.name;
    const senderZusatz  = getField(idx, ALIASES.sZusatz)  || abs.zusatz  || s.sender.zusatz;
    const senderStrasse = getField(idx, ALIASES.sStrasse) || abs.strasse || s.sender.strasse;
    const senderPlzOrt  = getField(idx, ALIASES.sPlzOrt)  || abs.plzOrt  || s.sender.plzOrt;
    const senderTelefon = getField(idx, ALIASES.sTelefon) || abs.telefon || s.sender.telefon;
    const senderEmail   = getField(idx, ALIASES.sEmail)   || abs.email   || s.sender.email;
    const senderWeb     = getField(idx, ALIASES.sWeb)     || abs.web     || s.sender.web;

    let ruecksende = (s.returnAddressLine || '').trim();
    if (!ruecksende) {
      ruecksende = [senderName, senderStrasse, senderPlzOrt].filter(Boolean).join(' · ');
    }

    /* free-form info-block rows. Two properties-friendly forms:
       flat `info_1`..`info_4` text fields ("Label: Wert"), then the
       `info:` map of label -> value (YAML, not editable in the
       properties view — kept for power users). */
    const infoExtra = [];
    for (let i = 1; i <= 4; i++) {
      const raw = getField(idx, ['info_' + i]);
      if (raw === undefined || raw === null || raw === '') continue;
      const sv = raw instanceof Date ? this.formatDate(raw) : String(raw);
      const ci = sv.indexOf(':');
      if (ci > 0) infoExtra.push([sv.slice(0, ci).trim(), sv.slice(ci + 1).trim()]);
      else infoExtra.push(['Info', sv.trim()]);
    }
    const infoRaw = getField(idx, ALIASES.info);
    if (infoRaw && typeof infoRaw === 'object' && !Array.isArray(infoRaw)) {
      for (const k of Object.keys(infoRaw)) {
        const v = infoRaw[k];
        if (v === undefined || v === null || v === '') continue;
        infoExtra.push([String(k), v instanceof Date ? this.formatDate(v) : String(v)]);
      }
    }

    const ihrSchreibenRaw = getField(idx, ALIASES.ihrSchreiben);

    const sprache = normSprache(getField(idx, ALIASES.sprache)) || normSprache(s.briefSprache) || 'de';
    const labels = LETTER_LABELS[sprache] || LETTER_LABELS.de;

    const model = {
      recipient: toLines(getField(idx, ALIASES.recipient)),
      betreff: getField(idx, ALIASES.betreff) || '',
      anrede: getField(idx, ALIASES.anrede) || '',
      gruss: getField(idx, ALIASES.gruss) || s.defaultGruss || labels.closing,
      unterschrift: getField(idx, ALIASES.unterschrift) || senderName || '',
      ort: getField(idx, ALIASES.ort) || '',
      datum: this.formatDate(getField(idx, ALIASES.datum)),
      anlagen: toLines(getField(idx, ALIASES.anlagen)),
      stil: normStil(getField(idx, ALIASES.stil)) || normStil(s.stil) || 'sachlich',
      infozeile: normInfozeile(getField(idx, ALIASES.infozeile)) || normInfozeile(s.infozeile) || 'vollstaendig',
      sprache,
      labels,
      steuernummer: getField(idx, ALIASES.steuernummer) || '',
      ihrZeichen: getField(idx, ALIASES.ihrZeichen) || '',
      ihrSchreiben: ihrSchreibenRaw ? this.formatDate(ihrSchreibenRaw) : '',
      unserZeichen: getField(idx, ALIASES.unserZeichen) || '',
      telefonBezug: getField(idx, ALIASES.telefonBezug) || '',
      infoExtra,
      senderName, senderZusatz, senderStrasse, senderPlzOrt,
      senderTelefon, senderEmail, senderWeb,
      ruecksende,
      bodyHtml,
      logo: await this.loadLogo()
    };

    if (model.recipient.length === 0) {
      new obsidian.Notice(t('notice_no_recipient'));
    }
    return model;
  }

  buildEnclosuresHtml(m) {
    if (!m.anlagen || m.anlagen.length === 0) return '';
    const L = m.labels || LETTER_LABELS.de;
    const label = m.anlagen.length === 1 ? L.anlage : L.anlagen;
    const items = m.anlagen.map((a) => `<li>${esc(a)}</li>`).join('');
    return `<div class="bk-enclosures">
      <div class="bk-encl-label">${label}</div>
      <ul class="bk-encl-list">${items}</ul>
    </div>`;
  }

  buildLetterHtml(m) {
    const s = this.settings;
    const marks =
      (s.showFoldMarks ? '<div class="bk-mark bk-f1"></div><div class="bk-mark bk-f2"></div>' : '') +
      (s.showHoleMark ? '<div class="bk-mark bk-lo"></div>' : '');
    const enclosures = this.buildEnclosuresHtml(m);

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
        <div class="bk-body">${m.bodyHtml}</div>
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
    let infozone;
    if (m.infozeile === 'nurdatum') {
      infozone = `<div class="bk-dateline">${m.ort ? esc(m.ort) + ', ' : ''}${esc(m.datum)}</div>`;
    } else {
      const L = m.labels || LETTER_LABELS.de;
      const rows = [];
      const addRow = (label, val) => { if (val) rows.push([label, val]); };
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
        <div class="bk-body">${m.bodyHtml}</div>
        ${m.gruss ? `<div class="bk-gruss bk-closing">${esc(m.gruss)}</div>` : ''}
        ${m.unterschrift ? `<div class="bk-signatur bk-signature">${escLines(toLines(m.unterschrift))}</div>` : ''}
        ${enclosures}
      </div>
    </div>`;
  }

  /* ---- export via print dialog (desktop + iOS) ---- */

  async exportLetter() {
    const m = await this.resolveLetter();
    if (!m) return;
    const html = this.buildLetterHtml(m);
    const css = buildCss(this.settings, m.stil);
    if (obsidian.Platform.isDesktopApp) {
      this.doPrint(html, css);
    } else {
      await this.exportViaShare(html, css);
    }
  }

  /* iOS/iPad path: window.print() is a no-op in the Obsidian mobile WebView,
     so write the letter as a standalone file into the vault and hand it to the
     system via openWithDefaultApp — the user prints it to PDF from Safari. */
  async exportViaShare(letterHtml, css) {
    const dir = '.letterhead-export';
    const file = this.app.workspace.getActiveFile();
    const base = (file && file.basename) ? file.basename : 'Brief';
    const safe = base.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Brief';
    const path = `${dir}/${safe}.html`;
    // Adapter API (not Vault API): the hidden export dir is scratch space, not a tracked vault file.
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(dir)) {
        const listing = await adapter.list(dir);
        for (const f of listing.files) { await adapter.remove(f); }
      } else {
        await adapter.mkdir(dir);
      }
      const docHtml = buildStandaloneDoc(letterHtml, css);
      await adapter.write(path, docHtml);
      new BriefkopfShareModal(this.app, path).open();
    } catch (e) {
      console.error('Letterhead: share export failed', e);
      new obsidian.Notice(t('notice_share_failed'));
    }
  }

  doPrint(letterHtml, css) {
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
    const cleanup = () => {
      if (done) return;
      done = true;
      root.remove();
      style.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    // give layout + embedded images a tick, then open the print/save-as-PDF dialog
    setTimeout(() => { try { window.print(); } catch (e) { new obsidian.Notice(t('notice_print_failed')); cleanup(); } }, 150);
    // safety net for platforms that never fire 'afterprint' (some iOS cases)
    setTimeout(cleanup, 60000);
  }

  /* ---- on-screen preview ---- */

  async previewLetter() {
    const m = await this.resolveLetter();
    if (!m) return;
    const html = this.buildLetterHtml(m);
    const css = buildCss(this.settings, m.stil);
    new BriefkopfPreviewModal(this.app, this, html, css).open();
  }
}

/* ------------------------------------------------------------------ *
 *  Preview modal
 * ------------------------------------------------------------------ */

class BriefkopfPreviewModal extends obsidian.Modal {
  constructor(app, plugin, html, css) {
    super(app);
    this.plugin = plugin;
    this.html = html;
    this.css = css;
  }

  onOpen() {
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
    const paginate = () => {
      try {
        const doc = frame.contentDocument;
        const stage = doc && doc.getElementById('bk-preview-stage');
        const letter = stage && stage.querySelector('.bk-letter');
        if (!letter || stage.dataset.paginated) return;
        const probe = doc.createElement('div');
        probe.style.cssText = 'position:absolute;visibility:hidden;height:100mm;width:10mm;';
        doc.body.appendChild(probe);
        const mm = probe.offsetHeight / 100;
        probe.remove();
        const h1 = Math.round((297 - PRINT_MARGIN_TOP_MM - PRINT_MARGIN_BOTTOM_MM) * mm);
        const hN = Math.round((297 - PRINT_MARGIN_TOP_FOLLOW_MM - PRINT_MARGIN_BOTTOM_MM) * mm);
        const total = letter.offsetHeight;
        const pages = total <= h1 ? 1 : 1 + Math.ceil((total - h1) / hN);
        const frag = doc.createDocumentFragment();
        for (let i = 0; i < pages; i++) {
          const sheet = doc.createElement('div');
          sheet.className = 'bk-sheet';
          const clip = doc.createElement('div');
          clip.className = 'bk-page-clip';
          clip.style.top = (i === 0 ? PRINT_MARGIN_TOP_MM : PRINT_MARGIN_TOP_FOLLOW_MM) + 'mm';
          clip.style.height = (i === 0 ? h1 : hN) + 'px';
          const copy = letter.cloneNode(true);
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
    const fitPreview = () => {
      try {
        const doc = frame.contentDocument;
        const stage = doc && doc.getElementById('bk-preview-stage');
        const sheet = stage && (doc.querySelector('.bk-sheet') || doc.querySelector('.bk-letter'));
        if (!stage || !sheet) return;
        stage.style.transformOrigin = 'top center';
        stage.style.transform = 'none';
        const pageW = sheet.offsetWidth || 794;
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
    exportBtn.onclick = () => { this.close(); this.plugin.exportLetter(); };
    const closeBtn = actions.createEl('button', { text: t('modal_close') });
    closeBtn.onclick = () => this.close();
  }

  onClose() {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
    this.contentEl.empty();
  }
}

/* ------------------------------------------------------------------ *
 *  Share modal (iOS export path)
 * ------------------------------------------------------------------ */

class BriefkopfShareModal extends obsidian.Modal {
  constructor(app, path) {
    super(app);
    this.path = path;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: t('share_title') });
    contentEl.createEl('p', { text: t('share_intro') });
    const ol = contentEl.createEl('ol');
    [t('share_step1'), t('share_step2'), t('share_step3'), t('share_step4'), t('share_step5')]
      .forEach((s) => ol.createEl('li', { text: s }));
    const actions = contentEl.createDiv({ cls: 'briefkopf-preview-actions' });
    const openBtn = actions.createEl('button', { text: t('share_open'), cls: 'mod-cta' });
    openBtn.onclick = async () => {
      try {
        if (typeof this.app.openWithDefaultApp === 'function') {
          await this.app.openWithDefaultApp(this.path);
        }
      } catch (e) {
        console.error('Letterhead: openWithDefaultApp failed', e);
        new obsidian.Notice(t('notice_share_failed'));
      }
      this.close();
    };
    const closeBtn = actions.createEl('button', { text: t('modal_close') });
    closeBtn.onclick = () => this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}

/* ------------------------------------------------------------------ *
 *  Settings tab
 * ------------------------------------------------------------------ */

class BriefkopfSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();

    new obsidian.Setting(containerEl)
      .setName(t('set_layout'))
      .setDesc(t('set_layout_desc'))
      .addDropdown((d) => d
        .addOption('din5008', t('opt_layout_din'))
        .addOption('modern', t('opt_layout_modern'))
        .setValue(s.theme)
        .onChange(async (v) => { s.theme = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl)
      .setName(t('set_style'))
      .setDesc(t('set_style_desc'))
      .addDropdown((d) => d
        .addOption('sachlich', t('opt_style_a'))
        .addOption('klassisch', t('opt_style_b'))
        .addOption('technisch', t('opt_style_c'))
        .setValue(s.stil)
        .onChange(async (v) => { s.stil = v; await this.plugin.saveSettings(); this.display(); }));

    new obsidian.Setting(containerEl)
      .setName(t('set_infoline'))
      .setDesc(t('set_infoline_desc'))
      .addDropdown((d) => d
        .addOption('vollstaendig', t('opt_info_full'))
        .addOption('nurdatum', t('opt_info_date'))
        .setValue(s.infozeile)
        .onChange(async (v) => { s.infozeile = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl)
      .setName(t('set_dinform'))
      .setDesc(t('set_dinform_desc'))
      .addDropdown((d) => d
        .addOption('A', 'Form A (27 mm)')
        .addOption('B', 'Form B (45 mm)')
        .setValue(s.dinForm)
        .onChange(async (v) => { s.dinForm = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('head_sender')).setHeading();
    containerEl.createEl('p', { text: t('sender_intro'), cls: 'setting-item-description' });

    const senderField = (name, key, ph) => new obsidian.Setting(containerEl)
      .setName(name)
      .addText((t) => t.setPlaceholder(ph || '').setValue(s.sender[key] || '')
        .onChange(async (v) => { s.sender[key] = v; await this.plugin.saveSettings(); }));

    senderField(t('f_name'), 'name', 'Max Mustermann');
    senderField(t('f_company'), 'zusatz', 'Muster GmbH');
    senderField(t('f_street'), 'strasse', 'Musterstraße 1');
    senderField(t('f_city'), 'plzOrt', '12345 Musterstadt');
    senderField(t('f_phone'), 'telefon', '+49 30 1234567');
    senderField(t('f_email'), 'email', 'kontakt@example.com');
    senderField(t('f_web'), 'web', 'www.example.com');

    const autoRuecksende = [s.sender.name, s.sender.strasse, s.sender.plzOrt].filter(Boolean).join(' · ');
    new obsidian.Setting(containerEl)
      .setName(t('set_return'))
      .setDesc(t('set_return_desc'))
      .addText((x) => x.setPlaceholder(autoRuecksende || t('ph_automatic')).setValue(s.returnAddressLine)
        .onChange(async (v) => { s.returnAddressLine = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('head_elements')).setHeading();

    new obsidian.Setting(containerEl).setName(t('set_fold'))
      .setDesc(t('set_fold_desc'))
      .addToggle((x) => x.setValue(s.showFoldMarks).onChange(async (v) => { s.showFoldMarks = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('set_hole'))
      .setDesc(t('set_hole_desc'))
      .addToggle((x) => x.setValue(s.showHoleMark).onChange(async (v) => { s.showHoleMark = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('set_offset'))
      .setDesc(t('set_offset_desc'))
      .addText((x) => x.setPlaceholder('0').setValue(s.printOffsetTopMm ? String(s.printOffsetTopMm) : '')
        .onChange(async (v) => {
          const n = Number(String(v).replace(',', '.'));
          s.printOffsetTopMm = isFinite(n) && n > 0 ? Math.min(n, 25) : 0;
          await this.plugin.saveSettings();
        }));

    new obsidian.Setting(containerEl).setName(t('set_logo'))
      .setDesc(t('set_logo_desc'))
      .addToggle((x) => x.setValue(s.showLogo).onChange(async (v) => { s.showLogo = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('set_logopath'))
      .setDesc(t('set_logopath_desc'))
      .addText((x) => x.setPlaceholder('assets/logo.png').setValue(s.logoPath)
        .onChange(async (v) => { s.logoPath = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('head_typo')).setHeading();

    const stilTokens = (STILE[normStil(s.stil) || 'sachlich'] || STILE.sachlich).tokens;

    new obsidian.Setting(containerEl).setName(t('set_font'))
      .setDesc(t('set_font_desc'))
      .addText((x) => x.setPlaceholder(stilTokens.fontFamily).setValue(s.fontFamily || '')
        .onChange(async (v) => { s.fontFamily = v.trim(); await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('set_fontsize'))
      .setDesc(t('set_fontsize_desc'))
      .addText((x) => x.setPlaceholder(String(stilTokens.fontSizePt)).setValue(s.fontSizePt === '' || s.fontSizePt == null ? '' : String(s.fontSizePt))
        .onChange(async (v) => {
          const n = Number(v);
          s.fontSizePt = v.trim() === '' || !isFinite(n) || n <= 0 ? '' : n;
          await this.plugin.saveSettings();
        }));

    new obsidian.Setting(containerEl).setName(t('set_locale'))
      .setDesc(t('set_locale_desc'))
      .addText((x) => x.setValue(s.locale)
        .onChange(async (v) => { s.locale = v || 'de-DE'; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('set_letterlang'))
      .setDesc(t('set_letterlang_desc'))
      .addDropdown((d) => d
        .addOption('de', t('opt_lang_de'))
        .addOption('en', t('opt_lang_en'))
        .setValue(normSprache(s.briefSprache) || 'de')
        .onChange(async (v) => { s.briefSprache = v; await this.plugin.saveSettings(); this.display(); }));

    const letterLabels = LETTER_LABELS[normSprache(s.briefSprache) || 'de'] || LETTER_LABELS.de;
    new obsidian.Setting(containerEl).setName(t('set_closing'))
      .setDesc(t('set_closing_desc'))
      .addText((x) => x.setPlaceholder(letterLabels.closing).setValue(s.defaultGruss)
        .onChange(async (v) => { s.defaultGruss = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName(t('head_fm')).setHeading();
    containerEl.createEl('p', {
      text: t('fm_intro'),
      cls: 'setting-item-description'
    });

    new obsidian.Setting(containerEl)
      .setName(t('set_insertfm'))
      .setDesc(t('set_insertfm_desc'))
      .addButton((b) => b.setButtonText(t('btn_insertfm')).setCta()
        .onClick(() => this.plugin.insertFrontmatterTemplate()));

    const fmTable = containerEl.createDiv({ cls: 'briefkopf-fm-table' });
    const fmRow = (key, desc) => {
      const r = fmTable.createDiv({ cls: 'briefkopf-fm-row' });
      r.createEl('code', { text: key });
      r.createSpan({ text: desc });
    };
    fmRow('empfaenger', t('fm_empfaenger'));
    fmRow('absender', t('fm_absender'));
    fmRow('betreff', t('fm_betreff'));
    fmRow('anrede', t('fm_anrede'));
    fmRow('ort', t('fm_ort'));
    fmRow('datum', t('fm_datum'));
    fmRow('anlagen', t('fm_anlagen'));
    fmRow('gruss', t('fm_gruss'));
    fmRow('unterschrift', t('fm_unterschrift'));
    fmRow('stil', t('fm_stil'));
    fmRow('infozeile', t('fm_infozeile'));
    fmRow('sprache', t('fm_sprache'));
    fmRow('steuernummer, ihr_zeichen, ihr_schreiben, unser_zeichen, telefon_bezug', t('fm_refs'));
    fmRow('info', t('fm_info'));

    new obsidian.Setting(containerEl).setName(t('head_advanced')).setHeading();

    new obsidian.Setting(containerEl).setName(t('set_css'))
      .setDesc(t('set_css_desc'))
      .addButton((b) => b.setButtonText(t('btn_preset')).onClick(async () => {
        s.customCss = PRESET_CSS;
        await this.plugin.saveSettings();
        this.display();
      }));

    new obsidian.Setting(containerEl)
      .addTextArea((x) => {
        x.setValue(s.customCss).onChange(async (v) => { s.customCss = v; await this.plugin.saveSettings(); });
        x.inputEl.rows = 12;
        x.inputEl.addClass('briefkopf-css-input');
      });
  }
}

module.exports = BriefkopfPlugin;
