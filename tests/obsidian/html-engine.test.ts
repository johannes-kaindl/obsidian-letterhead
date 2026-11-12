import { describe, it, expect } from 'vitest';
import { buildCss, buildChromiumDoc, buildStandaloneDoc, PRINT_CSP, STANDALONE_WRAPPER_CSS } from '../../src/obsidian/html-engine';
import { DEFAULT_SETTINGS } from '../../src/core/model';

describe('html-engine', () => {
  it('buildCss(DEFAULT_SETTINGS, "sachlich") contains --bk- design tokens', () => {
    const css = buildCss(DEFAULT_SETTINGS, 'sachlich');
    expect(css).toContain('--bk-');
    expect(css).toContain('--bk-din-head-top');
    expect(css).toContain('--bk-font-family');
  });

  it('buildStandaloneDoc("<x>", "") produces a doctype-wrapped document', () => {
    const doc = buildStandaloneDoc('<x>', '');
    expect(doc).toContain('<!doctype');
    expect(doc).toContain('<x>');
  });

  it('buildCss draws table cells with the hairline colour, and Custom CSS still wins', () => {
    const css = buildCss({ ...DEFAULT_SETTINGS, customCss: '.bk-body td{ border:none; }' }, 'sachlich');
    const regel = css.indexOf('.bk-body th, .bk-body td{ border:0.25mm solid var(--bk-color-hairline)');
    expect(regel).toBeGreaterThan(-1);
    expect(css.indexOf('.bk-body td{ border:none; }')).toBeGreaterThan(regel);
  });
  it('buildCss defines the three print-margin tokens with the built-in defaults', () => {
    const css = buildCss(DEFAULT_SETTINGS, 'sachlich');
    expect(css).toContain('--bk-print-margin-top:10mm');
    expect(css).toContain('--bk-print-margin-top-follow:25mm');
    expect(css).toContain('--bk-print-margin-bottom:20mm');
  });

  it('the @page margins read the tokens, so Custom CSS can set them', () => {
    expect(STANDALONE_WRAPPER_CSS).toMatch(
      /@page\{[^}]*margin:var\(--bk-print-margin-top-follow, 25mm\) 0 var\(--bk-print-margin-bottom, 20mm\) 0/
    );
    expect(STANDALONE_WRAPPER_CSS).toMatch(
      /@page:first\{\s*margin-top:var\(--bk-print-margin-top, 10mm\)/
    );
  });

  it('the margin tokens are defined before the wrapper, Custom CSS sits between', () => {
    const css = buildCss({ ...DEFAULT_SETTINGS, customCss: ':root{--bk-print-margin-top:0mm;}' }, 'sachlich');
    const doc = buildStandaloneDoc('<x>', css);
    const base = doc.indexOf('--bk-print-margin-top:10mm');
    const custom = doc.indexOf('--bk-print-margin-top:0mm');
    const wrapper = doc.indexOf('@page:first');
    expect(base).toBeGreaterThan(-1);
    expect(custom).toBeGreaterThan(base);
    expect(wrapper).toBeGreaterThan(custom);
  });

  it('buildChromiumDoc is the standalone document plus a CSP that forbids scripts', () => {
    const doc = buildChromiumDoc('<x>', '.a{color:red}');
    expect(doc).toContain(`http-equiv="Content-Security-Policy" content="${PRINT_CSP}"`);
    expect(doc.indexOf('Content-Security-Policy')).toBeLessThan(doc.indexOf('<style>'));
    expect(PRINT_CSP).toContain("default-src 'none'");
    expect(PRINT_CSP).not.toContain('script-src');
    expect(doc.replace(/<meta http-equiv[^>]*>/, '')).toBe(buildStandaloneDoc('<x>', '.a{color:red}'));
  });
});
