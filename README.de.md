# Letterhead – DIN 5008 & modern letters

> 🇩🇪 Deutsch · [🇬🇧 English](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/README.md)

Ein Obsidian-Plugin, das aus einer Notiz einen professionell formatierten Geschäftsbrief macht — deutscher **DIN 5008** oder ein klares **modernes** Layout — und ihn als PDF exportiert: auf dem Desktop per Druckdialog, auf **iPhone/iPad** als echtes, textselektierbares PDF mit einem Tipp.

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE)
[![Docs: CC BY-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--SA%204.0-lightgrey.svg)](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE-DOCS)
![Platform](https://img.shields.io/badge/platform-Obsidian%20(Desktop%20%7C%20iOS)-lightgrey)

<p>
  <img src="https://raw.githubusercontent.com/johannes-kaindl/obsidian-letterhead/main/docs/images/hero-din-de.png" alt="DIN-5008-Geschäftsbrief (Deutsch)" width="340">
  <img src="https://raw.githubusercontent.com/johannes-kaindl/obsidian-letterhead/main/docs/images/hero-modern-en.png" alt="Moderner Geschäftsbrief (Englisch)" width="340">
</p>

<sub><b>DIN 5008</b> (Deutsch) · <b>Modern</b> (Englisch) — zwei Layouts, zwei Briefsprachen.</sub>

## Funktionen

- **Briefe aus deinen Notizen:** Das Frontmatter einer Notiz hält die Metadaten, der Notiztext (Markdown) wird zum Brieftext — ein Befehl macht daraus einen fertig formatierten Geschäftsbrief.
- **PDF-Export & Druck, überall:** Desktop (macOS/Windows/Linux) → Druckdialog → „Als PDF sichern"; **iPhone/iPad** → ein echtes, textselektierbares **Vektor-PDF**, das im Plugin erzeugt und mit **einem Tipp** geteilt wird (System-Teilen-Menü → „In Dateien sichern" oder beliebig weiterleiten). Die eingebaute PDF-Engine hat keine Laufzeit-Abhängigkeiten und arbeitet vollständig offline — kein Netz, kein Electron, kein Node — und rendert reiche Briefinhalte (Tabellen, eingebettete Bilder, Code-Blöcke, mehrseitige Paginierung), nicht nur reinen Text. Was die Engine nicht darstellen kann, wird als Hinweis gemeldet statt still verschluckt. Druckränder werden automatisch gesetzt (Seite 1 oben 10 mm, Folgeseiten 25 mm, unten 20 mm) — DIN-Positionen bleiben papiergenau. Das mobile PDF nutzt die Standard-PDF-Schriften (Helvetica/Times/Courier), bleibt dadurch winzig und öffnet in jedem Viewer identisch.
- **Zwei Layouts:** `DIN 5008` (deutscher Standard, fensterkuvert-tauglich) und `Modern` (international) — wählbar unter **Einstellungen → Layout**.
- **Drei Stile per Dropdown:** Sachlich-modern, Klassisch-seriös, Technisch-präzise — plus Infozeile „Vollständig" (Infoblock) oder „Nur Datum"; beides pro Brief im Frontmatter überschreibbar.
- **Zweisprachig:** Plugin-UI folgt der Obsidian-App-Sprache (Englisch/Deutsch); die Briefsprache ist separat einstellbar — deutsche oder englische Brief-Labels (Anlagen/Enclosures, Ihr Zeichen/Your ref., …), pro Brief per Frontmatter `sprache` umschaltbar.
- **Metadaten aus dem Frontmatter:** Empfänger und Absender als YAML-Listen, Betreff, Anrede, Grußformel, Datum, Infoblock (inkl. Steuernummer + freie Zeilen), Anlagenvermerk — deutsche und englische Feld-Aliasse. Befehl **Insert letter frontmatter into note** legt die Felder an; die Einstellungen zeigen eine Feldübersicht.
- **Absender-Profil** in den Einstellungen, pro Brief überschreibbar (Liste `absender` oder Einzelfelder).
- **Seitenechte Vorschau:** zeigt die fertigen A4-Blätter inklusive Seitenumbrüchen.
- **DIN-Extras:** Faltmarken (105/210 mm bzw. 87/192 mm), Lochmarke (148,5 mm), Druckversatz-Feinjustierung fürs Kuvertfenster.
- **Kein CSS nötig** — Stil und Infozeile direkt in den Einstellungen; für Feinschliff bleiben dokumentierte CSS-Design-Tokens + kommentiertes Preset auf Knopfdruck.
- **Komplett offline** — keine Netzwerkaufrufe, keine Telemetrie; das Rendering läuft lokal über die Druck-Engine des Betriebssystems.
- TypeScript, per esbuild gebündelt, ohne Laufzeit-Abhängigkeiten, mobil-tauglich (`isDesktopOnly: false`), AGPL-3.0.

