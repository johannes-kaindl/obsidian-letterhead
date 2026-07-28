/* ------------------------------------------------------------------ *
 *  Plugin class + the vector-PDF export flow — the integration seam.
 *
 *  Ported from main.js.reference:727-1268 (`BriefkopfPlugin`): onload +
 *  command registration, loadSettings/saveSettings (with migrations),
 *  insertFrontmatterTemplate, renderMarkdownToHtml, loadLogo, resolveLetter,
 *  and the export commands.
 *
 *  The vector-PDF path is REBUILT for the shared kit engine:
 *    - the head is laid out by `layoutHead` (core/head-layout) as absolute
 *      ops on page 0 + a content-top hand-off;
 *    - the Markdown body is rendered by Obsidian's MarkdownRenderer into a
 *      detached DOM, converted to IR (`domToIrSync` + `resolveImages`) and
 *      laid out by `layoutBody` (core/body-ir) starting at the head's
 *      content top;
 *    - both op streams are merged into one PdfWriter (`buildPdfBytes`).
 *
 *  The old HTML/print fallback for mobile is GONE: the kit engine degrades
 *  unsupported blocks to visible notices itself, so mobile ALWAYS produces
 *  the vector PDF. A count of degraded blocks surfaces as a Notice.
 *
 *  This file lives in src/obsidian/, so importing 'obsidian' is allowed
 *  (check:pure only restricts src/core and src/vendor).
 * ------------------------------------------------------------------ */

import { Plugin, Notice, Component, MarkdownRenderer, Platform, normalizePath, type TFile } from 'obsidian';

import { layoutHead } from '../core/head-layout';
import { layoutBody } from '../core/body-ir';
import { domToIrSync, resolveImages } from '../vendor/kit/pdf/dom-to-ir';
import { extractCodeBlocks, parseCodePlaceholder } from '../vendor/kit/pdf/code-blocks';
import { imageToJpeg } from '../vendor/kit/pdf/image';
import { buildFilename, migrateFilenameTemplate, isoDate, type FilenameValues } from '../core/filename';
import { dinGeometry, DEFAULT_SETTINGS, LETTER_LABELS, type LetterheadSettings } from '../core/model';
import {
  buildFmIndex, getField, ALIASES, parseAbsenderLines, toLines,
  normStil, normInfozeile, normSprache, arrayBufferToBase64, asText,
} from '../core/frontmatter';

import { PdfWriter, type PdfPage } from '../vendor/kit/pdf/writer';
import { mmToPt, yTopMmToPt, pageSizePt } from '../vendor/kit/pdf/geometry';
import type { Block, DrawOp } from '../vendor/kit/pdf';

import { buildLetterHtml, buildCss, doPrint, LetterheadPreviewModal, PRESET_CSS } from './html-engine';
import { LetterheadSettingTab } from './settings';
import { writePdf, resolveOutputPath, type OutputMode } from './output';
import { t } from '../i18n/strings';

// DIN letters are always A4 (matches the reference PAGE_W_PT/PAGE_H_PT).
const { wPt: PAGE_W_PT, hPt: PAGE_H_PT } = pageSizePt('A4');

/** The resolved letter model — everything the HTML engine, the head/body
 *  layout passes, and the export flow need. A superset of the individual
 *  consumer shapes (LetterHtmlModel / LetterHeadModel). */
type LetterModelResolved = {
  recipient: string[];
  betreff: string;
  anrede: string;
  gruss: string;
  unterschrift: string;
  ort: string;
  datum: string;
  /** Raw frontmatter date normalised to YYYY-MM-DD, for the filename scheme. */
  datumIso: string;
  anlagen: string[];
  stil: string;
  infozeile: string;
  sprache: string;
  labels: (typeof LETTER_LABELS)['de'];
  steuernummer: string;
  ihrZeichen: string;
  ihrSchreiben: string;
  unserZeichen: string;
  telefonBezug: string;
  infoExtra: Array<[string, string]>;
  senderName: string;
  senderZusatz: string;
  senderStrasse: string;
  senderPlzOrt: string;
  senderTelefon: string;
  senderEmail: string;
  senderWeb: string;
  ruecksende: string;
  logo: string;
  // export-only extras (not part of LetterHtmlModel)
  bodyMarkdown: string;
  bodyHtml: string;
  sourcePath: string;
  sourceFile: TFile | null;
  baseName: string;
};

