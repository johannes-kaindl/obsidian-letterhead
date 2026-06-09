# Briefkopf – Letter Generator

> 🇩🇪 Deutsch · [🇬🇧 English](README.md)

Ein Obsidian-Plugin, das aus einer Notiz einen professionell formatierten Geschäftsbrief macht — deutscher **DIN 5008** oder ein klares **modernes** Layout — und ihn über den Druckdialog als PDF exportiert, auf Desktop **und iPhone/iPad**.

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Docs: CC BY-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-DOCS)
![Platform](https://img.shields.io/badge/platform-Obsidian%20(Desktop%20%7C%20iOS)-lightgrey)

![Briefkopf — DIN-5008-Brief](docs/images/hero.png)

## Funktionen

- **Zwei Themes:** `DIN 5008` (deutscher Standard, fensterkuvert-tauglich) und `Modern` (international).
- **Metadaten aus dem Frontmatter:** Empfänger, Betreff, Anrede, Grußformel, Datum, Bezugszeichen, Absender-Overrides — deutsche und englische Feld-Aliasse.
- **Absender-Profil** in den Einstellungen, pro Brief überschreibbar.
- **PDF-Export per Druckdialog** → „Als PDF sichern". Plattformübergreifend (Desktop + iOS), weil das OS das CSS rendert — kein Electron, kein Node.
- **DIN-Extras:** Faltmarken (105/210 mm bzw. 87/192 mm) und Lochmarke (148,5 mm).
- **Voll thembar** über dokumentierte CSS-Design-Tokens + kommentiertes Preset auf Knopfdruck.
- Abhängigkeitsfrei, mobil-tauglich (`isDesktopOnly: false`), AGPL-3.0.

## Schnellstart

```bash
# Manuelle Installation: Plugin in den Vault kopieren
cp manifest.json main.js styles.css versions.json \
   "<dein-vault>/.obsidian/plugins/briefkopf/"

# …oder mit gesetztem OBSIDIAN_PLUGIN_DIR:
npm run deploy
```

Dann: Obsidian → Einstellungen → Community-Plugins → neu laden → **Briefkopf** aktivieren → Absender-Profil ausfüllen.

## Nutzung

1. Notiz mit Brief-Frontmatter öffnen (siehe [Beispiel](examples/Beispielbrief.md)).
2. Befehl **„Brief als PDF exportieren / drucken"** (Befehlspalette oder Briefumschlag-Icon). Mit **„Brief-Vorschau öffnen"** vorab prüfen.
3. Im Druckdialog **„Als PDF sichern"** wählen (macOS: PDF-Dropdown; iOS: Teilen → „In Dateien sichern").

Der Notiztext unter dem Frontmatter ist der Brieftext und wird als Markdown gerendert.

## Dokumentation

- [Tutorial — dein erster Brief](docs/tutorial.md)
- [Referenz — Frontmatter-Felder](docs/reference/frontmatter.md) · [Einstellungen](docs/reference/settings.md) · [Theming / CSS-Tokens](docs/reference/theming.md)
- [Erläuterung — DIN-5008-Maße](docs/explanation/din5008.md)

## Theming

Das Aussehen läuft komplett über CSS Custom Properties (Design-Tokens). In **Einstellungen → Eigenes CSS → „Preset einfügen"** gibt es einen kommentierten Startpunkt, alternativ [`presets/briefkopf-theme.css`](presets/briefkopf-theme.css). Als *DIN-kritisch* markierte Geometrie-Tokens halten die Anschrift im Kuvertfenster — bewusst ändern. Vollständige Tokenliste: [docs/reference/theming.md](docs/reference/theming.md).

## Lizenz

Code: **AGPL-3.0-or-later** — siehe [`LICENSE`](LICENSE); kommerzielle Dual-License-Option in [`LICENSING.md`](LICENSING.md).
Dokumentation/Texte: **CC BY-SA 4.0** — siehe [`LICENSE-DOCS`](LICENSE-DOCS).
