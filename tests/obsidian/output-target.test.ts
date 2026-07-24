import { describe, it, expect, vi } from 'vitest';
import { resolveOutputPath, shouldShareAfterSave, uniquePath, writePdf } from '../../src/obsidian/output';
import type { App } from 'obsidian';

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

describe('writePdf — mkdir on a vault-root target', () => {
  /* Regression: `target.slice(0, target.lastIndexOf('/'))` on a target with
     no '/' (vault root, e.g. outputFolder "/") used to compute lastIndexOf
     → -1 → slice(0, -1), which drops the file's last character instead of
     yielding an empty dir — creating a phantom "Name.pd" folder next to
     every export. Caught via a real-device report (2026-07-24). */
  it('does not create a directory when the resolved path has no slash', async () => {
    const mkdir = vi.fn(async () => {});
    const adapter = {
      exists: vi.fn(async () => false),
      mkdir,
      writeBinary: vi.fn(async () => {}),
    };
    const app = { vault: { adapter } } as unknown as App;

    await writePdf(app, new Uint8Array([1, 2, 3]), 'customFolder', {
      baseName: 'Muster GmbH',
      resolvedPath: 'Muster GmbH.pdf',
    });

    expect(mkdir).not.toHaveBeenCalled();
    expect(adapter.writeBinary).toHaveBeenCalledWith('Muster GmbH.pdf', expect.anything());
  });

  it('still creates the parent directory for a nested target', async () => {
    const mkdir = vi.fn(async () => {});
    const adapter = {
      exists: vi.fn(async (p: string) => p !== 'Export/PDF'),
      mkdir,
      writeBinary: vi.fn(async () => {}),
    };
    const app = { vault: { adapter } } as unknown as App;

    await writePdf(app, new Uint8Array([1, 2, 3]), 'customFolder', {
      baseName: 'Muster GmbH',
      resolvedPath: 'Export/PDF/Muster GmbH.pdf',
    });

    expect(mkdir).toHaveBeenCalledWith('Export/PDF');
  });
});
