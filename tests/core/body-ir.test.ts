import { describe, it, expect } from 'vitest';
import { layoutBody } from '../../src/core/body-ir';
import { DEFAULT_SETTINGS } from '../../src/core/model';

const base = { stil: 'sachlich', labels: {} };

describe('layoutBody — cursor hand-off', () => {
  it('emits frame ops (Betreff/Anrede/Gruß) without a markdown body', () => {
    const { ops } = layoutBody({ ...base, betreff: 'Re: X', anrede: 'Hallo,', gruss: 'MfG' }, DEFAULT_SETTINGS, [], 98.46);
    const texts = ops.filter((o) => o.kind === 'text').map((o: any) => o.str).join(' ');
    expect(texts).toContain('Re: X');
    expect(texts).toContain('Hallo,');
    expect(texts).toContain('MfG');
  });
  it('places the markdown body between anrede and gruss (single page)', () => {
    const body = [{ type: 'paragraph', inlines: [{ text: 'Body text.' }] } as any];
    const { ops, pageCount } = layoutBody({ ...base, anrede: 'Hallo,', gruss: 'MfG' }, DEFAULT_SETTINGS, body, 98.46);
    expect(pageCount).toBe(1);
    const ys = ops.filter((o) => o.kind === 'text');
    // anrede is above (larger y) than body which is above gruss
    const yOf = (s: string) => (ys.find((o: any) => o.str.includes(s)) as any).y;
    expect(yOf('Hallo,')).toBeGreaterThan(yOf('Body text.'));
    expect(yOf('Body text.')).toBeGreaterThan(yOf('MfG'));
  });
  it('offsets body ops onto continuation pages correctly', () => {
    const body = Array.from({ length: 80 }, (_, i) => ({ type: 'paragraph', inlines: [{ text: 'p' + i }] } as any));
    const { pageCount } = layoutBody({ ...base, anrede: 'Hallo,' }, DEFAULT_SETTINGS, body, 98.46);
    expect(pageCount).toBeGreaterThan(1);
  });
});

/* The Anlagen block carries the bulk of this file's type debt (singular/plural
   label choice, label lookup, list iteration). These pin the CURRENT behaviour
   so the typing pass cannot change it silently — no test covered it before. */
describe('layoutBody — Anlagen block', () => {
  const strs = (model: Record<string, unknown>): string[] =>
    layoutBody(model, DEFAULT_SETTINGS, [], 98.46)
      .ops.filter((o) => o.kind === 'text')
      .map((o: any) => o.str);

  it('uses the singular label for exactly one Anlage', () => {
    const out = strs({ ...base, anlagen: ['Rechnung.pdf'], labels: { anlage: 'Anlage', anlagen: 'Anlagen' } });
    expect(out).toContain('Anlage');
    expect(out).not.toContain('Anlagen');
    expect(out).toContain('Rechnung.pdf');
  });

  it('uses the plural label for more than one Anlage and lists every entry', () => {
    const out = strs({ ...base, anlagen: ['A.pdf', 'B.pdf'], labels: { anlage: 'Anlage', anlagen: 'Anlagen' } });
    expect(out).toContain('Anlagen');
    expect(out).toContain('A.pdf');
    expect(out).toContain('B.pdf');
  });

  it('falls back to "Anlagen" when no label set is supplied', () => {
    expect(strs({ ...base, anlagen: ['A.pdf'], labels: undefined })).toContain('Anlagen');
    expect(strs({ ...base, anlagen: ['A.pdf'], labels: {} })).toContain('Anlagen');
  });

  it('emits no Anlagen block for an empty or missing list', () => {
    expect(strs({ ...base, anlagen: [] })).not.toContain('Anlagen');
    expect(strs({ ...base })).not.toContain('Anlagen');
  });

  it('renders the Anlagen block below the signature', () => {
    const ops = layoutBody(
      { ...base, unterschrift: 'M. Muster', anlagen: ['A.pdf'] },
      DEFAULT_SETTINGS, [], 98.46
    ).ops.filter((o) => o.kind === 'text');
    const yOf = (s: string) => (ops.find((o: any) => o.str === s) as any).y;
    expect(yOf('M. Muster')).toBeGreaterThan(yOf('Anlagen'));
    expect(yOf('Anlagen')).toBeGreaterThan(yOf('A.pdf'));
  });
});
