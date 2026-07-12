import { describe, it, expect } from 'vitest';
import { t, detectUiLang, UI_STRINGS } from '../../src/i18n/strings';

describe('i18n strings', () => {
  it('t() returns a non-empty string for a known key', () => {
    const result = t('cmd_export');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('t() returns the key itself for an unknown key (main.js:367-371 behavior)', () => {
    expect(t('this_key_does_not_exist')).toBe('this_key_does_not_exist');
  });

  it('detectUiLang() returns "de" or "en"', () => {
    expect(['de', 'en']).toContain(detectUiLang());
  });

  it('UI_STRINGS has both en and de tables with matching key sets', () => {
    const enKeys = Object.keys(UI_STRINGS.en).sort();
    const deKeys = Object.keys(UI_STRINGS.de).sort();
    expect(deKeys).toEqual(enKeys);
  });

  it('every en string value is non-empty', () => {
    for (const v of Object.values(UI_STRINGS.en)) {
      expect(typeof v).toBe('string');
      expect((v as string).length).toBeGreaterThan(0);
    }
  });
});
