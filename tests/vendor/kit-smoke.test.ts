import { describe, it, expect } from 'vitest';
import { renderPdf, DEFAULT_OPTIONS } from '../../src/vendor/kit/pdf';
describe('vendored kit engine', () => {
  it('renders a minimal PDF', () => {
    const bytes = renderPdf([{ type: 'paragraph', inlines: [{ text: 'hi' }] }], DEFAULT_OPTIONS);
    expect(bytes.length).toBeGreaterThan(100);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });
});
