// "Reset preset" (Funktions-Inventur 2026-10-07): erst Rückfrage, dann Schnappschuss, dann Ersetzen.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notices: string[] = [];
const confirm = vi.hoisted(() => vi.fn());
vi.mock('obsidian', () => ({
  PluginSettingTab: class { constructor(public app: unknown, public plugin: unknown) {} },
  Setting: class {}, Plugin: class {}, App: class {}, AbstractInputSuggest: class {}, Modal: class {}, Component: class {}, MarkdownRenderer: {}, Platform: {}, normalizePath: (x: string) => x, getLanguage: () => 'en',
  Notice: class { constructor(m: string) { notices.push(m); } },
}));
vi.mock('../../src/vendor/kit-obsidian/confirm', () => ({ confirmAction: confirm }));

import { LetterheadSettingTab } from '../../src/obsidian/settings';
import { DEFAULT_SETTINGS } from '../../src/core/model';
import { PRESET_CSS } from '../../src/obsidian/html-engine';

function setup(writeImpl: () => Promise<void>) {
  const write = vi.fn(writeImpl);
  const save = vi.fn(async () => {});
  const settings = { ...DEFAULT_SETTINGS, customCss: 'body{color:red}' };
  const tab = new LetterheadSettingTab({ vault: { adapter: { write } } } as never,
    { manifest: { dir: '.obsidian/plugins/letterhead' }, settings, saveSettings: save, insertFrontmatterTemplate: () => {} } as never);
  (tab as unknown as { refreshUi: () => void }).refreshUi = () => {};
  const row = tab.getSettingDefinitions().flatMap((d) => (d as { items?: unknown[] }).items ?? [])
    .find((i) => (i as { name?: string }).name === 'Custom CSS (optional)') as { render: (s: unknown) => void };
  let click: () => Promise<void> = async () => {};
  const b: Record<string, unknown> = {};
  b.setButtonText = () => b; b.onClick = (f: () => Promise<void>) => { click = f; return b; };
  row.render({ addButton: (cb: (x: unknown) => void) => cb(b) });
  return { settings, write, save, click: () => click() };
}

describe('Reset preset', () => {
  beforeEach(() => { notices.length = 0; confirm.mockReset(); });

  it('ändert bei Abbruch nichts und schreibt keine Sicherung', async () => {
    confirm.mockResolvedValue(false);
    const t = setup(async () => {});
    await t.click();
    expect(t.settings.customCss).toBe('body{color:red}');
    expect(t.write).not.toHaveBeenCalled();
    expect(t.save).not.toHaveBeenCalled();
  });

  it('sichert das bisherige CSS und ersetzt es dann durch das Preset', async () => {
    confirm.mockResolvedValue(true);
    const t = setup(async () => {});
    await t.click();
    expect(t.write).toHaveBeenCalledWith('.obsidian/plugins/letterhead/custom-css-backup.css', 'body{color:red}');
    expect(t.settings.customCss).toBe(PRESET_CSS);
    expect(t.save).toHaveBeenCalledTimes(1);
  });

  it('lässt das CSS stehen, wenn die Sicherung scheitert', async () => {
    confirm.mockResolvedValue(true);
    const t = setup(async () => { throw new Error('disk'); });
    await t.click();
    expect(t.settings.customCss).toBe('body{color:red}');
    expect(t.save).not.toHaveBeenCalled();
    expect(notices.some((n) => n.includes('could not save a backup'))).toBe(true);
  });

  it('fragt nicht, wenn das Preset schon steht', async () => {
    const t = setup(async () => {});
    t.settings.customCss = PRESET_CSS;
    await t.click();
    expect(confirm).not.toHaveBeenCalled();
  });
});
