// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { domToIrSync } from '../../src/core/dom-to-ir';
function dom(html: string): HTMLElement { const d = document.createElement('div'); d.innerHTML = html; return d; }

describe('domToIrSync (letterhead body)', () => {
  it('maps a bold/italic paragraph', () => {
    const { blocks } = domToIrSync(dom('<p>a <strong>b</strong> <em>c</em></p>'));
    const p = blocks[0] as any;
    expect(p.type).toBe('paragraph');
    expect(p.inlines.some((r: any) => r.bold)).toBe(true);
    expect(p.inlines.some((r: any) => r.italic)).toBe(true);
  });
  it('maps a table', () => {
    const { blocks } = domToIrSync(dom('<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>c</td></tr></tbody></table>'));
    expect(blocks[0].type).toBe('table');
  });
  it('collects image placeholders + refs', () => {
    const { blocks, imageEls } = domToIrSync(dom('<p><img src="x.png" alt="A"></p>'));
    expect(blocks.some((b) => b.type === 'image')).toBe(true);
    expect(imageEls.length).toBe(1);
  });
});
