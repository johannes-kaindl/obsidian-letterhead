import { describe, it, expect } from 'vitest';
import { sanitizeBase, resolveOutputPath } from '../../src/obsidian/output';

describe('output helpers', () => {
  it('sanitizeBase replaces path separators and illegal chars', () => {
    expect(sanitizeBase('a/b')).toBe('a_b');
    expect(sanitizeBase('Re: A\\B*?')).toBe('Re_ A_B__');
  });

  it('sanitizeBase falls back to "Brief" for empty/blank input', () => {
    expect(sanitizeBase('')).toBe('Brief');
    expect(sanitizeBase('   ')).toBe('Brief');
  });

  it("resolveOutputPath('share', …) has no persistent path (transient scratch)", () => {
    expect(resolveOutputPath('share', { baseName: 'Brief' })).toBeNull();
  });

  it("resolveOutputPath('save', …) writes next to the note", () => {
    expect(resolveOutputPath('save', { baseName: 'Angebot', sourceDir: 'letters' }))
      .toBe('letters/Angebot.pdf');
    expect(resolveOutputPath('save', { baseName: 'Angebot' })).toBe('Angebot.pdf');
  });
});
