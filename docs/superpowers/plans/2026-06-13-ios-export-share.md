# iOS-Export via Teilen-Sheet + Vorschau-Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auf iOS/iPad ersetzt ein Teilen-Sheet-Pfad den toten `window.print()`-Export; die Vorschau wird auf schmalen Viewports lesbar; manifest/Doku werden ehrlich.

**Architecture:** Plattform-Verzweigung in `exportLetter()`: Desktop behält `doPrint()` (`window.print()`), Mobile schreibt den Brief als eigenständige HTML-Datei in den Vault und übergibt sie via `app.openWithDefaultApp()` ans iOS-System. Eine reine Bau-Funktion `buildStandaloneDoc()` erzeugt das Dokument mit eigenem, am Bildschirm sichtbarem Wrapper-CSS plus `@page`-Rändern. Der Vorschau-Fix tauscht das iOS-untaugliche CSS-`zoom` gegen `transform: scale()`.

**Tech Stack:** Vanilla JS (Zero-Build, keine Dependency), Obsidian-API (`Platform`, `Modal`, `vault.adapter`, `openWithDefaultApp`). Verifikation via `npm run check` (`node --check`) + manueller Desktop-Test + iOS-Geräte-Gate. **Kein Test-Framework** — bewusste Projekt-Konvention (PROF-TS-01..04, AGENTS.md); User-Instruktion hat Vorrang vor TDD-Default.

---

## Vorbemerkung zur Verifikation

Das Repo hat bewusst kein vitest/jest/node:test-Setup und `main.js` lädt `obsidian` top-level (nicht ohne Mock in Node ladbar). Jede Code-Task endet daher mit `npm run check` (Syntax-Gate) statt einem Unit-Test. Funktionale Korrektheit wird in Task 9 (Desktop) und Task 10 (iOS-Gate) manuell verifiziert. Das ist die etablierte Repo-Praxis, kein Auslassen.

---

## File Structure

