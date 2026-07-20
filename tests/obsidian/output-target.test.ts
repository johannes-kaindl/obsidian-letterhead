import { describe, it, expect } from 'vitest';
import { resolveOutputPath, shouldShareAfterSave, uniquePath } from '../../src/obsidian/output';

/* Output target, spec A2. The decision logic is pure and fully covered here;
   only the actual I/O in writePdf stays untested. */

const CTX = {
  noteDir: 'Briefe/2026',
  baseName: '2026-06-09 Mustermann GmbH',
  customFolder: 'Export/PDF',
  attachmentPath: 'Anhänge/2026-06-09 Mustermann GmbH.pdf',
};

describe('resolveOutputPath', () => {
  it('writes next to the note by default', () => {
    expect(resolveOutputPath('nextToNote', CTX)).toBe('Briefe/2026/2026-06-09 Mustermann GmbH.pdf');
  });

  it('writes into a custom folder', () => {
    expect(resolveOutputPath('customFolder', CTX)).toBe('Export/PDF/2026-06-09 Mustermann GmbH.pdf');
  });

  it('passes the resolved attachment path through verbatim', () => {
    // Obsidian has already resolved collisions here — we must not second-guess it
    expect(resolveOutputPath('attachmentFolder', CTX)).toBe(CTX.attachmentPath);
  });

  it('has no persistent path in share mode', () => {
    expect(resolveOutputPath('share', CTX)).toBeNull();
  });

  it('handles a note in the vault root without a leading slash', () => {
    expect(resolveOutputPath('nextToNote', { ...CTX, noteDir: '' })).toBe('2026-06-09 Mustermann GmbH.pdf');
  });

  it('tolerates a custom folder with a trailing slash', () => {
    expect(resolveOutputPath('customFolder', { ...CTX, customFolder: 'Export/PDF/' }))
      .toBe('Export/PDF/2026-06-09 Mustermann GmbH.pdf');
  });

  it('falls back to the vault root when customFolder is empty', () => {
    expect(resolveOutputPath('customFolder', { ...CTX, customFolder: '' }))
      .toBe('2026-06-09 Mustermann GmbH.pdf');
  });
});

describe('shouldShareAfterSave', () => {
  it('offers the share sheet on mobile after saving', () => {
    expect(shouldShareAfterSave('nextToNote', true)).toBe(true);
    expect(shouldShareAfterSave('customFolder', true)).toBe(true);
    expect(shouldShareAfterSave('attachmentFolder', true)).toBe(true);
  });

  it('does not on desktop — the file is simply there', () => {
    expect(shouldShareAfterSave('nextToNote', false)).toBe(false);
  });

  it('never double-shares in share mode, which shares anyway', () => {
    expect(shouldShareAfterSave('share', true)).toBe(false);
    expect(shouldShareAfterSave('share', false)).toBe(false);
  });
});

describe('uniquePath', () => {
  const existing = (...paths: string[]) => (p: string) => Promise.resolve(paths.includes(p));

  it('keeps the path when nothing is in the way', async () => {
    expect(await uniquePath('Briefe/Brief.pdf', existing())).toBe('Briefe/Brief.pdf');
  });

  /* A letter PDF must never be overwritten silently — that is data loss.
     paperize overwrites; letterhead follows Obsidian's " (2)" convention. */
  it('appends " (2)" rather than overwriting', async () => {
    expect(await uniquePath('Briefe/Brief.pdf', existing('Briefe/Brief.pdf')))
      .toBe('Briefe/Brief (2).pdf');
  });

  it('counts up past several collisions', async () => {
    const taken = existing('B/x.pdf', 'B/x (2).pdf', 'B/x (3).pdf');
    expect(await uniquePath('B/x.pdf', taken)).toBe('B/x (4).pdf');
  });

  it('keeps a dotted basename intact', async () => {
    expect(await uniquePath('B/9.6.2026 Muster.pdf', existing('B/9.6.2026 Muster.pdf')))
      .toBe('B/9.6.2026 Muster (2).pdf');
  });

  it('gives up rather than looping forever', async () => {
    const alwaysTaken = () => Promise.resolve(true);
    await expect(uniquePath('B/x.pdf', alwaysTaken)).resolves.toMatch(/^B\/x \(\d+\)\.pdf$/);
  });
});
