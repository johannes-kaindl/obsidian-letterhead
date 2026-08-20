import { describe, it, expect } from 'vitest';
import {
  buildFilename,
  sanitizeFilename,
  DEFAULT_FILENAME_TEMPLATE,
  LEGACY_FILENAME_TEMPLATE,
  PLACEHOLDERS,
  migrateFilenameTemplate,
  isoDate,
  type FilenameValues,
} from '../../src/core/filename';

const V: FilenameValues = {
  notiz: 'Beispielbrief',
  datum: '2026-06-09',
  datum_lang: '9.6.2026',
  empfaenger: 'Mustermann GmbH',
  betreff: 'Angebot Nr. 2026-0042',
  unserzeichen: 'JK-2026-07',
};

/* Filenames sort lexically, so {datum} yields ISO — "2026-06-09 …" sorts by date in
   any file manager, "9.6.2026 …" does not. This deliberately revises the spec's
   "no second date path" stance: isoDate NORMALISES the raw frontmatter value, it does
   not re-format the letter's display date. That one stays available as {datum_lang}. */
describe('isoDate', () => {
  it('passes an ISO date through', () => {
    expect(isoDate('2026-06-09')).toBe('2026-06-09');
    expect(isoDate('2026-06-09T12:00:00Z')).toBe('2026-06-09');
  });

  it('converts a Date without shifting the day across timezones', () => {
    // A local midnight Date must not become the previous day via toISOString()
    expect(isoDate(new Date(2026, 5, 9))).toBe('2026-06-09');
    expect(isoDate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('parses the German day-first form the frontmatter may carry', () => {
    expect(isoDate('9.6.2026')).toBe('2026-06-09');
    expect(isoDate('09.06.2026')).toBe('2026-06-09');
  });

  it('returns an empty string for something undateable', () => {
    expect(isoDate('irgendwas')).toBe('');
    expect(isoDate('')).toBe('');
    expect(isoDate(null)).toBe('');
    expect(isoDate(undefined)).toBe('');
    expect(isoDate({})).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('replaces filesystem- and Obsidian-reserved characters with _', () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j#k^l[m]n')).toBe('a_b_c_d_e_f_g_h_i_j_k_l_m_n');
  });

  it('collapses whitespace and trims', () => {
    expect(sanitizeFilename('  Herr   Max   Mustermann  ')).toBe('Herr Max Mustermann');
  });

  it('cannot smuggle a path traversal through a template', () => {
    expect(sanitizeFilename('../../etc/passwd')).not.toContain('/');
  });
});

describe('buildFilename', () => {
  it('fills the documented placeholders', () => {
    expect(buildFilename('{datum} {empfaenger}', V)).toBe('2026-06-09 Mustermann GmbH');
    expect(buildFilename('{datum_lang}', V)).toBe('9.6.2026');
    expect(buildFilename('{notiz}', V)).toBe('Beispielbrief');
    expect(buildFilename('{unserzeichen} {betreff}', V)).toBe('JK-2026-07 Angebot Nr. 2026-0042');
  });

  it('treats everything outside braces as a literal', () => {
    expect(buildFilename('Brief an {empfaenger} vom {datum}', V))
      .toBe('Brief an Mustermann GmbH vom 2026-06-09');
  });

  it('leaves an unknown placeholder verbatim', () => {
    expect(buildFilename('{foo} {datum}', V)).toBe('{foo} 2026-06-09');
  });

  it('is case-sensitive', () => {
    expect(buildFilename('{Datum}', V)).toBe('{Datum}');
  });

  /* The bug this pins: with an object literal as the substitution map, subs['toString'] is
     Function.prototype.toString rather than undefined — the `?? {key}` fallback never fires
     and the template writes the function's source code into the filename. It was live in
     yijing-oracle and paperize.

     Since the kit hookup (0.27.0) the guard is `Object.hasOwn` INSIDE the kit module
     (src/vendor/kit/filename-template.ts), where all three plugins get it. letterhead's local
     null-prototype map was the second, redundant layer against the same leak and is gone on
     purpose. So: if this test ever fails, the kit guard broke — it does NOT mean the map has
     to come back. */
  it('does not leak Object.prototype members into the filename', () => {
    for (const evil of ['{toString}', '{constructor}', '{hasOwnProperty}', '{__proto__}']) {
      const out = buildFilename(evil, V);
      expect(out).toBe(evil);
      expect(out).not.toMatch(/function|native code|\[object/i);
    }
  });

  it('truncates long recipient and subject to 48 characters', () => {
    const long = { ...V, empfaenger: 'M'.repeat(200) };
    expect(buildFilename('{empfaenger}', long)).toHaveLength(48);
  });

  it('caps the overall result at 120 characters', () => {
    const long = { ...V, empfaenger: 'M'.repeat(80), betreff: 'B'.repeat(80), notiz: 'N'.repeat(80) };
    expect(buildFilename('{notiz} {empfaenger} {betreff}', long).length).toBeLessThanOrEqual(120);
  });

  it('falls back to the note name when the template renders empty', () => {
    expect(buildFilename('{empfaenger}', { ...V, empfaenger: '' })).toBe('Beispielbrief');
    expect(buildFilename('   ', V)).toBe('Beispielbrief');
  });

  it('falls back to "Brief" when even the note name is empty', () => {
    expect(buildFilename('{empfaenger}', { ...V, empfaenger: '', notiz: '' })).toBe('Brief');
  });

  it('never returns an empty name for any placeholder-only template', () => {
    const empty: FilenameValues = { notiz: '', datum: '', datum_lang: '', empfaenger: '', betreff: '', unserzeichen: '' };
    for (const p of PLACEHOLDERS) {
      expect(buildFilename(`{${p}}`, empty).length).toBeGreaterThan(0);
    }
  });

  it('exposes the placeholder list the settings UI renders, so it cannot drift', () => {
    expect(PLACEHOLDERS).toEqual(['notiz', 'datum', 'datum_lang', 'empfaenger', 'betreff', 'unserzeichen']);
    // every advertised placeholder must actually substitute
    for (const p of PLACEHOLDERS) {
      expect(buildFilename(`{${p}}`, V)).not.toBe(`{${p}}`);
    }
  });

  it('keeps existing installs bit-identical, per spec A3', () => {
    // the case that matters: someone in the community directory who never saw this setting
    expect(migrateFilenameTemplate(undefined, false)).toBe(LEGACY_FILENAME_TEMPLATE);
    expect(buildFilename(migrateFilenameTemplate(undefined, false), V)).toBe(V.notiz);
    // fresh install gets the new default
    expect(migrateFilenameTemplate(undefined, true)).toBe(DEFAULT_FILENAME_TEMPLATE);
    // an explicit choice always wins over both
    expect(migrateFilenameTemplate('{betreff}', false)).toBe('{betreff}');
    expect(migrateFilenameTemplate('{betreff}', true)).toBe('{betreff}');
    // an emptied field is not a choice — fall back rather than produce nothing
    expect(migrateFilenameTemplate('', false)).toBe(LEGACY_FILENAME_TEMPLATE);
  });

  it('ships the templates the migration relies on', () => {
    expect(DEFAULT_FILENAME_TEMPLATE).toBe('{datum} {empfaenger}');
    expect(LEGACY_FILENAME_TEMPLATE).toBe('{notiz}');
    expect(buildFilename(LEGACY_FILENAME_TEMPLATE, V)).toBe(V.notiz);
  });
});
