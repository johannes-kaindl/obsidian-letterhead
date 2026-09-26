// Hilfe-Zeile (UI-STANDARD §8): erstes Element der Settings-Definitionen, beide URLs dieses Repos.
import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
  PluginSettingTab: class { constructor(public app: unknown, public plugin: unknown) {} },
  Setting: class {}, Plugin: class {}, App: class {}, AbstractInputSuggest: class {}, Notice: class {}, Modal: class {}, Component: class {}, MarkdownRenderer: {}, Platform: {}, normalizePath: (x: string) => x, getLanguage: () => 'en',
}));

import { LetterheadSettingTab } from '../../src/obsidian/settings';
import { DEFAULT_SETTINGS } from '../../src/core/model';
import { UI_STRINGS } from '../../src/i18n/strings';

function fakeSetting() {
  const calls = { buttons: [] as { text: string; click: () => void }[], extra: [] as { icon: string; tip: string; click: () => void }[] };
  const setting: Record<string, unknown> = {};
  setting.setName = () => setting;
  setting.setDesc = () => setting;
  setting.addButton = (cb: (b: unknown) => void) => {
    const rec = { text: '', click: () => {} }; const b: Record<string, unknown> = {};
    b.setButtonText = (x: string) => { rec.text = x; return b; };
    b.onClick = (f: () => void) => { rec.click = f; return b; };
    cb(b); calls.buttons.push(rec); return setting;
  };
  setting.addExtraButton = (cb: (b: unknown) => void) => {
    const rec = { icon: '', tip: '', click: () => {} }; const b: Record<string, unknown> = {};
    b.setIcon = (x: string) => { rec.icon = x; return b; };
    b.setTooltip = (x: string) => { rec.tip = x; return b; };
    b.onClick = (f: () => void) => { rec.click = f; return b; };
    cb(b); calls.extra.push(rec); return setting;
  };
  return { setting, calls };
}

const tab = () => new LetterheadSettingTab({} as never, { settings: { ...DEFAULT_SETTINGS }, saveSettings: async () => {}, insertFrontmatterTemplate: () => {} } as never);

describe('Hilfe-Zeile in den Settings', () => {
  it('ist das ERSTE Element von getSettingDefinitions() — der Walker-Fallback zeichnet dieselbe Liste', () => {
    const defs = tab().getSettingDefinitions() as unknown as { name?: string; type?: string; render?: unknown }[];
    expect(defs[0]!.type).toBeUndefined();
    expect(defs[0]!.name).toBe('Help');
    expect(typeof defs[0]!.render).toBe('function');
    expect(defs.filter((d) => d.name === 'Help')).toHaveLength(1);
  });

  it('oeffnet Doku-Index und Issues dieses Repos', () => {
    const open = vi.fn();
    vi.stubGlobal('window', { open });
    const first = tab().getSettingDefinitions()[0] as unknown as { render: (s: unknown) => void };
    const { setting, calls } = fakeSetting();
    first.render(setting);
    expect(calls.buttons.map((b) => b.text)).toEqual(['Open documentation']);
    expect(calls.extra.map((b) => [b.icon, b.tip])).toEqual([['bug', 'Report an issue']]);
    calls.buttons[0]!.click(); calls.extra[0]!.click();
    expect(open.mock.calls.map((c) => c[0])).toEqual([
      'https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/README.md',
      'https://github.com/johannes-kaindl/obsidian-letterhead/issues',
    ]);
    vi.unstubAllGlobals();
  });

  it('hat deutsche Texte', () => {
    expect(UI_STRINGS.de.help_name).toBe('Hilfe');
    expect(UI_STRINGS.de.help_open_docs).toBe('Dokumentation öffnen');
  });
});
