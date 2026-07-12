// Ported verbatim from .superpowers/sdd/main.js.reference:172-371
// (UI_STRINGS, detectUiLang, UI_LANG, t). Do not reword, drop, or reorder
// entries when touching this file — see Task D1 in .superpowers/sdd/.

/** English UI strings — canonical source; every key must exist here. */
const en = {
  cmd_export: 'Export letter as PDF / print',
  cmd_export_pdf: 'Export letter as PDF (vector)',
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
  set_layout: 'Layout',
  set_layout_desc: 'Base layout of the letter.',
  opt_layout_din: 'DIN 5008 (German standard)',
  opt_layout_modern: 'Modern / international',
  set_style: 'Style',
  set_style_desc: 'Complete look: font, colors, spacing, letterhead. Override per letter via "stil".',
  opt_style_a: 'A · Sachlich (neutral sans)',
  opt_style_b: 'B · Klassisch (serif)',
  opt_style_c: 'C · Technisch (monospaced accents)',
  set_infoline: 'Info line',
  set_infoline_desc: 'Full: info block on the right. Date only: a plain place/date line. Override per letter via "infozeile".',
  opt_info_full: 'Full (info block)',
  opt_info_date: 'Date only',
  set_dinform: 'DIN 5008 form',
  set_dinform_desc: 'Address field position: Form A 27 mm, Form B 45 mm (standard).',
  set_mobileexport: 'Mobile export',
  set_mobileexport_desc: 'On iPhone/iPad: one-tap vector PDF (recommended) or the classic print/Quick Look route.',
  opt_mobile_pdf: 'Vector PDF (one tap)',
  opt_mobile_print: 'Print / Quick Look (classic)',
  head_sender: 'Sender profile',
  sender_intro: 'Default sender; override per letter via the "absender" frontmatter list.',
  f_name: 'Name',
  f_company: 'Company / addition',
  f_street: 'Street',
  f_city: 'Postal code and city',
  f_phone: 'Phone',
  f_email: 'Email',
  f_web: 'Website',
  set_return: 'Return address line',
  set_return_desc: 'Line above the recipient address. Empty = automatic.',
  ph_automatic: 'automatic',
  head_elements: 'Elements',
  set_fold: 'Fold marks',
  set_fold_desc: 'Two marks for folding to fit a window envelope (DIN 5008).',
  set_hole: 'Hole mark',
  set_hole_desc: 'Mark at 148.5 mm for filing.',
  set_offset: 'Print offset top (mm)',
  set_offset_desc: 'Shifts the content down if the address sits too high in the envelope window (try 2–4 mm).',
  set_logo: 'Show logo',
  set_logo_desc: 'Replaces the name in the letterhead with an image.',
  set_logopath: 'Logo path',
  set_logopath_desc: 'Vault-relative path to an image, e.g. assets/logo.png',
  head_typo: 'Typography & language',
  set_font: 'Font (CSS font-family)',
  set_font_desc: 'Empty = style default (shown as placeholder).',
  set_fontsize: 'Font size (pt)',
  set_fontsize_desc: 'Empty = style default (shown as placeholder).',
  set_locale: 'Date locale',
  set_locale_desc: 'For example de-DE, en-GB, en-US — controls the date format.',
  set_letterlang: 'Letter language',
  set_letterlang_desc: 'Language of the printed labels. Override per letter via "sprache".',
  opt_lang_de: 'Deutsch',
  opt_lang_en: 'English',
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
  btn_preset: 'Reset preset',
};

