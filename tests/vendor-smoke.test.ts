// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { domToIrSync } from '../src/vendor/kit/pdf/dom-to-ir';
import { extractCodeBlocks, parseCodePlaceholder } from '../src/vendor/kit/pdf/code-blocks';

describe('vendored dom-to-ir + code-blocks', () => {
  it('extracts a fence and resolves it back to a code block', () => {
    const { markdown, codes } = extractCodeBlocks('```js\nx=1\n```', 'LETTERHEADCODE');
    const div = document.createElement('div');
    div.innerHTML = `<p>${markdown}</p>`;
    const { blocks } = domToIrSync(div, {
      codes,
      resolvePlaceholder: (t) => parseCodePlaceholder(t, 'LETTERHEADCODE'),
    });
    expect(blocks).toEqual([{ type: 'code', lang: 'js', text: 'x=1' }]);
  });

  // Grobe Nachbildung der Absatzbildung eines Markdown-Renderers: eine Leerzeile trennt Bloecke,
  // ein einfacher Zeilenumbruch bleibt Soft Break im selben Absatz. Genau daran haengt der Fall:
  // klebt der Fence an der Textzeile, muss extractCodeBlocks den Platzhalter in einen eigenen
  // Absatz polstern, sonst findet ihn resolvePlaceholder nicht mehr.
  const renderParagraphs = (md: string) =>
    md
      .split(/\n{2,}/)
      .filter((b) => b.trim())
      .map((b) => `<p>${b.split('\n').join('<br>')}</p>`)
      .join('');

  it('resolves a fence that hugs the preceding text', () => {
    const { markdown, codes } = extractCodeBlocks('Text:\n```js\nx=1\n```', 'LETTERHEADCODE');
    const div = document.createElement('div');
    div.innerHTML = renderParagraphs(markdown);
    const { blocks } = domToIrSync(div, {
      codes,
      resolvePlaceholder: (t) => parseCodePlaceholder(t, 'LETTERHEADCODE'),
    });
    expect(blocks).toEqual([
      { type: 'paragraph', inlines: [{ text: 'Text:' }] },
      { type: 'code', lang: 'js', text: 'x=1' },
    ]);
  });
});
