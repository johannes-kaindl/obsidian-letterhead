// Hilfe-Zeile der Settings (UI-STANDARD §8): Doku-Index und Issues dieses Repos, Texte aus i18n.
import { t } from '../i18n/strings';
import { githubHelpUrls, helpSettingDefinition } from '../vendor/kit-obsidian/help-setting';
import type { HelpSettingOptions } from '../vendor/kit-obsidian/help-setting';

/** GitHub-Repo-Name, nicht die Plugin-ID (`letterhead`). */
export const HELP_REPO = 'obsidian-letterhead';

export function helpOptions(open?: (url: string) => void): HelpSettingOptions {
  return {
    ...githubHelpUrls(HELP_REPO),
    texts: {
      name: t('help_name'),
      desc: t('help_desc'),
      openDocs: t('help_open_docs'),
      reportIssue: t('help_report_issue'),
    },
    open,
  };
}

/** Erstes Element von `getSettingDefinitions()`; der Walker-Fallback (< 1.13) zeichnet es mit. */
export function helpDefinition() {
  return helpSettingDefinition(helpOptions());
}
