# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/) (Tags **ohne** v-Präfix).

## [Unreleased]

## [1.7.0] — 2026-09-26

### Added
- **Hilfe-Zeile ganz oben in den Einstellungen**, mit Links auf die Dokumentation und den Issue-Tracker (Knopf `bug`).

### Changed
- **Doku: Installationsweg und Attestations-Zusage sagen jetzt, was tatsächlich gilt.**
  Letterhead ist derzeit nicht im Community-Verzeichnis gelistet und GitHub-Releases sind
  ausgesetzt — die README empfahl trotzdem die Store-Suche, und `SECURITY.md` sagte
  unbedingt zu, *jedes* Release werde von GitHub Actions gebaut und Sigstore-signiert. Für
  1.6.5 und 1.6.6 stimmte beides nicht: sie sind nur auf Forgejo erschienen und tragen
  `checksums.sha256` statt einer Attestation. Neu beschreiben README und `SECURITY.md`
  (je EN + DE) beide Auslieferungswege und **was jeder von beiden belegt** — Attestation
  = Herkunft aus dem getaggten Commit, Prüfsumme = Unversehrtheit des Downloads, und eine
  Prüfsumme vom selben Server wie die Dateien ersetzt das erste nicht. Der genannte
  `gh attestation verify`-Aufruf trägt jetzt den Vorbehalt, dass sein Fehlschlag derzeit
  der erwartete Ausgang ist und kein Manipulationshinweis; als Ersatz steht der Weg über
  einen eigenen Build aus dem Tag da. Installation läuft bis auf Weiteres über
  **AnySource Sideloader** (liest Forgejo direkt) oder manuell aus dem Forgejo-Release.
  Seit dem 2026-09-03 gibt es dafür einen abonnierbaren **Katalog**, der Letterhead neben
  den übrigen Plugins desselben Autors listet — beide READMEs nennen ihn.
- **Die READMEs zeigen wieder Bilder.** Beide banden Hero-Bilder und alle Dateilinks über
  absolute `github.com`-URLs ein — 15 Stück je Sprache, seit dem Konto-Ausfall allesamt
  **404**, sichtbar als zwei kaputte Bilder direkt unter der Überschrift. Sie sind jetzt
  **repo-relativ** (`SECURITY.md`, `LICENSE`, `docs/…`) und funktionieren damit auf jeder
  Forge und in jedem Klon. Die **Bilder** bleiben absolut, aber auf Forgejo-Raw statt
  GitHub: eine Store-Seite rendert die README außerhalb des Repos und lädt relative
  Bildpfade nicht — worauf das README-Gate zu Recht hinwies. Die Repository-Zeile
  nennt Forgejo als Quelle statt des unerreichbaren Mirrors.

## [1.6.6] — 2026-09-03

### Changed
- **Die Platzhalter für nicht darstellbare Formeln und Grafiken folgen jetzt der
  Briefsprache.** Steht im Brief eine Formel oder eine reine Grafik, die das PDF nicht
  wiedergeben kann, druckt Letterhead an ihrer Stelle einen sichtbaren Hinweis. Der war bis
  hierher immer deutsch — in einem englischen Brief stand `[Grafik]` neben `Enclosures`.
  Jetzt richtet er sich nach `sprache`/`language` bzw. der eingestellten Briefsprache:
  `[Formel]`/`[Grafik]` bzw. `[Formula]`/`[Graphic]`. **Nicht** nach der Sprache der
  Obsidian-Oberfläche — ein deutsches Obsidian kann einen englischen Brief setzen.
