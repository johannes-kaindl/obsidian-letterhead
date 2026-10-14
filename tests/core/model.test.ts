import { describe, it, expect } from 'vitest';
import { dinGeometry, hexToRgb01, styleFonts, bodyLayoutOptions, resolveTokens, STILE, DEFAULT_SETTINGS } from '../../src/core/model';

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

describe('resolveTokens — eine Quelle für CSS- und PDF-Pfad', () => {
  const css = (customCss: string, extra: object = {}) => ({ ...DEFAULT_SETTINGS, customCss, ...extra });

  it('ohne Custom CSS gleich den Stil-Defaults', () => {
    expect(resolveTokens('klassisch', css(''))).toEqual({ ...STILE.klassisch.tokens });
  });
  it('die Einstellung "Schriftgröße" schlägt den Stil, Custom CSS schlägt die Einstellung', () => {
    expect(resolveTokens('sachlich', css('', { fontSizePt: '12' })).fontSizePt).toBe(12);
    expect(resolveTokens('sachlich', css(':root{ --bk-font-size: 11.5pt; }', { fontSizePt: '12' })).fontSizePt).toBe(11.5);
  });
  it('liest Farben und Maße aus --bk-* und ignoriert auskommentierte Zeilen', () => {
    const t = resolveTokens('sachlich', css(`/* --bk-color-text: #ff0000; */
      :root { --bk-color-text: #0a7d3c; --bk-block-gap: 8mm; --bk-name-size: 20pt; }`));
    expect(t.colorText).toBe('#0a7d3c');
    expect(t.blockGap).toBe('8mm');
    expect(t.nameSize).toBe('20pt');
  });
  it('nimmt nur Literale: var(), Wörter und Fremdes bleiben beim Stil-Default', () => {
    const t = resolveTokens('sachlich', css(':root{ --bk-color-text: var(--x); --bk-color-muted: red; --bk-space: 2em; --bk-font-family: Comic; }'));
    expect(t.colorText).toBe(STILE.sachlich.tokens.colorText);
    expect(t.colorMuted).toBe(STILE.sachlich.tokens.colorMuted);
    expect(t.space).toBe(STILE.sachlich.tokens.space);
    expect(t.fontFamily).toBe(STILE.sachlich.tokens.fontFamily);
  });
  it('speist den Kopf-/Rumpf-Pfad: bodyLayoutOptions übernimmt die Farbe aus Custom CSS', () => {
    const o = bodyLayoutOptions({ stil: 'sachlich' }, css(':root{ --bk-color-text: #123456; }'), 500);
    expect(o.colors.text).toBe('#123456');
  });
  it('bleibt linear bei langen, nicht passenden Eingaben (n = 1 000 / 10 000 / 50 000)', () => {
    const time = (input: string) => {
      let best = Infinity;
      for (let i = 0; i < 3; i++) { const t0 = performance.now(); resolveTokens('sachlich', css(input)); best = Math.min(best, performance.now() - t0); }
      return best;
    };
    for (const unit of ['/*', '--bk-', '--bk-a', ':', '{', '--bk-a:' ]) {
      const t10 = time(unit.repeat(10_000));
      const t50 = time(unit.repeat(50_000));
      expect(t50 < 50 || t50 / t10 < 12, `${unit}: ${t10.toFixed(1)} → ${t50.toFixed(1)} ms`).toBe(true);
    }
  });
});
