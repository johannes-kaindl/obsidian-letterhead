// Minimal Obsidian stub for vitest resolution. Per-test vi.mock overrides win.
export class Plugin {}
export class Modal {}
export class PluginSettingTab {}
export class Notice { constructor(_msg?: string) {} }
export const Platform = { isDesktopApp: true };
export class Component {}
export const MarkdownRenderer = { render: async () => {} };
export function normalizePath(p: string) { return p; }
export function getLanguage() { return 'en'; }
