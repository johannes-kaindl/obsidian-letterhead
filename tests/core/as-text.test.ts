import { describe, it, expect } from 'vitest';
import { asText } from '../../src/core/frontmatter';

/* asText() replaced the bare String(v) calls that @typescript-eslint/no-base-to-string
   flagged in 1.4.1. The rule was pointing at a real defect, not at style: YAML
   frontmatter may legally hold a map, and String({}) writes the literal
   "[object Object]" into a printed business letter.

   The contract is deliberately conservative — every previously-working input keeps
   its exact old rendering, and ONLY the object case changes (to an empty string). */
describe('asText', () => {
  it('passes strings through untouched', () => {
    expect(asText('Sehr geehrte Damen und Herren')).toBe('Sehr geehrte Damen und Herren');
  });

  it('renders numbers and booleans as before', () => {
    expect(asText(42)).toBe('42');
    expect(asText(0)).toBe('0');
    expect(asText(false)).toBe('false');
  });

  it('maps null and undefined to an empty string', () => {
    expect(asText(null)).toBe('');
    expect(asText(undefined)).toBe('');
  });

  it('joins arrays exactly like String(array) did', () => {
    expect(asText(['a', 'b'])).toBe(String(['a', 'b']));
    expect(asText([1, 2])).toBe('1,2');
  });

  it('never leaks "[object Object]" into a letter', () => {
    expect(asText({ a: 1 })).toBe('');
    expect(asText({})).toBe('');
    expect(asText([{ a: 1 }, 'b'])).toBe(',b');
  });

  it('keeps Date rendering unchanged (callers format dates themselves)', () => {
    const d = new Date('2026-07-20T12:00:00Z');
    expect(asText(d)).toBe(String(d));
  });
});
