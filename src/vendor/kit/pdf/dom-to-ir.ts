// vendored from obsidian-kit@0.22.0, src/pure/pdf/dom-to-ir.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
import { Block, Inline, ListItem, Cell, Align } from './ir';
import type { ExtractedCode } from './code-blocks';

const EMPTY = new Uint8Array(0);
const nameOf = (n: Node) => (n.nodeName || '').toUpperCase();
const isText = (n: Node) => n.nodeType === 3;
const isElem = (n: Node) => n.nodeType === 1;

const hasClass = (el: Element, c: string) => ` ${el.getAttribute('class') || ''} `.includes(` ${c} `);
const isMathEl = (el: Element) => {
  const nm = nameOf(el);
  return nm === 'MJX-CONTAINER' || nm === 'MATH' || hasClass(el, 'math');
};

// Chrome, not content: a callout's Lucide icon is decoration and reporting it as a lost
// graphic is noise where nothing is missing. Two markers carry across renderers — `aria-hidden`
// (the W3C way to say "purely decorative") and `icon` in the class name.
const isDecorative = (el: Element): boolean =>
  el.getAttribute('aria-hidden') === 'true' || /(^|[\s-])icon([\s-]|$)/.test(el.getAttribute('class') || '');

// Graphically rendered elements — MathJax, Mermaid, bare SVG — carry no text node at all.
// Checking only `textContent` let them vanish without a trace *and* without incrementing the
// counter, so the host's summary notice stayed silent too. Silent loss is worse than visible
// simplification: the PDF gave no hint that anything was missing. Returns the placeholder to
// show in the PDF, or null when the element is just an empty layout wrapper or decoration.
function graphicPlaceholder(el: Element): string | null {
  if ((el.textContent || '').trim()) return null;
  if (isDecorative(el)) return null;
  const nm = nameOf(el);
  const self = nm === 'SVG' || nm === 'CANVAS' || isMathEl(el);
  const inner = el.querySelector('svg, canvas, mjx-container, math');
  if (!self && !inner) return null;
  // A wrapper whose only graphic is a decorative icon is decorative itself.
  if (!self && inner && isDecorative(inner)) return null;
  return isMathEl(el) || el.querySelector('mjx-container, math') ? '[Formel]' : '[Grafik]';
}

// A rendered task list item keeps its state only in the checkbox element; without a marker
// `- [ ]` and `- [x]` become visually identical bullets in the PDF.
function taskMarker(li: Element): string | null {
  const box = li.querySelector('input[type="checkbox"]');
  if (!box) return null;
  const checked = (box as HTMLInputElement).checked || box.hasAttribute('checked')
    || hasClass(li, 'is-checked') || (li.getAttribute('data-task') || '').toLowerCase() === 'x';
  return checked ? '[x] ' : '[ ] ';
}

// Inline runs (bold/italic/code/link) from an element's descendants.
function runsFrom(node: Node, ctx: { bold: boolean; italic: boolean; code: boolean; link?: string }, acc: Inline[], stats?: { graphics: number }): Inline[] {
  for (const c of Array.from(node.childNodes || [])) {
    if (isText(c)) {
      const txt = c.textContent || '';
      if (txt) acc.push({ text: txt, bold: ctx.bold || undefined, italic: ctx.italic || undefined, code: ctx.code || undefined, link: ctx.link });
    } else if (isElem(c)) {
      const nm = nameOf(c);
      if (nm === 'BR') { acc.push({ text: '\n' }); continue; }
      if (nm === 'IMG') continue; // inline images are ignored inside text runs
      if (nm === 'UL' || nm === 'OL') continue; // nested lists are handled as separate child blocks
      if (nm === 'INPUT') continue; // the task checkbox is surfaced via taskMarker, not as a run
      const ph = graphicPlaceholder(c as Element);
      if (ph) { acc.push({ text: ph }); if (stats) stats.graphics++; continue; }
      const next = {
        bold: ctx.bold || nm === 'STRONG' || nm === 'B',
        italic: ctx.italic || nm === 'EM' || nm === 'I',
        code: ctx.code || nm === 'CODE',
        link: nm === 'A' ? ((c as HTMLAnchorElement).getAttribute('href') || ctx.link) : ctx.link,
      };
      runsFrom(c, next, acc, stats);
    }
  }
  return acc;
}

