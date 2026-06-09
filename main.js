'use strict';

/*
 * Briefkopf – Letter Generator for Obsidian
 * Copyright (C) 2026 Johannes Kaindl — AGPL-3.0-or-later
 *
 * Turns the active note into a formatted business letter:
 *   - metadata (sender / recipient / subject / date / reference line) from frontmatter
 *   - two CSS themes: "DIN 5008" (German standard, window-envelope ready) and "Modern"
 *   - PDF export via the OS print dialog  ->  works on desktop AND iPhone/iPad
 *
 * Dependency-free vanilla JS, so this file is also the source — drop it in and go.
 */

const obsidian = require('obsidian');

/* ------------------------------------------------------------------ *
 *  Settings
 * ------------------------------------------------------------------ */

const DEFAULT_SETTINGS = {
  theme: 'din5008',          // 'din5008' | 'modern'
  dinForm: 'B',              // 'A' | 'B'  (letterhead 27mm vs 45mm)
  sender: {
    name: '',
    zusatz: '',
    strasse: '',
    plzOrt: '',
    telefon: '',
    email: '',
    web: ''
  },
  returnAddressLine: '',     // Rücksendeangabe; empty => auto from sender
  showFoldMarks: true,
  showHoleMark: true,
  showBezugszeichen: true,
  showLogo: false,
  logoPath: '',              // vault-relative path to an image
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSizePt: 11,
  locale: 'de-DE',
  defaultGruss: 'Mit freundlichen Grüßen',
  customCss: ''
};

/* ------------------------------------------------------------------ *
 *  Frontmatter field resolution (German-first, with aliases)
 * ------------------------------------------------------------------ */

const ALIASES = {
  recipient:   ['empfaenger', 'empfänger', 'recipient', 'an', 'to', 'adresse', 'anschrift'],
  betreff:     ['betreff', 'subject', 're', 'thema'],
  anrede:      ['anrede', 'salutation', 'greeting'],
  gruss:       ['gruss', 'gruß', 'grußformel', 'grussformel', 'closing', 'signoff'],
  unterschrift:['unterschrift', 'signatur', 'signature', 'gezeichnet'],
  ort:         ['ort', 'place', 'city', 'stadt'],
  datum:       ['datum', 'date'],
  ihrZeichen:  ['ihr_zeichen', 'ihrzeichen', 'your_ref', 'yourref'],
  ihrSchreiben:['ihr_schreiben', 'ihrschreiben', 'ihrschreibenvom', 'your_letter'],
  unserZeichen:['unser_zeichen', 'unserzeichen', 'our_ref', 'ourref'],
  telefonBezug:['telefon_bezug', 'durchwahl', 'phone'],
  sName:       ['absender_name', 'absendername', 'sender_name', 'sendername'],
  sZusatz:     ['absender_zusatz', 'absenderzusatz', 'firma', 'company'],
  sStrasse:    ['absender_strasse', 'absenderstrasse', 'absender_straße', 'sender_street'],
  sPlzOrt:     ['absender_plz_ort', 'absenderplzort', 'absender_ort', 'sender_city'],
  sTelefon:    ['absender_telefon', 'absendertelefon'],
  sEmail:      ['absender_email', 'absenderemail'],
  sWeb:        ['absender_web', 'absenderweb', 'website']
};

function norm(k) { return String(k).toLowerCase().replace(/[\s_\-.]+/g, ''); }

function buildFmIndex(fm) {
  const idx = {};
  if (fm && typeof fm === 'object') {
    for (const k of Object.keys(fm)) idx[norm(k)] = fm[k];
  }
  return idx;
}

