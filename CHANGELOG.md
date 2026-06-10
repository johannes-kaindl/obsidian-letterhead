# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/) (Tags **ohne** v-Präfix).

## [Unreleased]

### Added
### Changed
### Fixed

## [1.1.0] — 2026-06-10

### Added
- **Drei eingebaute Stile** (Einstellung „Stil", pro Brief per Frontmatter
  `stil` überschreibbar): A Sachlich-modern (serifenlos), B Klassisch-seriös
  (Serife), C Technisch-präzise (monospaced Akzente) — aus `design/css/`
  übernommen, ohne Webfont-Import (offline-fähig, System-Monospace-Stack).
- **Infozeilen-Layout** (Einstellung „Infozeile", Frontmatter `infozeile`):
  „Vollständig" = Infoblock rechts neben der Anschrift (Label-Wert-Zeilen),
  „Nur Datum" = schlichte rechtsbündige Orts-/Datumszeile.
- **Anlagenvermerk**: Frontmatter `anlagen` (Liste oder Blockskalar) erzeugt
  einen gestapelten Anlagen-Block unter der Unterschrift („Anlage"/„Anlagen").
- **Freie Infoblock-Zeilen**: Frontmatter-Map `info` (z. B. Kundennummer),
  plus eingebautes Feld `steuernummer`.
- Neue Design-Tokens für den Briefkopf-Namen (`--bk-name-font`, `-size`,
  `-weight`, `-spacing`, `-transform`) sowie `--bk-din-head-top`,
  `--bk-din-info-top`, `--bk-din-info-width`, `--bk-din-dateline-top`.
- Einstellung **„Druckversatz oben (mm)"** (Token `--bk-print-offset`):
  Feinjustierung, falls die Anschrift im Kuvertfenster zu hoch sitzt; schiebt
  den Briefinhalt nach unten, Falt-/Lochmarken bleiben papierbezogen
  unverändert.

### Changed
- **DIN-Briefkopf neu**: Name (oder Logo) links, Kontaktdaten rechts, Hairline
  darunter — statt rechtsbündigem Kopf + Absenderblock neben der Anschrift.
- Die horizontale Bezugszeichenzeile wurde durch den **Infoblock** ersetzt;
  die Einstellung „Bezugszeichenzeile" wird zu „Infozeile" migriert.
- Settings-Migration: War eine der Design-Varianten-Dateien ins Feld
  „Eigenes CSS" eingefügt, wird sie automatisch als Stil/Infozeile übernommen
  und das Feld geleert; alte Schrift-Defaults werden zu „Stil-Standard".
- `ihr_schreiben` wird jetzt als Datum gemäß Locale formatiert; `telefon_bezug`
  hat keinen Absender-Default mehr (Telefon steht bereits im Briefkopf).
- **Einstellungen ohne CSS-Pflicht**: Stil + Infozeile als Dropdowns;
  Schriftart/-größe sind optionale Overrides (leer = Stil-Standard);
  „Eigenes CSS" ist nach „Erweitert" gewandert.
- Neue Komponenten-Klassennamen analog zur Design-Vorschau (`.bk-address`,
  `.bk-return`, `.bk-recipient`, `.bk-infoblock`, `.bk-dateline`,
  `.bk-greeting`, `.bk-closing`, `.bk-signature`, `.bk-enclosures`); die
  1.0-Namen bleiben als Aliasse im Markup erhalten.

### Fixed
- **Feste Druckränder** (`@page` oben 10 mm / unten 15 mm): Drucker ohne
  randlosen Druck schneiden den Briefkopf nicht mehr ab, und mehrseitige
  Briefe brechen mit sauberen Rändern um statt an der Blattkante (zusätzlich
  `orphans`/`widows`; Gruß/Unterschrift/Anlagen bleiben zusammen). Alle
  DIN-Positionen bleiben papierbezogen exakt — die Komponenten ziehen den
  Seitenrand intern ab; die Vorschau simuliert ihn.
- **Brief-Vorschau**: Die A4-Seite wird jetzt vollständig ins Vorschaufenster
  eingepasst (Zoom-to-fit, nie über 100 %). Vorher wurde die mm-breite Seite
  bei schmalen Fenstern vom Flex-Layout gestaucht — Texte brachen zu früh um
  und die Schrift wirkte zu groß.

## [1.0.0] — 2026-06-09

### Added
- Erste Veröffentlichung.
- Zwei Themes: **DIN 5008** (Form A/B, fensterkuvert-tauglich) und **Modern**.
- PDF-Export über den OS-Druckdialog — funktioniert auf Desktop **und iPhone/iPad**.
- Frontmatter-Felder für Empfänger, Betreff, Anrede, Grußformel, Datum,
  Bezugszeichen und Absender-Overrides (deutsche + englische Aliasse).
- Absender-Profil in den Einstellungen.
- Faltmarken (105/210 mm bzw. 87/192 mm) und Lochmarke (148,5 mm).
- Logo/Briefkopf aus Vault-Bild (als data-URL eingebettet).
- CSS-Design-Tokens + kommentiertes Preset (Datei + „Preset einfügen"-Button).
- Vorschau-Modal vor dem Export.