function mergeRuns(runs: Inline[]): Inline[] {
  const out: Inline[] = [];
  for (const r of runs) {
    const last = out[out.length - 1];
    if (r.text === '\n') { out.push(r); continue; }
    if (last && last.text !== '\n' && !!last.bold === !!r.bold && !!last.italic === !!r.italic && !!last.code === !!r.code && last.link === r.link) last.text += r.text;
    else out.push({ ...r });
  }
  return out.filter((r) => r.text !== '');
}

function inlinesOf(el: Element, stats?: { graphics: number }): Inline[] {
  return mergeRuns(runsFrom(el, { bold: false, italic: false, code: false }, [], stats));
}

function cellAlign(td: Element): Align | undefined {
  const s = (td.getAttribute('style') || '').toLowerCase();
  if (s.includes('center')) return 'center';
  if (s.includes('right')) return 'right';
  const a = (td.getAttribute('align') || '').toLowerCase();
  if (a === 'center' || a === 'right' || a === 'left') return a;
  return undefined;
}

export function domToIrSync(
  root: HTMLElement,
  opts?: { pageBreakMarker?: string; codes?: ExtractedCode[]; resolvePlaceholder?: (text: string) => number | null },
): { blocks: Block[]; imageEls: HTMLImageElement[]; unsupportedCount: number } {
  const blocks: Block[] = [];
  const imageEls: HTMLImageElement[] = [];
  let unsupportedCount = 0;
  // Inline graphics (a formula inside a paragraph) are counted while collecting runs and
  // folded into unsupportedCount at the end.
  const gstats = { graphics: 0 };
  const marker = opts?.pageBreakMarker;
  const codes = opts?.codes;
  const resolvePlaceholder = opts?.resolvePlaceholder;

  // A placeholder paragraph stands for a fenced block that was pulled out of the Markdown
  // before rendering (see extractCodeBlocks) — Obsidian post-processors from other plugins
  // never saw it, so the original code is still intact here.
  const codeFor = (txt: string): ExtractedCode | null => {
    if (!codes || !codes.length || !resolvePlaceholder) return null;
    const i = resolvePlaceholder(txt);
    return i === null ? null : (codes[i] ?? null);
  };

  const parseList = (listEl: Element): ListItem[] => {
    const items: ListItem[] = [];
    for (const li of Array.from(listEl.children)) {
      if (nameOf(li) !== 'LI') continue;
      // Split the LI's own inline text from nested lists.
      const childBlocks: Block[] = [];
      for (const sub of Array.from(li.children)) {
        const nm = nameOf(sub);
        if (nm === 'UL' || nm === 'OL') childBlocks.push({ type: 'list', ordered: nm === 'OL', items: parseList(sub) });
      }
      if (li.querySelector('img')) unsupportedCount++;
      const inl = inlinesOf(li, gstats);
      const mark = taskMarker(li);
      if (mark) {
        if (inl[0]) inl[0].text = inl[0].text.replace(/^\s+/, '');
        inl.unshift({ text: mark });
      }
      items.push({ inlines: inl, children: childBlocks.length ? childBlocks : undefined });
    }
    return items;
  };

  const parseTable = (tableEl: Element): Block => {
    let header: Cell[] = [];
    const rows: Cell[][] = [];
    const thead = tableEl.querySelector('thead');
    const tbody = tableEl.querySelector('tbody') || tableEl;
    if (thead) {
      const tr = thead.querySelector('tr');
      if (tr) header = Array.from(tr.children).map((td) => {
        if (td.querySelector('img')) unsupportedCount++;
        return { inlines: inlinesOf(td, gstats), align: cellAlign(td) };
      });
    }
    for (const tr of Array.from(tbody.querySelectorAll('tr'))) {
      if (thead && tr.parentElement && tr.parentElement.nodeName.toUpperCase() === 'THEAD') continue;
      const cells = Array.from(tr.children).map((td) => {
        if (td.querySelector('img')) unsupportedCount++;
        return { inlines: inlinesOf(td, gstats), align: cellAlign(td) };
      });
      if (cells.length) rows.push(cells);
    }
    return { type: 'table', header, rows };
  };

  const walk = (node: Node) => {
    for (const c of Array.from(node.childNodes || [])) {
      if (isText(c)) { const t = (c.textContent || '').trim(); if (t) blocks.push({ type: 'paragraph', inlines: [{ text: t }] }); continue; }
      if (!isElem(c)) continue;
      const el = c as Element;
      // Skip decorative chrome wholesale rather than descending into it. Obsidian's export
      // path renders a callout icon as a bare `<svg width="16" height="16">` with no class
      // and no aria-hidden — only its *container* is recognisable, so checking the element
      // alone let the naked SVG through one level down. The text guard keeps an element that
      // merely happens to be called "icon-legend" from swallowing its own content.
      if (isDecorative(el) && !(el.textContent || '').trim()) continue;
      const nm = nameOf(el);
      if (/^H[1-6]$/.test(nm)) blocks.push({ type: 'heading', level: Number(nm[1]) as 1, inlines: inlinesOf(el, gstats) });
      else if (nm === 'P') {
        const txt = (el.textContent || '').trim();
        if (marker && txt === marker) { blocks.push({ type: 'pagebreak' }); continue; }
        const code = codeFor(txt);
        if (code) { blocks.push({ type: 'code', lang: code.lang, text: code.text }); continue; }
        const inl = inlinesOf(el, gstats);
        if (inl.length) blocks.push({ type: 'paragraph', inlines: inl });
        for (const img of Array.from(el.querySelectorAll('img'))) {
          blocks.push({ type: 'image', data: EMPTY, wPx: 0, hPx: 0, alt: img.getAttribute('alt') || undefined });
          imageEls.push(img);
        }
      }
      else if (nm === 'UL' || nm === 'OL') blocks.push({ type: 'list', ordered: nm === 'OL', items: parseList(el) });
      else if (nm === 'BLOCKQUOTE') { const inner: Block[] = []; const sub = domToIrSync(el as HTMLElement, opts); inner.push(...sub.blocks); imageEls.push(...sub.imageEls); unsupportedCount += sub.unsupportedCount; blocks.push({ type: 'blockquote', blocks: inner }); }
      else if (nm === 'PRE') { const code = el.querySelector('code'); const langCls = code ? (code.getAttribute('class') || '') : ''; const lm = /language-(\S+)/.exec(langCls); blocks.push({ type: 'code', lang: lm ? lm[1] : undefined, text: (el.textContent || '') }); }
      else if (nm === 'TABLE') blocks.push(parseTable(el));
      else if (nm === 'IMG') { blocks.push({ type: 'image', data: EMPTY, wPx: 0, hPx: 0, alt: (el as HTMLImageElement).getAttribute('alt') || undefined }); imageEls.push(el as HTMLImageElement); }
      else if (nm === 'HR') blocks.push({ type: 'hr' });
      else if (nm === 'DIV' || nm === 'SECTION' || nm === 'ARTICLE') {
        const ph = graphicPlaceholder(el);
        if (ph) { blocks.push({ type: 'unsupported', text: ph }); unsupportedCount++; }
        else walk(el);
      }
      else {
        const t = (el.textContent || '').trim();
        if (t) { blocks.push({ type: 'unsupported', text: t }); unsupportedCount++; continue; }
        const ph = graphicPlaceholder(el);
        if (ph) { blocks.push({ type: 'unsupported', text: ph }); unsupportedCount++; }
      }
    }
  };

  walk(root);
  return { blocks, imageEls, unsupportedCount: unsupportedCount + gstats.graphics };
}

export async function resolveImages(
  blocks: Block[],
  imageEls: HTMLImageElement[],
  decode: (src: string) => Promise<{ data: Uint8Array; wPx: number; hPx: number } | null>,
): Promise<{ blocks: Block[]; unsupportedAdded: number }> {
  let unsupportedAdded = 0;
  let imgIdx = 0;
  const mapBlock = async (b: Block): Promise<Block> => {
    if (b.type === 'image') {
      const el = imageEls[imgIdx++];
      const src = el ? (el.getAttribute('src') || el.src || '') : '';
      const dec = src ? await decode(src) : null;
      if (!dec) { unsupportedAdded++; return { type: 'unsupported', text: b.alt ? `[Bild: ${b.alt}]` : '[Bild konnte nicht eingebettet werden]' }; }
      return { type: 'image', data: dec.data, wPx: dec.wPx, hPx: dec.hPx, alt: b.alt };
    }
    if (b.type === 'blockquote') return { type: 'blockquote', blocks: await Promise.all(b.blocks.map(mapBlock)) };
    return b;
  };
  const out = await Promise.all(blocks.map(mapBlock));
  return { blocks: out, unsupportedAdded };
}
