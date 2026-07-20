/* ------------------------------------------------------------------ *
 *  Configurable filename scheme for exported / printed letters.
 *  Pure: no obsidian import (check:pure).
 *
 *  Spec: docs/superpowers/specs/2026-07-16-letterhead-output-target-design.md
 *  (§ Dateinamen-Schema). Pulled forward from 1.5.0 into 1.4.2 because the
 *  desktop print dialog proposes Obsidian's window title as the filename —
 *  see doPrint() in obsidian/html-engine.ts.
 *
 *  Modelled on obsidian-paperize's filename.ts (which names a PDF, like we
 *  do) rather than yijing-oracle's (which names a note) — spec decision A1b.
 * ------------------------------------------------------------------ */

/** Windows-reserved plus Obsidian-significant characters (`#` tag, `^` block
 *  ref, `[]` wikilink). Replaced, not dropped — matches paperize and the
 *  previous `sanitizeBase` in output.ts. */
const INVALID = /[\\/:*?"<>|#^[\]]/g;

/** Per-field cap for free-text placeholders. */
const FIELD_MAX = 48;
/** Overall cap; the folder path still has to fit under the 255-byte limit. */
const TOTAL_MAX = 120;

export const DEFAULT_FILENAME_TEMPLATE = '{datum} {empfaenger}';
/** What existing installs keep, so their filenames stay bit-identical (spec A3). */
export const LEGACY_FILENAME_TEMPLATE = '{notiz}';

/** The list the settings UI renders. Exported so the help text is generated
 *  from the same source that substitutes — yijing's hand-maintained list had
 *  drifted from its map. */
export const PLACEHOLDERS = ['notiz', 'datum', 'datum_lang', 'empfaenger', 'betreff', 'unserzeichen'] as const;

/** Raw frontmatter date → `YYYY-MM-DD`, or '' if it is not a date.
 *
 *  Filenames sort lexically, so the letter's display date ("9.6.2026") sorts
 *  terribly while ISO sorts by date in any file manager. The spec originally
 *  ruled out a second date path to avoid drifting against the display date —
 *  this does not format a date, it NORMALISES the frontmatter value. The
 *  display date stays reachable as {datum_lang}. */
export function isoDate(raw: unknown): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const fromDate = (d: Date): string =>
    isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (raw instanceof Date) return fromDate(raw);
  if (typeof raw !== 'string') return '';
  const s = raw.trim();
  if (!s) return '';

  // Already ISO (with or without a time part) — take it verbatim, no Date round
  // trip, which would shift the day for timezones behind UTC.
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // German day-first form, as a hand-typed frontmatter date may carry it.
  const de = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (de) return `${de[3]}-${pad(Number(de[2]))}-${pad(Number(de[1]))}`;

  return '';
}

export interface FilenameValues {
  /** Note name without extension. */
  notiz: string;
  /** ISO date (YYYY-MM-DD) — sorts correctly in a file listing. */
  datum: string;
  /** The date as printed in the letter (locale-formatted). */
  datum_lang: string;
  /** First recipient line. */
  empfaenger: string;
  betreff: string;
  unserzeichen: string;
}

/** Which template an install starts with (spec A3). A fresh install gets the
 *  new default; an existing one keeps naming files after the note, because a
 *  silent default switch would rename files for people who never touched the
 *  setting — letterhead has been in the community directory since 2026-06-13. */
export function migrateFilenameTemplate(stored: unknown, isFreshInstall: boolean): string {
  if (typeof stored === 'string' && stored !== '') return stored;
  return isFreshInstall ? DEFAULT_FILENAME_TEMPLATE : LEGACY_FILENAME_TEMPLATE;
}

export function sanitizeFilename(s: string): string {
  return (s || '').replace(INVALID, '_').replace(/\s+/g, ' ').trim();
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max).trim() : s;
}

export function buildFilename(template: string, v: FilenameValues): string {
  /* Null-prototype map on purpose: with a plain object literal, subs['toString']
     resolves to Function.prototype.toString, the `?? ` fallback never fires, and
     `{toString}` writes the function source into the filename. That bug is live
     in both yijing-oracle and paperize; it must not be inherited here. */
  const subs: Record<string, string> = Object.create(null) as Record<string, string>;
  subs.notiz = v.notiz;
  subs.datum = v.datum;
  subs.datum_lang = v.datum_lang;
  subs.empfaenger = clip(v.empfaenger, FIELD_MAX);
  subs.betreff = clip(v.betreff, FIELD_MAX);
  subs.unserzeichen = v.unserzeichen;

  const fill = (tpl: string): string =>
    sanitizeFilename(
      tpl.replace(/\{(\w+)\}/g, (whole, key: string) =>
        Object.hasOwn(subs, key) ? subs[key] : whole,
      ),
    );

  // Fallback chain — never return a nameless export.
  const out = fill(template) || fill(LEGACY_FILENAME_TEMPLATE) || 'Brief';
  return clip(out, TOTAL_MAX);
}
