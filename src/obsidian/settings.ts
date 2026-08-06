/* ------------------------------------------------------------------ *
 *  Settings tab.
 *
 *  Declarative for Obsidian ≥ 1.13 (`getSettingDefinitions`), with the
 *  deprecated imperative `display()` kept as the < 1.13 fallback — it walks
 *  the SAME definitions via renderImperative(), so there is a single source
 *  of truth (pattern copied from ../markdown-presentation/src/settings.ts).
 *  minAppVersion stays 1.8.7: the fallback is load-bearing, not hypothetical.
 *
 *  Plain rows bind by key ↔ get/setControlValue; those two methods are
 *  OVERRIDDEN with an explicit switch, so the framework default is never
 *  relied upon. That is why the nested `sender` block is a non-issue: the
 *  control `key` (e.g. "sender.name") is a lookup token in our own code, not
 *  a storage path — whether the default resolves dotted paths is irrelevant.
 *  Rows that need bespoke UI (intro paragraphs, the frontmatter reference
 *  table, the insert/preset buttons, the CSS textarea) use `render`.
 *
 *  NOTE: a "Mobile export" dropdown used to sit under the DIN-form row,
 *  offering 'pdf' and the reference's 'print' (HTML/Quick-Look fallback).
 *  1.4.0 dropped the fallback in favour of the Degradation model, which left
 *  a dropdown with a single option that no code path reads. It stays gone;
 *  the settings KEY `mobileExport` is deliberately kept in DEFAULT_SETTINGS
 *  so stored configurations (including 'print') still load without migration.
 *
 *  This file lives in src/obsidian/, so importing 'obsidian' is allowed
 *  (check:pure only restricts src/core and src/vendor).
 * ------------------------------------------------------------------ */

import { App, Plugin, PluginSettingTab, Setting, type SettingDefinitionItem } from 'obsidian';
import { t } from '../i18n/strings';
import {
  DEFAULT_SETTINGS, STILE, LETTER_LABELS,
  type LetterheadSettings, type SenderSettings,
} from '../core/model';
import { PLACEHOLDERS, DEFAULT_FILENAME_TEMPLATE } from '../core/filename';
import { normStil, normSprache } from '../core/frontmatter';
import { PRESET_CSS } from './html-engine';
import { renderSettingDefinitions, settingBodyHost, refreshSettingsTab } from '../vendor/kit-obsidian/settings_walker';

/** Minimal shape the settings tab needs from the plugin instance. The
 *  full plugin class (LetterheadPlugin) is ported in Task D4; this local
 *  interface avoids a circular import between main.ts and settings.ts. */
export interface LetterheadSettingTabHost {
  settings: LetterheadSettings;
  saveSettings(): Promise<void>;
  insertFrontmatterTemplate(): void | Promise<void>;
}

export class LetterheadSettingTab extends PluginSettingTab {
  plugin: LetterheadSettingTabHost;

  constructor(app: App, plugin: LetterheadSettingTabHost) {
    // PluginSettingTab's constructor is typed against the real `Plugin`
    // class; `plugin` here is only the subset of the plugin the tab
    // needs (see LetterheadSettingTabHost), so we cast at the boundary.
    super(app, plugin as unknown as Plugin);
    this.plugin = plugin;
  }

