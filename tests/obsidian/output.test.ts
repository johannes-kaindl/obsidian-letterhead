import { describe, it, expect } from 'vitest';
import { sanitizeBase } from '../../src/obsidian/output';

/* resolveOutputPath moved to output-target.test.ts when 1.5.0 replaced the
   two-mode 'save'/'share' split with the four OutputModes. */
describe('output helpers', () => {
  it('sanitizeBase replaces path separators and illegal chars', () => {
    expect(sanitizeBase('a/b')).toBe('a_b');
    expect(sanitizeBase('Re: A\\B*?')).toBe('Re_ A_B__');
  });

  it('sanitizeBase falls back to "Brief" for empty/blank input', () => {
    expect(sanitizeBase('')).toBe('Brief');
    expect(sanitizeBase('   ')).toBe('Brief');
  });

});
