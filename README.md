# Briefkopf – Letter Generator (Obsidian)

Erzeugt aus einer Notiz einen sauber formatierten Geschäftsbrief und exportiert ihn
als PDF – **auf Desktop und iPhone/iPad**. Metadaten (Absender, Empfänger, Betreff,
Datum, Bezugszeichen) kommen aus dem Frontmatter, das Styling aus CSS-Themes.

- **Zwei Themes:** `DIN 5008` (deutscher Standard, fertig fürs Fensterkuvert) und `Modern`.
- **PDF-Export per Druckdialog** → „Als PDF sichern". Funktioniert plattformübergreifend,
  weil das Betriebssystem dein CSS rendert (kein Electron, kein Node nötig).
- **Mobil-tauglich:** `isDesktopOnly: false`, keine Desktop-only-APIs.
- Abhängigkeitsfrei (Vanilla JS) und AGPL-3.0.

## Installation

1. Ordner `briefkopf/` in deinen Vault kopieren nach:
   `<DeinVault>/.obsidian/plugins/briefkopf/`
   (muss `main.js`, `manifest.json`, `styles.css` enthalten).
2. Obsidian → Einstellungen → Community-Plugins → neu laden → **Briefkopf** aktivieren.
3. In den Plugin-Einstellungen dein **Absender-Profil** ausfüllen.

## Nutzung

1. Notiz mit Frontmatter (siehe unten) öffnen.
2. Befehl **„Brief als PDF exportieren / drucken"** (Befehlspalette oder Briefumschlag-Icon
   in der linken Leiste). Alternativ **„Brief-Vorschau öffnen"** zum Prüfen.
3. Im Druckdialog **„Als PDF sichern"** wählen.
   - macOS: PDF-Dropdown unten links → „Als PDF sichern".
   - iPhone/iPad: Teilen-Symbol → „In Dateien sichern" (das Vorschaubild zwei Finger
     auseinanderziehen erzeugt ebenfalls ein PDF).

## Frontmatter-Felder

Alles ist optional; fehlt ein Wert, greift der Standard aus den Einstellungen.

```yaml
---
empfaenger: |
  Mustermann GmbH
  Herr Max Mustermann
  Musterstraße 12
  12345 Musterstadt
betreff: Angebot Nr. 2026-0042
anrede: Sehr geehrter Herr Mustermann,
gruss: Mit freundlichen Grüßen
unterschrift: Johannes Kaindl
ort: München
datum: 2026-06-09          # fehlt = heute
# Bezugszeichenzeile (optional)
ihr_zeichen: MM-2026
ihr_schreiben: 2026-05-30
unser_zeichen: JK
# Absender pro Brief überschreiben (sonst aus den Einstellungen)
absender_name: Johannes Kaindl
absender_strasse: Musterstraße 1
absender_plz_ort: 80331 München
---

Sehr gerne unterbreite ich Ihnen das folgende Angebot …

Der **Brieftext** ist einfach der Notiz-Inhalt unter dem Frontmatter und wird
als Markdown gerendert (Absätze, Listen, Fett/Kursiv).
```

### Feld-Aliasse

Deutsch und Englisch funktionieren, Groß/Kleinschreibung und `_`/Leerzeichen egal:

| Zweck | mögliche Schlüssel |
|---|---|
| Empfänger | `empfaenger`, `empfänger`, `recipient`, `an`, `to` |
| Betreff | `betreff`, `subject`, `thema` |
| Anrede | `anrede`, `salutation` |
| Grußformel | `gruss`, `grußformel`, `closing` |
| Unterschrift | `unterschrift`, `signatur`, `signature` |
| Ort | `ort`, `place`, `stadt` |
| Datum | `datum`, `date` |
| Ihr Zeichen | `ihr_zeichen` · Ihr Schreiben `ihr_schreiben` · Unser Zeichen `unser_zeichen` |
| Absender | `absender_name`, `absender_strasse`, `absender_plz_ort`, `absender_telefon`, `absender_email`, `absender_web` |

## DIN 5008 – Maße (Stand März 2020)

Im DIN-Theme exakt umgesetzt, damit der Brief ins Fensterkuvert (DIN lang) passt:

| Element | Form A | Form B |
|---|---|---|
| Briefkopfhöhe | 27 mm | 45 mm |
| Falzmarke 1 | 87 mm | 105 mm |
| Lochmarke | 148,5 mm | 148,5 mm |
| Falzmarke 2 | 192 mm | 210 mm |
| Schreibrand links / rechts | 25 mm / 20 mm | 25 mm / 20 mm |
| Anschriftfeld | 85 × 40 mm | 85 × 40 mm |

Alle Positionen liegen als CSS-Variablen (`--bk-…`) vor und lassen sich im Feld
**„Eigenes CSS"** der Einstellungen feinjustieren, falls dein Kuvert minimal abweicht.

## Hinweise & Grenzen

- **Mehrseitige Briefe:** Adressfeld/Faltmarken stehen auf Seite 1; Folgeseiten haben
  (noch) keinen Briefkopf. Für klassische 1-Seiten-Briefe ideal.
- **iOS-Seitenränder:** iOS bestimmt die Papiergröße im Druckdialog. Für A4 dort A4
  wählen; das mm-genaue Layout bleibt erhalten.
- **Modern-Theme** ist für Korrespondenz ohne Fensterkuvert gedacht (Empfänger im Fluss,
  nicht an der DIN-Fensterposition).

## Lizenz

AGPL-3.0-or-later — siehe `LICENSE`. Vollständigen Lizenztext beim Verteilen beilegen.

## Entwicklung

Abhängigkeitsfreies Vanilla JS: `main.js` ist zugleich Quelle und Build-Output –
kein npm, kein Build-Schritt. Editieren und nach
`<vault>/.obsidian/plugins/briefkopf/` kopieren, dann Obsidian neu laden.

## Hosting & Veröffentlichung

- **Codeberg** ist die AGPL-Heimat dieses Repos.
- Das **offizielle Obsidian-Verzeichnis** und **BRAT** ziehen Releases aber von
  **GitHub**. Für Verzeichnis-Einreichung oder Beta-Tests daher einen
  GitHub-Mirror anlegen und dort ein Release (Tag = Version ohne „v",
  Assets: `main.js`, `manifest.json`, `styles.css`) veröffentlichen.
- Vor der Veröffentlichung: vollständigen AGPL-Text in `LICENSE` ergänzen
  (`curl -o LICENSE https://www.gnu.org/licenses/agpl-3.0.txt`, Copyright-Zeile
  wieder voranstellen).
