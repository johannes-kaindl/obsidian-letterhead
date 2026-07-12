import { describe, it, expect } from 'vitest';
import { dinGeometry, hexToRgb01, styleFonts, bodyLayoutOptions, DEFAULT_SETTINGS } from '../../src/core/model';

describe('model', () => {
  it('dinGeometry form A vs B differ in address top', () => {
    expect(dinGeometry('A').addrTopMm).not.toBe(dinGeometry('B').addrTopMm);
  });
  it('hexToRgb01 parses to 0..1 triple', () => {
    expect(hexToRgb01('#ffffff')).toEqual([1, 1, 1]);
  });
  it('styleFonts: klassisch uses Times family', () => {
    expect(styleFonts('klassisch').body).toBe('times');
  });
  it('bodyLayoutOptions wires startY + followTopMm=25', () => {
    const o = bodyLayoutOptions({ stil: 'sachlich' }, DEFAULT_SETTINGS, 500);
    expect(o.page.startY).toBe(500);
    expect(o.page.followTopMm).toBe(25);
    expect(o.frame.pageNumbers).toBe(false);
  });
  it('bodyLayoutOptions maps klassisch → serif', () => {
    expect(bodyLayoutOptions({ stil: 'klassisch' }, DEFAULT_SETTINGS, 500).fonts.body).toBe('serif');
  });
});
