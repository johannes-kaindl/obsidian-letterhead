import { describe, it, expect } from 'vitest';
import { buildCss, buildStandaloneDoc } from '../../src/obsidian/html-engine';
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
});