function getField(idx, aliases) {
  for (const a of aliases) {
    const v = idx[norm(a)];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function toLines(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function escLines(lines) { return (lines || []).map(esc).join('\n'); }

function arrayBufferToBase64(buf) {
  let bin = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/* ------------------------------------------------------------------ *
 *  CSS generation (themes)
 *
 *  All visual values are exposed as CSS custom properties ("design
 *  tokens") in :root, so the whole look can be re-themed by overriding
 *  tokens in the "Eigenes CSS" setting (see PRESET_CSS / presets/).
 *  Geometry tokens marked DIN-critical keep the address block aligned
 *  with a DIN-long window envelope — change them only deliberately.
 * ------------------------------------------------------------------ */

function buildCss(s) {
  const form = s.dinForm === 'A'
    ? { head: '27mm', f1: '87mm', f2: '192mm', addrTop: '27mm' }
    : { head: '45mm', f1: '105mm', f2: '210mm', addrTop: '45mm' };
  const font = s.fontFamily || 'Helvetica, Arial, sans-serif';
  const fs = Number(s.fontSizePt) || 11;

  return `
  :root{
    /* --- Page geometry (DIN-critical: envelope-window alignment) --- */
    --bk-page-width:210mm; --bk-page-height:297mm;
    --bk-margin-left:25mm; --bk-margin-right:20mm;
    --bk-din-head-height:${form.head};
    --bk-din-address-top:${form.addrTop}; --bk-din-address-left:25mm;
    --bk-din-address-width:85mm; --bk-din-address-height:40mm;
    --bk-din-fold-1:${form.f1}; --bk-din-fold-2:${form.f2}; --bk-din-hole:148.5mm;
    --bk-din-content-top:98.46mm;
    /* --- Typography (safe to customize) --- */
    --bk-font-family:${font};
    --bk-font-size:${fs}pt;
    --bk-line-height:1.4;
    /* --- Colors (safe to customize) --- */
    --bk-color-text:#111111;
    --bk-color-muted:#555555;       /* reference-line labels */
    --bk-color-rule:#000000;        /* fold/hole marks + return-address underline */
    --bk-color-hairline:#bbbbbb;    /* reference-line separator */
    /* --- Spacing (safe to customize) --- */
    --bk-space:2.6mm;               /* base paragraph rhythm */
    --bk-block-gap:6mm;             /* gap between letter blocks */
    --bk-signature-gap:16mm;        /* room for a handwritten signature */
  }
  .bk-letter{ position:relative; box-sizing:border-box; width:var(--bk-page-width); min-height:var(--bk-page-height);
    margin:0 auto; background:#fff; color:var(--bk-color-text);
    font-family:var(--bk-font-family); font-size:var(--bk-font-size); line-height:var(--bk-line-height); }
  .bk-letter *{ box-sizing:border-box; }

  /* fold + hole marks (left margin / Heftrand) */
  .bk-mark{ position:absolute; left:0; width:5mm; height:0; border-top:0.3mm solid var(--bk-color-rule); }
  .bk-mark.bk-lo{ width:8mm; }
  .bk-f1{ top:var(--bk-din-fold-1); } .bk-f2{ top:var(--bk-din-fold-2); } .bk-lo{ top:var(--bk-din-hole); }

  /* ---- DIN 5008 theme ---- */
  .bk-din .bk-head{ position:absolute; top:0; left:var(--bk-margin-left); right:var(--bk-margin-right); height:var(--bk-din-head-height);
    display:flex; align-items:flex-end; justify-content:flex-end; }
  .bk-din .bk-head img{ max-height:calc(var(--bk-din-head-height) - 4mm); max-width:90mm; }
  .bk-din .bk-head .bk-head-name{ font-weight:bold; font-size:14pt; }

  .bk-din .bk-anschrift{ position:absolute; top:var(--bk-din-address-top); left:var(--bk-din-address-left);
    width:var(--bk-din-address-width); height:var(--bk-din-address-height); overflow:hidden; }
  .bk-din .bk-ruecksende{ font-size:7pt; line-height:1.1; border-bottom:0.2mm solid var(--bk-color-rule);
    padding-bottom:0.5mm; margin-bottom:3mm; display:inline-block; }
  .bk-din .bk-empf{ white-space:pre-line; line-height:1.3; }

  .bk-din .bk-info{ position:absolute; top:var(--bk-din-address-top); right:var(--bk-margin-right); width:72mm;
    font-size:9pt; line-height:1.3; }
  .bk-din .bk-info-name{ font-weight:bold; }
  .bk-din .bk-info-sp{ height:3mm; }

  .bk-din .bk-content{ margin-left:var(--bk-margin-left); margin-right:var(--bk-margin-right); padding-top:var(--bk-din-content-top); }
  .bk-din .bk-date{ text-align:right; margin-bottom:var(--bk-block-gap); }
  .bk-din .bk-bezug{ display:flex; gap:7mm; font-size:8pt; border-bottom:0.2mm solid var(--bk-color-hairline);
    padding-bottom:1mm; margin-bottom:7mm; }
  .bk-din .bk-bezug .bk-col .lbl{ display:block; font-size:7pt; color:var(--bk-color-muted); }

  /* ---- Modern theme ---- */
  .bk-modern{ padding:var(--bk-margin-left) var(--bk-margin-right); }
  .bk-modern .bk-m-head{ display:flex; justify-content:space-between; align-items:flex-start;
    gap:10mm; margin-bottom:16mm; }
  .bk-modern .bk-m-logo{ max-height:22mm; max-width:80mm; }
  .bk-modern .bk-m-sender{ text-align:right; font-size:9pt; line-height:1.35; margin-left:auto; }
  .bk-modern .bk-m-name{ font-weight:bold; font-size:12pt; }
  .bk-modern .bk-m-recipient{ white-space:pre-line; line-height:1.35; margin-bottom:12mm; }
  .bk-modern .bk-m-date{ text-align:right; margin-bottom:10mm; }

  /* ---- shared body blocks ---- */
  .bk-betreff{ font-weight:bold; margin:0 0 5mm; }
  .bk-anrede{ margin:0 0 3mm; }
  .bk-body p{ margin:0 0 var(--bk-space); }
  .bk-body ul, .bk-body ol{ margin:0 0 var(--bk-space); padding-left:6mm; }
  .bk-body h1, .bk-body h2, .bk-body h3{ font-size:1em; font-weight:bold; margin:4mm 0 2mm; }
  .bk-body{ text-align:left; }
  .bk-gruss{ margin-top:var(--bk-block-gap); }
  .bk-signatur{ margin-top:var(--bk-signature-gap); white-space:pre-line; }
  ${s.customCss || ''}
  `;
}

const PRINT_WRAPPER_CSS = `
  #briefkopf-print-root{ display:none; }
  @media print{
    @page{ size:A4; margin:0; }
    html, body{ margin:0 !important; padding:0 !important; background:#fff !important; height:auto !important; }
    body > *:not(#briefkopf-print-root){ display:none !important; }
    #briefkopf-print-root{ display:block !important; position:static !important; }
  }
`;

const SCREEN_PREVIEW_CSS = `
  html,body{ margin:0; padding:0; }
  body{ background:#d9d9d9; display:flex; justify-content:center; padding:14px 0; }
  .bk-letter{ box-shadow:0 2px 14px rgba(0,0,0,.35); }
`;

/* Commented starter the user can load into the "Eigenes CSS" field via the
   settings button. Kept identical to presets/briefkopf-theme.css. */
const PRESET_CSS = `/* =====================================================================
   Briefkopf – CSS-Preset (Best-Practice-Startpunkt zum Selbstanpassen)
   ---------------------------------------------------------------------
   - Dieses CSS wird NACH dem Theme geladen und überschreibt es.
   - Du änderst v. a. die Design-Tokens unten (CSS Custom Properties).
   - "SICHER" = frei anpassbar. "DIN-KRITISCH" = Fensterkuvert-Position.
   - Workflow: Token ändern -> Befehl "Brief-Vorschau" -> prüfen.
   ===================================================================== */
:root {
  /* ---------- SICHER: Typografie ---------- */
  --bk-font-family: "Helvetica Neue", Arial, system-ui, sans-serif;
  --bk-font-size: 11pt;          /* 10-12pt üblich */
  --bk-line-height: 1.45;        /* 1.3-1.6 */

  /* ---------- SICHER: Farben ---------- */
  --bk-color-text: #1a1a1a;      /* Fließtext */
  --bk-color-muted: #555;        /* Labels der Bezugszeichenzeile */
  --bk-color-rule: #000;         /* Faltmarken + Rücksende-Unterstrich */
  --bk-color-hairline: #c8c8c8;  /* Trennlinie der Bezugszeile */

  /* ---------- SICHER: Abstände ---------- */
  --bk-space: 2.6mm;             /* Absatz-Rhythmus */
  --bk-block-gap: 6mm;           /* Abstand zwischen Blöcken */
  --bk-signature-gap: 16mm;      /* Platz für die Unterschrift */

  /* ---------- DIN-KRITISCH: Seitengeometrie ----------
     Standard = DIN 5008 Form B; hält die Anschrift im Fensterkuvert.
     Nur ändern, wenn dein Kuvert abweicht. Auskommentiert lassen = Default. */
  /* --bk-margin-left: 25mm;
     --bk-margin-right: 20mm;
     --bk-din-address-top: 45mm;
     --bk-din-content-top: 98.46mm; */
}

/* ---------- Beispiel: einzelne Komponenten überschreiben ----------
.bk-betreff { color: #0a7d3c; }
.bk-din .bk-head .bk-head-name { letter-spacing: .3px; }
*/

/* ---------- Beispiel: klassischer Serifen-Brief ----------
:root {
  --bk-font-family: "Iowan Old Style", Georgia, "Times New Roman", serif;
  --bk-font-size: 11.5pt;
  --bk-line-height: 1.5;
}
*/
`;

/* ------------------------------------------------------------------ *
 *  Plugin
 * ------------------------------------------------------------------ */

class BriefkopfPlugin extends obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new BriefkopfSettingTab(this.app, this));

    this.addRibbonIcon('mail', 'Brief als PDF exportieren', () => this.exportLetter());

    this.addCommand({
      id: 'briefkopf-export',
      name: 'Brief als PDF exportieren / drucken',
      callback: () => this.exportLetter()
    });
    this.addCommand({
      id: 'briefkopf-preview',
      name: 'Brief-Vorschau öffnen',
      callback: () => this.previewLetter()
    });
  }

  async loadSettings() {
    const data = (await this.loadData()) || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    this.settings.sender = Object.assign({}, DEFAULT_SETTINGS.sender, data.sender || {});
  }

  async saveSettings() { await this.saveData(this.settings); }

  /* ---- rendering helpers ---- */

  stripFrontmatter(content) {
    if (content.startsWith('---')) {
      const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
      if (m) return content.slice(m[0].length);
    }
    return content;
  }

  async renderMarkdownToHtml(markdown, sourcePath) {
    const comp = new obsidian.Component();
    const tmp = document.createElement('div');
    try {
      if (obsidian.MarkdownRenderer && typeof obsidian.MarkdownRenderer.render === 'function') {
        await obsidian.MarkdownRenderer.render(this.app, markdown, tmp, sourcePath, comp);
      } else {
        await obsidian.MarkdownRenderer.renderMarkdown(markdown, tmp, sourcePath, comp);
      }
    } catch (e) {
      console.error('Briefkopf: markdown render failed', e);
    }
    const html = tmp.innerHTML;
    comp.unload();
    return html;
  }

  formatDate(value) {
    let d;
    if (value == null || value === '') d = new Date();
    else if (value instanceof Date) d = value;
    else { d = new Date(value); if (isNaN(d.getTime())) return String(value); }
    try { return d.toLocaleDateString(this.settings.locale || 'de-DE'); }
    catch (e) { return d.toLocaleDateString('de-DE'); }
  }

  async loadLogo() {
    const p = (this.settings.logoPath || '').trim();
    if (!this.settings.showLogo || !p) return '';
    try {
      const ab = await this.app.vault.adapter.readBinary(obsidian.normalizePath(p));
      const ext = p.split('.').pop().toLowerCase();
      const mime = ext === 'png' ? 'image/png'
        : ext === 'svg' ? 'image/svg+xml'
        : ext === 'gif' ? 'image/gif'
        : ext === 'webp' ? 'image/webp'
        : 'image/jpeg';
      return `data:${mime};base64,${arrayBufferToBase64(ab)}`;
    } catch (e) {
      new obsidian.Notice('Briefkopf: Logo konnte nicht geladen werden – ' + p);
      return '';
    }
  }

  /* ---- resolve the active note into a letter model ---- */

  async resolveLetter() {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== 'md') {
      new obsidian.Notice('Briefkopf: Bitte zuerst eine Markdown-Notiz öffnen.');
      return null;
    }
    const cache = this.app.metadataCache.getFileCache(file);
    const idx = buildFmIndex(cache && cache.frontmatter);
    const s = this.settings;

    const content = await this.app.vault.cachedRead(file);
    const body = this.stripFrontmatter(content);
    const bodyHtml = await this.renderMarkdownToHtml(body, file.path);

    const senderName    = getField(idx, ALIASES.sName)    || s.sender.name;
    const senderZusatz  = getField(idx, ALIASES.sZusatz)  || s.sender.zusatz;
    const senderStrasse = getField(idx, ALIASES.sStrasse) || s.sender.strasse;
    const senderPlzOrt  = getField(idx, ALIASES.sPlzOrt)  || s.sender.plzOrt;
    const senderTelefon = getField(idx, ALIASES.sTelefon) || s.sender.telefon;
    const senderEmail   = getField(idx, ALIASES.sEmail)   || s.sender.email;
    const senderWeb     = getField(idx, ALIASES.sWeb)     || s.sender.web;

    let ruecksende = (s.returnAddressLine || '').trim();
    if (!ruecksende) {
      ruecksende = [senderName, senderStrasse, senderPlzOrt].filter(Boolean).join(' · ');
    }

    const model = {
      recipient: toLines(getField(idx, ALIASES.recipient)),
      betreff: getField(idx, ALIASES.betreff) || '',
      anrede: getField(idx, ALIASES.anrede) || '',
      gruss: getField(idx, ALIASES.gruss) || s.defaultGruss || '',
      unterschrift: getField(idx, ALIASES.unterschrift) || senderName || '',
      ort: getField(idx, ALIASES.ort) || '',
      datum: this.formatDate(getField(idx, ALIASES.datum)),
      ihrZeichen: getField(idx, ALIASES.ihrZeichen) || '',
      ihrSchreiben: getField(idx, ALIASES.ihrSchreiben) || '',
      unserZeichen: getField(idx, ALIASES.unserZeichen) || '',
      telefonBezug: getField(idx, ALIASES.telefonBezug) || senderTelefon || '',
      senderName, senderZusatz, senderStrasse, senderPlzOrt,
      senderTelefon, senderEmail, senderWeb,
      ruecksende,
      bodyHtml,
      logo: await this.loadLogo()
    };

    if (model.recipient.length === 0) {
      new obsidian.Notice('Briefkopf: Kein Empfänger im Frontmatter (Feld „empfaenger").');
    }
    return model;
  }

  buildLetterHtml(m) {
    const s = this.settings;
    const marks =
      (s.showFoldMarks ? '<div class="bk-mark bk-f1"></div><div class="bk-mark bk-f2"></div>' : '') +
      (s.showHoleMark ? '<div class="bk-mark bk-lo"></div>' : '');

    if (s.theme === 'modern') {
      const senderLines = [m.senderZusatz, m.senderStrasse, m.senderPlzOrt, m.senderTelefon, m.senderEmail, m.senderWeb]
        .filter(Boolean).map((x) => `<div>${esc(x)}</div>`).join('');
      return `<div class="bk-letter bk-modern">
        ${marks}
        <header class="bk-m-head">
          ${m.logo ? `<img class="bk-m-logo" src="${m.logo}" alt="">` : '<div></div>'}
          <div class="bk-m-sender">
            ${m.senderName ? `<div class="bk-m-name">${esc(m.senderName)}</div>` : ''}
            ${senderLines}
          </div>
        </header>
        <section class="bk-m-recipient">${escLines(m.recipient)}</section>
        <div class="bk-m-date">${m.ort ? esc(m.ort) + ', ' : ''}${esc(m.datum)}</div>
        ${m.betreff ? `<div class="bk-betreff">${esc(m.betreff)}</div>` : ''}
        ${m.anrede ? `<div class="bk-anrede">${esc(m.anrede)}</div>` : ''}
        <div class="bk-body">${m.bodyHtml}</div>
        ${m.gruss ? `<div class="bk-gruss">${esc(m.gruss)}</div>` : ''}
        ${m.unterschrift ? `<div class="bk-signatur">${escLines(toLines(m.unterschrift))}</div>` : ''}
      </div>`;
    }

    // DIN 5008
    const head = m.logo
      ? `<header class="bk-head"><img src="${m.logo}" alt=""></header>`
      : (m.senderName ? `<header class="bk-head"><div class="bk-head-name">${esc(m.senderName)}</div></header>` : '');

    const col = (label, val, always) => {
      if (!val && !always) return '';
      return `<div class="bk-col"><span class="lbl">${esc(label)}</span>${esc(val || '')}</div>`;
    };

    const reference = s.showBezugszeichen
      ? `<div class="bk-bezug">
            ${col('Ihr Zeichen', m.ihrZeichen)}
            ${col('Ihr Schreiben vom', m.ihrSchreiben)}
            ${col('Unser Zeichen', m.unserZeichen)}
            ${col('Telefon', m.telefonBezug)}
            ${col('Datum', m.datum, true)}
         </div>`
      : `<div class="bk-date">${m.ort ? esc(m.ort) + ', den ' : ''}${esc(m.datum)}</div>`;

    const info = `<section class="bk-info">
        ${m.senderName ? `<div class="bk-info-name">${esc(m.senderName)}</div>` : ''}
        ${m.senderZusatz ? `<div>${esc(m.senderZusatz)}</div>` : ''}
        ${m.senderStrasse ? `<div>${esc(m.senderStrasse)}</div>` : ''}
        ${m.senderPlzOrt ? `<div>${esc(m.senderPlzOrt)}</div>` : ''}
        ${(m.senderTelefon || m.senderEmail || m.senderWeb) ? '<div class="bk-info-sp"></div>' : ''}
        ${m.senderTelefon ? `<div>Tel.: ${esc(m.senderTelefon)}</div>` : ''}
        ${m.senderEmail ? `<div>${esc(m.senderEmail)}</div>` : ''}
        ${m.senderWeb ? `<div>${esc(m.senderWeb)}</div>` : ''}
      </section>`;

    return `<div class="bk-letter bk-din">
      ${marks}
      ${head}
      <section class="bk-anschrift">
        ${m.ruecksende ? `<div class="bk-ruecksende">${esc(m.ruecksende)}</div>` : ''}
        <div class="bk-empf">${escLines(m.recipient)}</div>
      </section>
      ${info}
      <div class="bk-content">
        ${reference}
        ${m.betreff ? `<div class="bk-betreff">${esc(m.betreff)}</div>` : ''}
        ${m.anrede ? `<div class="bk-anrede">${esc(m.anrede)}</div>` : ''}
        <div class="bk-body">${m.bodyHtml}</div>
        ${m.gruss ? `<div class="bk-gruss">${esc(m.gruss)}</div>` : ''}
        ${m.unterschrift ? `<div class="bk-signatur">${escLines(toLines(m.unterschrift))}</div>` : ''}
      </div>
    </div>`;
  }

  /* ---- export via print dialog (desktop + iOS) ---- */

  async exportLetter() {
    const m = await this.resolveLetter();
    if (!m) return;
    const html = this.buildLetterHtml(m);
    const css = buildCss(this.settings);
    this.doPrint(html, css);
  }

  doPrint(letterHtml, css) {
    const oldRoot = document.getElementById('briefkopf-print-root');
    if (oldRoot) oldRoot.remove();
    const oldStyle = document.getElementById('briefkopf-print-style');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.id = 'briefkopf-print-style';
    style.textContent = css + PRINT_WRAPPER_CSS;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'briefkopf-print-root';
    root.innerHTML = letterHtml;
    document.body.appendChild(root);

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      root.remove();
      style.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    // give layout + embedded images a tick, then open the print/save-as-PDF dialog
    setTimeout(() => { try { window.print(); } catch (e) { new obsidian.Notice('Briefkopf: Druck nicht möglich.'); cleanup(); } }, 150);
    // safety net for platforms that never fire 'afterprint' (some iOS cases)
    setTimeout(cleanup, 60000);
  }

  /* ---- on-screen preview ---- */

  async previewLetter() {
    const m = await this.resolveLetter();
    if (!m) return;
    const html = this.buildLetterHtml(m);
    const css = buildCss(this.settings);
    new BriefkopfPreviewModal(this.app, this, html, css).open();
  }
}