  /** Single source of truth. Called fresh on every render/update, so the
   *  dynamic placeholders/descriptions (style-dependent font defaults, the
   *  language-dependent closing, the auto return address) are recomputed. */
  getSettingDefinitions(): SettingDefinitionItem[] {
    const s = this.plugin.settings;

    const stilTokens = (STILE[(normStil(s.stil) || 'sachlich') as keyof typeof STILE] || STILE.sachlich).tokens;
    const letterLabels = LETTER_LABELS[(normSprache(s.briefSprache) || 'de') as keyof typeof LETTER_LABELS] || LETTER_LABELS.de;
    const autoRuecksende = [s.sender.name, s.sender.strasse, s.sender.plzOrt].filter(Boolean).join(' · ');

    const senderFields: Array<[string, keyof SenderSettings, string]> = [
      [t('f_name'), 'name', 'Max Mustermann'],
      [t('f_company'), 'zusatz', 'Muster GmbH'],
      [t('f_street'), 'strasse', 'Musterstraße 1'],
      [t('f_city'), 'plzOrt', '12345 Musterstadt'],
      [t('f_phone'), 'telefon', '+49 30 1234567'],
      [t('f_email'), 'email', 'kontakt@example.com'],
      [t('f_web'), 'web', 'www.example.com'],
    ];

    return [
      {
        type: 'group',
        items: [
          { name: t('set_layout'), desc: t('set_layout_desc'),
            control: { type: 'dropdown', key: 'theme', options: { din5008: t('opt_layout_din'), modern: t('opt_layout_modern') } } },
          { name: t('set_style'), desc: t('set_style_desc'),
            control: { type: 'dropdown', key: 'stil', options: { sachlich: t('opt_style_a'), klassisch: t('opt_style_b'), technisch: t('opt_style_c') } } },
          { name: t('set_infoline'), desc: t('set_infoline_desc'),
            control: { type: 'dropdown', key: 'infozeile', options: { vollstaendig: t('opt_info_full'), nurdatum: t('opt_info_date') } } },
          { name: t('set_dinform'), desc: t('set_dinform_desc'),
            control: { type: 'dropdown', key: 'dinForm', options: { A: 'Form A (27 mm)', B: 'Form B (45 mm)' } } },
        ],
      },
      {
        type: 'group',
        heading: t('head_sender'),
        items: [
          ...senderFields.map(([name, key, ph]) => ({
            name, control: { type: 'text' as const, key: `sender.${key}`, placeholder: ph },
          })),
          { name: t('set_return'), desc: t('set_return_desc'),
            control: { type: 'text', key: 'returnAddressLine', placeholder: autoRuecksende || t('ph_automatic') } },
        ],
      },
      {
        type: 'group',
        heading: t('head_elements'),
        items: [
          { name: t('set_fold'), desc: t('set_fold_desc'), control: { type: 'toggle', key: 'showFoldMarks' } },
          { name: t('set_hole'), desc: t('set_hole_desc'), control: { type: 'toggle', key: 'showHoleMark' } },
          { name: t('set_offset'), desc: t('set_offset_desc'), control: { type: 'text', key: 'printOffsetTopMm', placeholder: '0' } },
          { name: t('set_logo'), desc: t('set_logo_desc'), control: { type: 'toggle', key: 'showLogo' } },
          { name: t('set_logopath'), desc: t('set_logopath_desc'), control: { type: 'text', key: 'logoPath', placeholder: 'assets/logo.png' } },
        ],
      },
      {
        type: 'group',
        heading: t('head_typo'),
        items: [
          { name: t('set_font'), desc: t('set_font_desc'), control: { type: 'text', key: 'fontFamily', placeholder: stilTokens.fontFamily } },
          { name: t('set_fontsize'), desc: t('set_fontsize_desc'), control: { type: 'text', key: 'fontSizePt', placeholder: String(stilTokens.fontSizePt) } },
          { name: t('set_locale'), desc: t('set_locale_desc'), control: { type: 'text', key: 'locale' } },
          { name: t('set_letterlang'), desc: t('set_letterlang_desc'),
            control: { type: 'dropdown', key: 'briefSprache', options: { de: t('opt_lang_de'), en: t('opt_lang_en') } } },
          { name: t('set_closing'), desc: t('set_closing_desc'), control: { type: 'text', key: 'defaultGruss', placeholder: letterLabels.closing } },
        ],
      },
      {
        type: 'group',
        heading: t('head_fm'),
        items: [
          { name: t('set_insertfm'), desc: t('set_insertfm_desc'),
            render: (setting) => { setting.addButton((b) => b.setButtonText(t('btn_insertfm')).setCta().onClick(() => this.plugin.insertFrontmatterTemplate())); } },
          { name: '', render: (setting) => this.renderFmTable(setting) },
        ],
      },
      {
        type: 'group',
        heading: t('head_advanced'),
        items: [
          { name: t('set_output'), desc: t('set_output_desc'),
            control: { type: 'dropdown', key: 'outputMode', options: {
              nextToNote: t('opt_out_note'), attachmentFolder: t('opt_out_attach'),
              customFolder: t('opt_out_custom'), share: t('opt_out_share'),
            } } },
          // Only shown where it does something — a field inert in 3 of 4 modes
          // but always visible is a trap (spec: deliberately unlike paperize).
          { name: t('set_outfolder'), desc: t('set_outfolder_desc'),
            visible: () => s.outputMode === 'customFolder',
            control: { type: 'text', key: 'outputFolder', placeholder: 'Export/Briefe' } },
          // The placeholder list is generated from PLACEHOLDERS rather than
          // written into the description string (yijing-oracle's hand-kept list
          // had drifted from the values it actually substitutes).
          { name: t('set_filename'), desc: t('set_filename_desc') + PLACEHOLDERS.map((p) => `{${p}}`).join(' '),
            control: { type: 'text', key: 'filenameTemplate', placeholder: DEFAULT_FILENAME_TEMPLATE } },
          { name: t('set_css'), desc: t('set_css_desc'),
            render: (setting) => { setting.addButton((b) => b.setButtonText(t('btn_preset')).onClick(async () => {
              s.customCss = PRESET_CSS; await this.plugin.saveSettings(); this.refreshUi();
            })); } },
          { name: '', render: (setting) => this.renderCssTextArea(setting) },
        ],
      },
    ];
  }