- `main.js` — alle Code-Änderungen (Single-File-Bundle, „Quelle = Output"):
  - neue Konstante `STANDALONE_WRAPPER_CSS` (bei den anderen CSS-Konstanten, ~Zeile 586)
  - neue reine Funktion `buildStandaloneDoc(letterHtml, css)` (nach `buildCss`, ~Zeile 585)
  - neue i18n-Keys `share_*` in beiden `UI_STRINGS`-Blöcken (en ~Zeile 238, de ~Zeile 238+)
  - neue Klasse `BriefkopfShareModal` (nach `BriefkopfPreviewModal`, ~Zeile 1170)
  - `exportLetter()` Plattform-Branch + neue Methode `exportViaShare()` (~Zeile 1027)
  - `fitPreview()` zoom→transform (~Zeile 1143)
- `manifest.json`, `package.json`, `versions.json` — Version 1.2.0 + ehrliche Description
- `docs/` — Export-Beschreibung angleichen

---

## Task 1: info_1–info_4-Fix verifizieren und committen

Der Fix in `insertFrontmatterTemplate()` ist bereits im Working Tree (Schleife `for (let i = 1; i <= 4; i++)` statt nur `info_1`). Diese Task sichert ihn als eigenen Commit.

**Files:**
- Modify (bereits geschehen): `main.js` (`insertFrontmatterTemplate`, ~Zeile 700–730)

- [ ] **Step 1: Bestehende Änderung sichten**

Run: `git diff main.js`
Erwartet: Der `K`-Map fehlt `info1`; eine `for`-Schleife setzt `fm['info_' + i]` für i=1..4.

- [ ] **Step 2: Syntax-Gate**

Run: `npm run check`
Erwartet: kein Output, Exit 0.

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "fix: Frontmatter-Vorlage setzt info_1 bis info_4 statt nur info_1"
```

---

## Task 2: `buildStandaloneDoc()` + Wrapper-CSS

Eine reine Funktion, die aus Brief-HTML + CSS ein vollständiges, eigenständiges HTML-Dokument baut. Anders als `PRINT_WRAPPER_CSS` (versteckt den Brief am Bildschirm mit `#briefkopf-print-root{display:none}`) muss der Brief hier auch am Bildschirm sichtbar sein, mit erhaltenen `@page`-Rändern.

**Files:**
- Modify: `main.js` — neue Konstante + Funktion direkt nach `PRINT_WRAPPER_CSS` (endet ~Zeile 597)

- [ ] **Step 1: Konstante und Funktion einfügen**

Direkt nach dem schließenden `` `; `` von `PRINT_WRAPPER_CSS` einfügen:

```js
/* Wrapper for the standalone export file (iOS share path): unlike
   PRINT_WRAPPER_CSS, the letter must be visible on screen too (the user opens
   the file in Safari before printing), while keeping the same @page margins. */
const STANDALONE_WRAPPER_CSS = `
  @page{ size:A4; margin:${PRINT_MARGIN_TOP_FOLLOW_MM}mm 0 ${PRINT_MARGIN_BOTTOM_MM}mm 0; }
  @page:first{ margin-top:${PRINT_MARGIN_TOP_MM}mm; }
  html, body{ margin:0; padding:0; background:#fff; }
  .bk-body p{ orphans:2; widows:2; }
  .bk-signature, .bk-enclosures, .bk-closing{ break-inside:avoid; }
`;

/* Build a self-contained HTML document for the iOS share/print path. Pure:
   no Obsidian imports. letterHtml comes from buildLetterHtml (esc()-escaped),
   css from buildCss (includes the --bk-* tokens and the data:-URL logo). */
function buildStandaloneDoc(letterHtml, css) {
  return `<!doctype html><html lang="de"><head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>Brief</title>` +
    `<style>${css}${STANDALONE_WRAPPER_CSS}</style>` +
    `</head><body>${letterHtml}</body></html>`;
}
```

- [ ] **Step 2: Syntax-Gate**

Run: `npm run check`
Erwartet: kein Output, Exit 0.

- [ ] **Step 3: Contract-Check des Wrapper-CSS**

`buildStandaloneDoc` ist nicht exportiert (Single-File-Bundle), daher prüfen wir den entscheidenden Vertrag per Quelltext: Die Standalone-Variante darf den Brief **nicht** am Bildschirm verstecken (kein `display:none` im Wrapper, anders als `PRINT_WRAPPER_CSS`).

```bash
node -e '
const src = require("fs").readFileSync("main.js","utf8");
const wrap = src.split("STANDALONE_WRAPPER_CSS = `")[1].split("`;")[0];
const ok = src.includes("function buildStandaloneDoc") && wrap && !wrap.includes("display:none");
console.log(ok ? "OK: standalone wrapper present, visible on screen" : "FAIL");
process.exit(ok ? 0 : 1);
'
```
Erwartet: `OK: standalone wrapper present, visible on screen`

- [ ] **Step 4: Commit**

```bash
git add main.js
git commit -m "feat: buildStandaloneDoc() + Wrapper-CSS fuer eigenstaendige Export-Datei"
```

---

## Task 3: i18n-Keys für das Teilen-Modal

**Files:**
- Modify: `main.js` — beide `UI_STRINGS`-Blöcke (en ~Zeile 158–245, de ~Zeile 228–298), bei den `modal_*`-Keys

- [ ] **Step 1: en-Keys einfügen**

Im **englischen** Block, neben `modal_export` / `modal_close`, hinzufügen:

```js
    share_title: 'Export to PDF on iPhone / iPad',
    share_intro: 'The letter was saved as a file. To turn it into a PDF:',
    share_step1: 'Tap "Open" below, then choose Safari (or "Open in…").',
    share_step2: 'In Safari: tap the Share button.',
    share_step3: 'Choose "Print", then pinch the preview and save as PDF.',
    share_open: 'Open',
    notice_share_failed: 'Briefkopf: Could not hand the file to the system.',
```

- [ ] **Step 2: de-Keys einfügen**

Im **deutschen** Block, an gleicher Stelle, hinzufügen:

```js
    share_title: 'PDF-Export auf iPhone / iPad',
    share_intro: 'Der Brief wurde als Datei gespeichert. So wird ein PDF daraus:',
    share_step1: 'Unten auf „Öffnen" tippen, dann Safari wählen (oder „Öffnen in…").',
    share_step2: 'In Safari: auf das Teilen-Symbol tippen.',
    share_step3: '„Drucken" wählen, dann die Vorschau aufziehen und als PDF sichern.',
    share_open: 'Öffnen',
    notice_share_failed: 'Briefkopf: Datei konnte nicht ans System übergeben werden.',
```

- [ ] **Step 3: Syntax-Gate**

Run: `npm run check`
Erwartet: kein Output, Exit 0.

- [ ] **Step 4: Commit**

```bash
git add main.js
git commit -m "i18n: Strings fuer iOS-Teilen-Modal (en/de)"
```

---

## Task 4: `BriefkopfShareModal`-Klasse

Kleines Modal mit Schritt-Anleitung und einem „Öffnen"-Button, der `app.openWithDefaultApp(path)` aufruft. So liest der Nutzer die Schritte, bevor das System-Sheet aufgeht.

**Files:**
- Modify: `main.js` — neue Klasse direkt nach `BriefkopfPreviewModal` (schließt ~Zeile 1170), vor dem Settings-Tab-Kommentarblock

- [ ] **Step 1: Klasse einfügen**

```js
/* ------------------------------------------------------------------ *
 *  Share modal (iOS export path)
 * ------------------------------------------------------------------ */

class BriefkopfShareModal extends obsidian.Modal {
  constructor(app, path) {
    super(app);
    this.path = path;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: t('share_title') });
    contentEl.createEl('p', { text: t('share_intro') });
    const ol = contentEl.createEl('ol');
    [t('share_step1'), t('share_step2'), t('share_step3')]
      .forEach((s) => ol.createEl('li', { text: s }));
    const actions = contentEl.createDiv({ cls: 'briefkopf-preview-actions' });
    const openBtn = actions.createEl('button', { text: t('share_open'), cls: 'mod-cta' });
    openBtn.onclick = async () => {
      try {
        if (typeof this.app.openWithDefaultApp === 'function') {
          await this.app.openWithDefaultApp(this.path);
        }
      } catch (e) {
        console.error('Briefkopf: openWithDefaultApp failed', e);
        new obsidian.Notice(t('notice_share_failed'));
      }
      this.close();
    };
    const closeBtn = actions.createEl('button', { text: t('modal_close') });
    closeBtn.onclick = () => this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}