/* ------------------------------------------------------------------ *
 *  Preview modal
 * ------------------------------------------------------------------ */

class BriefkopfPreviewModal extends obsidian.Modal {
  constructor(app, plugin, html, css) {
    super(app);
    this.plugin = plugin;
    this.html = html;
    this.css = css;
  }

  onOpen() {
    this.modalEl.addClass('briefkopf-preview-modal');
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: 'Brief-Vorschau' });

    const frame = contentEl.createEl('iframe', { cls: 'briefkopf-preview-frame' });
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8">
      <style>${this.css}${SCREEN_PREVIEW_CSS}</style></head><body>${this.html}</body></html>`;

    const actions = contentEl.createDiv({ cls: 'briefkopf-preview-actions' });
    const exportBtn = actions.createEl('button', { text: 'Als PDF exportieren', cls: 'mod-cta' });
    exportBtn.onclick = () => { this.close(); this.plugin.exportLetter(); };
    const closeBtn = actions.createEl('button', { text: 'Schließen' });
    closeBtn.onclick = () => this.close();
  }

  onClose() { this.contentEl.empty(); }
}

/* ------------------------------------------------------------------ *
 *  Settings tab
 * ------------------------------------------------------------------ */

class BriefkopfSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Briefkopf – Letter Generator' });

    new obsidian.Setting(containerEl)
      .setName('Theme')
      .setDesc('Layout-Vorlage für den Brief.')
      .addDropdown((d) => d
        .addOption('din5008', 'DIN 5008 (deutscher Standard)')
        .addOption('modern', 'Modern / International')
        .setValue(s.theme)
        .onChange(async (v) => { s.theme = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl)
      .setName('DIN-5008-Form')
      .setDesc('Form A: Briefkopf 27 mm · Form B: Briefkopf 45 mm (mehr Platz fürs Logo).')
      .addDropdown((d) => d
        .addOption('A', 'Form A (27 mm)')
        .addOption('B', 'Form B (45 mm)')
        .setValue(s.dinForm)
        .onChange(async (v) => { s.dinForm = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('div', { text: 'Absender-Profil', cls: 'briefkopf-settings-section' });
    containerEl.createEl('p', { text: 'Standard-Absender. Pro Brief im Frontmatter überschreibbar (z. B. absender_name).', cls: 'setting-item-description' });

    const senderField = (name, key, ph) => new obsidian.Setting(containerEl)
      .setName(name)
      .addText((t) => t.setPlaceholder(ph || '').setValue(s.sender[key] || '')
        .onChange(async (v) => { s.sender[key] = v; await this.plugin.saveSettings(); }));

    senderField('Name', 'name', 'Max Mustermann');
    senderField('Zusatz / Firma', 'zusatz', 'Muster GmbH');
    senderField('Straße', 'strasse', 'Musterstraße 1');
    senderField('PLZ + Ort', 'plzOrt', '12345 Musterstadt');
    senderField('Telefon', 'telefon', '+49 30 1234567');
    senderField('E-Mail', 'email', 'kontakt@example.com');
    senderField('Website', 'web', 'www.example.com');

    new obsidian.Setting(containerEl)
      .setName('Rücksendeangabe')
      .setDesc('Kleine Zeile über der Empfängeranschrift. Leer = automatisch (Name · Straße · PLZ Ort).')
      .addText((t) => t.setPlaceholder('automatisch').setValue(s.returnAddressLine)
        .onChange(async (v) => { s.returnAddressLine = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('div', { text: 'Elemente', cls: 'briefkopf-settings-section' });

    new obsidian.Setting(containerEl).setName('Faltmarken')
      .setDesc('Zwei Markierungen zum Falten fürs Fensterkuvert (DIN 5008).')
      .addToggle((t) => t.setValue(s.showFoldMarks).onChange(async (v) => { s.showFoldMarks = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName('Lochmarke')
      .setDesc('Markierung bei 148,5 mm zum Abheften.')
      .addToggle((t) => t.setValue(s.showHoleMark).onChange(async (v) => { s.showHoleMark = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName('Bezugszeichenzeile')
      .setDesc('Zeile mit Ihr Zeichen / Ihr Schreiben / Unser Zeichen / Telefon / Datum.')
      .addToggle((t) => t.setValue(s.showBezugszeichen).onChange(async (v) => { s.showBezugszeichen = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName('Logo anzeigen')
      .addToggle((t) => t.setValue(s.showLogo).onChange(async (v) => { s.showLogo = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName('Logo-Pfad')
      .setDesc('Vault-relativer Pfad zu einer Bilddatei, z. B. assets/logo.png')
      .addText((t) => t.setPlaceholder('assets/logo.png').setValue(s.logoPath)
        .onChange(async (v) => { s.logoPath = v; await this.plugin.saveSettings(); }));

    containerEl.createEl('div', { text: 'Typografie & Sonstiges', cls: 'briefkopf-settings-section' });

    new obsidian.Setting(containerEl).setName('Schriftart (CSS font-family)')
      .addText((t) => t.setValue(s.fontFamily)
        .onChange(async (v) => { s.fontFamily = v || DEFAULT_SETTINGS.fontFamily; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName('Schriftgröße (pt)')
      .addText((t) => t.setValue(String(s.fontSizePt))
        .onChange(async (v) => { s.fontSizePt = Number(v) || 11; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName('Datums-Locale')
      .setDesc('z. B. de-DE, en-GB, en-US')
      .addText((t) => t.setValue(s.locale)
        .onChange(async (v) => { s.locale = v || 'de-DE'; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName('Standard-Grußformel')
      .addText((t) => t.setValue(s.defaultGruss)
        .onChange(async (v) => { s.defaultGruss = v; await this.plugin.saveSettings(); }));

    new obsidian.Setting(containerEl).setName('Eigenes CSS')
      .setDesc('Wird ans Theme angehängt – volle Kontrolle übers Styling. „Preset einfügen" lädt einen kommentierten Startpunkt (überschreibt das Feld).')
      .addButton((b) => b.setButtonText('Preset einfügen').onClick(async () => {
        s.customCss = PRESET_CSS;
        await this.plugin.saveSettings();
        this.display();
      }));

    new obsidian.Setting(containerEl)
      .addTextArea((t) => {
        t.setValue(s.customCss).onChange(async (v) => { s.customCss = v; await this.plugin.saveSettings(); });
        t.inputEl.rows = 12;
        t.inputEl.style.width = '100%';
        t.inputEl.style.fontFamily = 'var(--font-monospace)';
      });
  }
}

module.exports = BriefkopfPlugin;
