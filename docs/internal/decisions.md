# Entscheidungen — das Warum

Verdichtete Design-Essenz zu den Regeln im Kern (`AGENTS.md`). Vor dem Übernehmen einer Altentscheidung gilt: Grund aufsuchen, messen, ob er heute trägt.

## TypeScript + esbuild statt Zero-Build

Der PDF-Engine-Kern wird als geteiltes Kit (`src/vendor/kit/`) vendored statt pro Plugin neu geschrieben; das ist mit reinem Zero-Build nicht mehr praktikabel (siehe `CHANGELOG.md`, 1.4.0). Das Plugin entspricht damit dem Standardprofil `ts-node · obsidian-plugin`. `main.js` ist Build-Output (gitignored) und läuft auf Mobile ohne Node/Electron-APIs.

## Kein HTML/Quick-Look-Fallback auf Mobile

Bis 1.3.0 schrieb `exportViaShare()` ein eigenständiges HTML für den Quick-Look-Umweg; seit 1.4.0 ist Mobile immer Vektor-PDF (Degradation statt Fallback), und das Setting `mobileExport` fällt weg.

## Desktop-Druck über ein eigenes iframe

Der Store-Review von 1.4.0 verbot `<style>` in `document.head` und `innerHTML` auf der App-DOM; deshalb druckt der Desktop seit 1.4.1 aus einem eigenen iframe. Die Bedingung (`doPrint` nur hinter `Platform.isDesktopApp`) steht in `.claude/rules/export-und-druck.md`.

## Ein Haupt-Befehl wählt den Weg, der Vektor-Befehl bleibt, der Druckdialog wird eigener Befehl

Zwei PDF-Befehle, die verschiedene Dateien lieferten (`output.pdf` gegen `output-vektor.pdf`), verwirrten Nutzer. Johannes entschied am 2026-11-08, dass ein Befehl «Als PDF exportieren» den Weg selbst wählt (Telefon Vektor, Desktop Druckweg) und der Rahmen aus dem Custom-CSS im Vektor-Weg nicht nachgebaut wird. Am 2026-11-11 kam mit dem Kit-Druckmodul (obsidian-kit 0.81.0, Konsument zuerst Paperize 0.6.0) die Wahl der Namen: der Desktop-Haupt-Befehl schreibt jetzt eine Datei ohne Dialog, damit stimmte der geplante Name «PDF ohne Druckdialog» für den Vektor-Befehl nicht mehr; der Unterschied ist die Gestaltung (Browser-Rendering mit Custom-CSS gegen feste DIN-Gestaltung). Beschlossen: `export-letter` «Als PDF exportieren», `export-letter-pdf` «Als PDF exportieren (Vektor, feste DIN-Gestaltung)» und neu `print-letter` «Brief drucken (Druckdialog)» (nur Desktop), damit der Papierdruck aus dem Plugin nicht verschwindet. Der Vektor-Befehl entfällt nicht: er ist der Telefon-Weg und der Rückfall des Haupt-Befehls.

## Platzhalter folgen der Briefsprache

Der Degradations-Platzhalter wird gedruckt und gehört deshalb zur Briefsprache, nicht zur Oberflächensprache (Begründung und Prüfpunkt D4: `.claude/rules/degradations-platzhalter.md`).

## Kit-Pin: `pdf/*` einzeln auf 0.82.2, der Rest auf 0.60.2 / code-kit 0.27.1

Die Pins stehen in `tools/kit-sync.json`; das Dach hebt Pins nach der Tag-Politik „lazy“ (KIT-MATRIX): ein neuer Kit-Tag allein ist keine Drift, gehoben wird, wenn ein Konsument etwas davon hat. Letterhead hat bei zwei Berührungen etwas davon gehabt, und beide liegen im PDF-Kern: `dom-to-ir` markiert seit 0.82.2 eine Formel mit ihrer LaTeX-Quelle statt Glyphenreste zu übernehmen (`mathSource`), `layout` rückt seit 0.67.0 ein Bild im Listenpunkt oder Zitat ein. Deshalb steht nur das Ziel `src/vendor/kit/pdf` mit `"ref": "0.82.2"` auf dem neuen Tag (Einzelpin, wie in obsidian-paperize). Das Druckmodul kam am 2026-11-11 als weitere Einzelpins dazu: `print-to-pdf` und `clock` aus obsidian-kit 0.82.2 (Inhalt gegenüber 0.81.1 unverändert), `timeout` aus code-kit 0.63.0. `collect-css`, `print-document` und `print-css` braucht Letterhead nicht: das Dokument kommt aus `buildStandaloneDoc`, nicht aus Obsidians gerendertem DOM.

