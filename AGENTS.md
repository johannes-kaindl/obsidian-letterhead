# AGENTS.md — obsidian-briefkopf

> **Workspace-Standards:** Die verbindliche Leitkonvention steht in
> `../_docs/CONVENTIONS.md` (Modell comply-or-explain). Begründete Abweichungen
> stehen unten unter „Abweichungen von der Leitkonvention".

Conventions for AI agents (Claude Code, Codex, …) working on this repository.

## Project character

Obsidian-Plugin „Briefkopf": macht aus der aktiven Notiz einen formatierten
Geschäftsbrief (DIN 5008 Form A/B + „Modern"-Theme) und exportiert ihn über den
OS-Druckdialog als PDF — Desktop **und iOS**. Bewusst **abhängigkeitsfreies
Vanilla-JS ohne Build**, damit `main.js` zugleich Quelle und Auslieferung ist und
auf Mobile ohne Toolchain läuft.

- **Plugin-ID:** `briefkopf` (deployed unter `.obsidian/plugins/briefkopf/`).
- **Test-Vault:** `/Users/Shared/10_ObsidianVaults/10_Pallas/`.

## Architecture principles

- Kein Electron-/Node-API → mobil-tauglich. Nur Obsidian-API + Browser-APIs.
- Reine Funktionen (`buildCss`, `getField`, `toLines`, `esc`, `buildFmIndex`) sind
  frei von Obsidian-Imports und damit in Node testbar (Geist von PROF-OBS-04).
- Styling ausschließlich über CSS Custom Properties (Design-Tokens): Geometrie ist
  DIN-kritisch (Fensterkuvert), Typo/Farbe/Spacing frei. Token-Referenz:
  `docs/reference/theming.md`.
- Export = `window.print()` + `@media print` (blendet die Obsidian-DOM aus). Keine
  Netzwerkzugriffe, keine Telemetrie, externe Assets nur als `data:`-URL (Logo).

## Commands

```bash
npm run check     # node --check main.js (Syntax-Gate)
npm run deploy    # cp manifest.json main.js styles.css versions.json → $OBSIDIAN_PLUGIN_DIR
```

Manuelles Deploy-Ziel: `<vault>/.obsidian/plugins/briefkopf/`.
Es gibt bewusst **keinen** build/test/lint/typecheck-Schritt (siehe Abweichungen).

## Conventions

- Conventional Commits; SemVer-Tags **ohne** v-Präfix; nur berührte Dateien stagen.
- Remotes: Codeberg `origin`, GitHub-Mirror für Obsidian-Verzeichnis/BRAT.
- Frontmatter-Felder deutsch-first mit Aliassen (`docs/reference/frontmatter.md`).
- Workspace-weite Standards: `../_docs/CONVENTIONS.md`.

## Gotchas

- Export hängt an `@media print` + Ausblenden der Obsidian-DOM. **Nicht** auf
  iframe-`print()` umbauen — iOS druckt dann das Eltern-Dokument.
- `MarkdownRenderer.render(app, …)` vs. ältere `renderMarkdown` — Feature-Detection
  beibehalten (siehe `renderMarkdownToHtml`).
- DIN-Maße (Kopf 45/27 mm, Falz 105/210 bzw. 87/192 mm, Loch 148,5 mm) sind
  kuvert-kritisch; Änderungen nur mit Render-Check (siehe `tools/render-hero.sh`).
- `main.js` ist die Quelle — nicht minifizieren/bundeln und committen.

## Memory

Projekt-Memory unter `~/.claude/projects/<slug>/memory/` (Index: `MEMORY.md`).
Session-Handoff unter `.remember/` (gitignored).

## Abweichungen von der Leitkonvention

- **PROF-TS-01..04** — Bewusst **kein** TypeScript/esbuild/vitest-Setup. Das Plugin
  ist abhängigkeitsfreies Zero-Build-Vanilla-JS (`main.js` = Quelle = Output),
  Begründung analog zur No-Build-Pflicht PROF-WEB-01. Syntax-Gate via
  `npm run check` (`node --check`) statt typecheck/build. Unit-Tests können später
  als reine Node-Specs für die Obsidian-freien Funktionen ergänzt werden, ohne
  Build-Toolchain.
- **CORE-META-03** — Hero/Screenshot reproduzierbar via `tools/render-hero.sh`
  (benötigt `weasyprint` + `poppler`/`pdftoppm`) statt eines npm-Screenshot-Tools.
