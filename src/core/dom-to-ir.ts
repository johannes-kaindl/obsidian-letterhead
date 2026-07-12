// src/core/dom-to-ir.ts
import { Block, Inline, ListItem, Cell, Align } from '../vendor/kit/pdf';

const EMPTY = new Uint8Array(0);
const nameOf = (n: Node) => (n.nodeName || '').toUpperCase();
const isText = (n: Node) => n.nodeType === 3;
const isElem = (n: Node) => n.nodeType === 1;

// Inline runs (bold/italic/code/link) from an element's descendants.
function runsFrom(node: Node, ctx: { bold: boolean; italic: boolean; code: boolean; link?: string }, acc: Inline[]): Inline[] {
  for (const c of Array.from(node.childNodes || [])) {
    if (isText(c)) {
      const txt = c.textContent || '';
      if (txt) acc.push({ text: txt, bold: ctx.bold || undefined, italic: ctx.italic || undefined, code: ctx.code || undefined, link: ctx.link });
    } else if (isElem(c)) {
      const nm = nameOf(c);
      if (nm === 'BR') { acc.push({ text: '\n' }); continue; }
      if (nm === 'IMG') continue; // inline images are ignored inside text runs
      if (nm === 'UL' || nm === 'OL') continue; // nested lists are handled as separate child blocks
      const next = {
        bold: ctx.bold || nm === 'STRONG' || nm === 'B',
        italic: ctx.italic || nm === 'EM' || nm === 'I',
        code: ctx.code || nm === 'CODE',
        link: nm === 'A' ? ((c as HTMLAnchorElement).getAttribute('href') || ctx.link) : ctx.link,
      };
      runsFrom(c, next, acc);
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

function inlinesOf(el: Element): Inline[] {
  return mergeRuns(runsFrom(el, { bold: false, italic: false, code: false }, []));
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
  opts?: { pageBreakMarker?: string },
): { blocks: Block[]; imageEls: HTMLImageElement[]; unsupportedCount: number } {
  const blocks: Block[] = [];
  const imageEls: HTMLImageElement[] = [];
  let unsupportedCount = 0;
  const marker = opts?.pageBreakMarker;

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
      items.push({ inlines: inlinesOf(li), children: childBlocks.length ? childBlocks : undefined });
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
        return { inlines: inlinesOf(td), align: cellAlign(td) };
      });
    }
    for (const tr of Array.from(tbody.querySelectorAll('tr'))) {
      if (thead && tr.parentElement && tr.parentElement.nodeName.toUpperCase() === 'THEAD') continue;
      const cells = Array.from(tr.children).map((td) => {
        if (td.querySelector('img')) unsupportedCount++;
        return { inlines: inlinesOf(td), align: cellAlign(td) };
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
      const nm = nameOf(el);
      if (/^H[1-6]$/.test(nm)) blocks.push({ type: 'heading', level: Number(nm[1]) as 1, inlines: inlinesOf(el) });
      else if (nm === 'P') {
        if (marker && (el.textContent || '').trim() === marker) { blocks.push({ type: 'pagebreak' }); continue; }
        const inl = inlinesOf(el);
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
      else if (nm === 'DIV' || nm === 'SECTION' || nm === 'ARTICLE') walk(el);
      else { const t = (el.textContent || '').trim(); if (t) { blocks.push({ type: 'unsupported', text: t }); unsupportedCount++; } }
    }
  };

  walk(root);
  return { blocks, imageEls, unsupportedCount };
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
