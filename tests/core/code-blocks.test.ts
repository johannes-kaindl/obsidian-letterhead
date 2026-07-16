import { describe, it, expect } from 'vitest';
import { extractCodeBlocks, codePlaceholder } from '../../src/core/code-blocks';

describe('extractCodeBlocks', () => {
  it('replaces a fenced block with a placeholder and returns its code', () => {
    const md = 'Vorher\n\n```json\n{"a":1}\n```\n\nNachher';

    const r = extractCodeBlocks(md);

    expect(r.codes).toEqual([{ lang: 'json', text: '{"a":1}' }]);
    expect(r.markdown).toBe(`Vorher\n\n${codePlaceholder(0)}\n\nNachher`);
  });

  it('handles tilde fences (~~~json is hijacked just like ```json)', () => {
    const r = extractCodeBlocks('~~~json\n{"a":1}\n~~~');

    expect(r.codes).toEqual([{ lang: 'json', text: '{"a":1}' }]);
    expect(r.markdown).toBe(codePlaceholder(0));
  });

  it('handles a fence without a language', () => {
    const r = extractCodeBlocks('```\nplain\n```');

    expect(r.codes).toEqual([{ text: 'plain' }]);
    expect(r.markdown).toBe(codePlaceholder(0));
  });

  it('extracts an indented fence inside a list item', () => {
    const r = extractCodeBlocks('- Punkt\n\n    ```json\n    {"a":1}\n    ```\n');

    expect(r.codes).toEqual([{ lang: 'json', text: '{"a":1}' }]);
    expect(r.markdown).toContain(codePlaceholder(0));
    expect(r.markdown).not.toContain('```');
  });

  it('keeps a longer fence intact when it contains a triple backtick', () => {
    const r = extractCodeBlocks('````md\nText mit ``` darin\n````');

    expect(r.codes).toEqual([{ lang: 'md', text: 'Text mit ``` darin' }]);
    expect(r.markdown).toBe(codePlaceholder(0));
  });

  it('numbers multiple blocks independently', () => {
    const r = extractCodeBlocks('```js\na\n```\n\nText\n\n```py\nb\n```');

    expect(r.codes).toEqual([{ lang: 'js', text: 'a' }, { lang: 'py', text: 'b' }]);
    expect(r.markdown).toBe(`${codePlaceholder(0)}\n\nText\n\n${codePlaceholder(1)}`);
  });

  it('leaves inline code untouched', () => {
    const md = 'Ein `inline` und noch `einer` im Satz.';

    const r = extractCodeBlocks(md);

    expect(r.codes).toEqual([]);
    expect(r.markdown).toBe(md);
  });

  it('leaves an unclosed fence alone rather than swallowing the rest', () => {
    const md = 'Text\n\n```json\nnie geschlossen';

    const r = extractCodeBlocks(md);

    expect(r.codes).toEqual([]);
    expect(r.markdown).toBe(md);
  });
});
