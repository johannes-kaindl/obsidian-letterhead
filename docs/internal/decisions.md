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

## Kit-Pin: `pdf/*` einzeln auf 0.82.2, der Rest auf 0.60.2 / code-kit 0.27.1

Die Pins stehen in `tools/kit-sync.json`; das Dach hebt Pins nach der Tag-Politik „lazy“ (KIT-MATRIX): ein neuer Kit-Tag allein ist keine Drift, gehoben wird, wenn ein Konsument etwas davon hat. Letterhead hat bei zwei Berührungen etwas davon gehabt, und beide liegen im PDF-Kern: `dom-to-ir` markiert seit 0.82.2 eine Formel mit ihrer LaTeX-Quelle statt Glyphenreste zu übernehmen (`mathSource`), `layout` rückt seit 0.67.0 ein Bild im Listenpunkt oder Zitat ein. Deshalb steht nur das Ziel `src/vendor/kit/pdf` mit `"ref": "0.82.2"` auf dem neuen Tag (Einzelpin, wie in obsidian-paperize).

Der Rest bleibt stehen, weil nichts davon im Brief ankommt. Gemessen 2026-11-10 als Diff 0.60.2 → 0.82.2: `confirm`, `folder-suggest` und `help-setting` sind unverändert, `vault-path` bekommt die neue Funktion `canonVaultDir`, die Letterhead nicht ruft, `settings_walker` nur Kommentar, `share-export` einen Umbau (`runExclusive` und `isPathSegment` aus code-kit statt eigener Kopie); an code-kit-Seite zieht kein Fix für `filename-template`, `data-url` oder `local-stamp`. Der Store-Lint 0.5.1 läuft mit dieser Mischung ohne Befund. **Wann der Grund nicht mehr trägt:** ändert eines der ungehobenen Module sein Verhalten für Letterhead (ein Fix in `share-export` oder `vault-path`, den der Export braucht), oder der Lint verlangt neu vendortes Material; dann den Rest-Pin heben und diesen Abschnitt nachziehen. Anlass der Hebung: Task „Formeln im Vektor-PDF verstümmelt wie in Paperize“, Release 1.10.2.

## Das PDF ist der Prüfgegenstand

Letterheads teuerste Defekte lagen in der Naht zwischen Obsidian und der puren Engine (das Export-DOM ist nicht das Preview-DOM); der GUI-Smoke misst deshalb die Datei, die im Vault landet (`docs/SMOKE.md`).

## SDD-Artefakte außerhalb des Repos

Specs, Pläne und Task-Reports liegen nicht im öffentlichen Repo, sondern im Arbeitskontext des Maintainers (CORE-META-14): Sie tragen Vault-Pfade und Schwester-Repo-Interna, die hier niemandem nützen. Das Repo behält die Design-Essenz in diesen beiden Dateien und in `CHANGELOG.md`. Keine absoluten Pfade außerhalb des Repos in committete Dateien; Gate: `scripts/check-no-abs-paths.mjs` (Teil von `npm test`).
