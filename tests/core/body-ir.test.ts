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
