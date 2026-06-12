# Referenz — Frontmatter-Felder

Alle Felder sind optional. Fehlt ein Wert, greift der Standard aus den
Plugin-Einstellungen (Absender, Stil, Grußformel, Datum = heute). Schlüssel sind
case-insensitive; `_`, `-`, `.` und Leerzeichen werden ignoriert
(`Ihr Zeichen` = `ihr_zeichen` = `ihrzeichen`).

Schnellstart: Der Befehl **Insert letter frontmatter into note** (auch als
Button in den Einstellungen unter „Frontmatter") ergänzt alle Brief-Felder in
der aktiven Notiz, ohne vorhandene Werte zu überschreiben — mit deutschen
Feldnamen bei Briefsprache Deutsch, englischen (`recipient`, `subject`, …) bei
Englisch. Leere Felder sind harmlos (es greift der Einstellungs-Standard). Die
Einstellungen zeigen zusätzlich eine kompakte Feldübersicht.

## Brief-Inhalt

| Feld | Aliasse | Beschreibung |
|------|---------|--------------|
| `empfaenger` | `empfänger`, `recipient`, `an`, `to`, `adresse`, `anschrift` | Empfängeranschrift als Liste — ein Listenpunkt pro Kuvertzeile (alternativ Blockskalar). |
| `betreff` | `subject`, `thema`, `re` | Betreffzeile. |
| `anrede` | `salutation`, `greeting` | z. B. „Sehr geehrte Frau Beispiel,". |
| `gruss` | `grußformel`, `grussformel`, `closing`, `signoff` | Grußformel; Default aus Einstellungen, sonst Sprach-Standard („Mit freundlichen Grüßen“ / „Kind regards“). |
| `unterschrift` | `signatur`, `signature`, `gezeichnet` | Name unter dem Gruß; Default = Absendername. |
| `ort` | `place`, `stadt`, `city` | Ort für die Orts-/Datumszeile. |
| `datum` | `date` | ISO `2026-06-09` empfohlen; fehlt = heute. Formatierung über die Einstellung **Date locale**. |
| `anlagen` | `anlage`, `attachments`, `enclosures` | Anlagenvermerk unter der Unterschrift — Liste, ein Punkt pro Anlage. Bei genau einem Eintrag lautet das Label „Anlage", sonst „Anlagen". |

## Design pro Brief

Überschreibt die Einstellungen **Style**, **Info line** und **Letter language** für diesen einen Brief.

| Feld | Aliasse | Werte |
|------|---------|-------|
| `stil` | `style`, `design`, `variante` | `sachlich` (`a`), `klassisch` (`b`), `technisch` (`c`) |
| `infozeile` | `layout` | `vollstaendig` (auch `full`, `infoblock`) · `nurdatum` (auch `minimal`, `datum`) |
| `sprache` | `language`, `lang` | `de` · `en` — Sprache der gedruckten Labels (Anlagen/Enclosures, Infoblock, Standard-Grußformel). |

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

### Freie Zeilen: `info_1` … `info_4` und `info`

Flache Textfelder im Format „Label: Wert" — direkt in Obsidians
Eigenschaften-Ansicht editierbar (ohne Doppelpunkt wird das Label „Info"
verwendet):

```yaml
info_1: "Kundennummer: 12345"
info_2: "Vertragsnummer: V-2026-007"
```

Alternativ (für YAML-Nutzer) eine Map mit beliebig vielen Zeilen (Aliasse:
`bezugszeichen`, `infoblock`):

```yaml
info:
  Kundennummer: 12345
  Vertragsnummer: V-2026-007
```

Reihenfolge: feste Felder → `info_1`–`info_4` → `info`-Map → „Datum".

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

`empfaenger`, `absender` und `anlagen` sind YAML-Listen — ein Listenpunkt pro
Zeile, bequem auch in Obsidians Eigenschaften-Ansicht pflegbar:

```yaml
empfaenger:
  - Muster GmbH
  - Frau Erika Beispiel
  - Musterstraße 12
  - 12345 Musterstadt
anlagen:
  - Lebenslauf
  - Zeugnisse
```

Alternativ wird auch ein YAML-Blockskalar akzeptiert (`empfaenger: |` mit einer
Adresszeile pro Textzeile).

## Brieftext

Alles **unterhalb** des Frontmatters ist der Brieftext und wird als Markdown
gerendert (Absätze, Listen, **fett**/*kursiv*, Überschriften).