## Voraussetzungen

- **Obsidian 1.8.7 oder neuer** (Desktop und Mobile — das Plugin ist nicht desktop-only).
- **Desktop:** macOS, Windows oder Linux. Der Export läuft über den Druckdialog des Betriebssystems.
- **iPhone/iPad:** iOS/iPadOS. Der Export erzeugt ein Vektor-PDF im Plugin und übergibt es dem System-Teilen-Menü.
- **Sonst nichts.** Keine Laufzeit-Abhängigkeiten, keine Netzwerkzugriffe, keine Node- oder Electron-APIs — das Plugin arbeitet vollständig offline.
- Zum Bauen aus dem Quelltext: **Node.js** und npm (siehe [Entwicklung](#entwicklung)).

## Installation

Repository: [github.com/johannes-kaindl/obsidian-letterhead](https://github.com/johannes-kaindl/obsidian-letterhead)
(Quell-Mirror: [git.jkaindl.de/jkaindl/obsidian-letterhead](https://git.jkaindl.de/jkaindl/obsidian-letterhead))

> **Hinweis (2026-09-03):** Letterhead ist derzeit **nicht im Community-Plugin-Verzeichnis
> gelistet**. Das GitHub-Konto, auf dem der Mirror liegt, steht nicht zur Verfügung, wodurch
> auch der Store-Eintrag entfallen ist. Das Plugin selbst ist davon nicht betroffen und wird
> weiter gepflegt — Releases erscheinen auf Forgejo, und die beiden folgenden Wege
> funktionieren heute.

### Mit AnySource Sideloader (empfohlen)

[AnySource Sideloader](https://git.jkaindl.de/jkaindl/anysource-sideloader) installiert und
aktualisiert Plugins von beliebigen Git-Forges, unabhängig vom Community-Store.

1. AnySource Sideloader installieren und aktivieren. (Seine eigene Erstinstallation läuft
   von Hand — die Unabhängigkeit vom Store ist ja gerade der Zweck —, aber nur dieses eine
   Mal; danach hält er sich und alles Weitere selbst aktuell.)
2. Den Katalog abonnieren, der Letterhead neben den übrigen Plugins desselben Autors
   listet:
   `https://git.jkaindl.de/jkaindl/obsidian-catalog/raw/branch/main/catalog.json`
   — oder nur dieses eine Repository als Quelle hinzufügen:
   `https://git.jkaindl.de/jkaindl/obsidian-letterhead`
3. Letterhead installieren, dann das Absender-Profil in den Einstellungen ausfüllen.

Updates kommen danach wie bei jedem anderen Plugin.

### Aus dem Community-Plugin-Verzeichnis

Wieder verfügbar, sobald der Store-Eintrag zurück ist:

1. **Einstellungen → Community-Plugins → Durchsuchen** öffnen.
2. Nach **„Letterhead"** suchen und **Installieren** wählen.
3. Letterhead **aktivieren**, dann das Absender-Profil in den Einstellungen ausfüllen.

### Manuelle Installation

`main.js`, `manifest.json` und `styles.css` aus dem
[letzten Forgejo-Release](https://git.jkaindl.de/jkaindl/obsidian-letterhead/releases/latest)
herunterladen und in den Vault kopieren. Jedes Release enthält zusätzlich
`checksums.sha256` — damit lässt sich das Heruntergeladene per
`shasum -a 256 -c checksums.sha256` prüfen.

```bash
# Plugin in den Vault kopieren
cp manifest.json main.js styles.css versions.json \
   "<dein-vault>/.obsidian/plugins/letterhead/"

# …oder aus einem Klon mit gesetztem OBSIDIAN_PLUGIN_DIR:
npm run deploy
```

Dann: Obsidian → Einstellungen → Community-Plugins → neu laden → **Letterhead** aktivieren → Absender-Profil ausfüllen.

## Nutzung

1. Notiz öffnen und mit dem Befehl **Insert letter frontmatter into note** die Felder anlegen (oder siehe [Beispiel](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/examples/example-letter.md)), dann ausfüllen.
2. Befehl **Export letter as PDF / print** (Befehlspalette oder Briefumschlag-Icon). Mit **Open letter preview** vorab seitenecht prüfen.
3. **Desktop:** Im Druckdialog **„Als PDF sichern"** wählen (macOS: PDF-Dropdown unten links), Skalierung auf 100 % lassen. **iPhone/iPad:** Die fertige PDF wird ins eingestellte **Ausgabeziel** geschrieben; steht dieses auf *direkt teilen*, öffnet sich das System-Teilen-Menü — **„In Dateien sichern"** tippen oder beliebig weiterleiten.

Der Notiztext unter dem Frontmatter ist der Brieftext und wird als Markdown gerendert.

## Konfiguration

Alles wird unter **Einstellungen → Letterhead** eingestellt; CSS ist für nichts davon nötig. Das Wesentliche:

| Gruppe | Was du dort einstellst |
|--------|------------------------|
| **Layout & Stil** | `DIN 5008` oder `Modern`; einer von drei Stilen (sachlich / klassisch / technisch); vollständige Infozeile oder schlichte Datumszeile; DIN-Form A (27 mm) oder B (45 mm). |
| **Absender-Profil** | Name, Zusatz, Straße, PLZ/Ort, Telefon, E-Mail, Web — dazu die Rücksendezeile für das Kuvertfenster. Jedes Feld ist pro Brief im Frontmatter überschreibbar. |
| **Elemente** | Falzmarken, Lochmarke, Druckversatz (schiebt den Inhalt nach unten, wenn die Anschrift im Fenster zu hoch sitzt), Logo statt Absendername. |
| **Typografie & Sprache** | Schrift- und Schriftgrößen-Override, Datums-Locale, **Briefsprache** (deutsche oder englische gedruckte Bezeichnungen — unabhängig von der Oberflächensprache), Standard-Grußformel. |
| **Erweitert** | Ausgabeziel, Dateinamen-Schema, eigenes CSS. |

Zwei Einstellungen entscheiden, wo die PDF landet und wie sie heißt:

- **Ausgabeziel** — wohin die exportierte PDF geschrieben wird: **neben die Notiz**, in **Obsidians Anhang-Ordner**, in einen **eigenen Ordner** oder gar nicht speichern und **direkt teilen**. Eine vorhandene Datei wird nie überschrieben, sondern um `" (2)"` ergänzt. Gilt für den Vektor-PDF-Export, nicht für den Desktop-Druckdialog.
- **Dateinamen-Schema** — wie die exportierte PDF heißt und was der Druckdialog vorschlägt. Platzhalter `{notiz}` `{datum}` `{datum_lang}` `{empfaenger}` `{betreff}` `{unserzeichen}`; alles andere im Feld bleibt wörtlich stehen. `{datum}` liefert **YYYY-MM-DD**, damit Briefe im Dateimanager chronologisch sortieren; `{datum_lang}` gibt das Datum so aus, wie es im Brief steht.

Bestehende Installationen behalten ihr bisheriges Verhalten (direkt teilen, `{notiz}`); nur Neuinstallationen starten mit den neuen Vorgaben. Vollständige Referenz: [docs/reference/settings.md](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/settings.md).

## Funktionsweise

Ein Brief ist eine ganz normale Notiz. Ihr **Frontmatter trägt die Metadaten** (Empfänger, Betreff, Anrede, Grußformel, Anlagen, …), der **Notiztext ist der Brieftext** und wird als Markdown gerendert. Die Feldnamen gibt es deutsch und englisch als Aliase — `betreff:` und `subject:` sind dasselbe Feld.

Der Export nimmt danach einen von zwei bewusst verschiedenen Wegen:

- **Desktop** rendert den Brief als HTML/CSS in ein isoliertes iframe und übergibt ihn dem **Druckdialog des Betriebssystems** — dort wählst du „Als PDF sichern". Das Rendern übernimmt das OS, das Ergebnis entspricht also dem, was jedes andere Programm auf deinem Rechner drucken würde.
- **iPhone/iPad** können so nicht drucken, deshalb baut das Plugin die PDF selbst: ein echtes, textselektierbares **Vektor-PDF** (PDF 1.7, PDF-Standardschriften), auf dem Gerät erzeugt und mit einem Tipp ans Teilen-Menü übergeben. Tabellen, eingebettete Bilder, Code-Blöcke und mehrseitige Paginierung werden direkt ins PDF gerendert. Was die Engine nicht darstellen kann, wird als Hinweis gemeldet statt still verschluckt.

Beide Wege teilen sich dieselbe Geometrie. Die DIN-5008-Positionen — Anschriftfeld, Falzmarken bei 105/210 mm (bzw. 87/192 mm), Lochmarke bei 148,5 mm — werden als absolute Papierkoordinaten gesetzt, damit die Empfängeranschrift im Fensterkuvert sitzt. Die Druckränder setzt das Plugin automatisch (Seite 1: 10 mm oben, Folgeseiten: 25 mm, unten überall 20 mm).

## Dokumentation

- [Tutorial — dein erster Brief](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/tutorial.de.md)
- [Referenz — Frontmatter-Felder](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/frontmatter.de.md) · [Einstellungen](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/settings.de.md) · [Theming / CSS-Tokens](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/theming.de.md)
- [Erläuterung — DIN-5008-Maße](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/explanation/din5008.de.md)

## Theming

Stil und Infozeile wählst du direkt in den Einstellungen — ganz ohne CSS. Für Feinschliff darüber hinaus läuft das Aussehen komplett über CSS Custom Properties (Design-Tokens): Das Feld **Custom CSS** (**Einstellungen → Advanced**) ist mit einem vollständig auskommentierten Preset vorbefüllt — eine Zeile einkommentieren und anpassen; der Button **Reset preset** stellt diesen Ausgangszustand wieder her, alternativ [`presets/letterhead-theme.css`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/presets/letterhead-theme.css) kopieren. Als *DIN-kritisch* markierte Geometrie-Tokens halten die Anschrift im Kuvertfenster — bewusst ändern. Vollständige Tokenliste: [docs/reference/theming.de.md](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/theming.de.md).

## Entwicklung

TypeScript, per `esbuild` zu `main.js` gebündelt. `main.js` ist Build-Output (gitignored, nicht committet) — einmal Abhängigkeiten installieren, dann bauen und ins Vault deployen.

```bash
npm install
npm run build     # Typecheck + esbuild → main.js
npm test          # vitest
npm run gate      # Typecheck + Test + check:pure + Build
npm run deploy    # bauen, dann manifest.json main.js styles.css versions.json → $OBSIDIAN_PLUGIN_DIR kopieren
```

Vollständige Architektur-Hinweise und verbleibende bewusste Abweichungen vom Workspace-Profil `ts-node · obsidian-plugin` stehen in `AGENTS.md`.

## Datenschutz & Sicherheit

Letterhead läuft vollständig auf deinem Gerät: keine Netzwerkaufrufe, keine Telemetrie, kein Tracking. Die Quelle ist TypeScript in `src/`, lesbar und prüfbar; `main.js` selbst ist Build-Output, keine committete Datei. Der einzige `btoa()`-Aufruf bettet dein konfiguriertes Logo als inline `data:`-URL ein. GitHub-Releases werden kryptografisch mit einer Sigstore/SLSA-Build-Provenance-Attestation signiert, die GitHub Actions frisch aus der getaggten Quelle baut — prüfe mit `gh attestation verify main.js --repo johannes-kaindl/obsidian-letterhead`, dass das laufende `main.js` aus dieser Quelle stammt. **GitHub-Releases sind derzeit ausgesetzt**, deshalb sind 1.6.5 und 1.6.6 nur auf Forgejo erschienen und tragen `checksums.sha256` statt einer Attestation; [`SECURITY.de.md`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/SECURITY.de.md) erklärt, was welcher Weg belegt und wie du einen Build in der Zwischenzeit selbst prüfst. Vollständige Erklärung und Meldung von Sicherheitslücken: [`SECURITY.de.md`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/SECURITY.de.md).

## Lizenz

Code: **AGPL-3.0-or-later** — siehe [`LICENSE`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE); kommerzielle Dual-License-Option in [`LICENSING.md`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSING.md).
Dokumentation/Texte: **CC BY-SA 4.0** — siehe [`LICENSE-DOCS`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE-DOCS).
