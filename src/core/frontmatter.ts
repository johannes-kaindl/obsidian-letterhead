/* ------------------------------------------------------------------ *
 *  Frontmatter field resolution (German-first, with aliases)
 *
 *  Ported verbatim from main.js.reference (main.js:96-114, 373-499).
 * ------------------------------------------------------------------ */

export function normSprache(v: unknown): string | null {
  if (v == null) return null;
  const k = norm(v);
  if (k === 'de' || k === 'deutsch' || k === 'german' || k === 'dede') return 'de';
  if (k === 'en' || k === 'englisch' || k === 'english' || k === 'engb' || k === 'enus') return 'en';
  return null;
}

/* Accepts setting values and frontmatter spellings: a/b/c, German names,
   English-ish aliases. Returns a STILE key or null. */
export function normStil(v: unknown): string | null {
  if (v == null) return null;
  const k = norm(v);
  if (k === 'a' || k === 'sachlich' || k === 'sachlichmodern' || k === 'modern' || k === 'sans') return 'sachlich';
  if (k === 'b' || k === 'klassisch' || k === 'klassischserioes' || k === 'klassischseriös' || k === 'classic' || k === 'serif') return 'klassisch';
  if (k === 'c' || k === 'technisch' || k === 'technischpraezise' || k === 'technischpräzise' || k === 'tech' || k === 'mono') return 'technisch';
  return null;
}

/* 'vollstaendig' (full info block) | 'nurdatum' (place + date line). */
export function normInfozeile(v: unknown): string | null {
  if (v == null) return null;
  const k = norm(v);
  if (k === 'vollstaendig' || k === 'vollständig' || k === 'voll' || k === 'full' || k === 'infoblock' || k === 'bezugszeichen') return 'vollstaendig';
  if (k === 'nurdatum' || k === 'datum' || k === 'minimal' || k === 'dateonly' || k === 'date') return 'nurdatum';
  return null;
}

export const ALIASES: Record<string, string[]> = {
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

export function norm(k: unknown): string { return String(k).toLowerCase().replace(/[\s_\-.]+/g, ''); }

export function buildFmIndex(fm: Record<string, unknown>): Record<string, unknown> {
  const idx: Record<string, unknown> = {};
  if (fm && typeof fm === 'object') {
    for (const k of Object.keys(fm)) idx[norm(k)] = fm[k];
  }
  return idx;
}

export function getField(idx: Record<string, unknown>, aliases: string[]): unknown {
  for (const a of aliases) {
    const v = idx[norm(a)];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/** Frontmatter value → letter text. YAML may legally hold a map, and a bare
 *  String(value) would print the literal "[object Object]" into the letter.
 *  Every other input keeps its historical rendering exactly. */
export function asText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
  if (v instanceof Date) return String(v);
  // Arrays keep String(array)'s comma joining, so existing letters render the same.
  if (Array.isArray(v)) return v.map(asText).join(',');
  // Objects, functions and symbols have no textual form in a business letter.
  // (Listing primitives explicitly also avoids String(symbol), which throws.)
  return '';
}

export function toLines(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => asText(x).trim()).filter(Boolean);
  return asText(v).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
}

export interface AbsenderLines {
  name: string;
  zusatz: string;
  strasse: string;
  plzOrt: string;
  telefon: string;
  email: string;
  web: string;
}

/* Frontmatter `absender:` as a plain list (one envelope line per item):
   first line = name, the rest is classified — phone/e-mail/web are detected,
   "12345 Ort" => PLZ+Ort, a line containing a digit => street, else Zusatz. */
export function parseAbsenderLines(lines: string[]): AbsenderLines {
  const r: AbsenderLines = { name: '', zusatz: '', strasse: '', plzOrt: '', telefon: '', email: '', web: '' };
  if (!lines || lines.length === 0) return r;
  r.name = lines[0];
  for (const line of lines.slice(1)) {
    if (!r.email && /@/.test(line)) r.email = line.replace(/^e-?mail\s*:?\s*/i, '');
    else if (!r.web && /^(www\.|https?:\/\/)/i.test(line)) r.web = line;
    else if (!r.telefon && (/^(tel\.?|telefon|fon|mobil)\b/i.test(line) || /^[+0][\d\s\-/().]{5,}$/.test(line)))
      r.telefon = line.replace(/^(tel\.?|telefon|fon|mobil)\s*:?\s*/i, '');
    else if (!r.plzOrt && /^\d{4,5}\s+\S/.test(line)) r.plzOrt = line;
    else if (!r.strasse && /\d/.test(line)) r.strasse = line;
    else if (!r.zusatz) r.zusatz = line;
    else if (!r.strasse) r.strasse = line;
  }
  return r;
}

export function esc(s: unknown): string {
  return asText(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]);
}

export function escLines(lines: string[]): string { return (lines || []).map(esc).join('\n'); }

// Base64-encodes a local vault file (the user's configured logo) for an inline data:
// URL — the plugin's only btoa() use. No network fetch, no obfuscation; see SECURITY.md.
export function arrayBufferToBase64(buf: ArrayBuffer): string {
  let bin = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}