- Die PDF-Engine kommt aus `obsidian-kit` **0.30.0**, das Dateiname-Schema aus
  `code-kit` **0.5.0**. Beide Pins stehen in `src/vendor/kit/VENDOR.json`: seit
  obsidian-kit `2ab1bb5` liegt die domänenfreie pure-Teilmenge in einem eigenen Repo, der
  Vendor-Baum stammt also aus zwei Quellen. `tools/sync-kit.sh` liest aus beiden Tag-Refs
  (`^{commit}`-gepeelt, bei code-kit zwingend — dort sind die Tags annotiert) und prüft alle
  Quellpfade, bevor es die erste Datei schreibt. Am vendorierten Code ändert der Umzug
  nichts: `filename-template.ts` ist in code-kit@0.5.0 byte-identisch mit dem bisherigen
  Stand.

## [1.6.5] — 2026-09-02

### Changed
- Dateiname-Schema und Vault-Pfad-Rechnung kommen aus `obsidian-kit` 0.27.0
  (`src/vendor/kit/filename-template.ts`, `src/vendor/kit/vault-path.ts`) statt aus lokalen
  Kopien. Beide Module wurden aus letterhead, obsidian-paperize und yijing-oracle
  zusammengeführt; letterhead hat den `Object.hasOwn`-Guard und den Nullguard in
  `sanitizeFilename` beigesteuert.
- `tools/sync-kit.sh` liest den Kit-Code aus einer festen Tag-Ref (`git show 0.27.0:<pfad>`)
  statt aus dem Arbeitsstand des Nachbar-Repos und stempelt den mit `^{commit}` gepeelten
  Tag-Commit. Vorher hing das Ergebnis am HEAD von `../obsidian-kit`, und `VENDOR.json` nannte
  eine SHA, die kein Release trägt. Kein vendorierter Inhalt ändert sich dadurch.
- `authorUrl` im Manifest zeigt auf das GitHub-Profil, unter dem der Code liegt, statt auf die
  selbst gehostete Domain — der Store-Review prüft das Feld auf Erreichbarkeit.

### Fixed
- **Ein führender Slash im Zielordner wird jetzt entfernt.** Die lokale Pfad-Fügung strippte
  nur *schließende* Slashes (`Export/PDF/` → `Export/PDF`), führende blieben stehen und hätten
  einen nicht normalisierten Vault-Pfad (`/Export/Brief.pdf`) an `adapter.mkdir`/`writeBinary`
  weitergereicht. Kein bestehendes Ergebnis ändert sich dadurch — der eigene Zielordner läuft
  vorher durch Obsidians `normalizePath`, und der Ordner der Notiz kommt von Obsidian selbst.
  Es fällt eine Falle im Modul weg, kein sichtbarer Fehler: die Zusage gilt jetzt im Modul
  statt nur an der einen Aufrufstelle. Der Kit-Baustein wandelt zusätzlich Backslashes zu `/`
  und kollabiert interne Mehrfach-Slashes — beides konnte die lokale Fassung nicht.

### Security
- Die Ausdrücke im Release-Workflow stehen jetzt in `env:` statt direkt in `run:`-Skripten.
  In `run:` interpoliert GitHub den Wert vor dem Shell-Start, ein Tag-Name kann dort also
  Shell-Syntax einschleusen; über `env:` erreicht er das Skript als Variable.

### Removed
- Die Null-Prototyp-Map in `buildFilename` (`Object.create(null)`) ist **absichtlich**
  entfallen. Sie war die zweite von zwei Schichten gegen dasselbe Leck; die erste, der
  `Object.hasOwn`-Guard, sitzt jetzt im Kit-Modul und schützt dort alle drei Plugins.
  `{toString}`, `{constructor}` & Co. bleiben unverändert wörtlich stehen (per Test
  festgenagelt) — wer die Map vermisst, sieht keine Regression, sondern die entfallene
  Redundanz.

## [1.6.4] — 2026-08-14

