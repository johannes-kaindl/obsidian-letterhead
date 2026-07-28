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
});
