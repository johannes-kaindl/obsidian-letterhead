/**
 * Linearität der Funktionen, die Frontmatter-Text, Einstellungstext und Dateinamen zerlegen (ReDoS-Konvention, CORE-TEST-26 (b)): der erschöpfende Fuzz
 * `pruefeLinearFuzz` aus dem Kit-Testmodul. Gemessen wird ein Quotient t(50 000)/t(10 000), keine Millisekunden.
 *
 * Geprüft sind die Wege, auf denen Text von außen ankommt: das eigene CSS der Einstellungen (`resolveTokens`), die Absenderzeilen und der Zeilenumbruch
 * (`parseAbsenderLines`, `toLines`), das Maskieren (`esc`), der Schlüsselvergleich (`norm`), das Datum (`isoDate`), die Längenangabe (`parseLenPt`) und der
 * Dateiname aus Vorlage und Feldern (`buildFilename`).
 *
 * Nicht Gegenstand: `sanitizeFilename` und `fillTemplate` (Kit, dort mit eigenem Linearitätstest) und `layoutHead`/`layoutBody` (rechnen auf einem Modell
 * aus festen Feldern, kein Zerlegen von Text). Die Gegenprobe (eine absichtlich quadratische Fassung wird rot) steht am Ende dieser Datei.
 */
import { describe, expect, it } from 'vitest';
import { pruefeLinear, pruefeLinearFuzz } from '../vendor/kit/linear-probe';
import { DEFAULT_SETTINGS, parseLenPt, resolveTokens } from '../../src/core/model';
import { esc, norm, parseAbsenderLines, toLines } from '../../src/core/frontmatter';
import { buildFilename, isoDate } from '../../src/core/filename';

const FUZZ_MS = 180_000;

/** Befund als lesbarer Text, damit eine rote Zeile ohne Nachlesen verständlich ist (CORE-TEST-14). */
const befund = (r: { verdaechtig: ReadonlyArray<{ message: string }> }): string => r.verdaechtig.map((v) => v.message).join('\n');

function fuzz(fn: (s: string) => unknown, alphabet: string[]): void {
  const f = pruefeLinearFuzz(fn, { alphabet, maxLaenge: 3 });
  expect(f.linear, befund(f)).toBe(true);
  expect(f.gemessen, 'der Fuzz hat Eingaben gemessen').toBeGreaterThan(20);
}

describe('Einstellungstext und Längen', () => {
  it('resolveTokens: Fuzz über Kommentare, Trennzeichen und Token-Anfang im eigenen CSS', () => {
    fuzz((s) => resolveTokens('sachlich', { ...DEFAULT_SETTINGS, customCss: s }), ['/*', '*/', '--bk-', ':', ';', '{']);
  }, FUZZ_MS);

  it('parseLenPt: Fuzz über Ziffern, Punkt, Leerraum und Einheit', () => {
    fuzz((s) => parseLenPt(s, 10), ['1', '.', ' ', 'mm', 'pt', '-']);
  }, FUZZ_MS);
});

describe('Frontmatter-Text', () => {
  it('parseAbsenderLines und toLines: Fuzz über Zeilenumbruch, Ziffern, Leerraum und Schlüsselwörter', () => {
    const alphabet = ['\n', ' ', '1', '@', 'tel', ':', 'www.'];
    fuzz((s) => parseAbsenderLines(toLines(s)), alphabet);
    fuzz((s) => toLines(s), alphabet);
  }, FUZZ_MS);

  it('esc und norm: Fuzz über Sonderzeichen, Trennzeichen und Leerraum', () => {
    fuzz((s) => esc(s), ['&', '<', '>', '"', ' ', 'x']);
    fuzz((s) => norm(s), [' ', '_', '-', '.', 'x', '\n']);
  }, FUZZ_MS);
});

describe('Dateiname', () => {
  it('buildFilename: Fuzz über Platzhalter, Klammern und Sonderzeichen in Vorlage und Feldern', () => {
    const werte = { notiz: 'n', datum: '2026-01-01', datum_lang: 'x', empfaenger: 'e', betreff: 'b', unserzeichen: 'u' };
    const alphabet = ['{', '}', '{datum}', '{empfaenger}', '/', ' ', 'x'];
    fuzz((s) => buildFilename(s, werte), alphabet);
    fuzz((s) => buildFilename('{empfaenger} {betreff}', { ...werte, empfaenger: s, betreff: s }), alphabet);
  }, FUZZ_MS);

  it('isoDate: Fuzz über Ziffern, Trennzeichen und Leerraum', () => {
    fuzz((s) => isoDate(s), ['1', '-', '.', ' ', 'T', '2026']);
  }, FUZZ_MS);

  it('feste Eingaben: lange Zeilen und viele Kommentare bleiben linear', () => {
    const a = pruefeLinear((s: string) => resolveTokens('sachlich', { ...DEFAULT_SETTINGS, customCss: s }), (n) => '/* x */ --bk-a: 1;\n'.repeat(Math.ceil(n / 20)));
    expect(a.linear, a.message).toBe(true);
    const b = pruefeLinear((s: string) => parseAbsenderLines(toLines(s)), (n) => 'Zeile 1\n'.repeat(Math.ceil(n / 8)));
    expect(b.linear, b.message).toBe(true);
  });
});

describe('Gegenprobe: der Fuzz kann rot werden (CORE-TEST-01)', () => {
  /** Absichtlich quadratisch: dieselbe Form wie `text.replace(/\n*$/, …)` auf dem Absendertext. */
  const quadratisch = (s: string): string => s.replace(/\n*$/, '\n\n');

  it('pruefeLinearFuzz meldet die quadratische Form als Verdacht', () => {
    const f = pruefeLinearFuzz((s) => quadratisch(`Rumpf\n${s}\nSchluss`), { alphabet: ['\n', 'x'], maxLaenge: 1, verschachtelt: false });
    expect(f.linear).toBe(false);
    expect(f.verdaechtig.map((v) => v.einheit)).toContain('\n');
  }, FUZZ_MS);
});
