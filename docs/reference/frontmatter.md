# Reference — frontmatter fields

All fields are optional. If a value is missing, the default from the plugin
settings applies (sender, style, closing, date = today). Keys are
case-insensitive; `_`, `-`, `.` and spaces are ignored
(`Your ref` = `your_ref` = `yourref`).

This plugin is German-first with English aliases: the field list below leads with
the **English aliases** for an international audience, and notes the German names
that also work. Use whichever you prefer — they are interchangeable.

Quick start: The command **Insert letter frontmatter into note** (also a button
in the settings under "Frontmatter") adds all letter fields to the active note
without overwriting existing values — with English field names when the letter
language is English, German names (`empfaenger`, `betreff`, …) when it is German.
Empty fields are harmless (the settings default applies). The settings also show
a compact field overview.

## Letter content

| Field | Aliases | Description |
|-------|---------|-------------|
| `recipient` | `empfaenger`, `empfänger`, `an`, `to`, `adresse`, `anschrift` | Recipient address as a list — one bullet per envelope line (alternatively a block scalar). |
| `subject` | `betreff`, `thema`, `re` | Subject line. |
| `salutation` | `anrede`, `greeting` | e.g. "Dear Ms Beispiel,". |
| `closing` | `gruss`, `grußformel`, `grussformel`, `signoff` | Closing; defaults from the settings, otherwise the language default ("Mit freundlichen Grüßen" / "Kind regards"). |
| `signature` | `unterschrift`, `signatur`, `gezeichnet` | Name below the closing; default = sender name. |
| `place` | `ort`, `stadt`, `city` | Place for the place/date line. |
| `date` | `datum` | ISO `2026-06-09` recommended; if missing = today. Formatted via the **Date locale** setting. |
| `enclosures` | `anlagen`, `anlage`, `attachments` | Enclosure note below the signature — a list, one bullet per enclosure. With exactly one entry the label reads "Anlage", otherwise "Anlagen" (in English letters: "Enclosure" / "Enclosures"). |

## Design per letter

Overrides the **Style**, **Info line** and **Letter language** settings for this
one letter.

| Field | Aliases | Values |
|-------|---------|--------|
| `style` | `stil`, `design`, `variante` | `a` (`sachlich`) · `b` (`klassisch`) · `c` (`technisch`) — the short codes match the settings UI, so `style: a` works |
| `info line` (`infozeile`) | `layout` | `vollstaendig` (also `full`, `infoblock`) · `nurdatum` (also `minimal`, `datum`) — mind the space in the key, e.g. `info line: "full"`, or use the no-space alias `infozeile: full` |
| `language` | `sprache`, `lang` | `de` · `en` — language of the printed labels (Anlagen/Enclosures, info block, default closing). |

## Info block (DIN layout, info line "Full")

To the right of the address, as label/value rows. Rows without a value are
omitted; "Datum" / "Date" always appears as the last row.

| Field | Aliases | Label in the letter |
|-------|---------|---------------------|
| `tax_number` | `steuernummer`, `steuernr`, `st_nr` | "Steuernummer". |
| `your_ref` | `ihr_zeichen` | "Ihr Zeichen". |
| `your_letter` | `ihr_schreiben`, `ihrschreibenvom` | "Ihr Schreiben"; date values are formatted according to the locale. |
| `our_ref` | `unser_zeichen` | "Unser Zeichen". |
| `phone` | `telefon_bezug`, `durchwahl` | "Telefon" — only when set (the sender phone is already in the letterhead). |

### Free-form rows: `info_1` … `info_4` and `info`

Flat text fields in "Label: value" format — editable directly in Obsidian's
Properties view (without a colon the label "Info" is used):

```yaml
info_1: "Customer number: 12345"
info_2: "Contract number: V-2026-007"
```

Alternatively (for YAML users) a map with any number of rows (aliases:
`bezugszeichen`, `infoblock`):

```yaml
info:
  Customer number: 12345
  Contract number: V-2026-007
```

Order: fixed fields → `info_1`–`info_4` → `info` map → "Date".

## Override the sender per letter

Overrides the sender profile from the settings — handy for multiple senders or a
self-contained example. The name (or logo) sits on the left of the letterhead,
the street/city/phone/email/web on the right as a contact block.

### Simple: `sender` as a list

One line per bullet, as on the envelope (aliases: `absender`, `von`):

```yaml
sender:
  - Max Mustermann
  - Muster GmbH
  - Musterstraße 1
  - 12345 Musterstadt
  - +49 30 1234567
  - kontakt@example.com
```

The first line is the name; the remaining lines are detected automatically:
phone (starts with `+`/`0` or `Tel.`), email (`@`), web (`www.`/`https:`),
postal code + city (`12345 …`), street (contains a house number), the rest =
addition/company.

### Precise: individual fields

These win over the `sender` list, field by field:

| Field | Aliases |
|-------|---------|
| `sender_name` | `absender_name` |
| `company` | `absender_zusatz`, `firma` |
| `sender_street` | `absender_strasse` |
| `sender_city` | `absender_plz_ort`, `absender_ort` |
| `absender_telefon` | — |
| `absender_email` | — |
| `absender_web` | `website` |

Phone, email and web are normally **auto-detected from the `sender` list**
(one item per line, see above); the individual fields `absender_telefon`,
`absender_email` and `absender_web` (alias `website`) are the explicit fallback
when you don't supply a `sender` list. Note that `absender_telefon` and
`absender_email` have no separate English alias.

## Multi-line values

`recipient`, `sender` and `enclosures` are YAML lists — one bullet per line,
also convenient to maintain in Obsidian's Properties view:

```yaml
recipient:
  - Muster GmbH
  - Frau Erika Beispiel
  - Musterstraße 12
  - 12345 Musterstadt
enclosures:
  - CV
  - References
```

Alternatively a YAML block scalar is accepted too (`recipient: |` with one
address line per text line).

## Letter text

Everything **below** the frontmatter is the letter text and is rendered as
Markdown (paragraphs, lists, **bold**/*italic*, headings).
