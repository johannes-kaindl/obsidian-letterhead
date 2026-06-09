# Referenz — Einstellungen

Einstellungen → Community-Plugins → **Briefkopf**.

## Layout

| Einstellung | Werte | Bedeutung |
|-------------|-------|-----------|
| **Theme** | `DIN 5008` · `Modern` | Brief-Layout. DIN = deutscher Standard, fensterkuvert-tauglich; Modern = freies, internationales Layout. |
| **DIN-5008-Form** | `Form A (27 mm)` · `Form B (45 mm)` | Höhe des Briefkopfs und Position der Falzmarken. Form B lässt mehr Platz fürs Logo. |

## Absender-Profil

Default-Absender (Name, Zusatz/Firma, Straße, PLZ + Ort, Telefon, E-Mail, Website).
Gilt für alle Briefe und ist pro Brief im Frontmatter überschreibbar
(`absender_name` usw.).

| Einstellung | Bedeutung |
|-------------|-----------|
| **Rücksendeangabe** | Kleine Zeile über der Empfängeranschrift (fürs Fensterkuvert). Leer = automatisch aus `Name · Straße · PLZ Ort`. |

## Elemente

| Einstellung | Bedeutung |
|-------------|-----------|
| **Faltmarken** | Zwei Markierungen zum Falten fürs Fensterkuvert. |
| **Lochmarke** | Markierung bei 148,5 mm zum Abheften. |
| **Bezugszeichenzeile** | Zeile „Ihr Zeichen / Ihr Schreiben / Unser Zeichen / Telefon / Datum". |
| **Logo anzeigen** + **Logo-Pfad** | Bild im Briefkopf; vault-relativer Pfad (z. B. `assets/logo.png`), als data-URL eingebettet. |

## Typografie & Sonstiges

| Einstellung | Bedeutung |
|-------------|-----------|
| **Schriftart** | CSS `font-family` (Token `--bk-font-family`). |
| **Schriftgröße (pt)** | Grundschriftgröße (Token `--bk-font-size`). |
| **Datums-Locale** | z. B. `de-DE`, `en-GB`, `en-US` — Format der Datumsausgabe. |
| **Standard-Grußformel** | Default, wenn `gruss` im Frontmatter fehlt. |
| **Eigenes CSS** | Wird ans Theme angehängt. **„Preset einfügen"** lädt einen kommentierten Startpunkt. Siehe [Theming](theming.md). |
