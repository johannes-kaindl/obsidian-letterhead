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
- **PDF-Export & Druck, überall:** Desktop (macOS/Windows/Linux) → Druckdialog → „Als PDF sichern"; **iPhone/iPad** → ein echtes, textselektierbares **Vektor-PDF**, das im Plugin erzeugt und mit **einem Tipp** geteilt wird (System-Teilen-Menü → „In Dateien sichern" oder beliebig weiterleiten). Die eingebaute PDF-Engine ist abhängigkeitsfrei und offline — kein Netz, kein Electron, kein Node. Der klassische Schnellansicht-Weg bleibt verfügbar (Einstellungen → Mobiler Export). Druckränder werden automatisch gesetzt (Seite 1 oben 10 mm, Folgeseiten 25 mm, unten 20 mm) — DIN-Positionen bleiben papiergenau. Das mobile PDF nutzt die Standard-PDF-Schriften (Helvetica/Times/Courier), bleibt dadurch winzig und öffnet in jedem Viewer identisch.
- **Zwei Layouts:** `DIN 5008` (deutscher Standard, fensterkuvert-tauglich) und `Modern` (international) — wählbar unter **Einstellungen → Layout**.
- **Drei Stile per Dropdown:** Sachlich-modern, Klassisch-seriös, Technisch-präzise — plus Infozeile „Vollständig" (Infoblock) oder „Nur Datum"; beides pro Brief im Frontmatter überschreibbar.
- **Zweisprachig:** Plugin-UI folgt der Obsidian-App-Sprache (Englisch/Deutsch); die Briefsprache ist separat einstellbar — deutsche oder englische Brief-Labels (Anlagen/Enclosures, Ihr Zeichen/Your ref., …), pro Brief per Frontmatter `sprache` umschaltbar.
- **Metadaten aus dem Frontmatter:** Empfänger und Absender als YAML-Listen, Betreff, Anrede, Grußformel, Datum, Infoblock (inkl. Steuernummer + freie Zeilen), Anlagenvermerk — deutsche und englische Feld-Aliasse. Befehl **Insert letter frontmatter into note** legt die Felder an; die Einstellungen zeigen eine Feldübersicht.
- **Absender-Profil** in den Einstellungen, pro Brief überschreibbar (Liste `absender` oder Einzelfelder).
- **Seitenechte Vorschau:** zeigt die fertigen A4-Blätter inklusive Seitenumbrüchen.
- **DIN-Extras:** Faltmarken (105/210 mm bzw. 87/192 mm), Lochmarke (148,5 mm), Druckversatz-Feinjustierung fürs Kuvertfenster.
- **Kein CSS nötig** — Stil und Infozeile direkt in den Einstellungen; für Feinschliff bleiben dokumentierte CSS-Design-Tokens + kommentiertes Preset auf Knopfdruck.
- **Komplett offline** — keine Netzwerkaufrufe, keine Telemetrie; das Rendering läuft lokal über die Druck-Engine des Betriebssystems.
- Abhängigkeitsfrei, mobil-tauglich (`isDesktopOnly: false`), AGPL-3.0.

## Schnellstart

Repository: [github.com/johannes-kaindl/obsidian-letterhead](https://github.com/johannes-kaindl/obsidian-letterhead)
(Quell-Mirror: [codeberg.org/jkaindl/obsidian-letterhead](https://codeberg.org/jkaindl/obsidian-letterhead))

### Installation aus Obsidian (empfohlen)

1. **Einstellungen → Community-Plugins → Durchsuchen** öffnen.
2. Nach **„Letterhead"** suchen und **Installieren** wählen.
3. Letterhead **aktivieren**, dann das Absender-Profil in den Einstellungen ausfüllen.

### Manuelle Installation

```bash
# Plugin in den Vault kopieren
cp manifest.json main.js styles.css versions.json \
   "<dein-vault>/.obsidian/plugins/letterhead/"

# …oder mit gesetztem OBSIDIAN_PLUGIN_DIR:
npm run deploy
```

Dann: Obsidian → Einstellungen → Community-Plugins → neu laden → **Letterhead** aktivieren → Absender-Profil ausfüllen.

## Nutzung

1. Notiz öffnen und mit dem Befehl **Insert letter frontmatter into note** die Felder anlegen (oder siehe [Beispiel](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/examples/example-letter.md)), dann ausfüllen.
2. Befehl **Export letter as PDF / print** (Befehlspalette oder Briefumschlag-Icon). Mit **Open letter preview** vorab seitenecht prüfen.
3. **Desktop:** Im Druckdialog **„Als PDF sichern"** wählen (macOS: PDF-Dropdown unten links), Skalierung auf 100 % lassen. **iPhone/iPad:** Das System-Teilen-Menü öffnet sich mit dem fertigen PDF — **„In Dateien sichern"** tippen (oder beliebig weiterleiten). Lieber den klassischen Weg? **Einstellungen → Mobiler Export → Drucken / Quick Look** umstellen.

Der Notiztext unter dem Frontmatter ist der Brieftext und wird als Markdown gerendert.

## Dokumentation

- [Tutorial — dein erster Brief](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/tutorial.de.md)
- [Referenz — Frontmatter-Felder](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/frontmatter.de.md) · [Einstellungen](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/settings.de.md) · [Theming / CSS-Tokens](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/theming.de.md)
- [Erläuterung — DIN-5008-Maße](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/explanation/din5008.de.md)

## Theming

Stil und Infozeile wählst du direkt in den Einstellungen — ganz ohne CSS. Für Feinschliff darüber hinaus läuft das Aussehen komplett über CSS Custom Properties (Design-Tokens): Das Feld **Custom CSS** (**Einstellungen → Advanced**) ist mit einem vollständig auskommentierten Preset vorbefüllt — eine Zeile einkommentieren und anpassen; der Button **Reset preset** stellt diesen Ausgangszustand wieder her, alternativ [`presets/letterhead-theme.css`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/presets/letterhead-theme.css) kopieren. Als *DIN-kritisch* markierte Geometrie-Tokens halten die Anschrift im Kuvertfenster — bewusst ändern. Vollständige Tokenliste: [docs/reference/theming.de.md](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/theming.de.md).

## Datenschutz & Sicherheit

Letterhead läuft vollständig auf deinem Gerät: keine Netzwerkaufrufe, keine Telemetrie, kein Tracking. Weil es als lesbarer Quellcode ausgeliefert wird — das veröffentlichte `main.js` ist die committete Datei, unminifiziert, ungebündelt, ohne Build-Schritt — kannst du genau prüfen, was es tut. Der einzige `btoa()`-Aufruf bettet dein konfiguriertes Logo als inline `data:`-URL ein. Releases werden zusätzlich kryptografisch mit einer Sigstore/SLSA-Build-Provenance-Attestation signiert — prüfe mit `gh attestation verify main.js --repo johannes-kaindl/obsidian-letterhead`, dass das laufende `main.js` aus dieser Quelle stammt. Vollständige Erklärung und Meldung von Sicherheitslücken: [`SECURITY.de.md`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/SECURITY.de.md).

## Lizenz

Code: **AGPL-3.0-or-later** — siehe [`LICENSE`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE); kommerzielle Dual-License-Option in [`LICENSING.md`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSING.md).
Dokumentation/Texte: **CC BY-SA 4.0** — siehe [`LICENSE-DOCS`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE-DOCS).
