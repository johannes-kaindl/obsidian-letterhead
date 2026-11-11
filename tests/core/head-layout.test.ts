import { describe, it, expect } from 'vitest';
import { layoutHead } from '../../src/core/head-layout';
import { DEFAULT_SETTINGS } from '../../src/core/model';
import { textWidthPt } from '../../src/vendor/kit/pdf/metrics';

const model = { senderName: 'Max Muster', recipient: ['Firma', 'Str. 1'], datum: '2026-07-12', stil: 'sachlich', labels: {} };

describe('layoutHead', () => {
  it('emits only page-0 ops', () => {
    const { ops } = layoutHead(model, DEFAULT_SETTINGS);
    expect(ops.length).toBeGreaterThan(0);
    expect(ops.every((o) => o.page === 0)).toBe(true);
  });
  it('places the sender name as a text op', () => {
    const { ops } = layoutHead(model, DEFAULT_SETTINGS);
    expect(ops.some((o) => o.kind === 'text' && (o as any).str.includes('Max Muster'))).toBe(true);
  });
  it('returns the content top for the body pass', () => {
    const { contentTopMm } = layoutHead(model, DEFAULT_SETTINGS);
    expect(contentTopMm).toBeGreaterThan(90);
    expect(contentTopMm).toBeLessThan(110);
  });
  it('draws the head separator line', () => {
    const { ops } = layoutHead(model, DEFAULT_SETTINGS);
    expect(ops.some((o) => o.kind === 'line')).toBe(true);
  });

  describe('name next to the logo (showNameWithLogo)', () => {
    const withLogo = { ...model, logo: 'data:image/png;base64,AAAA', logoWidthMm: 40, logoHeightMm: 15 };
    const nameOp = (ops: ReturnType<typeof layoutHead>['ops']) =>
      ops.find((o) => o.kind === 'text' && (o as { str: string }).str.includes('Max Muster')) as { x: number; y: number } | undefined;

    it('keeps the logo alone by default: no name op (as before)', () => {
      expect(nameOp(layoutHead(withLogo, DEFAULT_SETTINGS).ops)).toBeUndefined();
    });
    it('draws the name right of the logo when the option is on', () => {
      const { ops } = layoutHead(withLogo, { ...DEFAULT_SETTINGS, showNameWithLogo: true });
      const op = nameOp(ops);
      expect(op).toBeDefined();
      // left margin 25 mm + logo 40 mm + gap 4 mm = 69 mm
      expect(op!.x).toBeCloseTo((25 + 40 + 4) * 2.834645669, 1);
    });
    it('centres the name on the logo height instead of the head top', () => {
      const tall = layoutHead({ ...withLogo, logoHeightMm: 22 }, { ...DEFAULT_SETTINGS, showNameWithLogo: true });
      const flat = layoutHead({ ...withLogo, logoHeightMm: 8 }, { ...DEFAULT_SETTINGS, showNameWithLogo: true });
      expect(nameOp(tall.ops)!.y).toBeLessThan(nameOp(flat.ops)!.y);
    });
    it('wraps a long name so it stays clear of the contact lines', () => {
      const long = { ...withLogo, senderName: 'Max Mustermann Büroservice und Beratung GmbH', senderStrasse: 'Musterstraße 1', senderPlzOrt: '12345 Musterstadt', senderTelefon: '+49 30 1234567', senderEmail: 'kontakt@example.com' };
      const { ops } = layoutHead(long, { ...DEFAULT_SETTINGS, showNameWithLogo: true });
      const texts = ops.filter((o) => o.kind === 'text') as Array<{ str: string; x: number; y: number; sizePt: number }>;
      const nameLines = texts.filter((o) => o.sizePt >= 12 && o.x > 60);
      expect(nameLines.length).toBeGreaterThan(1);
      expect(nameLines.map((o) => o.str).join(' ')).toBe(long.senderName);
      // the right edge of the widest name line stays left of the left edge of the contact block
      const contactLeft = Math.min(...texts.filter((o) => o.sizePt < 9 && o.x > 250).map((o) => o.x));
      for (const o of nameLines) expect(o.x + textWidthPt('helvB', o.sizePt, o.str)).toBeLessThan(contactLeft);
    });
    it('draws nothing extra without a sender name, and changes nothing without a logo', () => {
      const noName = { ...withLogo, senderName: '' };
      expect(layoutHead(noName, { ...DEFAULT_SETTINGS, showNameWithLogo: true }).ops.some((o) => o.kind === 'text' && (o as { str: string }).str === '')).toBe(false);
      const a = layoutHead(model, DEFAULT_SETTINGS).ops;
      const b = layoutHead(model, { ...DEFAULT_SETTINGS, showNameWithLogo: true }).ops;
      expect(b).toEqual(a);
    });
  });
});