### Fixed
- **Codeblock verschwand aus dem PDF, wenn ein Fence direkt an einer Textzeile klebte.** Ein
  Fenced Code darf in CommonMark/Obsidian einen Absatz unterbrechen — steht er ohne Leerzeile
  unter einer Textzeile, landete der interne Platzhalter per Zeilenumbruch im selben Absatz.
  Aufgelöst wird aber nur ein alleinstehender Platzhalter, also fiel der Codeblock aus dem PDF
  und der rohe Platzhaltertext (`LETTERHEADCODE0`) wurde stattdessen als Fließtext gedruckt.
  Bestand seit 1.4.0. Behoben stromaufwärts in `obsidian-kit` 0.26.1, hier re-vendored.

### Changed
- PDF-Engine von `obsidian-kit` 0.22.0 auf 0.26.1 nachgezogen (außer der Codeblock-Korrektur
  keine inhaltliche Änderung — die übrigen Kit-Releases betrafen andere Module).
- Settings-Fallback-Walker kommt aus `obsidian-kit` 0.25.0 statt aus einer lokalen Kopie.
- ESLint-Kern und der lokale Spiegel des Store-Scanners stammen jetzt aus der zentralen
  Release-Vorlage — was `npm run lint` prüft, entspricht damit dem, was der Store prüft.
- Release-Tooling zentralisiert (`../tools/release/`) statt einer repo-eigenen Kopie;
  `check-no-nul-bytes.mjs` ist Teil der Test-Kette, CI nutzt `checkout`/`setup-node` v5.

## [1.6.3] — 2026-08-05

### Fixed
- **Grafisch gerenderte Elemente verschwanden spurlos aus dem PDF.** MathJax-Formeln, Mermaid-
  Diagramme und nacktes SVG tragen keinen Textknoten; die DOM→IR-Umwandlung prüfte nur
  `textContent` und ließ sie ungezählt fallen — auch die Zusammenfassungs-Notice blieb dadurch
  stumm, das PDF gab keinen Hinweis, dass etwas fehlte. Jetzt erscheinen `[Formel]`/`[Grafik]`
  als sichtbare Vereinfachung. Dekoratives (Callout-Icons, `aria-hidden`) wird weiterhin
  übergangen, statt fälschlich als verlorene Grafik gemeldet zu werden.
- **Aufgabenlisten verloren ihren Zustand.** `- [ ]` und `- [x]` wurden zu optisch gleichen
  Aufzählungspunkten; der Zustand steht jetzt wieder als `[ ]`/`[x]` voran.
- **Überschrift blieb über einer fast leeren Seite zurück.** Der Waisenschutz maß Textzeilen des
  Folgeblocks — bei einem Bild sinnlos, weil es atomar umbricht. Jetzt zählt die volle Bildhöhe.

Alle drei stammen aus `obsidian-kit` 0.18.0–0.22.0 und waren seit 1.4.0 (Kit 0.17.0) vorhanden.

## [1.6.2] — 2026-07-25

### Fixed
- **Eingebettete Bilder erschienen auf iOS nicht im Vektor-PDF.** Obsidians iOS-App (Capacitor)
  liefert für eingebettete Bild-Elemente `src="capacitor://localhost/_capacitor_file_/…"` statt
  `app://` wie auf Desktop. Die Bild-Erkennung kannte dieses Schema nicht und behandelte den vollen
  Capacitor-URL fälschlich als vault-relativen Wikilink — dessen Auflösung scheiterte, das Bild
  wurde nie gerastert und erschien im PDF nur als Platzhaltertext. Betraf jedes eingebettete
  Bildformat auf iOS/iPadOS, nicht nur SVG. Auf iPhone verifiziert.
- **Phantom-Ordner bei jedem Export in den Vault-Root.** Beim Export-Ziel „Custom-Ordner" mit
  Vault-Root (`/`) oder direkt neben der Notiz im Root berechnete die Verzeichnis-Ermittlung beim
  Schreiben der PDF einen um ein Zeichen verkürzten Ordnernamen und legte ihn als leeres
  Verzeichnis an. Betraf jeden Export ohne Unterordner im Zielpfad. Auf iPhone verifiziert.

## [1.6.1] — 2026-07-23