```

- [ ] **Step 2: Syntax-Gate**

Run: `npm run check`
Erwartet: kein Output, Exit 0.

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "feat: BriefkopfShareModal mit Schritt-Anleitung fuer iOS-Export"
```

---

## Task 5: Plattform-Branch in `exportLetter()` + `exportViaShare()`

**Files:**
- Modify: `main.js` — `exportLetter()` (~Zeile 1027–1033), neue Methode `exportViaShare()` direkt danach

- [ ] **Step 1: `exportLetter()` verzweigen**

Ersetze den Body von `exportLetter()`:

```js
  async exportLetter() {
    const m = await this.resolveLetter();
    if (!m) return;
    const html = this.buildLetterHtml(m);
    const css = buildCss(this.settings, m.stil);
    if (obsidian.Platform.isDesktopApp) {
      this.doPrint(html, css);
    } else {
      await this.exportViaShare(html, css);
    }
  }

  /* iOS/iPad path: window.print() is a no-op in the Obsidian mobile WebView,
     so write the letter as a standalone file into the vault and hand it to the
     system via openWithDefaultApp — the user prints it to PDF from Safari. */
  async exportViaShare(letterHtml, css) {
    const path = '.briefkopf-export.html';
    try {
      const docHtml = buildStandaloneDoc(letterHtml, css);
      await this.app.vault.adapter.write(path, docHtml);
      new BriefkopfShareModal(this.app, path).open();
    } catch (e) {
      console.error('Briefkopf: share export failed', e);
      new obsidian.Notice(t('notice_share_failed'));
    }
  }
```

- [ ] **Step 2: Syntax-Gate**

Run: `npm run check`
Erwartet: kein Output, Exit 0.

- [ ] **Step 3: Bestätigen, dass der Vorschau-Export-Button mitzieht**

Run: `grep -n "exportBtn.onclick" main.js`
Erwartet: `exportBtn.onclick = () => { this.close(); this.plugin.exportLetter(); };` — ruft `exportLetter()`, also greift der Branch automatisch. Keine Änderung nötig.

