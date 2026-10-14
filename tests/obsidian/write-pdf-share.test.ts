// 'share'-Modus von writePdf läuft über den Kit-Baustein share-export (Welle 22):
// eigene Reste werden still ersetzt, Fremdes nur nach Rückfrage gelöscht.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notices: string[] = [];
const confirm = vi.hoisted(() => vi.fn());
vi.mock('obsidian', () => ({
  Notice: class { constructor(m: string) { notices.push(m); } },
  Modal: class {}, Plugin: class {}, getLanguage: () => 'en',
}));
vi.mock('../../src/vendor/kit-obsidian/confirm', () => ({ confirmAction: confirm }));

import { writePdf } from '../../src/obsidian/output';

function fakeApp(initial: Record<string, string>) {
  const files = new Map(Object.entries(initial));
  const adapter = {
    exists: async (p: string) => files.has(p) || [...files.keys()].some((k) => k.startsWith(p + '/')),
    mkdir: async () => {},
    list: async (dir: string) => ({ files: [...files.keys()].filter((k) => k.startsWith(dir + '/')), folders: [] as string[] }),
    remove: async (p: string) => { files.delete(p); },
    rmdir: async () => {},
    writeBinary: async (p: string) => { files.set(p, 'pdf'); },
  };
  return { files, app: { vault: { adapter } } as never };
}

describe("writePdf im Modus 'share'", () => {
  beforeEach(() => { notices.length = 0; confirm.mockReset(); });

  it('ersetzt eigene PDF-Reste ohne Rückfrage und schreibt die neue Datei', async () => {
    const { files, app } = fakeApp({ '.letterhead-export/Alt.pdf': 'old' });
    await writePdf(app, new Uint8Array([1]), 'share', { baseName: 'Brief', resolvedPath: null });
    expect(confirm).not.toHaveBeenCalled();
    expect([...files.keys()]).toEqual(['.letterhead-export/Brief.pdf']);
  });

  it('fragt vor dem Löschen fremder Dateien und lässt sie bei Nein liegen', async () => {
    confirm.mockResolvedValue(false);
    const { files, app } = fakeApp({ '.letterhead-export/notiz.txt': 'x' });
    await writePdf(app, new Uint8Array([1]), 'share', { baseName: 'Brief', resolvedPath: null });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(files.has('.letterhead-export/notiz.txt')).toBe(true);
    expect(files.has('.letterhead-export/Brief.pdf')).toBe(true);
  });

  it('löscht Fremdes nach Ja', async () => {
    confirm.mockResolvedValue(true);
    const { files, app } = fakeApp({ '.letterhead-export/notiz.txt': 'x' });
    await writePdf(app, new Uint8Array([1]), 'share', { baseName: 'Brief', resolvedPath: null });
    expect(files.has('.letterhead-export/notiz.txt')).toBe(false);
  });

  it('meldet einen Schreibfehler mit der eigenen Meldung', async () => {
    const { app } = fakeApp({});
    (app as unknown as { vault: { adapter: { writeBinary: () => Promise<void> } } }).vault.adapter.writeBinary = async () => { throw new Error('disk'); };
    await writePdf(app, new Uint8Array([1]), 'share', { baseName: 'Brief', resolvedPath: null });
    expect(notices).toContain('Letterhead: Could not hand the file to the system.');
  });
});
