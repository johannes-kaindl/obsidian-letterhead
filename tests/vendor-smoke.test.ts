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

  // Ein nacktes SVG traegt keinen Textknoten; die Engine setzt an seine Stelle einen
  // sichtbaren Platzhalter, statt es spurlos fallen zu lassen. Seit Kit 0.30.0 ist dessen
  // TEXT durchgereicht statt deutsch festgeschrieben — letterhead speist ihn aus
  // LETTER_LABELS, folgt also der Brief- und nicht der Oberflaechensprache.
  const svgDiv = () => {
    const div = document.createElement('div');
    div.innerHTML = '<p><svg width="10" height="10"><rect width="10" height="10"/></svg></p>';
    return div;
  };

  it('uses the German placeholder by default (kit fallback)', () => {
    const { blocks, unsupportedCount } = domToIrSync(svgDiv(), {});
    expect(blocks).toEqual([{ type: 'paragraph', inlines: [{ text: '[Grafik]' }] }]);
    // Der Zaehler ist die zweite Haelfte der Zusage: ein Platzhalter ohne Zaehlung
    // liesse die Sammel-Notice schweigen, waehrend im PDF etwas fehlt.
    expect(unsupportedCount).toBe(1);
  });

  it('honours the placeholder texts handed in by the caller', () => {
    const { blocks } = domToIrSync(svgDiv(), {
      placeholders: { math: '[Formula]', graphic: '[Graphic]' },
    });
    expect(blocks).toEqual([{ type: 'paragraph', inlines: [{ text: '[Graphic]' }] }]);
  });

  // Die Rekursion ist die Stelle, an der ein durchgereichtes Options-Objekt still unter den
  // Tisch fallen kann: bei einem Blockquote ruft sich domToIrSync selbst auf. Faellt `opts`
  // dort weg, greift wieder der deutsche Default — und zwar NUR in Zitaten, also an einer
  // Stelle, die kein Grundfall-Test beruehrt.
  it('keeps the placeholder texts inside a blockquote', () => {
    const div = document.createElement('div');
    div.innerHTML = '<blockquote><p><svg width="10" height="10"><rect width="10" height="10"/></svg></p></blockquote>';
    const { blocks } = domToIrSync(div, { placeholders: { graphic: '[Graphic]' } });
    expect(blocks).toEqual([
      { type: 'blockquote', blocks: [{ type: 'paragraph', inlines: [{ text: '[Graphic]' }] }] },
    ]);
  });
});
