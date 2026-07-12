// src/pure/pdf/options.ts
export type FontChoice = 'sans' | 'serif' | 'mono';

export interface Margins { top: number; right: number; bottom: number; left: number; }

export interface RunningHF {
  position: 'header' | 'footer';
  left?: string;
  center?: string;
  right?: string;
}

export interface PaginationOptions {
  keepTablesTogether: boolean;
  repeatTableHeader: boolean;
  keepImagesTogether: boolean;
  keepCodeTogether: boolean;
  headingKeepWithLines: number; // 0 = off
}

export interface LayoutOptions {
  page: { size: 'A4' | 'Letter'; marginMm: Margins; startY?: number; followTopMm?: number };
  fonts: { body: FontChoice; baseSizePt: number; lineHeight: number; headingScale: number };
  colors: { text: string; muted: string; rule: string; codeBg: string; tableBorder: string };
  frame: { title: string | null; pageNumbers: boolean; runningHeaderFooter: RunningHF | null };
  image: { maxWidthPct: number };
  pagination: PaginationOptions;
}

export const DEFAULT_OPTIONS: LayoutOptions = {
  page: { size: 'A4', marginMm: { top: 20, right: 20, bottom: 20, left: 20 } },
  fonts: { body: 'sans', baseSizePt: 10.5, lineHeight: 1.45, headingScale: 1 },
  colors: { text: '#1a1a1a', muted: '#666666', rule: '#cccccc', codeBg: '#f4f4f4', tableBorder: '#cccccc' },
  frame: { title: null, pageNumbers: true, runningHeaderFooter: null },
  image: { maxWidthPct: 100 },
  pagination: { keepTablesTogether: true, repeatTableHeader: true, keepImagesTogether: true, keepCodeTogether: true, headingKeepWithLines: 2 },
};

// Map a font family choice to the four Core-14 font keys plus the mono key.
export function fontSet(choice: FontChoice): { body: string; bold: string; italic: string; boldItalic: string; mono: string } {
  if (choice === 'serif') return { body: 'times', bold: 'timesB', italic: 'timesI', boldItalic: 'timesBI', mono: 'cour' };
  if (choice === 'mono') return { body: 'cour', bold: 'courB', italic: 'courI', boldItalic: 'courBI', mono: 'cour' };
  return { body: 'helv', bold: 'helvB', italic: 'helvI', boldItalic: 'helvBI', mono: 'cour' };
}
