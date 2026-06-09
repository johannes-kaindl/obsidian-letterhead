# Referenz — Frontmatter-Felder

Alle Felder sind optional. Fehlt ein Wert, greift der Standard aus den
Plugin-Einstellungen (Absender, Grußformel, Datum = heute). Schlüssel sind
case-insensitive; `_`, `-`, `.` und Leerzeichen werden ignoriert
(`Ihr Zeichen` = `ihr_zeichen` = `ihrzeichen`).

## Brief-Inhalt

| Feld | Aliasse | Beschreibung |
|------|---------|--------------|
| `empfaenger` | `empfänger`, `recipient`, `an`, `to`, `adresse`, `anschrift` | Empfängeranschrift, mehrzeilig (YAML-Blockskalar `|`) oder Liste. |
| `betreff` | `subject`, `thema`, `re` | Betreffzeile (fett). |
| `anrede` | `salutation`, `greeting` | z. B. „Sehr geehrte Frau Beispiel,". |
| `gruss` | `grußformel`, `grussformel`, `closing`, `signoff` | Grußformel; Default aus Einstellungen. |
| `unterschrift` | `signatur`, `signature`, `gezeichnet` | Name unter dem Gruß; Default = Absendername. |
| `ort` | `place`, `stadt`, `city` | Ort für die Datumszeile. |
| `datum` | `date` | ISO `2026-06-09` empfohlen; fehlt = heute. Formatierung über `Datums-Locale`. |

## Bezugszeichenzeile (DIN-Theme, optional)

| Feld | Aliasse | Beschreibung |
|------|---------|--------------|
| `ihr_zeichen` | `your_ref` | „Ihr Zeichen". |
| `ihr_schreiben` | `ihrschreibenvom`, `your_letter` | „Ihr Schreiben vom". |
| `unser_zeichen` | `our_ref` | „Unser Zeichen". |
| `telefon_bezug` | `durchwahl`, `phone` | Telefon/Durchwahl; Default = Absender-Telefon. |

Spalten ohne Wert werden weggelassen; „Datum" erscheint immer. Sichtbarkeit der
ganzen Zeile über die Einstellung **Bezugszeichenzeile**.

## Absender pro Brief überschreiben

Überschreibt das Absender-Profil aus den Einstellungen — praktisch für mehrere
Absender oder ein self-contained Beispiel.

| Feld | Aliasse |
|------|---------|
| `absender_name` | `sender_name` |
| `absender_zusatz` | `firma`, `company` |
| `absender_strasse` | `sender_street` |
| `absender_plz_ort` | `absender_ort`, `sender_city` |
| `absender_telefon` | — |
| `absender_email` | — |
| `absender_web` | `website` |

## Mehrzeilige Werte

`empfaenger` (und Absenderfelder) akzeptieren einen YAML-Blockskalar …

```yaml
empfaenger: |
  Muster GmbH
  Frau Erika Beispiel
  Musterstraße 12
  12345 Musterstadt
```

… oder eine YAML-Liste:

```yaml
empfaenger:
  - Muster GmbH
  - Frau Erika Beispiel
  - Musterstraße 12
  - 12345 Musterstadt
```

## Brieftext

Alles **unterhalb** des Frontmatters ist der Brieftext und wird als Markdown
gerendert (Absätze, Listen, **fett**/*kursiv*, Überschriften).