### Changed
- **Store-Warnung `obsidianmd/prefer-create-el` im Code aufgelöst statt abgeschaltet.** Der
  frühere `eslint`-Override (`prefer-create-el: off`) ist entfernt; der Linter meldet jetzt
  0 Warnungen. `core/image.ts` erzeugt das Raster-`<canvas>` nicht mehr selbst über
  `activeDocument.createElement`, sondern bekommt es als Factory injiziert (`() => createEl('canvas')`)
  — die reine Kernschicht bleibt so frei von Obsidian-Globals. Der Druck-`iframe` (`doPrint`) nutzt
  `createEl`; die Vorschau-Paginierung erzeugt ihre Blätter mit `createDiv()` und übernimmt sie per
  `doc.adoptNode()` in den iframe-Realm (Obsidians Helfer existieren dort nicht). Rein intern, kein
  sichtbares Verhalten geändert (Desktop-Druck, Vektor-PDF und Vorschau verifiziert).

## [1.6.0] — 2026-07-23

### Removed
- **Einstellung „Mobiler Export" entfernt.** Sie bot seit 1.4.0 nur noch eine einzige Option und
  wurde von keinem Codepfad mehr gelesen — der HTML/Quick-Look-Weg war damals zugunsten des
  Degradations-Modells abgeschafft worden, das Dropdown blieb als Attrappe stehen. Der
  gespeicherte Schlüssel wird weiterhin akzeptiert, alte Konfigurationen laden also unverändert;
  es ändert sich nichts am Verhalten, nur eine wirkungslose Zeile verschwindet aus den
  Einstellungen.

### Fixed
- **Dokumentation beschrieb einen Exportweg, den es nicht mehr gibt.** README (beide Sprachen)
  und das Tutorial führten weiterhin durch den alten iOS-Umweg (HTML-Datei → Quick Look →
  Drucken → Vorschau aufziehen → sichern) und verwiesen auf die „Mobiler Export"-Einstellung.
  Seit 1.3.0 ist der mobile Export ein Tipp. Auch `AGENTS.md` und ein Kommentar in `core/model.ts`
  behaupteten den wählbaren Fallback.
- **Referenz-Doku um die 1.5.0-Einstellungen ergänzt:** Ausgabeziel, eigener Ordner und
  Dateinamen-Schema samt Platzhalter-Tabelle fehlten in `docs/reference/settings.md` vollständig,
  obwohl sie bestimmen, wohin die PDF geschrieben wird und wie sie heißt.

### Changed
- **Intern:** `core/body-ir.ts` nimmt das Briefmodell nicht mehr als `any`, sondern als
  typisierte Consumer-Shape `LetterBodyModel` (Muster von `LetterHeadModel`). Damit fallen die
  letzten 32 Lint-Warnungen des Repos weg, die im Community-Store-Review als Warnings auftauchten.
  Keine Verhaltensänderung: alle drei Änderungen sind Typkonstrukte, der Build-Output ist bis auf
  die Bezeichner-Vergabe des Minifiers identisch (Zahlen-Literale byte-gleich). Der Anlagen-Block
  ist dabei erstmals von Tests abgedeckt (Singular/Plural-Label, Fallback, Position).
- **Einstellungen-Tab auf die deklarative API (`getSettingDefinitions`) umgestellt.** Auf Obsidian
  ab 1.13 rendern die Einstellungen im nativen Karten-Layout inklusive Einstellungs-Suche; auf
  älteren Versionen greift unverändert der bisherige Aufbau (`display()`), der dieselben
  Definitionen durchläuft — es gibt keine zweite Quelle. `minAppVersion` bleibt 1.8.7, Felder und
  Verhalten sind identisch. Damit entfällt der letzte begründungslose Lint-Override des Repos.

## [1.5.0] — 2026-07-20

