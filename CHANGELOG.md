# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/) (Tags **ohne** v-Präfix).

## [Unreleased]

## [1.2.0] — 2026-06-13

### Added
- **PDF-Export auf iPhone/iPad** über das System-Teilen-Sheet: Da `window.print()`
  in der mobilen Obsidian-WebView wirkungslos ist, schreibt das Plugin den Brief
  als eigenständige HTML-Datei (Dateiname = Notizname) in einen versteckten
  Export-Ordner und übergibt sie via „In Standard-App öffnen" ans System. Ein Dialog
  führt durch die Schritte: Schnellansicht → Teilen → Drucken → Vorschau aufziehen →
  Teilen → In Dateien sichern.
- Die **Frontmatter-Vorlage** befüllt `gruss` und `unterschrift` jetzt mit den
  effektiven Standardwerten (statt leer) und legt `info_1` … `info_4` vollständig an.

### Changed
- **Umbenannt von „Briefkopf" zu „Letterhead"** (Plugin-ID `letterhead`, Repository
  `obsidian-letterhead`) — eine international verständliche, funktionale Bezeichnung.
  Die Brief-Funktionalität bleibt unverändert; bestehende Frontmatter-Felder gelten weiter.
- Die Vorschau skaliert auf Mobilgeräten jetzt per `transform` statt CSS `zoom`
  (WebKit ignoriert `zoom`) und wird auf iPhone/iPad wieder vollständig angezeigt.
- Plugin-Beschreibung präzisiert: Druckdialog auf dem Desktop, Teilen-Sheet auf iOS.
- Export-Schaltfläche in der Vorschau gekürzt zu „PDF-Export".

### Fixed
- Vorschau wurde auf iOS rechts abgeschnitten (A4-Blatt wurde nicht herunterskaliert).

## [1.1.1] — 2026-06-12

### Fixed
- **Plugin-UI war englisch trotz deutscher Obsidian-App**: Die Spracherkennung
  nutzt jetzt die offizielle `getLanguage()`-API (Fallback: `moment.locale()`,
  dann Legacy-`localStorage`). Gefunden im Pre-Submission-Test.

### Added
- **Flache Infoblock-Felder `info_1` … `info_4`** im Format „Label: Wert" —
  in Obsidians Eigenschaften-Ansicht direkt editierbar (die `info:`-Map bleibt
  für YAML-Nutzer erhalten; ohne Doppelpunkt wird das Label „Info" verwendet).
- Die **Frontmatter-Vorlage folgt der Briefsprache**: englische Feldnamen
  (`recipient`, `subject`, `salutation`, …) bei Briefsprache Englisch, und sie
  fügt jetzt alle Felder ein (`gruss`, `unterschrift`, `stil`, `infozeile`,
  `sprache`, `info_1`) — leer = Einstellungs-/Sprach-Standard, alles in den
  Eigenschaften editierbar.

### Changed
- **Custom-CSS-Feld kommt vorbefüllt** mit einem komplett auskommentierten,
  wirkungslosen Preset (dokumentiert alle Tokens an Ort und Stelle); der
  Button heißt jetzt **„Reset preset"**. Migration: leere Felder und das alte
  *aktive* Preset (das die Stil-Auswahl übersteuerte) werden ersetzt.
- Kürzere Settings-Beschreibungen — näher am Obsidian-Standard-Layout.

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
- **Frontmatter-Sektion in den Einstellungen**: kompakte Übersicht aller
  Felder + Button/Befehl **„Brief-Frontmatter in Notiz einfügen"** (ergänzt
  Empfänger, Betreff, Anrede, Ort, Datum, Anlagen, ohne vorhandene Werte zu
  überschreiben).
- **`absender` als einfache YAML-Liste** (eine Kuvertzeile pro Listenpunkt;
  Telefon/E-Mail/Web/PLZ+Ort werden automatisch erkannt) — zusätzlich zu den
  Einzelfeldern `absender_name` & Co., die weiterhin Feld für Feld gewinnen.
- **Paginierte Brief-Vorschau**: zeigt echte A4-Blätter mit denselben
  Seitenumbruch-Positionen wie der Druck statt einer Endlos-Seite.
- **Mehrsprachigkeit**: Die Plugin-UI folgt automatisch der
  Obsidian-App-Sprache (Englisch Standard, Deutsch lokalisiert). Neu ist die
  davon unabhängige Einstellung **Letter language** (Frontmatter `sprache`):
  deutsche oder englische Brief-Labels (Anlage/Enclosure, Ihr Zeichen/Your
  ref., Datum/Date, Tel./Phone) inkl. Sprach-Standard für die Grußformel
  („Mit freundlichen Grüßen“ / „Kind regards“); „Standard-Grußformel“ leer =
  Sprach-Standard (bestehender deutscher Default wird migriert).

### Changed
- **DIN-Briefkopf neu**: Name (oder Logo) links, Kontaktdaten rechts, Hairline
  darunter — statt rechtsbündigem Kopf + Absenderblock neben der Anschrift.
- Die horizontale Bezugszeichenzeile wurde durch den **Infoblock** ersetzt;
  die Einstellung „Bezugszeichenzeile" wird zu „Infozeile" migriert.
- Settings-Migration: War eine der Design-Varianten-Dateien ins Feld
  „Eigenes CSS" eingefügt, wird sie automatisch als Stil/Infozeile übernommen
  und das Feld geleert; alte Schrift-Defaults werden zu „Stil-Standard".
- **Grundschriftgröße aller Stile auf 10 pt** (vorher 11/11,5 pt); per
  Einstellung oder Token weiterhin frei änderbar.
- Druckränder nach Dokumenten-Standard: Folgeseiten oben 25 mm, unten überall
  20 mm; Seite 1 behält oben 10 mm (DIN-Briefkopf sitzt konstruktionsbedingt
  hoch).
- Einstellungen zeigen jetzt die wirksamen Standardwerte als Platzhalter
  (Schriftart/-größe je Stil, automatische Rücksendeangabe).
- **UI auf Englisch** gemäß Obsidian-Community-Richtlinien (Sentence case,
  `setHeading()` statt eigener Überschriften, kein Top-Level-Heading):
  Befehle heißen jetzt „Export letter as PDF / print", „Open letter preview",
  „Insert letter frontmatter into note". Die Befehl-IDs wurden bereinigt
  (`export-letter`, `open-preview`, `insert-frontmatter` — ohne Plugin-Präfix);
  zugewiesene Hotkeys müssen einmalig neu gesetzt werden. Brief-Inhalte
  (Anlagen, Ihr Zeichen, Grußformel …) bleiben deutsch — sie sind Briefsprache
  nach DIN, keine UI.
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