  /* --- bespoke render rows ---------------------------------------- */

  /** Frontmatter field reference — the live list of recognised `key: desc` rows. */
  private renderFmTable(setting: Setting): void {
    const el = settingBodyHost(setting);
    el.addClass('bk-settings-host');
    const table = el.createDiv({ cls: 'briefkopf-fm-table' });
    const row = (key: string, desc: string) => {
      const r = table.createDiv({ cls: 'briefkopf-fm-row' });
      r.createEl('code', { text: key });
      r.createSpan({ text: desc });
    };
    row('empfaenger', t('fm_empfaenger'));
    row('absender', t('fm_absender'));
    row('betreff', t('fm_betreff'));
    row('anrede', t('fm_anrede'));
    row('ort', t('fm_ort'));
    row('datum', t('fm_datum'));
    row('anlagen', t('fm_anlagen'));
    row('gruss', t('fm_gruss'));
    row('unterschrift', t('fm_unterschrift'));
    row('stil', t('fm_stil'));
    row('infozeile', t('fm_infozeile'));
    row('sprache', t('fm_sprache'));
    row('steuernummer, ihr_zeichen, ihr_schreiben, unser_zeichen, telefon_bezug', t('fm_refs'));
    row('info', t('fm_info'));
  }

  /** The custom-CSS editor — a nameless row whose control is a tall textarea. */
  private renderCssTextArea(setting: Setting): void {
    setting.addTextArea((x) => {
      x.setValue(this.plugin.settings.customCss)
        .onChange(async (v) => { this.plugin.settings.customCss = v; await this.plugin.saveSettings(); });
      x.inputEl.rows = 12;
      x.inputEl.addClass('briefkopf-css-input');
    });
  }

  /* --- value binding (overrides; framework default never used) ---- */