- [ ] **Step 4: Commit**

```bash
git add main.js
git commit -m "feat: iOS-Export-Pfad via Teilen-Sheet (Platform-Branch in exportLetter)"
```

---

## Task 6: Vorschau-Fix — `zoom` → `transform: scale()`

`doc.body.style.zoom` wird von iOS-WebKit nicht angewandt → die A4-Seite läuft rechts über. `transform: scale()` greift dort zuverlässig.

**Files:**
- Modify: `main.js` — `fitPreview()` (~Zeile 1143–1154)

- [ ] **Step 1: `fitPreview()` ersetzen**

```js
    /* Fit a whole A4 sheet into the frame. CSS `zoom` is ignored by iOS
       WebKit, so scale the stage with transform (works on every platform).
       Height is tracked so the frame scrolls correctly after scaling. */
    const fitPreview = () => {
      try {
        const doc = frame.contentDocument;
        const stage = doc && doc.getElementById('bk-preview-stage');
        const sheet = stage && (doc.querySelector('.bk-sheet') || doc.querySelector('.bk-letter'));
        if (!stage || !sheet) return;
        stage.style.transformOrigin = 'top center';
        stage.style.transform = 'none';
        const pageW = sheet.offsetWidth || 794;
        const z = Math.min(1, (frame.clientWidth - 20) / pageW);
        stage.style.transform = `scale(${z})`;
        doc.body.style.height = Math.ceil(stage.getBoundingClientRect().height * z + 28) + 'px';
      } catch (e) { /* cross-origin or detached frame — leave unscaled */ }
    };
```

- [ ] **Step 2: Syntax-Gate**

