# AGENTS.md — obsidian-letterhead

> **Workspace-Standards (maintainer-lokal):** Die verbindliche Leitkonvention steht in `_docs/CONVENTIONS.md` im Multi-Projekt-Workspace des Maintainers, `../../workspace/_docs` relativ zu diesem Repo — nicht Teil dieses Repos, ignorieren falls im Klon nicht vorhanden. Modell comply-or-explain. Begründete Abweichungen stehen unten unter „Abweichungen von der Leitkonvention".

Conventions for AI agents (Claude Code, Codex, …) working on this repository.

## Project character

Obsidian-Plugin „Letterhead": macht aus der aktiven Notiz einen formatierten Geschäftsbrief (DIN 5008 Form A/B + „Modern"-Theme) und exportiert ihn über den OS-Druckdialog als PDF — Desktop **und iOS**. TypeScript + `esbuild`-Build (`src/` → `main.js`), ohne Laufzeit-Abhängigkeiten; `main.js` ist Build-Output (gitignored, nicht committet) und läuft auf Mobile ohne Node/Electron-APIs.

- **Plugin-ID:** `letterhead` (deployed unter `.obsidian/plugins/letterhead/`).
- **Test-Vault:** `$VAULT/` (Obsidian-Vault des Maintainers, CORE-META-14-Platzhalter).

## Architecture principles

- Kein Electron-/Node-API zur Laufzeit → mobil-tauglich. Nur Obsidian-API + Browser-APIs im gebauten `main.js`.
- Reine Funktionen (`src/core/*`, `src/vendor/kit/pdf/*`) sind frei von Obsidian-Imports und damit isoliert mit `vitest` testbar (PROF-OBS-04). `npm run check:pure` (Script `scripts/check-pure.mjs`) erzwingt die Grenze.
- Styling ausschließlich über CSS Custom Properties (Design-Tokens): Geometrie ist DIN-kritisch (Fensterkuvert), Typo/Farbe/Spacing frei. Token-Referenz: `docs/reference/theming.md`.
- Der Export ist plattformabhängig: **Desktop** druckt über `doPrint()` aus einem eigenen iframe (OS-Druckdialog, keine Datei), **iOS/iPad** baut mit `exportViaPdf()` ein Vektor-PDF. `Platform.isDesktopApp` ist das Gate für `doPrint` (die einzige Stelle, die zwischen Druckdialog und Vektor-PDF wählt; `Platform.isMobile` steuert nur das anschließende Teilen in `writePdf`), und `doPrint` darf nur hinter ihr aufgerufen werden. Die Vektor-Engine ist das vendorte Kit `src/vendor/kit/pdf/`. Aufbau beider Wege: `docs/internal/architecture.md`.
- Keine Netzwerkzugriffe, keine Telemetrie, externe Assets nur als `data:`-URL (Logo).

## Commands

```bash
npm run typecheck         # tsc --noEmit
npm run typecheck:test    # tsc -p tsconfig.test.json (src + tests)
npm run typecheck:scripts # tsc -p tsconfig.scripts.json (GUI-Smoke-Treiber)
npm test                  # vitest run (reine, Obsidian-freie Specs für src/core + src/vendor)
npm run build             # tsc --noEmit + esbuild --production → main.js
npm run check:pure        # kein `from 'obsidian'`-Import in src/core, src/vendor
npm run gate              # typecheck && typecheck:test && typecheck:scripts && test && check:pure && lint && build
npm run smoke:gui         # GUI-Smoke gegen ein laufendes Obsidian — siehe docs/SMOKE.md
npm run deploy            # build, dann cp manifest.json main.js styles.css versions.json → $OBSIDIAN_PLUGIN_DIR
sh tools/sync-kit.sh      # Kit neu vendoren (Pins in tools/kit-sync.json); --check vergleicht nur
```

Manuelles Deploy-Ziel: `<vault>/.obsidian/plugins/letterhead/`.

**`smoke:gui` braucht ein laufendes Obsidian und den CDP-Lock** (`--exclusive focus`, weil der Treiber das Fenster nach vorn holt). Der Staging-Vault entsteht aus dem getrackten Fixture: `npm run build && npm run smoke:gui -- --setup`. Prüfpunkte, übersprungene Punkte und die Durchlauf-Tabelle stehen in `docs/SMOKE.md`. Der Treiber löst ausschließlich `letterhead:export-letter-pdf` aus — nie `letterhead:export-letter`, der auf dem Desktop den OS-Druckdialog öffnet und damit jede weitere CDP-Kommunikation blockiert.

## Releasing