### Added
- **Ausgabeziel** (Einstellungen → Erweitert): Wohin die exportierte PDF geschrieben wird —
  **neben die Notiz**, in **Obsidians Anhang-Ordner**, in einen **eigenen Ordner** oder gar nicht
  speichern und **direkt teilen**. Bisher landete jeder Export im versteckten Zwischenordner und
  wurde extern geöffnet; das ist jetzt eine Option von vieren statt der einzige Weg. Eine
  vorhandene Datei wird nicht überschrieben, sondern um `" (2)"` ergänzt.
- **Dateinamen-Schema** (Einstellungen → Erweitert): Wie die PDF heißt, ist konfigurierbar.
  Platzhalter `{notiz}` `{datum}` `{datum_lang}` `{empfaenger}` `{betreff}` `{unserzeichen}`,
  alles andere im Feld bleibt wörtlich stehen. `{datum}` liefert **YYYY-MM-DD**, damit Briefe im
  Dateimanager chronologisch sortieren; `{datum_lang}` gibt das Datum so aus, wie es im Brief
  steht. Neuinstallationen starten mit `{datum} {empfaenger}`.
- **Der Druckdialog schlägt jetzt den Briefnamen vor.** Bisher bot er den Fenstertitel an — etwa
  `Beispielbrief - MeinVault - Obsidian 1.13.2.pdf`. Er nutzt dasselbe Schema wie der PDF-Export.

### Changed
- Bestehende Installationen behalten ihr bisheriges Verhalten und müssen nichts umstellen:
  Ausgabeziel steht bei ihnen auf „direkt teilen", das Dateinamen-Schema auf `{notiz}`. Beides
  lässt sich in den Einstellungen umstellen.

## [1.4.1] — 2026-07-20

Behebt die vier Fehler, an denen der Community-Store-Review von 1.4.0 gescheitert
ist. Der gedruckte Brief ist unverändert — die Änderungen betreffen, **wie** er
erzeugt wird.

### Changed
- **Desktop-Druck läuft über ein eigenes iframe.** Bisher hängte der Export ein
  `<style>` in Obsidians `document.head`, schrieb den Brief per `innerHTML` in die
  App-DOM und blendete alle Geschwister-Elemente per `display:none` aus. Beides ist
  im Community-Store verboten. Der Brief wird jetzt als eigenständiges Dokument in
  einem versteckten iframe gedruckt. Nebeneffekt: eigenes Custom-CSS kann nicht mehr
  in die laufende App durchschlagen, und der Druck wartet auf das `load`-Ereignis
  des Rahmens statt auf einen 150-ms-Timer — eingebettete Logos sind dadurch
  zuverlässig gesetzt, bevor der Druckdialog aufgeht.
- **`minAppVersion` 1.4.0 → 1.8.7.** Das Plugin nutzt `getLanguage` (ab 1.8.7) und
  `processFrontMatter` (ab 1.4.4); die bisherige Angabe war schlicht zu niedrig.

### Fixed
- Objekte im Frontmatter erzeugten die wörtliche Zeichenkette `[object Object]` im
  fertigen Brief (etwa bei versehentlich verschachteltem YAML unter `betreff:` oder
  `info_1:`). Solche Werte bleiben jetzt leer. Alle bisher funktionierenden
  Frontmatter-Werte — Text, Zahlen, Listen, Datumsangaben — werden unverändert
  dargestellt.

### Internal
- `eslint` + `eslint-plugin-obsidianmd` als Gate (`npm run lint`, Teil von
  `npm run gate`), inklusive Verbot von Inline-`eslint-disable` (der Store wertet
  die als Fehler). Damit sind Store-Findings vor dem Release lokal sichtbar — genau
  die Lücke, durch die 1.4.0 durchgefallen ist.
- Ausstehend als eigener Schnitt: `src/core/body-ir.ts` nimmt das Briefmodell als
  `any` (32 Lint-Warnungen). Eine saubere Typisierung legt ~9 echte Typfehler in
  kuvert-kritischem Layout-Code frei und gehört nicht in ein Compliance-Release.

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