Run: `npm run check`
Erwartet: kein Output, Exit 0.

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "fix: Vorschau skaliert via transform statt zoom (iOS-tauglich)"
```

> **Hinweis für die Ausführung:** Die genauen Pixel-Offsets (`-20`, `+28`) sind ein
> getesteter Startpunkt; das visuelle Ergebnis wird in Task 10 am iPhone bestätigt
> und ggf. um wenige Pixel justiert. Desktop-Verhalten (Task 9) darf nicht regredieren.

---

## Task 7: Version 1.2.0 + ehrliche Description

**Files:**
- Modify: `manifest.json`, `package.json`, `versions.json`

- [ ] **Step 1: `manifest.json`**

`version` auf `1.2.0`; `description` ersetzen durch:

```
Generate professionally formatted business letters (DIN 5008 and modern) from note frontmatter and export them to PDF — via the print dialog on desktop, or the system share sheet on iPhone and iPad.
```

- [ ] **Step 2: `package.json`**

`version` auf `1.2.0`; `description` auf denselben Text wie in Step 1.

- [ ] **Step 3: `versions.json`**

Eintrag `"1.2.0": "1.4.0"` ergänzen (gleiche minAppVersion wie bisher).

- [ ] **Step 4: Syntax-Gate (JSON gültig)**

Run: `node -e "require('./manifest.json');require('./package.json');require('./versions.json');console.log('JSON OK')"`
Erwartet: `JSON OK`

- [ ] **Step 5: Commit**

```bash
git add manifest.json package.json versions.json
git commit -m "chore: Release 1.2.0 — Description ehrlich (Desktop-Druck / iOS-Teilen-Sheet)"
```

---

## Task 8: Doku angleichen

**Files:**
- Modify: `docs/` — die Stelle(n), die den Export beschreiben (README/Doku)

- [ ] **Step 1: Export-Stellen finden**

Run: `grep -rln "print dialog\|Druckdialog\|window.print\|iPhone\|iOS" docs/ README.md 2>/dev/null`

- [ ] **Step 2: Beschreibung angleichen**

In den gefundenen Dateien den Export so beschreiben: Desktop exportiert über den OS-Druckdialog (`window.print()`); auf iPhone/iPad schreibt das Plugin den Brief als Datei und übergibt sie via „In Standard-App öffnen" ans System — von Safari aus wird über Teilen → Drucken ein PDF gesichert. `@page`-Ränder (Seite 1 oben 10 mm, Folgeseiten 25 mm, unten 20 mm) gelten in beiden Pfaden.

- [ ] **Step 3: Commit**

```bash
git add docs/ README.md 2>/dev/null; git commit -m "docs: Export-Beschreibung um iOS-Teilen-Weg ergaenzt"
```

---

## Task 9: Desktop-Verifikation (Regression)

Stellt sicher, dass der Desktop-Export unverändert über `window.print()` läuft und Mobile-Code nichts bricht.

**Files:** keine Änderung — nur Verifikation

- [ ] **Step 1: Ins Test-Vault deployen**

Run: `OBSIDIAN_PLUGIN_DIR="/Users/Shared/10_ObsidianVaults/10_Pallas/.obsidian/plugins/briefkopf" npm run deploy`
Erwartet: Dateien kopiert, Exit 0.

- [ ] **Step 2: Manuell in Obsidian Desktop**

1. Obsidian Desktop öffnen, Test-Brief-Notiz aktivieren.
2. „Brief als PDF exportieren / drucken" → der **OS-Druckdialog** muss erscheinen (wie bisher).
3. Vorschau öffnen → Brief wird korrekt skaliert angezeigt (keine Regression durch Task 6).
4. „Frontmatter-Vorlage einfügen" in leere Notiz → `info_1`…`info_4` erscheinen.

Erwartet: Druckdialog erscheint; **keine** `.briefkopf-export.html` wird auf Desktop geschrieben (Branch greift korrekt).

- [ ] **Step 3: Ergebnis festhalten** — falls Abweichung: zurück zur jeweiligen Task.

---

## Task 10: iOS-Geräte-Gate (entscheidet A' vs. Fallback B)

**Files:** keine Änderung — Verifikation durch den Nutzer am iPhone (über Obsidian Sync / BRAT verteilt)

- [ ] **Step 1: Plugin aufs iPhone bringen** (BRAT-Update oder Sync des Plugin-Ordners).

- [ ] **Step 2: Vorschau prüfen**

Test-Brief → Vorschau öffnen. Erwartet: A4-Seite vollständig sichtbar, **nicht** rechts abgeschnitten (Absenderzeile, Infoblock lesbar).

- [ ] **Step 3: Export-Pfad prüfen**

„Als PDF exportieren" → Modal mit Schritten erscheint → „Öffnen" → iOS-Öffnen/Teilen-Sheet geht auf → in Safari öffnen → Teilen → Drucken → als PDF sichern. Erwartet: PDF mit korrekten `@page`-Rändern (Seite 1 oben ~10 mm, Folgeseiten ~25 mm).

- [ ] **Step 4: Gate-Entscheidung**

- **Erfolg** → A' bestätigt. Branch `feat/ios-export-share` nach `main` mergen, taggen `1.2.0`, GitHub-Release mit Assets (`main.js`, `manifest.json`, `styles.css`), Mirror-Sync. Danach Community-PR vorbereiten.
- **Fehlschlag** (kein druckbarer Safari-Pfad / Review-Risiko zu hoch) → **Fallback B**: in `exportLetter()` den Mobile-Zweig durch eine `Notice` ersetzen, dass der PDF-Export auf dem Desktop läuft; `manifest`/`package`-Description auf „export to PDF via the print dialog on desktop" zurücknehmen; Vorschau-Fix (Task 6) bleibt erhalten. Separat committen.

---

## Self-Review (vom Plan-Autor)

**Spec-Abdeckung:** Spec §0→Task 1; §1 (iOS-Export A')→Tasks 2,3,4,5; §2 (Vorschau)→Task 6; §3 (manifest/Doku)→Tasks 7,8; §4 (Fallback B)→Task 10 Step 4. Alle Abschnitte abgedeckt.

**Platzhalter:** keiner — jeder Code-Schritt zeigt vollständigen Code; Verifikationsschritte nennen konkrete Befehle/Erwartungen.

**Typ-/Namens-Konsistenz:** `buildStandaloneDoc(letterHtml, css)`, `STANDALONE_WRAPPER_CSS`, `exportViaShare(letterHtml, css)`, `BriefkopfShareModal(app, path)`, Pfad `.briefkopf-export.html`, i18n-Keys `share_title/share_intro/share_step1..3/share_open/notice_share_failed` — über alle Tasks identisch verwendet.
