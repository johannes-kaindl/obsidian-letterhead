import { describe, it, expect } from 'vitest';
import { buildFmIndex, getField, toLines, esc, normStil, ALIASES } from '../../src/core/frontmatter';

describe('frontmatter', () => {
  it('resolves a field via German-first aliases', () => {
    const idx = buildFmIndex({ 'Empfänger': 'Max' });
    expect(getField(idx, ALIASES.recipient)).toBe('Max');
  });
  it('subject comes from betreff, subject or re, never from the vault axis "thema"', () => {
    expect(getField(buildFmIndex({ thema: '🏗️ Vault-Architektur' }), ALIASES.betreff)).toBeUndefined();
    expect(getField(buildFmIndex({ thema: 'X', betreff: 'Kündigung' }), ALIASES.betreff)).toBe('Kündigung');
    expect(getField(buildFmIndex({ Re: 'Ihr Schreiben' }), ALIASES.betreff)).toBe('Ihr Schreiben');
    expect(getField(buildFmIndex({ Subject: 'Hello' }), ALIASES.betreff)).toBe('Hello');
  });
  it('normalises keys (case/space/underscore insensitive)', () => {
    const idx = buildFmIndex({ 'Ihr Zeichen': 'AZ-1' });
    expect(getField(idx, ['ihrzeichen'])).toBe('AZ-1');
  });
  it('toLines splits multiline and arrays', () => {
    expect(toLines('a\nb')).toEqual(['a', 'b']);
    expect(toLines(['a', 'b'])).toEqual(['a', 'b']);
  });
  it('esc escapes HTML', () => { expect(esc('<b>&')).toBe('&lt;b&gt;&amp;'); });
  it('normStil maps aliases to canonical style keys', () => {
    expect(['sachlich', 'klassisch', 'technisch']).toContain(normStil('klassisch'));
  });
});
