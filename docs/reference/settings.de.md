# Referenz — Einstellungen

> 🇩🇪 Deutsch · [🇬🇧 English](settings.md)

Einstellungen → Community-Plugins → **Letterhead**. Die Plugin-UI folgt der
Obsidian-App-Sprache (Englisch als Standard, Deutsch lokalisiert); diese
Referenz nennt die englischen Bezeichnungen und erklärt auf Deutsch. Die
Sprache des **Briefs** ist davon unabhängig (Einstellung **Letter language**).

## Layout & Stil

| Einstellung | Werte | Bedeutung |
|-------------|-------|-----------|
| **Layout** | `DIN 5008 (German standard)` · `Modern / international` | Brief-Grundlayout. DIN = deutscher Standard, fensterkuvert-tauglich; Modern = freies, internationales Layout. |
| **Style** | `A · Sachlich (neutral sans)` · `B · Klassisch (serif)` · `C · Technisch (monospaced accents)` | Komplettes Erscheinungsbild (Schrift, Farben, Abstände, Briefkopf-Typo). Pro Brief per Frontmatter `stil` überschreibbar. |
| **Info line** | `Full (info block)` · `Date only` | Full: Infoblock rechts neben der Anschrift (Steuernummer, Zeichen, … Datum). Date only: schlichte rechtsbündige Orts-/Datumszeile — für Arbeitgeber- und Privatkorrespondenz. Pro Brief per Frontmatter `infozeile` überschreibbar. |
| **DIN 5008 form** | `Form A (27 mm)` · `Form B (45 mm)` | Position des Anschriftfelds und der Falzmarken. Form B ist der Standard. |

### Die drei Stile

| Stil | Charakter |
|------|-----------|
| **A · Sachlich** | Serifenlos (Helvetica/Arial). Der neutrale, sichere Standard für Behörden und Arbeitgeber. |
| **B · Klassisch** | Serifenschrift (Palatino/Georgia). Traditionell, autoritativ, gediegen-persönlich. |
| **C · Technisch** | Serifenloser Fließtext mit monospaced Labels in Kopf, Infoblock und Anlagenvermerk. Diszipliniert, gerastert. |

Alle Stile sind reines Schwarz/Grau und lassen die DIN-Geometrie
(Fensterkuvert-Position) unangetastet.

## Sender profile (Absender-Profil)

Default-Absender (Name, Company/addition, Street, Postal code and city, Phone,
Email, Website). Gilt für alle Briefe und ist pro Brief im Frontmatter
überschreibbar (`absender`-Liste oder `absender_name` usw.). Name (oder Logo)
erscheint links im Briefkopf, die Kontaktdaten rechts.

| Einstellung | Bedeutung |
|-------------|-----------|
| **Return address line** | Rücksendeangabe — kleine Zeile über der Empfängeranschrift (fürs Fensterkuvert). Leer = automatisch aus `Name · Straße · PLZ Ort`. |

## Elements (Elemente)

| Einstellung | Bedeutung |
|-------------|-----------|
| **Fold marks** | Faltmarken — zwei Markierungen zum Falten fürs Fensterkuvert. |
| **Hole mark** | Lochmarke bei 148,5 mm zum Abheften. |
| **Print offset top (mm)** | Druckversatz-Feinjustierung (Standard 0): schiebt den gesamten Briefinhalt nach unten, falls die Anschrift im Kuvertfenster zu hoch sitzt; 2–4 mm probieren. Falt-/Lochmarken bleiben papierbezogen unverändert, damit die Faltung stimmt. Druckränder setzt das Plugin immer automatisch: Seite 1 oben 10 mm (der DIN-Briefkopf sitzt konstruktionsbedingt hoch), Folgeseiten oben 25 mm, unten überall 20 mm. |
| **Show logo** + **Logo path** | Bild statt Name im Briefkopf; vault-relativer Pfad (z. B. `assets/logo.png`), als data-URL eingebettet. |

## Typography & language (Typografie & Sprache)

| Einstellung | Bedeutung |
|-------------|-----------|
| **Font (CSS font-family)** | Optionaler Override. Leer = Standard des gewählten Stils; der Platzhalter zeigt den wirksamen Wert. |
| **Font size (pt)** | Optionaler Override. Leer = Stil-Standard (10 pt); der Platzhalter zeigt den wirksamen Wert. |
| **Date locale** | z. B. `de-DE`, `en-GB`, `en-US` — Format der Datumsausgabe. |
| **Letter language** | Sprache der gedruckten Labels: `Deutsch` (Anlagen, Ihr Zeichen, Datum, Tel.) oder `English` (Enclosures, Your ref., Date, Phone). Pro Brief per Frontmatter `sprache` überschreibbar. |
| **Default closing** | Standard-Grußformel, wenn `gruss` im Frontmatter fehlt. Leer = Sprach-Standard („Mit freundlichen Grüßen" / „Kind regards"). |

