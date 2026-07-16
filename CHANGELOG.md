# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/) (Tags **ohne** v-Präfix).

## [Unreleased]

## [1.4.0] — 2026-07-12

Umbau der Build- und Provenance-Basis — die Brief-Funktionalität ist unverändert,
aber der mobile Vektor-PDF-Export wird deutlich leistungsfähiger.

### Changed
- **Build-System:** Das Plugin ist nicht mehr abhängigkeits- und build-frei. `src/`
  (TypeScript) wird per `esbuild` zu `main.js` gebündelt; `main.js` ist jetzt ein
  Build-Artefakt (gitignored), keine committete Quelle mehr. Grund: der
  PDF-Engine-Kern wird als geteiltes Kit vendored (`src/vendor/kit/`) statt pro
  Plugin neu geschrieben — das ist mit reinem Zero-Build nicht mehr praktikabel.
- **Release-/Provenance-Modell:** Die GitHub-Attestation (`actions/attest-build-provenance`)
  signiert jetzt den **Build-Output** (`main.js`/`manifest.json`/`styles.css`), frisch aus
  dem getaggten Quellstand via `npm ci` + `npm run gate` gebaut — nicht mehr committete Bytes
  1:1 (bisheriges `source = output`-Modell aus 1.2.2). Provenance-Garantie: reproduzierbar aus
  dem attestierten Commit, verifizierbar mit `gh attestation verify`.
- **Mobiler Vektor-PDF-Export erzeugt jetzt reiche Markdown-Bodies:** Tabellen,
  eingebettete Bilder, Code-Blöcke und mehrseitige Paginierung werden direkt im
  Vektor-PDF gerendert (per Degradation auf einfachere Darstellung bei nicht
  unterstützten Elementen) — statt wie bisher auf den HTML/Quick-Look-Weg
  auszuweichen. Der Desktop-Druckweg (`window.print()`) ist unverändert.
- **Code-Blöcke bleiben auch dann intakt, wenn andere Plugins sie einfärben:**
  Fenced-Code wird für den PDF-Weg direkt aus dem Markdown gelesen, statt aus dem
  gerenderten DOM. Obsidians Renderer führt alle installierten Markdown-Prozessoren
  aus — ein fremdes Plugin, das z. B. ```json in ein eigenes Widget verwandelt (etwa
  „JSON Editor"), hinterlässt dort kein `<pre>` mehr, sondern seine Bedienelemente.
  Im PDF erscheint jetzt der Code, den Sie geschrieben haben, unabhängig von Ihren
  übrigen Plugins. Der Desktop-Druckweg nutzt weiterhin die gerenderte Ansicht (dort
  ist die Plugin-Darstellung korrekt und gewollt).

## [1.3.0] — 2026-06-28

Mobiler PDF-Export als **ein Tipp** — die schwächste Stelle des Plugins (der
manuelle Quick-Look-Tanz auf iOS) ist behoben.

### Added
- **Mobiler Vektor-PDF-Export:** Auf iPhone/iPad erzeugt der Brief jetzt ein echtes,
  textselektierbares Vektor-PDF und teilt es direkt über den System-Share-Sheet
  (`navigator.share()`) — statt HTML zu schreiben und den Nutzer durch Schnellansicht →
  Drucken → Aufziehen → Sichern zu schicken. Eigener, **abhängigkeits- und build-freier**
  PDF-Writer (PDF 1.7, Adobe-Core-14-Standardschriften, WinAnsi mit Umlauten/€); keine
  neue Bibliothek, keine Netzwerkzugriffe — die Zero-Build-/`source = output`-Garantie
  bleibt unverändert.
- Neuer Befehl **„Brief als PDF exportieren (Vektor)"** — erzeugt das Vektor-PDF auf
  Desktop und Mobile.
- Einstellung **„Mobiler Export"** (`Vektor-PDF` ⁄ `Drucken / Quick Look`) als
  Sicherheitsventil; Standard ist das neue Vektor-PDF.
- Node-Tests (`npm test`, reines `node --test` ohne Build-Toolchain) für die puren
  Engine-Funktionen (Einheiten, Encoding, Metriken, Writer, Umbruch, Layout, Body).

### Notes
- Komplexe Body-Inhalte (Tabellen, eingebettete Bilder, Code-Blöcke) lösen automatisch
  den bisherigen HTML/Quick-Look-Weg als Fallback aus; der Desktop-Druckweg ist unverändert.

## [1.2.2] — 2026-06-16

Lieferketten-Transparenz — keine funktionalen Änderungen am Brief.

### Added
- **GitHub Artifact Attestation** für Release-Dateien: Releases werden über GitHub
  Actions veröffentlicht und signieren `main.js`, `manifest.json` und `styles.css`
  kryptografisch (Sigstore/SLSA-Provenance). Da das Plugin abhängigkeits- und build-frei
  ist, wird **nichts gebaut** — signiert werden exakt die committeten Bytes, die du liest
  und installierst. Verifizierbar mit `gh attestation verify`. Die lesbare, ungebündelte
  Quelle bleibt die primäre Garantie; die Attestation legt eine Provenance-Schicht darüber.

## [1.2.1] — 2026-06-13

Feinschliff nach dem Community-Verzeichnis-Review — keine funktionalen Änderungen am Brief.

### Changed
- Spracherkennung nutzt nur noch `getLanguage()` + `moment.locale()`; der redundante
  `localStorage`-Fallback wurde entfernt.
- `ui-monospace` aus dem Monospace-Stack des technischen Stils entfernt — auf älteren
  Obsidian-Versionen nicht unterstützt; die benannten System-Fonts decken alle Plattformen ab.

### Removed
- Veraltete Design-Entwürfe unter `design/` (die Stile leben seit 1.1.0 in `main.js`,
  Theming in `presets/letterhead-theme.css`).

### Added
- `package-lock.json` (leeres Lockfile — das Plugin ist dependency-free) für reproduzierbare Builds.

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
