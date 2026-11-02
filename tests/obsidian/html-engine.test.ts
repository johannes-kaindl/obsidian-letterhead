import { describe, it, expect } from 'vitest';
import { buildCss, buildStandaloneDoc, STANDALONE_WRAPPER_CSS } from '../../src/obsidian/html-engine';
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
});
