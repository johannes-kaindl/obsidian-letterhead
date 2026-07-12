import { describe, it, expect, vi } from 'vitest';

// Override the obsidian mock so getLanguage() reports a German locale, to cover
// detectUiLang's primary path (main.js.reference:351-356). File-scoped mock.
vi.mock('obsidian', () => ({
  getLanguage: () => 'de-DE',
}));

describe('detectUiLang — obsidian.getLanguage primary path', () => {
  it('returns "de" when getLanguage() reports a German locale', async () => {
    const { detectUiLang } = await import('../../src/i18n/strings');
    expect(detectUiLang()).toBe('de');
  });

  it('t() resolves to the German table when the app locale is German', async () => {
    const { t } = await import('../../src/i18n/strings');
    expect(t('cmd_export')).toBe('Brief als PDF exportieren / drucken');
  });
});
