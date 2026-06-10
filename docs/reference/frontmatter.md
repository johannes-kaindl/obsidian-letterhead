# Referenz — Frontmatter-Felder

Alle Felder sind optional. Fehlt ein Wert, greift der Standard aus den
Plugin-Einstellungen (Absender, Stil, Grußformel, Datum = heute). Schlüssel sind
case-insensitive; `_`, `-`, `.` und Leerzeichen werden ignoriert
(`Ihr Zeichen` = `ihr_zeichen` = `ihrzeichen`).

Schnellstart: Der Befehl **„Brief-Frontmatter in Notiz einfügen"** (auch als
Button in den Einstellungen unter „Frontmatter") ergänzt die wichtigsten Felder
in der aktiven Notiz, ohne vorhandene Werte zu überschreiben. Die Einstellungen
zeigen zusätzlich eine kompakte Feldübersicht.

## Brief-Inhalt

| Feld | Aliasse | Beschreibung |
|------|---------|--------------|
| `empfaenger` | `empfänger`, `recipient`, `an`, `to`, `adresse`, `anschrift` | Empfängeranschrift, mehrzeilig (YAML-Blockskalar `|`) oder Liste. |
| `betreff` | `subject`, `thema`, `re` | Betreffzeile. |
| `anrede` | `salutation`, `greeting` | z. B. „Sehr geehrte Frau Beispiel,". |
| `gruss` | `grußformel`, `grussformel`, `closing`, `signoff` | Grußformel; Default aus Einstellungen. |
| `unterschrift` | `signatur`, `signature`, `gezeichnet` | Name unter dem Gruß; Default = Absendername. |
| `ort` | `place`, `stadt`, `city` | Ort für die Orts-/Datumszeile. |
| `datum` | `date` | ISO `2026-06-09` empfohlen; fehlt = heute. Formatierung über `Datums-Locale`. |
| `anlagen` | `anlage`, `attachments`, `enclosures` | Anlagenvermerk unter der Unterschrift — Liste oder Blockskalar. Bei genau einem Eintrag lautet das Label „Anlage", sonst „Anlagen". |

## Design pro Brief

Überschreibt die Einstellungen **Stil** und **Infozeile** für diesen einen Brief.

| Feld | Aliasse | Werte |
|------|---------|-------|
| `stil` | `style`, `design`, `variante` | `sachlich` (`a`), `klassisch` (`b`), `technisch` (`c`) |
| `infozeile` | `layout` | `vollstaendig` (auch `full`, `infoblock`) · `nurdatum` (auch `minimal`, `datum`) |

## Infoblock (DIN-Layout, Infozeile „Vollständig")

Rechts neben der Anschrift, als Label-Wert-Zeilen. Zeilen ohne Wert werden
weggelassen; „Datum" erscheint immer als letzte Zeile.

| Feld | Aliasse | Label im Brief |
|------|---------|----------------|
| `steuernummer` | `steuernr`, `st_nr`, `tax_number` | „Steuernummer". |
| `ihr_zeichen` | `your_ref` | „Ihr Zeichen". |
| `ihr_schreiben` | `ihrschreibenvom`, `your_letter` | „Ihr Schreiben"; Datumswerte werden gemäß Locale formatiert. |
| `unser_zeichen` | `our_ref` | „Unser Zeichen". |
| `telefon_bezug` | `durchwahl`, `phone` | „Telefon" — nur wenn gesetzt (das Absender-Telefon steht bereits im Briefkopf). |

### Freie Zeilen: `info`

Beliebige zusätzliche Label-Wert-Zeilen als YAML-Map (Aliasse: `bezugszeichen`,
`infoblock`). Reihenfolge bleibt erhalten; sie erscheinen nach den festen
Feldern, vor „Datum":

```yaml
info:
  Kundennummer: 12345
  Vertragsnummer: V-2026-007
```

## Absender pro Brief überschreiben

Überschreibt das Absender-Profil aus den Einstellungen — praktisch für mehrere
Absender oder ein self-contained Beispiel. Name (oder Logo) steht links im
Briefkopf, Straße/Ort/Telefon/E-Mail/Web rechts als Kontaktblock.

### Einfach: `absender` als Liste

Eine Zeile pro Listenpunkt, wie auf dem Kuvert (Aliasse: `sender`, `von`):

```yaml
absender:
  - Max Mustermann
  - Muster GmbH
  - Musterstraße 1
  - 12345 Musterstadt
  - +49 30 1234567
  - kontakt@example.com
```

Die erste Zeile ist der Name; die übrigen Zeilen werden automatisch erkannt:
Telefon (beginnt mit `+`/`0` oder `Tel.`), E-Mail (`@`), Web (`www.`/`https:`),
PLZ + Ort (`12345 …`), Straße (enthält Hausnummer), Rest = Zusatz/Firma.

### Präzise: Einzelfelder

Gewinnen gegenüber der `absender`-Liste, Feld für Feld:

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

`empfaenger`, `anlagen` (und Absenderfelder) akzeptieren einen YAML-Blockskalar …

```yaml
empfaenger: |
  Muster GmbH
  Frau Erika Beispiel
  Musterstraße 12
  12345 Musterstadt
```

… oder eine YAML-Liste:

```yaml
anlagen:
  - Lebenslauf
  - Zeugnisse
```

## Brieftext

Alles **unterhalb** des Frontmatters ist der Brieftext und wird als Markdown
gerendert (Absätze, Listen, **fett**/*kursiv*, Überschriften).