## Frontmatter (per letter)

Eine kompakte Übersicht aller Frontmatter-Felder direkt in den Einstellungen,
plus Button **Insert frontmatter template** (auch als Befehl
**Insert letter frontmatter into note**): ergänzt Empfänger, Betreff, Anrede,
Ort, Datum und Anlagen im Frontmatter der aktiven Notiz, ohne vorhandene Werte
zu überschreiben. Vollständige Referenz: [Frontmatter-Felder](frontmatter.de.md).

## Advanced (Erweitert)

| Einstellung | Bedeutung |
|-------------|-----------|
| **Ausgabeziel** | Wohin die exportierte PDF geschrieben wird: **Neben die Notiz** · **Obsidians Anhang-Ordner** · **Eigener Ordner** · **Nicht speichern, direkt teilen**. Gilt für den Vektor-PDF-Export, nicht für den Desktop-Druckdialog — dort entscheidet das Betriebssystem, wo die Datei landet. Eine vorhandene Datei wird nie überschrieben, sondern um `" (2)"` ergänzt. |
| **Eigener Ordner** | Vault-relativer Zielordner, z.B. `Export/Briefe`. Wird nur angezeigt, wenn **Ausgabeziel** auf *Eigener Ordner* steht — ein Feld, das in den anderen drei Modi wirkungslos ist, wäre eine Falle. |
| **Dateinamen-Schema** | Name der exportierten PDF und Vorschlag im Druckdialog. Siehe die Platzhalter-Tabelle unten. |
| **Custom CSS (optional)** | Eigenes CSS für Feinheiten jenseits von Stil + Infozeile; wird zuletzt geladen und gewinnt. Das Feld ist mit einem **komplett auskommentierten** (wirkungslosen) Preset vorbefüllt, das alle Tokens dokumentiert — Zeile einkommentieren = aktivieren. **Reset preset** stellt den Ausgangszustand wieder her. Siehe [Theming](theming.de.md). |

### Platzhalter für den Dateinamen

Alles im Feld, was kein Platzhalter ist, bleibt wörtlich stehen — `Brief {datum} —
{empfaenger}` funktioniert also genau so. Zeichen, die ein Dateisystem ablehnt,
werden ersetzt; bleibt nichts übrig, greift der Notizname.

| Platzhalter | Ergibt |
|-------------|--------|
| `{notiz}` | Name der Notiz, aus der der Brief erzeugt wurde. |
| `{datum}` | Datum als **YYYY-MM-DD**, damit Briefe im Dateimanager chronologisch sortieren. Das **normalisiert** den Frontmatter-Rohwert — es formatiert nicht das Datum neu, das im Brief gedruckt wird. |
| `{datum_lang}` | Das Datum so, wie es im Brief steht (gemäß Einstellung **Datums-Locale**). |
| `{empfaenger}` | Erste Zeile der Empfängeranschrift. |
| `{betreff}` | Betreffzeile. |
| `{unserzeichen}` | Das Feld `unser zeichen` / `our ref.`. |

### Vorgaben für neue und bestehende Installationen

Neuinstallationen starten mit **Ausgabeziel: Neben die Notiz** und dem
Dateinamen-Schema **`{datum} {empfaenger}`**. Bestehende Installationen behalten
das Verhalten, das sie vor diesen Einstellungen hatten — Ausgabeziel **Nicht
speichern, direkt teilen** und das Schema **`{notiz}`** — ein Update ändert also
nie stillschweigend, wo deine Briefe landen.

> **Seit 1.4.0 entfallen:** Die Einstellung **Mobiler Export** bot einmal die Wahl
> zwischen dem Vektor-PDF und einem HTML-/Quick-Look-Weg. Der Fallback wurde
> zugunsten des Degradations-Modells abgeschafft (der mobile Export erzeugt immer
> eine PDF; was die Engine nicht darstellen kann, wird als Hinweis gemeldet). Das
> Dropdown ist bei einer späteren Aufräumung entfernt worden; der gespeicherte
> Schlüssel wird weiterhin akzeptiert, damit alte Konfigurationen laden.
