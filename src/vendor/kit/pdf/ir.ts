// src/pure/pdf/ir.ts
// Platform-free intermediate representation — the kit contract.
export type Align = 'left' | 'center' | 'right';

export interface Inline {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: string;
}

export interface ListItem {
  inlines: Inline[];
  children?: Block[];
}

export interface Cell {
  inlines: Inline[];
  align?: Align;
}

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; inlines: Inline[] }
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'list'; ordered: boolean; items: ListItem[] }
  | { type: 'blockquote'; blocks: Block[] }
  | { type: 'code'; lang?: string; text: string }
  | { type: 'table'; header: Cell[]; rows: Cell[][] }
  | { type: 'image'; data: Uint8Array; wPx: number; hPx: number; alt?: string }
  | { type: 'hr' }
  | { type: 'metadata'; entries: { key: string; value: string }[] }
  | { type: 'unsupported'; text: string }
  | { type: 'pagebreak' };

export type Document = Block[];

// Flatten inline runs to plain text (for measuring / degradation).
export function inlineText(inlines: Inline[]): string {
  return (inlines || []).map((r) => r.text).join('');
}
