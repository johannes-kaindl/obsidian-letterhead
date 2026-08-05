// vendored from obsidian-kit@0.22.0, src/pure/pdf/code-blocks.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
export interface ExtractedCode {
  lang?: string;
  text: string;
}

export function codePlaceholder(prefix: string, i: number): string {
  return `${prefix}${i}`;
}

/** Index of the placeholder this text is, or null. Counterpart to codePlaceholder(). */
export function parseCodePlaceholder(text: string, prefix: string): number | null {
  const re = new RegExp(`^${prefix}(\\d+)$`);
  const m = re.exec(text.trim());
  return m ? Number(m[1]) : null;
}

// Opening fence: optional indent, 3+ backticks or tildes, optional language.
const OPEN_RE = /^(\s*)(`{3,}|~{3,})(\S*)\s*$/;

export function extractCodeBlocks(md: string, prefix: string): { markdown: string; codes: ExtractedCode[] } {
  const lines = md.split('\n');
  const out: string[] = [];
  const codes: ExtractedCode[] = [];
  let i = 0;

  while (i < lines.length) {
    const open = OPEN_RE.exec(lines[i]);
    if (!open) { out.push(lines[i]); i++; continue; }

    const [, indent, fence, lang] = open;
    // Closing fence: same char, at least as long, nothing else on the line. This is what
    // keeps a ``` inside a ````-block from ending it early.
    const close = new RegExp(`^\\s*${fence[0]}{${fence.length},}\\s*$`);
    let j = i + 1;
    while (j < lines.length && !close.test(lines[j])) j++;

    // Unclosed fence: not a code block. Leave the line as-is so the renderer decides.
    if (j >= lines.length) { out.push(lines[i]); i++; continue; }

    const body = lines.slice(i + 1, j).map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l));
    codes.push({ lang: lang || undefined, text: body.join('\n') });
    out.push(indent + codePlaceholder(prefix, codes.length - 1));
    i = j + 1;
  }

  return { markdown: out.join('\n'), codes };
}
