# Aufbau von Letterhead

Modul-Layout und Export-Wege. Das Warum steht in `docs/internal/decisions.md`, die Regeln im Kern (`AGENTS.md`), die Fallstricke unter `.claude/rules/`.

## Schichten

- `src/core/*` ist pure (kein Obsidian-Import, mit `vitest` isoliert testbar, PROF-OBS-04): Modell und Einstellungen (`model.ts`: `DEFAULT_SETTINGS`, `LETTER_LABELS`, `dinGeometry`), Frontmatter, Kopf-Layout (`head-layout.ts`), Body-IR (`body-ir.ts`), Dateiname (`filename.ts`).
- `src/obsidian/*` ist die Schicht mit Obsidian-API: `main.ts` (Befehle, Export-Ablauf), `html-engine.ts` (Brief-HTML, CSS, Druck, Vorschau-Modal), `output.ts` (`writePdf`), `settings.ts`, `help-row.ts`.
- `src/vendor/kit/` ist die vendorte pure Schicht (PDF-Engine, `vault-path`, `filename-template`, `data-url`, `local-stamp`), `src/vendor/kit-obsidian/` die Obsidian-gekoppelte (`confirm`, `folder-suggest`, `help-setting`, `settings_walker`, `share-export`). `npm run check:pure` erzwingt: kein `obsidian`-Import in `src/core` oder `src/vendor`, außer in `src/vendor/kit-obsidian` (einziger Eintrag in `EXCLUDED` von `scripts/check-pure.mjs`).
- Styling läuft ausschließlich über CSS Custom Properties (Design-Tokens): Geometrie ist DIN-kritisch (Fensterkuvert), Typo/Farbe/Spacing frei. Token-Referenz: `docs/reference/theming.md`.

## Zwei Export-Wege

Der Export ist plattformabhängig. `Platform.isDesktopApp` ist die einzige Abfrage, die zwischen Druckdialog und Vektor-PDF wählt; `Platform.isMobile` steuert nur das Teilen nach dem Speichern in `writePdf`.

- **Desktop:** `doPrint()` baut ein eigenes iframe (`srcdoc` = `buildStandaloneDoc`) und ruft `window.print()`; der OS-Druckdialog übernimmt, es entsteht keine Datei.
- **iOS/iPad:** `window.print()` ist dort wirkungslos, daher baut `exportViaPdf()` das Vektor-PDF und `writePdf()` (`src/obsidian/output.ts`) reicht es weiter. Im Ausgabemodus `share` landet die Datei im versteckten Export-Ordner `.letterhead-export/`; in den Speichermodi (`nextToNote`, `attachmentFolder`, `customFolder`) wird gespeichert und auf Mobile anschließend geteilt. Geteilt wird über eine nach Fähigkeit gewählte Kaskade `navigator.canShare({files})` → `navigator.share()` (Ein-Tipp-Share-Sheet) → sonst `app.openWithDefaultApp()`.
- Keine Netzwerkzugriffe, keine Telemetrie, externe Assets nur als `data:`-URL (Logo).
- Der Befehl `letterhead:export-letter-pdf` (`exportViaPdf`) fährt auf beiden Plattformen dieselbe Vektor-Engine; der GUI-Smoke löst nur ihn aus.

## Vektor-PDF-Engine

Die Engine ist das vendorte, geteilte Kit `src/vendor/kit/pdf/` und erzeugt ein echtes, textselektierbares Vektor-PDF (PDF 1.7, Adobe-Core-14-Standardschriften, WinAnsi mit Umlauten/€) ohne Fremdbibliothek. Reine, Obsidian-freie Schichten: `writer`/`encoding` (Byte-Writer), `layout`/`geometry` (DIN-Geometrie → Draw-Ops, AFM-Metriken via `metrics`), `ir` (Body-IR), gefüttert aus `dom-to-ir.ts` (`domToIrSync`). Tabellen, eingebettete Bilder, Code-Blöcke und mehrseitige Paginierung werden direkt im Vektor-PDF gerendert; nicht unterstützte Elemente degradieren, statt den Export zu brechen.

## Einstellungen

Das Setting `mobileExport` wird von keinem Codepfad gelesen. Der Schlüssel ist aus `DEFAULT_SETTINGS` entfernt, `loadSettings` löscht einen gespeicherten Wert beim Laden.

## Release-Weg

Releases erzeugt GitHub Actions (`.github/workflows/release.yml`): Der Workflow checkt den Tag aus, führt `npm ci` + `npm run gate` aus (baut `main.js` frisch aus `src/`) und erstellt das GitHub-Release **und** eine Sigstore-Artifact-Attestation (SLSA-Provenance) auf die dabei gebauten `main.js`/`manifest.json`/`styles.css`. Das attestierte Subjekt ist Build-Output aus dem getaggten Commit, nicht eine committete Kopie.
