/* ------------------------------------------------------------------ *
 *  Settings tab — ported VERBATIM from main.js.reference:1410-1603
 *  (`BriefkopfSettingTab`), renamed to `LetterheadSettingTab`.
 *
 *  ONE deliberate change from the reference: the mobile HTML/Quick-Look
 *  fallback ('print') is dropped from the `mobileExport` dropdown — the
 *  Degradation model means mobile always produces a vector PDF now. The
 *  setting KEY `mobileExport` is kept so previously stored data still
 *  loads; only the dropdown option is removed. Everything else (field
 *  order, DOM ids/classes, behavior) is unchanged.
 *
 *  This file lives in src/obsidian/, so importing 'obsidian' is allowed
 *  (check:pure only restricts src/core and src/vendor).
 * ------------------------------------------------------------------ */

import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { t } from '../i18n/strings';
import { DEFAULT_SETTINGS, STILE, type LetterheadSettings } from '../core/model';
import { normStil, normSprache } from '../core/frontmatter';
import { LETTER_LABELS } from '../core/model';
import { PRESET_CSS } from './html-engine';

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

  display(): void {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t('set_layout'))
      .setDesc(t('set_layout_desc'))
      .addDropdown((d) => d
        .addOption('din5008', t('opt_layout_din'))
        .addOption('modern', t('opt_layout_modern'))
        .setValue(s.theme)
        .onChange(async (v) => { s.theme = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName(t('set_style'))
      .setDesc(t('set_style_desc'))
      .addDropdown((d) => d
        .addOption('sachlich', t('opt_style_a'))
        .addOption('klassisch', t('opt_style_b'))
        .addOption('technisch', t('opt_style_c'))
        .setValue(s.stil)
        .onChange(async (v) => { s.stil = v; await this.plugin.saveSettings(); this.display(); }));

    new Setting(containerEl)
      .setName(t('set_infoline'))
      .setDesc(t('set_infoline_desc'))
      .addDropdown((d) => d
        .addOption('vollstaendig', t('opt_info_full'))
        .addOption('nurdatum', t('opt_info_date'))
        .setValue(s.infozeile)
        .onChange(async (v) => { s.infozeile = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName(t('set_dinform'))
      .setDesc(t('set_dinform_desc'))
      .addDropdown((d) => d
        .addOption('A', 'Form A (27 mm)')
        .addOption('B', 'Form B (45 mm)')
        .setValue(s.dinForm)
        .onChange(async (v) => { s.dinForm = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName(t('set_mobileexport'))
      .setDesc(t('set_mobileexport_desc'))
      .addDropdown((d) => d
        .addOption('pdf', t('opt_mobile_pdf'))
        // NOTE: the reference also offered 'print' (opt_mobile_print) —
        // the HTML/Quick-Look mobile fallback. Removed: mobile export is
        // vector-PDF only now (Degradation model). The `mobileExport`
        // setting key is preserved so old stored values still load.
        .setValue(s.mobileExport || DEFAULT_SETTINGS.mobileExport)
        .onChange(async (v) => { s.mobileExport = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('head_sender')).setHeading();
    containerEl.createEl('p', { text: t('sender_intro'), cls: 'setting-item-description' });

    const senderField = (name: string, key: keyof LetterheadSettings['sender'], ph?: string) => new Setting(containerEl)
      .setName(name)
      .addText((x) => x.setPlaceholder(ph || '').setValue(s.sender[key] || '')
        .onChange(async (v) => { s.sender[key] = v; await this.plugin.saveSettings(); }));

    senderField(t('f_name'), 'name', 'Max Mustermann');
    senderField(t('f_company'), 'zusatz', 'Muster GmbH');
    senderField(t('f_street'), 'strasse', 'Musterstraße 1');
    senderField(t('f_city'), 'plzOrt', '12345 Musterstadt');
    senderField(t('f_phone'), 'telefon', '+49 30 1234567');
    senderField(t('f_email'), 'email', 'kontakt@example.com');
    senderField(t('f_web'), 'web', 'www.example.com');

    const autoRuecksende = [s.sender.name, s.sender.strasse, s.sender.plzOrt].filter(Boolean).join(' · ');
    new Setting(containerEl)
      .setName(t('set_return'))
      .setDesc(t('set_return_desc'))
      .addText((x) => x.setPlaceholder(autoRuecksende || t('ph_automatic')).setValue(s.returnAddressLine)
        .onChange(async (v) => { s.returnAddressLine = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('head_elements')).setHeading();

    new Setting(containerEl).setName(t('set_fold'))
      .setDesc(t('set_fold_desc'))
      .addToggle((x) => x.setValue(s.showFoldMarks).onChange(async (v) => { s.showFoldMarks = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('set_hole'))
      .setDesc(t('set_hole_desc'))
      .addToggle((x) => x.setValue(s.showHoleMark).onChange(async (v) => { s.showHoleMark = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('set_offset'))
      .setDesc(t('set_offset_desc'))
      .addText((x) => x.setPlaceholder('0').setValue(s.printOffsetTopMm ? String(s.printOffsetTopMm) : '')
        .onChange(async (v) => {
          const n = Number(String(v).replace(',', '.'));
          s.printOffsetTopMm = isFinite(n) && n > 0 ? Math.min(n, 25) : 0;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl).setName(t('set_logo'))
      .setDesc(t('set_logo_desc'))
      .addToggle((x) => x.setValue(s.showLogo).onChange(async (v) => { s.showLogo = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('set_logopath'))
      .setDesc(t('set_logopath_desc'))
      .addText((x) => x.setPlaceholder('assets/logo.png').setValue(s.logoPath)
        .onChange(async (v) => { s.logoPath = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('head_typo')).setHeading();

    const stilTokens = (STILE[(normStil(s.stil) || 'sachlich') as keyof typeof STILE] || STILE.sachlich).tokens;

    new Setting(containerEl).setName(t('set_font'))
      .setDesc(t('set_font_desc'))
      .addText((x) => x.setPlaceholder(stilTokens.fontFamily).setValue(s.fontFamily || '')
        .onChange(async (v) => { s.fontFamily = v.trim(); await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('set_fontsize'))
      .setDesc(t('set_fontsize_desc'))
      .addText((x) => x.setPlaceholder(String(stilTokens.fontSizePt)).setValue(s.fontSizePt === '' || s.fontSizePt == null ? '' : String(s.fontSizePt))
        .onChange(async (v) => {
          const n = Number(v);
          s.fontSizePt = v.trim() === '' || !isFinite(n) || n <= 0 ? '' : n;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl).setName(t('set_locale'))
      .setDesc(t('set_locale_desc'))
      .addText((x) => x.setValue(s.locale)
        .onChange(async (v) => { s.locale = v || 'de-DE'; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('set_letterlang'))
      .setDesc(t('set_letterlang_desc'))
      .addDropdown((d) => d
        .addOption('de', t('opt_lang_de'))
        .addOption('en', t('opt_lang_en'))
        .setValue(normSprache(s.briefSprache) || 'de')
        .onChange(async (v) => { s.briefSprache = v; await this.plugin.saveSettings(); this.display(); }));

    const letterLabels = LETTER_LABELS[(normSprache(s.briefSprache) || 'de') as keyof typeof LETTER_LABELS] || LETTER_LABELS.de;
    new Setting(containerEl).setName(t('set_closing'))
      .setDesc(t('set_closing_desc'))
      .addText((x) => x.setPlaceholder(letterLabels.closing).setValue(s.defaultGruss)
        .onChange(async (v) => { s.defaultGruss = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName(t('head_fm')).setHeading();
    containerEl.createEl('p', {
      text: t('fm_intro'),
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName(t('set_insertfm'))
      .setDesc(t('set_insertfm_desc'))
      .addButton((b) => b.setButtonText(t('btn_insertfm')).setCta()
        .onClick(() => this.plugin.insertFrontmatterTemplate()));

    const fmTable = containerEl.createDiv({ cls: 'briefkopf-fm-table' });
    const fmRow = (key: string, desc: string) => {
      const r = fmTable.createDiv({ cls: 'briefkopf-fm-row' });
      r.createEl('code', { text: key });
      r.createSpan({ text: desc });
    };
    fmRow('empfaenger', t('fm_empfaenger'));
    fmRow('absender', t('fm_absender'));
    fmRow('betreff', t('fm_betreff'));
    fmRow('anrede', t('fm_anrede'));
    fmRow('ort', t('fm_ort'));
    fmRow('datum', t('fm_datum'));
    fmRow('anlagen', t('fm_anlagen'));
    fmRow('gruss', t('fm_gruss'));
    fmRow('unterschrift', t('fm_unterschrift'));
    fmRow('stil', t('fm_stil'));
    fmRow('infozeile', t('fm_infozeile'));
    fmRow('sprache', t('fm_sprache'));
    fmRow('steuernummer, ihr_zeichen, ihr_schreiben, unser_zeichen, telefon_bezug', t('fm_refs'));
    fmRow('info', t('fm_info'));

    new Setting(containerEl).setName(t('head_advanced')).setHeading();

    new Setting(containerEl).setName(t('set_css'))
      .setDesc(t('set_css_desc'))
      .addButton((b) => b.setButtonText(t('btn_preset')).onClick(async () => {
        s.customCss = PRESET_CSS;
        await this.plugin.saveSettings();
        this.display();
      }));

    new Setting(containerEl)
      .addTextArea((x) => {
        x.setValue(s.customCss).onChange(async (v) => { s.customCss = v; await this.plugin.saveSettings(); });
        x.inputEl.rows = 12;
        x.inputEl.addClass('briefkopf-css-input');
      });
  }
}
