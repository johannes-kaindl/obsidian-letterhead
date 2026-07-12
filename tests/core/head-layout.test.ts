import { describe, it, expect } from 'vitest';
import { layoutHead } from '../../src/core/head-layout';
import { DEFAULT_SETTINGS } from '../../src/core/model';

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
});