/** German UI strings — must carry exactly the same keys as `en`. */
const de: Record<keyof typeof en, string> = {
  cmd_export: 'Brief als PDF exportieren / drucken',
  cmd_export_pdf: 'Brief als PDF exportieren (Vektor)',
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
  set_layout: 'Layout',
  set_layout_desc: 'Grundlayout des Briefs.',
  opt_layout_din: 'DIN 5008 (deutscher Standard)',
  opt_layout_modern: 'Modern / international',
  set_style: 'Stil',
  set_style_desc: 'Komplettes Erscheinungsbild: Schrift, Farben, Abstände, Briefkopf. Pro Brief per „stil" überschreibbar.',
  opt_style_a: 'A · Sachlich (neutral serifenlos)',
  opt_style_b: 'B · Klassisch (Serife)',
  opt_style_c: 'C · Technisch (monospaced Akzente)',
  set_infoline: 'Infozeile',
  set_infoline_desc: 'Vollständig: Infoblock rechts. Nur Datum: schlichte Orts-/Datumszeile. Pro Brief per „infozeile" überschreibbar.',
  opt_info_full: 'Vollständig (Infoblock)',
  opt_info_date: 'Nur Datum',
  set_dinform: 'DIN-5008-Form',
  set_dinform_desc: 'Anschrift-Position: Form A 27 mm, Form B 45 mm (Standard).',
  set_mobileexport: 'Mobiler Export',
  set_mobileexport_desc: 'Auf iPhone/iPad: Ein-Tipp-Vektor-PDF (empfohlen) oder der klassische Druck-/Quick-Look-Weg.',
  opt_mobile_pdf: 'Vektor-PDF (ein Tipp)',
  opt_mobile_print: 'Drucken / Quick Look (klassisch)',
  head_sender: 'Absender-Profil',
  sender_intro: 'Standard-Absender; pro Brief per Frontmatter-Liste „absender" überschreibbar.',
  f_name: 'Name',
  f_company: 'Zusatz / Firma',
  f_street: 'Straße',
  f_city: 'PLZ und Ort',
  f_phone: 'Telefon',
  f_email: 'E-Mail',
  f_web: 'Website',
  set_return: 'Rücksendeangabe',
  set_return_desc: 'Zeile über der Empfängeranschrift. Leer = automatisch.',
  ph_automatic: 'automatisch',
  head_elements: 'Elemente',
  set_fold: 'Faltmarken',
  set_fold_desc: 'Zwei Markierungen zum Falten fürs Fensterkuvert (DIN 5008).',
  set_hole: 'Lochmarke',
  set_hole_desc: 'Markierung bei 148,5 mm zum Abheften.',
  set_offset: 'Druckversatz oben (mm)',
  set_offset_desc: 'Schiebt den Inhalt nach unten, falls die Anschrift im Kuvertfenster zu hoch sitzt (2–4 mm probieren).',
  set_logo: 'Logo anzeigen',
  set_logo_desc: 'Ersetzt den Namen im Briefkopf durch ein Bild.',
  set_logopath: 'Logo-Pfad',
  set_logopath_desc: 'Vault-relativer Pfad zu einer Bilddatei, z. B. assets/logo.png',
  head_typo: 'Typografie & Sprache',
  set_font: 'Schriftart (CSS font-family)',
  set_font_desc: 'Leer = Stil-Standard (als Platzhalter angezeigt).',
  set_fontsize: 'Schriftgröße (pt)',
  set_fontsize_desc: 'Leer = Stil-Standard (als Platzhalter angezeigt).',
  set_locale: 'Datums-Locale',
  set_locale_desc: 'z. B. de-DE, en-GB, en-US — bestimmt das Datumsformat.',
  set_letterlang: 'Briefsprache',
  set_letterlang_desc: 'Sprache der gedruckten Labels. Pro Brief per „sprache" überschreibbar.',
  opt_lang_de: 'Deutsch',
  opt_lang_en: 'Englisch',
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
  btn_preset: 'Preset zurücksetzen',
};

/** All UI string tables, keyed by language. */
export const UI_STRINGS = { en, de };

/** Supported UI languages. */
export type UiLang = keyof typeof UI_STRINGS;

/** Every valid UI string key (as defined by the English table). */
export type UiStringKey = keyof typeof en;

/* App language detection, most reliable source first:
   1. obsidian.getLanguage() — official API (Obsidian >= 1.8)
   2. moment.locale() — Obsidian keeps it on the app language
   English is the default and the fallback for every missing key.

   This module intentionally does not statically `import` the 'obsidian'
   package (kept dependency-free for pure string lookup); the official-API
   check below reads a global `obsidian` object if one happens to be present
   instead. In the real Obsidian app that global is not set by the module
   bundler, so in practice detection currently falls through to branch 2
   (window.moment), matching the legacy main.js runtime behavior. */
export function detectUiLang(): UiLang {
  try {
    const g = globalThis as unknown as { obsidian?: { getLanguage?: () => string } };
    if (g.obsidian && typeof g.obsidian.getLanguage === 'function') {
      const l = g.obsidian.getLanguage();
      if (l) return String(l).toLowerCase().startsWith('de') ? 'de' : 'en';
    }
  } catch (e) {
    /* fall through */
  }
  try {
    if (typeof window !== 'undefined') {
      const w = window as unknown as { moment?: { locale?: () => string } };
      const m = w.moment && w.moment.locale && w.moment.locale();
      if (m && String(m).toLowerCase().startsWith('de')) return 'de';
    }
  } catch (e) {
    /* no window (tests) — default to English */
  }
  return 'en';
}

const UI_LANG: UiLang = detectUiLang();

/** Translates `key` in the detected UI language; falls back to English, then
 *  to the key itself for unknown keys (verbatim behavior of main.js:367-371). */
export function t(key: string): string {
  const table = UI_STRINGS[UI_LANG] as Record<string, string> | undefined;
  const enTable = UI_STRINGS.en as Record<string, string>;
  return (table && table[key]) || enTable[key] || key;
}
