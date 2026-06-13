# Tutorial — dein erster Brief

Ziel: in fünf Minuten von einer leeren Notiz zu einem fertigen PDF-Geschäftsbrief.

## 1. Plugin installieren & aktivieren

`manifest.json`, `main.js`, `styles.css`, `versions.json` nach
`<dein-vault>/.obsidian/plugins/briefkopf/` kopieren (oder `npm run deploy`),
dann in Obsidian → Einstellungen → Community-Plugins neu laden und **Briefkopf**
aktivieren.

## 2. Absender & Stil einmalig einstellen

Einstellungen → **Briefkopf**:

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
[Frontmatter-Referenz](reference/frontmatter.md). Ein vollständiges Beispiel
liegt unter [`examples/Beispielbrief.md`](../examples/Beispielbrief.md).

## 4. Vorschau prüfen

Befehlspalette → **Open letter preview**. Die Vorschau zeigt die fertigen
A4-Seiten inklusive Seitenumbrüchen — so siehst du das Layout, ohne zu drucken.

## 5. Als PDF exportieren

Befehlspalette oder Briefumschlag-Icon → **Export letter as PDF / print**.

- **Desktop (macOS/Windows/Linux):** Es öffnet sich der Druckdialog des
  Betriebssystems. PDF-Dropdown bzw. Ziel → **„Als PDF sichern"**; Skalierung
  auf **100 %** lassen.
- **iPhone/iPad:** Das Plugin schreibt den Brief als HTML-Datei in deinen Vault
  und öffnet sie im Standard-Browser (Safari). Dort: **Teilen-Symbol →
  Drucken → Vorschau lang drücken → In Dateien sichern** (oder AirDrop/Mail).
  Alternativ genügt Teilen → „Als PDF sichern", falls dein iOS das anbietet.

Druckränder setzt das Plugin automatisch (Seite 1 oben 10 mm, Folgeseiten
25 mm, unten 20 mm) — gelten auf beiden Wegen, also nichts anpassen.

## 6. Falten & Kuvertieren

An den Falzmarken (links, bei 105/210 mm) falten und so ins
DIN-lang-Fensterkuvert stecken, dass die Anschrift im Fenster liegt. Sitzt sie
bei deinem Kuvert ein paar Millimeter zu hoch, hilft die Einstellung
**Print offset top (mm)** (2–4 mm).

## Weiter

- Alle Felder: [Frontmatter-Referenz](reference/frontmatter.md)
- Alle Einstellungen: [Einstellungs-Referenz](reference/settings.md)
- Feinschliff per CSS: [Theming / CSS-Tokens](reference/theming.md)
- Warum diese Maße: [DIN 5008](explanation/din5008.md)