Releases erzeugt **GitHub Actions** (`.github/workflows/release.yml`), getriggert durch einen SemVer-Tag (ohne v-Präfix). Der Workflow baut `main.js` frisch aus dem getaggten Commit (`npm ci` + `npm run gate`) und erstellt das GitHub-Release **und** eine Sigstore-Artifact-Attestation (SLSA-Provenance) auf den Build-Output. Voraussetzung: GitHub Actions sind im GitHub-Repo `johannes-kaindl/obsidian-letterhead` aktiviert. `npm run release -- <version>` ruft das zentrale Tooling im Dach; Dual-Push über `release.mjs`, Tag-Push und Store: `../.claude/rules/release-und-store.md`. **Nicht** manuell `gh release create`: Die Attestation kann nur der Actions-Lauf signieren (OIDC-Identität = Workflow, nicht Laptop); ein manuelles Release für denselben Tag hätte keine Provenance und kollidiert mit dem Workflow.

## Conventions

- Conventional Commits; SemVer-Tags **ohne** v-Präfix; nur berührte Dateien stagen.
- Remotes: Forgejo `origin`; `github` (Obsidian-Verzeichnis/BRAT) bekommt Branch und Tag nur über `release.mjs`, nie von Hand.
- Frontmatter-Felder deutsch-first mit Aliassen (`docs/reference/frontmatter.md`).
- Doku ist zweisprachig: Änderungen immer in **beiden** Sprachen pflegen (EN `*.md` + DE `*.de.md`), sonst driften die Versionen auseinander.
- Workspace-weite Standards: `_docs/CONVENTIONS.md` im Maintainer-Workspace (`../../workspace/_docs`, siehe Kopf dieser Datei).
- **Nie im Repo:** absolute Pfade außerhalb des Repos (`/Users/…`, Vault-Pfade) — Platzhalter nutzen (`$VAULT/…`, `~/…`, repo-relativ). Herkunftsnachweise als Repo-Name + `Datei:Zeile` sind dagegen erwünscht. Gate: `scripts/check-no-abs-paths.mjs` (Teil von `npm test`). SDD-Artefakte (Specs, Pläne, Task-Reports) leben im Coding-Cockpit des Maintainers, nicht hier (CORE-META-14).

## Gotchas

- `main.js`/`main.js.map` sind Build-Output (gitignored) — **nicht** committen; Quelle ist `src/`.

## Context index

- Bevor du den Export, den Druck (`doPrint`, `buildStandaloneDoc`), `output.ts`, die Bild-Rasterung oder die Markdown-Renderung änderst: `.claude/rules/export-und-druck.md`.
- Bevor du DIN-Maße, Seitenränder, Paginierung oder die Vorschau im iframe anfasst: `.claude/rules/layout-und-seitenraender.md`.
- Bevor du Platzhalter für Formeln und Grafiken, `LETTER_LABELS` oder das Fixture `fixtures/vault/notes/Smoke-Englisch.md` anfasst: `.claude/rules/degradations-platzhalter.md`.
- Bevor du etwas unter `src/vendor/` änderst, das Kit hebst oder `scripts/check-pure.mjs` anfasst: `.claude/rules/vendor-kit.md`.
- Vor Änderungen an Modul-Layout, Export-Wegen oder Engine-Schichten: `docs/internal/architecture.md`.
- Bevor du eine Altentscheidung (TypeScript-Umbau, kein HTML-Fallback, iframe-Druck, Briefsprache, SDD-Ablage) übernimmst: `docs/internal/decisions.md`.
- Vor dem GUI-Smoke: `docs/SMOKE.md`; Treiber-Regeln, Instanz und Lock des Dachs in `../.claude/rules/gui-smoke-treiber.md`, `../.claude/rules/obsidian-instanz.md`, `../.claude/rules/cdp-lock.md`.
- Vor einem Release oder Store-Rescan: `../.claude/rules/release-und-store.md`, Skills `plugin-release-setup` und `store-rescan`.
- Vor UI-Arbeit: `../UI-STANDARD.md`, `../.claude/rules/ui-bausteine.md`.

## Memory

Projekt-Memory unter `~/.claude/projects/<slug>/memory/` (Index: `MEMORY.md`). Session-Handoff unter `.remember/` (gitignored).

## Abweichungen von der Leitkonvention

- **CORE-META-03** — Hero/Screenshot reproduzierbar via `tools/render-hero.sh` (benötigt `weasyprint` + `poppler`/`pdftoppm`) statt eines npm-Screenshot-Tools.

## Dach-Kontext (obsidian-plugins)

Dieses Repo liegt unter dem Koordinations-Dach `obsidian-plugins/` (`..` vom Repo-Root). **Vor dem Lösen eines Problems:** `../AGENTS.md` (Kit-first-Regel) und `../REGISTRY.md` (Lösungs-Registry) prüfen — viele Probleme sind in Nachbar-Plugins oder im `obsidian-kit` bereits gelöst. **Vor jeder UI-Arbeit** (Views, Modals, Settings-Tabs, CSS): `../UI-STANDARD.md` ist verbindlich.