**Nachtrag 2026-11-14:** `pdf/*` steht jetzt auf 0.86.0 (`dom-to-ir`: Mermaid und beschriftete Grafiken als Markierung; zwischen 0.82.2 und 0.86.0 hat sich sonst nur der Kopf der Dateien geändert), dazu die Einzelpins `inline-images` (obsidian-kit 0.86.0, `kit-obsidian`) und `image-source` (obsidian-kit 0.86.0, `kit`). Bis zu den Tags 0.88.0 / 0.68.0 ist erlaubt, der Linkschutz-Tag 0.88.0 betrifft Letterhead nicht (`dom-guard`, `link-guard`, `remote-resources` und `safe-markdown` sind nicht vendort).

Der Rest bleibt stehen, weil nichts davon im Brief ankommt. Gemessen 2026-11-10 als Diff 0.60.2 → 0.82.2: `confirm`, `folder-suggest` und `help-setting` sind unverändert, `vault-path` bekommt die neue Funktion `canonVaultDir`, die Letterhead nicht ruft, `settings_walker` nur Kommentar, `share-export` einen Umbau (`runExclusive` und `isPathSegment` aus code-kit statt eigener Kopie); an code-kit-Seite zieht kein Fix für `filename-template`, `data-url` oder `local-stamp`. Der Store-Lint 0.5.1 läuft mit dieser Mischung ohne Befund. **Wann der Grund nicht mehr trägt:** ändert eines der ungehobenen Module sein Verhalten für Letterhead (ein Fix in `share-export` oder `vault-path`, den der Export braucht), oder der Lint verlangt neu vendortes Material; dann den Rest-Pin heben und diesen Abschnitt nachziehen. Anlass der Hebung: Task „Formeln im Vektor-PDF verstümmelt wie in Paperize“, Release 1.10.2.

## Bilder fürs Browser-PDF kommen aus dem Kit-Baustein `inlineImages`, https wird mit eingebettet

Bis 2026-11-14 hatte Letterhead einen eigenen `inlineImages` in `main.ts`, der https-Bilder stehen ließ (Annahme: das unsichtbare `<webview>` lädt sie selbst); Paperize bettete sie über `requestUrl` ein. Der Unterschied hatte keinen belegten Grund (Drift), und obsidian-kit 0.86.0 hat den Baustein (`obsidian/inline-images`, `pure/image-source`) mit der Paperize-Fassung als Entscheidung geliefert. Gemessen am Eigenbau (Zweitinstanz, Obsidian 1.15.1, ein `https`-Bild von w3.org ohne künstliche Verzögerung): das `<webview>` lädt das Bild selbst rechtzeitig, es stand im Chromium-PDF. Die Annahme stimmte also für den schnellen Fall; sie ist nicht gemessen für ein langsames oder hängendes Bild, und genau dafür trägt das Einbetten (Frist 15 s je Bild, bei Fehlschlag bleibt das Bild stehen wie zuvor). Deshalb wurde auf den Baustein umgestellt und nicht der Unterschied beibehalten: ein Export soll nicht davon abhängen, ob das Netz beim Drucken antwortet. Nebenfolge: ein Bild unbekannten Typs ohne Endung bekommt `application/octet-stream` statt `image/jpeg`. **Wann das nicht mehr trägt:** wenn ein Nutzer https-Bilder hinter einer Anmeldung im Brief hat: ob das `<webview>` dafür Cookies hätte und `requestUrl` sie nicht mitschickt, ist ungemessen.

## Mermaid zeichnet Letterhead nicht

Ein Mermaid-Fence bleibt im Brief ein Codeblock mit dem Quelltext, auf oberster Ebene wie in Callout und Zitat (gemessen 2026-11-14, Prüfpunkt L1). Letterhead wartet nicht auf das svg, das Obsidian nachträglich einsetzt; Paperize tut es (`waitForMermaid`). Der Kit-Fix von 0.86.0 (`dom-to-ir`: Mermaid im Callout als Markierung) greift daher im Letterhead-Pfad nicht, er ist vendort und bleibt für den Fall, dass ein Diagramm-Weg kommt. Ob Briefe Diagramme zeichnen sollen, ist keine Pflicht des Plugins (ein Geschäftsbrief), steht aber als Task im Cockpit.

## Das PDF ist der Prüfgegenstand

Letterheads teuerste Defekte lagen in der Naht zwischen Obsidian und der puren Engine (das Export-DOM ist nicht das Preview-DOM); der GUI-Smoke misst deshalb die Datei, die im Vault landet (`docs/SMOKE.md`).

## SDD-Artefakte außerhalb des Repos

Specs, Pläne und Task-Reports liegen nicht im öffentlichen Repo, sondern im Arbeitskontext des Maintainers (CORE-META-14): Sie tragen Vault-Pfade und Schwester-Repo-Interna, die hier niemandem nützen. Das Repo behält die Design-Essenz in diesen beiden Dateien und in `CHANGELOG.md`. Keine absoluten Pfade außerhalb des Repos in committete Dateien; Gate: `scripts/check-no-abs-paths.mjs` (Teil von `npm test`).
