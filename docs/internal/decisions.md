# Entscheidungen — das Warum

Verdichtete Design-Essenz zu den Regeln im Kern (`AGENTS.md`). Vor dem Übernehmen einer Altentscheidung gilt: Grund aufsuchen, messen, ob er heute trägt.

## TypeScript + esbuild statt Zero-Build

Der PDF-Engine-Kern wird als geteiltes Kit (`src/vendor/kit/`) vendored statt pro Plugin neu geschrieben; das ist mit reinem Zero-Build nicht mehr praktikabel (siehe `CHANGELOG.md`, 1.4.0). Das Plugin entspricht damit dem Standardprofil `ts-node · obsidian-plugin`. `main.js` ist Build-Output (gitignored) und läuft auf Mobile ohne Node/Electron-APIs.

## Kein HTML/Quick-Look-Fallback auf Mobile

Bis 1.3.0 schrieb `exportViaShare()` ein eigenständiges HTML für den Quick-Look-Umweg; seit 1.4.0 ist Mobile immer Vektor-PDF (Degradation statt Fallback), und das Setting `mobileExport` fällt weg.

## Desktop-Druck über ein eigenes iframe

Der Store-Review von 1.4.0 verbot `<style>` in `document.head` und `innerHTML` auf der App-DOM; deshalb druckt der Desktop seit 1.4.1 aus einem eigenen iframe. Die Bedingung (`doPrint` nur hinter `Platform.isDesktopApp`) steht in `.claude/rules/export-und-druck.md`.

## Platzhalter folgen der Briefsprache

Der Degradations-Platzhalter wird gedruckt und gehört deshalb zur Briefsprache, nicht zur Oberflächensprache (Begründung und Prüfpunkt D4: `.claude/rules/degradations-platzhalter.md`).

## Das PDF ist der Prüfgegenstand

Letterheads teuerste Defekte lagen in der Naht zwischen Obsidian und der puren Engine (das Export-DOM ist nicht das Preview-DOM); der GUI-Smoke misst deshalb die Datei, die im Vault landet (`docs/SMOKE.md`).

## SDD-Artefakte außerhalb des Repos

Specs, Pläne und Task-Reports liegen nicht im öffentlichen Repo, sondern im Arbeitskontext des Maintainers (CORE-META-14): Sie tragen Vault-Pfade und Schwester-Repo-Interna, die hier niemandem nützen. Das Repo behält die Design-Essenz in diesen beiden Dateien und in `CHANGELOG.md`. Keine absoluten Pfade außerhalb des Repos in committete Dateien; Gate: `scripts/check-no-abs-paths.mjs` (Teil von `npm test`).
