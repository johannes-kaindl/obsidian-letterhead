// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { domToIrSync } from '../../src/core/dom-to-ir';
import { codePlaceholder } from '../../src/core/code-blocks';
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

  it('turns a placeholder paragraph back into its extracted code block', () => {
    const { blocks } = domToIrSync(dom(`<p>${codePlaceholder(0)}</p>`), {
      codes: [{ lang: 'json', text: '{"a":1}' }],
    });
    expect(blocks).toEqual([{ type: 'code', lang: 'json', text: '{"a":1}' }]);
  });

  it('resolves placeholders by index, not by order of appearance', () => {
    const { blocks } = domToIrSync(dom(`<p>${codePlaceholder(1)}</p><p>${codePlaceholder(0)}</p>`), {
      codes: [{ lang: 'js', text: 'first' }, { lang: 'py', text: 'second' }],
    });
    expect(blocks).toEqual([
      { type: 'code', lang: 'py', text: 'second' },
      { type: 'code', lang: 'js', text: 'first' },
    ]);
  });

  it('leaves a placeholder-looking paragraph alone when no such code exists', () => {
    const { blocks } = domToIrSync(dom(`<p>${codePlaceholder(7)}</p>`), { codes: [] });
    expect(blocks[0].type).toBe('paragraph');
  });

  it('still renders a real <pre> when no plugin hijacked it', () => {
    const { blocks } = domToIrSync(dom('<pre><code class="language-js">let a=1;</code></pre>'));
    expect(blocks).toEqual([{ type: 'code', lang: 'js', text: 'let a=1;' }]);
  });
});
