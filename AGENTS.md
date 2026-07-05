# AGENTS.md — obsidian-letterhead

> **Workspace-Standards:** Die verbindliche Leitkonvention steht in
> `../_docs/CONVENTIONS.md` (Modell comply-or-explain). Begründete Abweichungen
> stehen unten unter „Abweichungen von der Leitkonvention".

Conventions for AI agents (Claude Code, Codex, …) working on this repository.

## Project character

Obsidian-Plugin „Letterhead": macht aus der aktiven Notiz einen formatierten
Geschäftsbrief (DIN 5008 Form A/B + „Modern"-Theme) und exportiert ihn über den
OS-Druckdialog als PDF — Desktop **und iOS**. Bewusst **abhängigkeitsfreies
Vanilla-JS ohne Build**, damit `main.js` zugleich Quelle und Auslieferung ist und
auf Mobile ohne Toolchain läuft.

- **Plugin-ID:** `letterhead` (deployed unter `.obsidian/plugins/letterhead/`).
- **Test-Vault:** `/Users/Shared/10_ObsidianVaults/10_Pallas/`.

## Architecture principles

- Kein Electron-/Node-API → mobil-tauglich. Nur Obsidian-API + Browser-APIs.
- Reine Funktionen (`buildCss`, `getField`, `toLines`, `esc`, `buildFmIndex`) sind
  frei von Obsidian-Imports und damit in Node testbar (Geist von PROF-OBS-04).
- Styling ausschließlich über CSS Custom Properties (Design-Tokens): Geometrie ist
  DIN-kritisch (Fensterkuvert), Typo/Farbe/Spacing frei. Token-Referenz:
  `docs/reference/theming.md`.
- Export ist plattformabhängig (`Platform.isDesktopApp`): **Desktop** =
  `window.print()` + `@media print` (blendet die Obsidian-DOM aus). **iOS/iPad** =
  `window.print()` ist dort wirkungslos, daher schreibt `exportViaShare()` den Brief
  als eigenständiges HTML (`buildStandaloneDoc`, Dateiname = Notizname) in einen
  versteckten Export-Ordner und übergibt es via `app.openWithDefaultApp()` ans System
  (Schnellansicht → Drucken → als PDF sichern). Keine Netzwerkzugriffe, keine
  Telemetrie, externe Assets nur als `data:`-URL (Logo).
- **Vektor-PDF-Export (ab 1.3.0):** Ein eigener, abhängigkeits- und build-freier
  PDF-Writer in `main.js` (Sektionen `PDF · …`) erzeugt ein echtes, textselektierbares
  Vektor-PDF (PDF 1.7, Adobe-Core-14-Standardschriften, WinAnsi mit Umlauten/€). Auf
  Mobile teilt `exportViaPdf()` es per `navigator.share()` (ein Tipp), sonst
  `openWithDefaultApp()`. Reine, Obsidian-freie Schichten: `pdf` (Byte-Writer), `layout`
  (DIN-Geometrie → Draw-Ops, AFM-Metriken), Body-Walk `walkBodyNodes`. Bei komplexem
  Body (Tabellen/Bilder/Code) oder Setting `mobileExport: 'print'` greift automatisch
  der HTML/Quick-Look-Weg als Fallback. Keine neue Dependency, kein Build — `source =
  output` bleibt gewahrt.

## Commands

```bash
npm run check     # node --check main.js (Syntax-Gate)
npm test          # node --test (reine node:test-Specs für die puren PDF-Funktionen)
npm run deploy    # cp manifest.json main.js styles.css versions.json → $OBSIDIAN_PLUGIN_DIR
```

Manuelles Deploy-Ziel: `<vault>/.obsidian/plugins/letterhead/`.
Es gibt bewusst **keinen** build/test/lint/typecheck-Schritt (siehe Abweichungen).

## Releasing

Releases erzeugt **GitHub Actions** (`.github/workflows/release.yml`), getriggert durch
einen Tag-Push, der GitHub erreicht: `git push github <tag>` (Tag ohne v-Präfix). Der
Workflow erstellt das GitHub-Release **und** eine Sigstore-Artifact-Attestation
(SLSA-Provenance) auf die committeten `main.js`/`manifest.json`/`styles.css` — **ohne
Build**; das attestierte Subjekt ist byte-identisch mit der Quelle (verstärkt
source-as-output statt es zu ersetzen).

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

- Export hängt an `@media print` + Ausblenden der Obsidian-DOM. **Nicht** auf
  iframe-`print()` umbauen — iOS druckt dann das Eltern-Dokument.
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
- `main.js` ist die Quelle — nicht minifizieren/bundeln und committen.

## Memory

Projekt-Memory unter `~/.claude/projects/<slug>/memory/` (Index: `MEMORY.md`).
Session-Handoff unter `.remember/` (gitignored).

## Abweichungen von der Leitkonvention

- **PROF-TS-01..04** — Bewusst **kein** TypeScript/esbuild/vitest-Setup. Das Plugin
  ist abhängigkeitsfreies Zero-Build-Vanilla-JS (`main.js` = Quelle = Output),
  Begründung analog zur No-Build-Pflicht PROF-WEB-01. Syntax-Gate via
  `npm run check` (`node --check`) statt typecheck/build. Unit-Tests sind als reine
  `node:test`-Specs (`npm test`, ohne Build-Toolchain) für die Obsidian-freien
  PDF-Engine-Funktionen umgesetzt; in Node ladbar via tolerantem `require('obsidian')`
  + `module.exports.__test__`-Hook.
- **CORE-META-03** — Hero/Screenshot reproduzierbar via `tools/render-hero.sh`
  (benötigt `weasyprint` + `poppler`/`pdftoppm`) statt eines npm-Screenshot-Tools.

## Dach-Kontext (obsidian-plugins)

Dieses Repo liegt unter dem Koordinations-Dach `/Users/Shared/code/obsidian-plugins/`.
**Vor dem Lösen eines Problems:** `../AGENTS.md` (Kit-first-Regel) und `../REGISTRY.md`
(Lösungs-Registry) prüfen — viele Probleme sind in Nachbar-Plugins oder im
`obsidian-kit` bereits gelöst.

**Vor jeder UI-Arbeit** (Views, Modals, Settings-Tabs, CSS): `../UI-STANDARD.md` ist
verbindlich (Obsidian-nativ first, ein Frontend pro Plugin, nur Theme-CSS-Variablen).