export default class LetterheadPlugin extends Plugin {
  declare settings: LetterheadSettings;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new LetterheadSettingTab(this.app, this));

    this.addRibbonIcon('mail', t('cmd_export'), () => { void this.exportLetter(); });

    this.addCommand({ id: 'export-letter', name: t('cmd_export'), callback: () => { void this.exportLetter(); } });
    this.addCommand({ id: 'export-letter-pdf', name: t('cmd_export_pdf'), callback: () => { void this.exportLetterPdf(); } });
    this.addCommand({ id: 'open-preview', name: t('cmd_preview'), callback: () => { void this.previewLetter(); } });
    this.addCommand({ id: 'insert-frontmatter', name: t('cmd_insert_fm'), callback: () => { void this.insertFrontmatterTemplate(); } });
  }

  /* Adds the most important letter fields to the active note's frontmatter
     without touching existing values (uses Obsidian's processFrontMatter). */
  async insertFrontmatterTemplate(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== 'md') { new Notice(t('notice_open_note')); return; }
    const now = new Date();
    const iso = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    const lang = normSprache(this.settings.briefSprache) || 'de';
    const K = lang === 'en'
      ? { recipient: 'recipient', betreff: 'subject', anrede: 'salutation', ort: 'place',
          datum: 'date', anlagen: 'enclosures', gruss: 'closing', unterschrift: 'signature',
          stil: 'style', infozeile: 'layout', sprache: 'language' }
      : { recipient: 'empfaenger', betreff: 'betreff', anrede: 'anrede', ort: 'ort',
          datum: 'datum', anlagen: 'anlagen', gruss: 'gruss', unterschrift: 'unterschrift',
          stil: 'stil', infozeile: 'infozeile', sprache: 'sprache' };
    try {
      await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        const has = (...keys: string[]): boolean => keys.some((k) => fm[k] !== undefined);
        const labels = (LETTER_LABELS as Record<string, typeof LETTER_LABELS.de>)[lang] || LETTER_LABELS.de;
        if (!has('empfaenger', 'empfänger', 'recipient', 'an', 'to', 'adresse', 'anschrift')) fm[K.recipient] = ['', '', '', ''];
        if (!has('betreff', 'subject', 'thema')) fm[K.betreff] = '';
        if (!has('anrede', 'salutation')) fm[K.anrede] = labels.salutation;
        if (!has('ort', 'place', 'stadt', 'city')) fm[K.ort] = '';
        if (!has('datum', 'date')) fm[K.datum] = iso;
        if (!has('anlagen', 'anlage', 'attachments', 'enclosures')) fm[K.anlagen] = [];
        if (!has('gruss', 'gruß', 'grussformel', 'closing', 'signoff')) fm[K.gruss] = this.settings.defaultGruss || labels.closing;
        if (!has('unterschrift', 'signatur', 'signature', 'gezeichnet')) fm[K.unterschrift] = (this.settings.sender && this.settings.sender.name) || '';
        if (!has('stil', 'style', 'design', 'variante')) fm[K.stil] = '';
        if (!has('infozeile', 'layout')) fm[K.infozeile] = '';
        if (!has('sprache', 'language', 'lang', 'briefsprache')) fm[K.sprache] = lang;
        for (let i = 1; i <= 4; i++) {
          if (!has('info_' + i, 'info' + i, 'infoblock_' + i, 'info_block_' + i)) fm['info_' + i] = '';
        }
      });
      new Notice(t('notice_fm_added'));
    } catch (e) {
      console.error('Letterhead: frontmatter insert failed', e);
      new Notice(t('notice_fm_failed'));
    }
  }

  async loadSettings(): Promise<void> {
    const data = ((await this.loadData()) || {}) as Partial<LetterheadSettings> & Record<string, unknown>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    this.settings.sender = Object.assign({}, DEFAULT_SETTINGS.sender, (data.sender as object) || {});
    /* Migration <= 1.0.0: the "Bezugszeichenzeile" toggle became the
       Infozeile dropdown; font settings were always-on and now mean
       "override the style default" (old defaults => unset). */
    let migrated = false;
    /* Filename scheme (1.4.2, spec A3): only FRESH installs get the new
       '{datum} {empfaenger}' default. An existing install keeps naming files
       after the note — letterhead has been in the community directory since
       2026-06-13, and a silent default switch would rename files for people
       who never touched the setting. */
    const freshInstall = Object.keys(data).length === 0;
    const tpl = migrateFilenameTemplate(data.filenameTemplate, freshInstall);
    if (tpl !== this.settings.filenameTemplate) { this.settings.filenameTemplate = tpl; migrated = true; }
    /* Output target (1.5.0), same reasoning: until now every export went through
       the share/open-externally path. An existing install keeps exactly that;
       only fresh installs start with 'nextToNote'. */
    if (data.outputMode === undefined && !freshInstall) { this.settings.outputMode = 'share'; migrated = true; }
    if (data.infozeile === undefined && (data as { showBezugszeichen?: boolean }).showBezugszeichen === false) {
      this.settings.infozeile = 'nurdatum';
      migrated = true;
    }
    if (data.fontFamily === 'Helvetica, Arial, sans-serif') { this.settings.fontFamily = ''; migrated = true; }
    if (data.fontSizePt === 11) { this.settings.fontSizePt = ''; migrated = true; }
    if (data.defaultGruss === 'Mit freundlichen Grüßen') { this.settings.defaultGruss = ''; migrated = true; }
    /* If a design-variant file was pasted into "Eigenes CSS", adopt it as the
       built-in Stil/Infozeile and clear the field — the variants ship built in. */
    const cc = typeof this.settings.customCss === 'string' ? this.settings.customCss : '';
    if (/Briefkopf · (VARIANTE [ABC]|LAYOUT-ADD-ON)/.test(cc)) {
      const v = cc.match(/VARIANTE ([ABC])/);
      if (v && data.stil === undefined) {
        this.settings.stil = ({ A: 'sachlich', B: 'klassisch', C: 'technisch' } as Record<string, string>)[v[1]];
      }
      if (/LAYOUT-ADD-ON/.test(cc) && data.infozeile === undefined) this.settings.infozeile = 'nurdatum';
      this.settings.customCss = '';
      migrated = true;
    }
    /* Custom CSS field: pre-fill with the inert commented preset; also
       replaces the old ACTIVE preset and the cleared field after migration. */
    if (this.settings.customCss === undefined || this.settings.customCss === '' ||
        (typeof this.settings.customCss === 'string' && this.settings.customCss.includes('Briefkopf – CSS-Preset'))) {
      if (this.settings.customCss !== PRESET_CSS) { this.settings.customCss = PRESET_CSS; migrated = true; }
    }
    if (migrated) await this.saveData(this.settings);
  }

  async saveSettings(): Promise<void> { await this.saveData(this.settings); }

  /* ---- rendering helpers ---- */

  stripFrontmatter(content: string): string {
    if (content.startsWith('---')) {
      const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
      if (m) return content.slice(m[0].length);
    }
    return content;
  }

  async renderMarkdownToHtml(markdown: string, sourcePath: string): Promise<string> {
    const comp = new Component();
    const tmp = createDiv();
    try {
      await MarkdownRenderer.render(this.app, markdown, tmp, sourcePath, comp);
    } catch (e) {
      console.error('Letterhead: markdown render failed', e);
    }
    const html = tmp.innerHTML;
    comp.unload();
    return html;
  }

  formatDate(value: unknown): string {
    let d: Date;
    if (value == null || value === '') d = new Date();
    else if (value instanceof Date) d = value;
    else { d = new Date(value as string); if (isNaN(d.getTime())) return asText(value); }
    try { return d.toLocaleDateString(this.settings.locale || 'de-DE'); }
    catch { return d.toLocaleDateString('de-DE'); }
  }

  async loadLogo(): Promise<string> {
    const p = (this.settings.logoPath || '').trim();
    if (!this.settings.showLogo || !p) return '';
    try {
      const ab = await this.app.vault.adapter.readBinary(normalizePath(p));
      const ext = (p.split('.').pop() || '').toLowerCase();
      const mime = ext === 'png' ? 'image/png'
        : ext === 'svg' ? 'image/svg+xml'
        : ext === 'gif' ? 'image/gif'
        : ext === 'webp' ? 'image/webp'
        : 'image/jpeg';
      return `data:${mime};base64,${arrayBufferToBase64(ab)}`;
    } catch {
      new Notice(t('notice_logo_failed') + p);
      return '';
    }
  }

  /* ---- resolve the active note into a letter model ---- */

  async resolveLetter(): Promise<LetterModelResolved | null> {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== 'md') { new Notice(t('notice_open_note')); return null; }
    const cache = this.app.metadataCache.getFileCache(file);
    const idx = buildFmIndex((cache && cache.frontmatter) as Record<string, unknown>);
    const s = this.settings;

    const content = await this.app.vault.cachedRead(file);
    const body = this.stripFrontmatter(content);
    const bodyHtml = await this.renderMarkdownToHtml(body, file.path);

    /* sender precedence: specific field > `absender:` list > settings profile */
    const abs = parseAbsenderLines(toLines(getField(idx, ALIASES.absender)));
    const senderName    = (getField(idx, ALIASES.sName)    as string) || abs.name    || s.sender.name;
    const senderZusatz  = (getField(idx, ALIASES.sZusatz)  as string) || abs.zusatz  || s.sender.zusatz;
    const senderStrasse = (getField(idx, ALIASES.sStrasse) as string) || abs.strasse || s.sender.strasse;
    const senderPlzOrt  = (getField(idx, ALIASES.sPlzOrt)  as string) || abs.plzOrt  || s.sender.plzOrt;
    const senderTelefon = (getField(idx, ALIASES.sTelefon) as string) || abs.telefon || s.sender.telefon;
    const senderEmail   = (getField(idx, ALIASES.sEmail)   as string) || abs.email   || s.sender.email;
    const senderWeb     = (getField(idx, ALIASES.sWeb)     as string) || abs.web     || s.sender.web;

    let ruecksende = (s.returnAddressLine || '').trim();
    if (!ruecksende) ruecksende = [senderName, senderStrasse, senderPlzOrt].filter(Boolean).join(' · ');

    /* free-form info-block rows: flat info_1..info_4 ("Label: Wert"), then the
       `info:` map of label -> value. */
    const infoExtra: Array<[string, string]> = [];
    for (let i = 1; i <= 4; i++) {
      const raw = getField(idx, ['info_' + i]);
      if (raw === undefined || raw === null || raw === '') continue;
      const sv = raw instanceof Date ? this.formatDate(raw) : asText(raw);
      const ci = sv.indexOf(':');
      if (ci > 0) infoExtra.push([sv.slice(0, ci).trim(), sv.slice(ci + 1).trim()]);
      else infoExtra.push(['Info', sv.trim()]);
    }
    const infoRaw = getField(idx, ALIASES.info);
    if (infoRaw && typeof infoRaw === 'object' && !Array.isArray(infoRaw)) {
      for (const k of Object.keys(infoRaw)) {
        const v = (infoRaw as Record<string, unknown>)[k];
        if (v === undefined || v === null || v === '') continue;
        infoExtra.push([k, v instanceof Date ? this.formatDate(v) : asText(v)]);
      }
    }

    const ihrSchreibenRaw = getField(idx, ALIASES.ihrSchreiben);

    const sprache = normSprache(getField(idx, ALIASES.sprache)) || normSprache(s.briefSprache) || 'de';
    const labels = (LETTER_LABELS as Record<string, typeof LETTER_LABELS.de>)[sprache] || LETTER_LABELS.de;

    const model: LetterModelResolved = {
      recipient: toLines(getField(idx, ALIASES.recipient)),
      betreff: (getField(idx, ALIASES.betreff) as string) || '',
      anrede: (getField(idx, ALIASES.anrede) as string) || '',
      gruss: (getField(idx, ALIASES.gruss) as string) || s.defaultGruss || labels.closing,
      unterschrift: (getField(idx, ALIASES.unterschrift) as string) || senderName || '',
      ort: (getField(idx, ALIASES.ort) as string) || '',
      datum: this.formatDate(getField(idx, ALIASES.datum)),
      // Same source as `datum`; '' (no date in frontmatter) means today, matching formatDate.
      datumIso: isoDate(getField(idx, ALIASES.datum)) || isoDate(new Date()),
      anlagen: toLines(getField(idx, ALIASES.anlagen)),
      stil: normStil(getField(idx, ALIASES.stil)) || normStil(s.stil) || 'sachlich',
      infozeile: normInfozeile(getField(idx, ALIASES.infozeile)) || normInfozeile(s.infozeile) || 'vollstaendig',
      sprache,
      labels,
      steuernummer: (getField(idx, ALIASES.steuernummer) as string) || '',
      ihrZeichen: (getField(idx, ALIASES.ihrZeichen) as string) || '',
      ihrSchreiben: ihrSchreibenRaw ? this.formatDate(ihrSchreibenRaw) : '',
      unserZeichen: (getField(idx, ALIASES.unserZeichen) as string) || '',
      telefonBezug: (getField(idx, ALIASES.telefonBezug) as string) || '',
      infoExtra,
      senderName, senderZusatz, senderStrasse, senderPlzOrt,
      senderTelefon, senderEmail, senderWeb,
      ruecksende,
      logo: await this.loadLogo(),
      bodyMarkdown: body,
      bodyHtml,
      sourcePath: file.path,
      sourceFile: file,
      baseName: file.basename || 'Brief',
    };

    if (model.recipient.length === 0) new Notice(t('notice_no_recipient'));
    return model;
  }

  /* ---- image decode for body <img> (data: / app: / vault-relative) ---- */

  async decodeImage(src: string, sourceFile: TFile | null): Promise<{ data: Uint8Array; wPx: number; hPx: number } | null> {
    if (!src) return null;
    try {
      // Already a loadable URL — hand straight to the rasterizer. `capacitor:`
      // is iOS/Capacitor's scheme for resolved local-file image srcs (the
      // mobile counterpart to desktop's `app:`) — without it, embedded images
      // fell through to the vault-link branch below and failed to resolve on
      // iPhone (confirmed via on-device diagnosis, 2026-07-25).
      if (/^(data:|app:|capacitor:|blob:|https?:)/i.test(src)) return await imageToJpeg(src, () => createEl('canvas'), 1600);
      // Vault-relative wikilink/path → resolve to a resource URL.
      const dest = this.app.metadataCache.getFirstLinkpathDest(src, sourceFile ? sourceFile.path : '');
      if (dest) return await imageToJpeg(this.app.vault.getResourcePath(dest), () => createEl('canvas'), 1600);
      return null;
    } catch (e) {
      console.error('Letterhead: image decode failed', e);
      return null;
    }
  }

  /* ---- vector PDF: merge head pass + body pass into one writer ---- */

  async buildPdfBytes(model: LetterModelResolved): Promise<Uint8Array> {
    const settings = this.settings;

    // 1. Head pass — absolute ops on page 0 + the content-top hand-off.
    const head = layoutHead(model, settings);
    const headOps: DrawOp[] = head.ops.slice();

    // 2. Logo image op (page 0) — scaling/position VERBATIM from
    //    main.js.reference:1119-1130 (logoToJpeg is now imageToJpeg).
    if (model.logo) {
      const jp = await imageToJpeg(model.logo, () => createEl('canvas'), 1200);
      if (jp) {
        const g = dinGeometry(settings.dinForm);
        const off = Number(settings.printOffsetTopMm) || 0;
        const maxHmm = Math.max(8, g.addrTopMm - g.headTopMm - 8);
        const ratio = jp.wPx / jp.hPx;
        let hmm = Math.min(maxHmm, 22);
        let wmm = hmm * ratio;
        if (wmm > 90) { wmm = 90; hmm = wmm / ratio; }
        headOps.push({
          page: 0, kind: 'image', data: jp.data, wPx: jp.wPx, hPx: jp.hPx,
          x: mmToPt(g.marginLeftMm), y: yTopMmToPt(g.headTopMm + off + hmm, PAGE_H_PT),
          w: mmToPt(wmm), h: mmToPt(hmm),
        });
      }
    }

    // 3. Body: Markdown → detached DOM → IR → resolved images.
    const holder = createDiv();
    const comp = new Component();
    let bodyBlocks: Block[] = [];
    let simplified = 0;
    try {
      // Pull fenced code out of the Markdown BEFORE rendering. MarkdownRenderer runs every
      // registered post-processor, including other plugins' — a code-block processor (e.g.
      // json-editor on ```json) replaces the <pre> with its own widget DOM, and the original
      // code would be unrecoverable from it. The HTML/print path (renderMarkdownToHtml) is
      // unaffected and must keep the widget: a browser renders it correctly.
      const { markdown, codes } = extractCodeBlocks(model.bodyMarkdown || '', 'LETTERHEADCODE');
      await MarkdownRenderer.render(this.app, markdown, holder, model.sourcePath || '', comp);
      const ex = domToIrSync(holder, { codes, resolvePlaceholder: (t) => parseCodePlaceholder(t, 'LETTERHEADCODE') });
      simplified = ex.unsupportedCount;
      const res = await resolveImages(ex.blocks, ex.imageEls, (src) => this.decodeImage(src, model.sourceFile));
      bodyBlocks = res.blocks;
      simplified += res.unsupportedAdded;
    } finally {
      comp.unload();
    }

    // 4. Body pass — cursor hand-off starting at the head's content top.
    const body = layoutBody(model, settings, bodyBlocks, head.contentTopMm);

    // Degradation surfaces as a Notice (replaces the old HTML/print fallback).
    if (simplified > 0) new Notice(t('notice_simplified').replace('{n}', String(simplified)));

    // 5. Merge head + body ops into one writer.
    const pageCount = Math.max(1, body.pageCount);
    const writer = new PdfWriter(PAGE_W_PT, PAGE_H_PT);
    const pages: PdfPage[] = [];
    for (let i = 0; i < pageCount; i++) pages.push(writer.addPage());
    const imgNames = new Map<Uint8Array, string>();
    for (const op of [...headOps, ...body.ops]) {
      const pg = pages[op.page] || pages[pages.length - 1];
      if (op.kind === 'text') pg.text(op.x, op.y, op.str, op.fontKey, op.sizePt, op.rgb);
      else if (op.kind === 'line') pg.line(op.x1, op.y1, op.x2, op.y2, op.wPt, op.rgb);
      else if (op.kind === 'rect') pg.rect(op.x, op.y, op.w, op.h, op.rgb);
      else if (op.kind === 'image') {
        let n = imgNames.get(op.data);
        if (!n) { n = writer.addJpeg(op.data, op.wPx, op.hPx); imgNames.set(op.data, n); }
        pg.image(n, op.x, op.y, op.w, op.h);
      }
    }
    return writer.build();
  }

  /** Letter model → the values the filename template can substitute. */
  filenameValues(model: LetterModelResolved): FilenameValues {
    return {
      notiz: model.baseName || '',
      datum: model.datumIso || '',
      datum_lang: model.datum || '',
      empfaenger: (model.recipient && model.recipient[0]) || '',
      betreff: model.betreff || '',
      unserzeichen: model.unserZeichen || '',
    };
  }

  /** Filename for this letter, per the configured scheme. */
  letterFilename(model: LetterModelResolved): string {
    return buildFilename(this.settings.filenameTemplate, this.filenameValues(model));
  }

  async exportViaPdf(model: LetterModelResolved): Promise<void> {
    const bytes = await this.buildPdfBytes(model);
    const noteDir = model.sourceFile && model.sourceFile.parent ? model.sourceFile.parent.path : '';
    const baseName = this.letterFilename(model);
    const mode = (this.settings.outputMode || 'nextToNote') as OutputMode;
    /* Resolved outside resolveOutputPath so that stays pure (paperize pattern). */
    const attachmentPath = mode === 'attachmentFolder'
      ? await this.app.fileManager.getAvailablePathForAttachment(`${baseName}.pdf`)
      : '';
    const resolvedPath = resolveOutputPath(mode, {
      noteDir, baseName, customFolder: normalizePath(this.settings.outputFolder || ''), attachmentPath,
    });
    await writePdf(this.app, bytes, mode, { baseName, resolvedPath, isMobile: Platform.isMobile });
  }

  /* ---- export commands ---- */

  /* Default: Desktop uses the HTML print dialog; Mobile always builds the
     vector PDF (no fallback). */
  async exportLetter(): Promise<void> {
    const m = await this.resolveLetter();
    if (!m) return;
    if (Platform.isDesktopApp) {
      /* The third argument is the filename the OS print dialog proposes: it
         takes the TOP-LEVEL window title, not the printed document's <title>
         (verified on macOS 26.5 / Electron with 1.4.1, which offered
         "<note> - <vault> - Obsidian <version>.pdf"). doPrint swaps it in and
         restores it on cleanup. */
      doPrint(buildLetterHtml(m, this.settings, m.bodyHtml), buildCss(this.settings, m.stil),
        this.letterFilename(m));
      return;
    }
    await this.exportViaPdf(m);
  }

  /* Explicit "vector PDF" command — both platforms. */
  async exportLetterPdf(): Promise<void> {
    const m = await this.resolveLetter();
    if (!m) return;
    await this.exportViaPdf(m);
  }

  /* ---- on-screen preview ---- */

  async previewLetter(): Promise<void> {
    const m = await this.resolveLetter();
    if (!m) return;
    const html = buildLetterHtml(m, this.settings, m.bodyHtml);
    const css = buildCss(this.settings, m.stil);
    new LetterheadPreviewModal(this.app, this, html, css).open();
  }
}
