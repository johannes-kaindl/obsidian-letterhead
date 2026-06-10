# Referenz — Einstellungen

Einstellungen → Community-Plugins → **Briefkopf**.

## Layout & Stil

| Einstellung | Werte | Bedeutung |
|-------------|-------|-----------|
| **Layout** | `DIN 5008` · `Modern` | Brief-Grundlayout. DIN = deutscher Standard, fensterkuvert-tauglich; Modern = freies, internationales Layout. |
| **Stil** | `A · Sachlich-modern` · `B · Klassisch-seriös` · `C · Technisch-präzise` | Komplettes Erscheinungsbild (Schrift, Farben, Abstände, Briefkopf-Typo). Pro Brief per Frontmatter `stil` überschreibbar. |
| **Infozeile** | `Vollständig (Infoblock)` · `Nur Datum` | Vollständig: Infoblock rechts neben der Anschrift (Steuernummer, Ihr Zeichen, … Datum). Nur Datum: schlichte rechtsbündige Orts-/Datumszeile — für Arbeitgeber- und Privatkorrespondenz. Pro Brief per Frontmatter `infozeile` überschreibbar. |
| **DIN-5008-Form** | `Form A (27 mm)` · `Form B (45 mm)` | Position des Anschriftfelds und der Falzmarken. Form B ist der Standard. |

### Die drei Stile

| Stil | Charakter |
|------|-----------|
| **A · Sachlich-modern** | Serifenlos (Helvetica/Arial). Der neutrale, sichere Standard für Behörden und Arbeitgeber. |
| **B · Klassisch-seriös** | Serifenschrift (Palatino/Georgia). Traditionell, autoritativ, gediegen-persönlich. |
| **C · Technisch-präzise** | Serifenloser Fließtext mit monospaced Labels in Kopf, Infoblock und Anlagenvermerk. Diszipliniert, gerastert. |

Alle Stile sind reines Schwarz/Grau und lassen die DIN-Geometrie
(Fensterkuvert-Position) unangetastet.

## Absender-Profil

Default-Absender (Name, Zusatz/Firma, Straße, PLZ + Ort, Telefon, E-Mail, Website).
Gilt für alle Briefe und ist pro Brief im Frontmatter überschreibbar
(`absender_name` usw.). Name (oder Logo) erscheint links im Briefkopf, die
Kontaktdaten rechts.

| Einstellung | Bedeutung |
|-------------|-----------|
| **Rücksendeangabe** | Kleine Zeile über der Empfängeranschrift (fürs Fensterkuvert). Leer = automatisch aus `Name · Straße · PLZ Ort`. |

## Elemente

| Einstellung | Bedeutung |
|-------------|-----------|
| **Faltmarken** | Zwei Markierungen zum Falten fürs Fensterkuvert. |
| **Lochmarke** | Markierung bei 148,5 mm zum Abheften. |
| **Druckversatz oben (mm)** | Feinjustierung (Standard 0): schiebt den gesamten Briefinhalt nach unten, falls die Anschrift im Kuvertfenster zu hoch sitzt; 2–4 mm probieren. Falt-/Lochmarken bleiben papierbezogen unverändert, damit die Faltung stimmt. Druckränder (oben 10 mm, unten 15 mm) setzt das Plugin immer automatisch. |
| **Logo anzeigen** + **Logo-Pfad** | Bild statt Name im Briefkopf; vault-relativer Pfad (z. B. `assets/logo.png`), als data-URL eingebettet. |

## Typografie & Sonstiges

| Einstellung | Bedeutung |
|-------------|-----------|
| **Schriftart** | Optionaler Override (CSS `font-family`). Leer = Standard des gewählten Stils. |
| **Schriftgröße (pt)** | Optionaler Override. Leer = Standard des gewählten Stils. |
| **Datums-Locale** | z. B. `de-DE`, `en-GB`, `en-US` — Format der Datumsausgabe. |
| **Standard-Grußformel** | Default, wenn `gruss` im Frontmatter fehlt. |

## Erweitert

| Einstellung | Bedeutung |
|-------------|-----------|
| **Eigenes CSS (optional)** | Für Feinheiten jenseits von Stil + Infozeile. Wird zuletzt geladen und gewinnt. **„Preset einfügen"** lädt einen kommentierten Startpunkt. Siehe [Theming](theming.md). |
