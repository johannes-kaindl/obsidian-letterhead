# Referenz — Einstellungen

Einstellungen → Community-Plugins → **Briefkopf**. Die UI ist gemäß den
Obsidian-Richtlinien englisch; diese Referenz erklärt jede Einstellung auf
Deutsch.

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

## Typography (Typografie)

| Einstellung | Bedeutung |
|-------------|-----------|
| **Font (CSS font-family)** | Optionaler Override. Leer = Standard des gewählten Stils; der Platzhalter zeigt den wirksamen Wert. |
| **Font size (pt)** | Optionaler Override. Leer = Stil-Standard (10 pt); der Platzhalter zeigt den wirksamen Wert. |
| **Date locale** | z. B. `de-DE`, `en-GB`, `en-US` — Format der Datumsausgabe. |
| **Default closing** | Standard-Grußformel, wenn `gruss` im Frontmatter fehlt. |

## Frontmatter (per letter)

Eine kompakte Übersicht aller Frontmatter-Felder direkt in den Einstellungen,
plus Button **Insert frontmatter template** (auch als Befehl
**Insert letter frontmatter into note**): ergänzt Empfänger, Betreff, Anrede,
Ort, Datum und Anlagen im Frontmatter der aktiven Notiz, ohne vorhandene Werte
zu überschreiben. Vollständige Referenz: [Frontmatter-Felder](frontmatter.md).

## Advanced (Erweitert)

| Einstellung | Bedeutung |
|-------------|-----------|
| **Custom CSS (optional)** | Eigenes CSS für Feinheiten jenseits von Stil + Infozeile. Wird zuletzt geladen und gewinnt. **Insert preset** lädt einen kommentierten Startpunkt. Siehe [Theming](theming.md). |
