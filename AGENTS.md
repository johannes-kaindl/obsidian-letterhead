# AGENTS.md — obsidian-letterhead

> **Workspace-Standards:** Die verbindliche Leitkonvention steht in
> `../_docs/CONVENTIONS.md` (Modell comply-or-explain). Begründete Abweichungen
> stehen unten unter „Abweichungen von der Leitkonvention".

Conventions for AI agents (Claude Code, Codex, …) working on this repository.

## Project character

Obsidian-Plugin „Letterhead": macht aus der aktiven Notiz einen formatierten
Geschäftsbrief (DIN 5008 Form A/B + „Modern"-Theme) und exportiert ihn über den
OS-Druckdialog als PDF — Desktop **und iOS**. TypeScript + `esbuild`-Build (`src/`
→ `main.js`), ohne Laufzeit-Abhängigkeiten; `main.js` ist Build-Output (gitignored,
nicht committet) und läuft auf Mobile ohne Node/Electron-APIs.

- **Plugin-ID:** `letterhead` (deployed unter `.obsidian/plugins/letterhead/`).
- **Test-Vault:** `/Users/Shared/10_ObsidianVaults/10_Pallas/`.

## Architecture principles

- Kein Electron-/Node-API zur Laufzeit → mobil-tauglich. Nur Obsidian-API +
  Browser-APIs im gebauten `main.js`.
- Reine Funktionen (`src/core/*`, `src/vendor/kit/pdf/*`) sind frei von
  Obsidian-Imports und damit isoliert mit `vitest` testbar (PROF-OBS-04). Die Grenze
  wird von `npm run check:pure` erzwungen (kein `from 'obsidian'`-Import in
  `src/core` oder `src/vendor`).
- Styling ausschließlich über CSS Custom Properties (Design-Tokens): Geometrie ist
  DIN-kritisch (Fensterkuvert), Typo/Farbe/Spacing frei. Token-Referenz:
  `docs/reference/theming.md`.
- Export ist plattformabhängig (`Platform.isDesktopApp`, die **einzige** Platform-Abfrage
  in `src/`): **Desktop** = `doPrint()` → `window.print()` + `@media print` (blendet die
  Obsidian-DOM aus, schreibt keine Datei — der OS-Druckdialog übernimmt). **iOS/iPad** =
  `window.print()` ist dort wirkungslos, daher baut `exportViaPdf()` das Vektor-PDF und
  `writePdf()` (`src/obsidian/output.ts`) reicht es weiter: Datei in den versteckten
  Export-Ordner `.letterhead-export/`, dann **capability**-gegatete Kaskade
  `navigator.canShare({files})` → `navigator.share()` (Ein-Tipp-Share-Sheet) → sonst
  `app.openWithDefaultApp()`. Keine Netzwerkzugriffe, keine Telemetrie, externe Assets
  nur als `data:`-URL (Logo).
  > **Historisch:** Bis 1.3.0 schrieb `exportViaShare()` hier ein eigenständiges HTML
  > (`buildStandaloneDoc`) für den Quick-Look-Umweg. Die Methode **existiert seit 1.4.0
  > nicht mehr**; `buildStandaloneDoc` lebt noch in `html-engine.ts`, wird aber von keinem
  > Export-Pfad mehr aufgerufen (Löschkandidat). Mobile ist seither immer Vektor-PDF
  > (Degradation statt Fallback).
- **Vektor-PDF-Export (ab 1.3.0, seit 1.4.0 mit reichen Bodies):** Die Engine ist das
  vendorte, geteilte Kit `src/vendor/kit/pdf/` (nicht mehr ein In-`main.js`-Writer) —
  erzeugt ein echtes, textselektierbares Vektor-PDF (PDF 1.7, Adobe-Core-14-
  Standardschriften, WinAnsi mit Umlauten/€) ohne Fremdbibliothek für PDF. Auf Mobile
  teilt `exportViaPdf()` es per `navigator.share()` (ein Tipp), sonst
  `openWithDefaultApp()`. Reine, Obsidian-freie Schichten unter `src/vendor/kit/pdf/`:
  `writer`/`encoding` (Byte-Writer), `layout`/`geometry` (DIN-Geometrie → Draw-Ops,
  AFM-Metriken via `metrics`), `ir` (Body-IR) — gefüttert aus `src/core/dom-to-ir.ts`
  (`domToIrSync`, Nachfolger von `walkBodyNodes`). Tabellen, eingebettete Bilder, Code-Blöcke und
  mehrseitige Paginierung werden seit 1.4.0 direkt im Vektor-PDF gerendert (Degradation
  bei nicht unterstützten Elementen). **Kein HTML/Quick-Look-Fallback mehr:** das Setting
  `mobileExport` wird von keinem Codepfad gelesen und ist als UI-Zeile entfernt; der
  Schlüssel bleibt nur in `DEFAULT_SETTINGS` stehen, damit alte gespeicherte Werte
  (inkl. `'print'`) ohne Migration laden. Die Engine selbst zieht keine
  Laufzeit-Dependency, aber das Bündeln erfolgt über den `esbuild`-Build — `main.js` ist
  Build-Output, nicht committete Quelle.

## Commands

```bash
npm run typecheck  # tsc --noEmit
npm test           # vitest run (reine, Obsidian-freie Specs für src/core + src/vendor)
npm run build      # tsc --noEmit + esbuild --production → main.js
npm run check:pure # kein `from 'obsidian'`-Import in src/core, src/vendor
npm run gate       # typecheck && test && check:pure && build — CI-Gate, siehe Releasing
npm run deploy     # build, dann cp manifest.json main.js styles.css versions.json → $OBSIDIAN_PLUGIN_DIR
```

Manuelles Deploy-Ziel: `<vault>/.obsidian/plugins/letterhead/`.

## Releasing

Releases erzeugt **GitHub Actions** (`.github/workflows/release.yml`), getriggert durch
einen Tag-Push, der GitHub erreicht: `git push github <tag>` (Tag ohne v-Präfix). Der
Workflow checkt den Tag aus, führt `npm ci` + `npm run gate` aus (baut also `main.js`
frisch aus `src/`) und erstellt das GitHub-Release **und** eine
Sigstore-Artifact-Attestation (SLSA-Provenance) auf die dabei gebauten
`main.js`/`manifest.json`/`styles.css` — das attestierte Subjekt ist Build-Output aus
dem getaggten Commit, nicht eine committete Kopie.

- **Nicht mehr** manuell `gh release create` aufrufen: Die Attestation kann nur der
  Actions-Lauf signieren (OIDC-Identität = Workflow, nicht Laptop); ein manuelles
  Release für denselben Tag hätte keine Provenance und kollidiert mit dem Workflow.
- `origin` bleibt Codeberg; nur der Tag muss zusätzlich auf den `github`-Remote, damit
  der Workflow feuert. Voraussetzung: Actions sind im Mirror-Repo aktiviert.

## Conventions

- Conventional Commits; SemVer-Tags **ohne** v-Präfix; nur berührte Dateien stagen.
- Remotes: Codeberg `origin`, GitHub-Mirror für Obsidian-Verzeichnis/BRAT.
- Frontmatter-Felder deutsch-first mit Aliassen (`docs/reference/frontmatter.md`).
- Doku ist zweisprachig: Änderungen immer in **beiden** Sprachen pflegen
  (EN `*.md` + DE `*.de.md`), sonst driften die Versionen auseinander.
- Workspace-weite Standards: `../_docs/CONVENTIONS.md`.

## Gotchas

- Der Desktop-Druck läuft seit 1.4.1 über ein **eigenes iframe** (`doPrint`,
  `srcdoc` = `buildStandaloneDoc`) statt über `@media print` + Ausblenden der
  Obsidian-DOM. Grund: der Store-Review von 1.4.0 verbot beides (`<style>` in
  `document.head`, `innerHTML` auf der App-DOM).
  **Bedingung, an der das hängt:** `doPrint` darf ausschließlich hinter
  `Platform.isDesktopApp` aufgerufen werden (aktuell genau eine Stelle,
  `main.ts` in `exportLetter`). Auf iOS druckt iframe-`print()` das
  Eltern-Dokument — dort geht der Export über `exportViaPdf`, nie über `doPrint`.
  Wer einen zweiten `doPrint`-Aufrufer ergänzt, muss dieses Gate mitziehen.
- `MarkdownRenderer.render(app, …)` vs. ältere `renderMarkdown` — Feature-Detection
  beibehalten (siehe `renderMarkdownToHtml`).
- DIN-Maße (Kopf 45/27 mm, Falz 105/210 bzw. 87/192 mm, Loch 148,5 mm) sind
  kuvert-kritisch; Änderungen nur mit Render-Check (siehe `tools/render-hero.sh`).
- Gedruckt wird mit festen `@page`-Rändern (Seite 1 oben 10 mm, Folgeseiten oben
  25 mm, unten 20 mm — Drucker-Beschnitt + Seitenumbruch-Ränder). Die
  `--bk-din-*`-Tokens bleiben trotzdem **papierbezogen**: die Komponenten ziehen
  `--bk-print-margin-top` per `calc()` ab. Die Vorschau paginiert den Brief in
  `.bk-sheet`-Blätter mit denselben Schnitthöhen (Modal `paginate()`). Beim
  Ändern von Positionen immer dieses Schema beibehalten.
- `main.js`/`main.js.map` sind Build-Output (gitignored) — **nicht** committen; Quelle
  ist `src/`.

## Memory

Projekt-Memory unter `~/.claude/projects/<slug>/memory/` (Index: `MEMORY.md`).
Session-Handoff unter `.remember/` (gitignored).

## Abweichungen von der Leitkonvention

- **PROF-TS-01..04** — entfällt seit dem Umbau auf TypeScript + `esbuild` + `vitest`
  (`src/` → `main.js`, Tests via `npm test`, Gate via `npm run gate`): das Plugin
  entspricht jetzt dem Standardprofil `ts-node · obsidian-plugin`, keine Abweichung
  mehr. Grund für den Umbau: der PDF-Engine-Kern wird als geteiltes Kit
  (`src/vendor/kit/`) vendored statt pro Plugin neu geschrieben — das ist mit reinem
  Zero-Build nicht mehr praktikabel (siehe `CHANGELOG.md` → 1.4.0).
- **CORE-META-03** — Hero/Screenshot reproduzierbar via `tools/render-hero.sh`
  (benötigt `weasyprint` + `poppler`/`pdftoppm`) statt eines npm-Screenshot-Tools.

## Dach-Kontext (obsidian-plugins)

Dieses Repo liegt unter dem Koordinations-Dach `/Users/Shared/code/obsidian-plugins/`.
**Vor dem Lösen eines Problems:** `../AGENTS.md` (Kit-first-Regel) und `../REGISTRY.md`
(Lösungs-Registry) prüfen — viele Probleme sind in Nachbar-Plugins oder im
`obsidian-kit` bereits gelöst.

**Vor jeder UI-Arbeit** (Views, Modals, Settings-Tabs, CSS): `../UI-STANDARD.md` ist
verbindlich (Obsidian-nativ first, ein Frontend pro Plugin, nur Theme-CSS-Variablen).