  getControlValue(key: string): unknown {
    const s = this.plugin.settings;
    if (key.startsWith('sender.')) return s.sender[key.slice(7) as keyof SenderSettings] || '';
    switch (key) {
      case 'theme': return s.theme;
      case 'stil': return s.stil;
      case 'infozeile': return s.infozeile;
      case 'dinForm': return s.dinForm;
      case 'returnAddressLine': return s.returnAddressLine;
      case 'showFoldMarks': return s.showFoldMarks;
      case 'showHoleMark': return s.showHoleMark;
      // Display string: empty means "0" (no offset), same as the old text field.
      case 'printOffsetTopMm': return s.printOffsetTopMm ? String(s.printOffsetTopMm) : '';
      case 'showLogo': return s.showLogo;
      case 'logoPath': return s.logoPath;
      case 'fontFamily': return s.fontFamily || '';
      // Display string: empty means "style default".
      case 'fontSizePt': return s.fontSizePt === '' || s.fontSizePt == null ? '' : String(s.fontSizePt);
      case 'locale': return s.locale;
      // Coerce to a valid dropdown option, like the old normSprache() call.
      case 'briefSprache': return normSprache(s.briefSprache) || 'de';
      case 'defaultGruss': return s.defaultGruss;
      case 'outputMode': return s.outputMode || DEFAULT_SETTINGS.outputMode;
      case 'outputFolder': return s.outputFolder || '';
      case 'filenameTemplate': return s.filenameTemplate;
      default: return undefined;
    }
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    const s = this.plugin.settings;
    if (key.startsWith('sender.')) {
      s.sender[key.slice(7) as keyof SenderSettings] = String(value);
      await this.plugin.saveSettings();
      return;
    }
    switch (key) {
      case 'theme': s.theme = String(value); break;
      case 'infozeile': s.infozeile = String(value); break;
      case 'dinForm': s.dinForm = String(value); break;
      case 'returnAddressLine': s.returnAddressLine = String(value); break;
      case 'showFoldMarks': s.showFoldMarks = Boolean(value); break;
      case 'showHoleMark': s.showHoleMark = Boolean(value); break;
      case 'printOffsetTopMm': {
        const n = Number(String(value).replace(',', '.'));
        s.printOffsetTopMm = isFinite(n) && n > 0 ? Math.min(n, 25) : 0;
        break;
      }
      case 'showLogo': s.showLogo = Boolean(value); break;
      case 'logoPath': s.logoPath = String(value); break;
      case 'fontFamily': s.fontFamily = String(value).trim(); break;
      case 'fontSizePt': {
        const v = String(value); const n = Number(v);
        s.fontSizePt = v.trim() === '' || !isFinite(n) || n <= 0 ? '' : n;
        break;
      }
      case 'locale': s.locale = String(value) || 'de-DE'; break;
      case 'defaultGruss': s.defaultGruss = String(value); break;
      case 'outputFolder': s.outputFolder = String(value).trim(); break;
      case 'filenameTemplate': s.filenameTemplate = String(value); break;
      // These change other rows' placeholders or a row's visibility, so the
      // tab must re-render after saving (old code called this.display()).
      case 'stil': s.stil = String(value); await this.plugin.saveSettings(); this.refreshUi(); return;
      case 'briefSprache': s.briefSprache = String(value); await this.plugin.saveSettings(); this.refreshUi(); return;
      case 'outputMode': s.outputMode = String(value); await this.plugin.saveSettings(); this.refreshUi(); return;
      default: return;
    }
    await this.plugin.saveSettings();
  }

  /* --- < 1.13 fallback -------------------------------------------- */

  /** Not called on ≥ 1.13 (the framework renders declaratively). On < 1.13 it
   *  walks the same definitions, so behaviour matches without a second source. */
  display(): void { this.renderImperative(); }

  private cleanupPrevious: () => void = () => {};

  private renderImperative(): void {
    const { containerEl } = this;
    this.cleanupPrevious();
    containerEl.empty();
    this.cleanupPrevious = renderSettingDefinitions(
      containerEl,
      this.getSettingDefinitions(),
      this,
      this.app,
    );
  }

  /** Re-render the tab. On ≥ 1.13 the declarative framework exposes update();
   *  on the < 1.13 fallback that method does not exist, so re-run display(). */
  private refreshUi(): void {
    refreshSettingsTab(this, () => this.renderImperative());
  }
}
