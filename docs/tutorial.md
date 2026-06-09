# Tutorial — dein erster Brief

Ziel: in fünf Minuten von einer leeren Notiz zu einem fertigen PDF-Geschäftsbrief.

## 1. Plugin installieren & aktivieren

`manifest.json`, `main.js`, `styles.css`, `versions.json` nach
`<dein-vault>/.obsidian/plugins/briefkopf/` kopieren (oder `npm run deploy`),
dann in Obsidian → Einstellungen → Community-Plugins neu laden und **Briefkopf**
aktivieren.

## 2. Absender einmalig hinterlegen

Einstellungen → **Briefkopf** → Absender-Profil ausfüllen (Name, Firma, Straße,
PLZ + Ort, Telefon, E-Mail, Website). Diese Werte gelten für alle Briefe und sind
pro Brief überschreibbar.

## 3. Eine Brief-Notiz anlegen

Neue Notiz, oben das Frontmatter, darunter der Brieftext. Minimalbeispiel:

```markdown
---
empfaenger: |
  Muster GmbH
  Frau Erika Beispiel
  Musterstraße 12
  12345 Musterstadt
betreff: Angebot Nr. 2026-0042
anrede: Sehr geehrte Frau Beispiel,
---

vielen Dank für Ihre Anfrage. Anbei unser Angebot …
```

Ein vollständiges Beispiel liegt unter [`examples/Beispielbrief.md`](../examples/Beispielbrief.md).

## 4. Vorschau prüfen

Befehlspalette → **„Brief-Vorschau öffnen"**. So siehst du das Layout, ohne zu drucken.

## 5. Als PDF exportieren

Befehlspalette oder Briefumschlag-Icon → **„Brief als PDF exportieren / drucken"** →
im Druckdialog **„Als PDF sichern"**.

- **macOS:** PDF-Dropdown unten links → „Als PDF sichern".
- **iPhone/iPad:** Teilen-Symbol → „In Dateien sichern".

## Weiter

- Layout anpassen: [Theming / CSS-Tokens](reference/theming.md)
- Alle Felder: [Frontmatter-Referenz](reference/frontmatter.md)
- Warum diese Maße: [DIN 5008](explanation/din5008.md)
