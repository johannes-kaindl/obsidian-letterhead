# Tutorial — dein erster Brief

> 🇩🇪 Deutsch · [🇬🇧 English](tutorial.md)

Ziel: in fünf Minuten von einer leeren Notiz zu einem fertigen PDF-Geschäftsbrief.

## 1. Plugin installieren & aktivieren

`manifest.json`, `main.js`, `styles.css`, `versions.json` nach
`<dein-vault>/.obsidian/plugins/letterhead/` kopieren (oder `npm run deploy`),
dann in Obsidian → Einstellungen → Community-Plugins neu laden und **Letterhead**
aktivieren.

## 2. Absender & Stil einmalig einstellen

Einstellungen → **Letterhead**:

- **Sender profile** ausfüllen (Name, Firma, Straße, PLZ + Ort, Telefon,
  E-Mail, Website). Gilt für alle Briefe, pro Brief überschreibbar.
- **Style** wählen: Sachlich (sans), Klassisch (serif) oder Technisch (mono).
- **Info line**: „Full" (Infoblock mit Zeichen/Datum) oder „Date only"
  (schlichte Orts-/Datumszeile, z. B. für Bewerbungen und Privatpost).

## 3. Eine Brief-Notiz anlegen

Neue Notiz öffnen, dann Befehlspalette → **Insert letter frontmatter into
note** — das legt die wichtigsten Felder an (auch als Button in den
Einstellungen unter „Frontmatter"). Ausfüllen, darunter den Brieftext schreiben:

```markdown
---
empfaenger:
  - Muster GmbH
  - Frau Erika Beispiel
  - Musterstraße 12
  - 12345 Musterstadt
betreff: Angebot Nr. 2026-0042
anrede: Sehr geehrte Frau Beispiel,
datum: 2026-06-10
anlagen:
  - Leistungsverzeichnis
  - AGB
---

vielen Dank für Ihre Anfrage. Anbei unser Angebot …
```

Listen wie `empfaenger` und `anlagen` haben einen Listenpunkt pro Zeile und
lassen sich auch bequem in Obsidians Eigenschaften-Ansicht pflegen. Alle Felder
(inkl. `absender` als Liste, `stil`, `infozeile`, Infoblock-Zeilen):
[Frontmatter-Referenz](reference/frontmatter.de.md). Ein vollständiges Beispiel
liegt unter [`examples/example-letter.md`](../examples/example-letter.md).

## 4. Vorschau prüfen

Befehlspalette → **Open letter preview**. Die Vorschau zeigt die fertigen
A4-Seiten inklusive Seitenumbrüchen — so siehst du das Layout, ohne zu drucken.

## 5. Als PDF exportieren

Befehlspalette oder Briefumschlag-Icon → **Export letter as PDF / print**.

- **Desktop (macOS/Windows/Linux):** Es öffnet sich der Druckdialog des
  Betriebssystems. PDF-Dropdown bzw. Ziel → **„Als PDF sichern"**; Skalierung
  auf **100 %** lassen.
- **iPhone/iPad:** Das Plugin schreibt den Brief als HTML-Datei (Name der
  Notiz) in den Vault und übergibt sie an iOS. Der Export läuft dann so:

  1. Ein kleiner Dialog erscheint — tippe **„Öffnen"**.
  2. iOS zeigt eine Auswahl — tippe **„Schnellansicht"**.
  3. In der Schnellansicht tippe das **Teilen-Symbol** (unten rechts).
  4. Wähle **„Drucken"**.
  5. **Vorschau mit zwei Fingern aufziehen** — sie wird zum fertigen PDF mit
     korrekten Rändern und Seitenumbrüchen.
  6. Tippe erneut das **Teilen-Symbol**, dann **„In Dateien sichern"**.

Druckränder setzt das Plugin automatisch (Seite 1 oben 10 mm, Folgeseiten
25 mm, unten 20 mm) — gelten auf beiden Wegen, also nichts anpassen.

## 6. Falten & Kuvertieren

An den Falzmarken (links, bei 105/210 mm) falten und so ins
DIN-lang-Fensterkuvert stecken, dass die Anschrift im Fenster liegt. Sitzt sie
bei deinem Kuvert ein paar Millimeter zu hoch, hilft die Einstellung
**Print offset top (mm)** (2–4 mm).

## Weiter

- Alle Felder: [Frontmatter-Referenz](reference/frontmatter.de.md)
- Alle Einstellungen: [Einstellungs-Referenz](reference/settings.de.md)
- Feinschliff per CSS: [Theming / CSS-Tokens](reference/theming.de.md)
- Warum diese Maße: [DIN 5008](explanation/din5008.de.md)
