// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { domToIrSync, resolveImages } from '../src/vendor/kit/pdf/dom-to-ir';
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

  // Kit 0.42.0: ein Bild in einem Listenpunkt zaehlte vorher nur den Verlustzaehler hoch und
  // verschwand — seit dem Bump landet es als eigener image-Block in den children des Listenpunkts.
  it('puts an image inside a list item into the IR as its own block', () => {
    const div = document.createElement('div');
    div.innerHTML = '<ul><li>Text<img src="x.png" alt="Logo"></li></ul>';
    const { blocks, imageEls } = domToIrSync(div, {});
    expect(blocks).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [
          {
            inlines: [{ text: 'Text' }],
            children: [{ type: 'image', data: new Uint8Array(0), wPx: 0, hPx: 0, alt: 'Logo' }],
          },
        ],
      },
    ]);
    expect(imageEls).toHaveLength(1);
  });

  // Kit 0.44.0: resolveImages nimmt die Fehl-Platzhalter jetzt als vierten Parameter, statt fest
  // den deutschen Text zu zeigen — letterhead speist sie aus model.labels (Briefsprache), hier
  // direkt gegen die Engine geprueft: ein Bild, das nicht dekodiert werden kann, zeigt bei
  // englischer Sprache den englischen Text.
  it('shows the English text for an image that fails to decode, when English placeholders are handed in', async () => {
    const div = document.createElement('div');
    div.innerHTML = '<p><img src="x.png"></p>';
    const { blocks, imageEls } = domToIrSync(div, {});
    const { blocks: resolved } = await resolveImages(blocks, imageEls, async () => null, {
      image: 'Image',
      imageFailed: '[Image could not be embedded]',
    });
    expect(resolved).toEqual([{ type: 'unsupported', text: '[Image could not be embedded]' }]);
  });
});
