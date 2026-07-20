# Reference — settings

> 🇬🇧 English · [🇩🇪 Deutsch](settings.de.md)

Settings → Community plugins → **Letterhead**. The plugin UI follows the
Obsidian app language (English by default, German localised); this reference uses
the English labels. The language of the **letter** is independent of this
(the **Letter language** setting).

## Layout & style

| Setting | Values | Meaning |
|---------|--------|---------|
| **Layout** | `DIN 5008 (German standard)` · `Modern / international` | Base letter layout. DIN = German standard, window-envelope-ready; Modern = free, international layout. |
| **Style** | `A · Matter-of-fact (neutral sans)` · `B · Classic (serif)` · `C · Technical (monospaced accents)` | The complete look (font, colours, spacing, letterhead typography). Overridable per letter via the `style` frontmatter field. |
| **Info line** | `Full (info block)` · `Date only` | Full: info block to the right of the address (tax number, references, … date). Date only: a plain right-aligned place/date line — for employer and private correspondence. Overridable per letter via the `info line` frontmatter field. |
| **DIN 5008 form** | `Form A (27 mm)` · `Form B (45 mm)` | Position of the address field and the fold marks. Form B is the default. |

### The three styles

| Style | Character |
|-------|-----------|
| **A · Matter-of-fact** | Sans-serif (Helvetica/Arial). The neutral, safe default for authorities and employers. |
| **B · Classic** | Serif typeface (Palatino/Georgia). Traditional, authoritative, refined and personal. |
| **C · Technical** | Sans-serif body text with monospaced labels in the header, info block and enclosure note. Disciplined, gridded. |

All styles are pure black/grey and leave the DIN geometry (window-envelope
position) untouched.

## Sender profile

Default sender (name, company/addition, street, postal code and city, phone,
email, website). It applies to every letter and is overridable per letter in the
frontmatter (`sender` list or `sender_name` etc.). The name (or logo) appears on
the left of the letterhead, the contact details on the right.

| Setting | Meaning |
|---------|---------|
| **Return address line** | Return-address line — a small line above the recipient address (for the window envelope). Empty = generated automatically from `Name · Street · Postcode City`. |

## Elements

| Setting | Meaning |
|---------|---------|
| **Fold marks** | Two marks for folding to fit the window envelope. |
| **Hole mark** | Hole mark at 148.5 mm for filing. |
| **Print offset top (mm)** | Print-offset fine-tuning (default 0): shifts the entire letter content downwards if the address sits too high in the envelope window; try 2–4 mm. Fold/hole marks stay paper-relative and unchanged, so the fold remains correct. The plugin always sets the print margins automatically: page 1 top 10 mm (the DIN letterhead sits high by design), continuation pages top 25 mm, bottom 20 mm everywhere. |
| **Show logo** + **Logo path** | Image instead of the name in the letterhead; a vault-relative path (e.g. `assets/logo.png`), embedded as a data URL. |

## Typography & language

| Setting | Meaning |
|---------|---------|
| **Font (CSS font-family)** | Optional override. Empty = the default of the chosen style; the placeholder shows the effective value. |
| **Font size (pt)** | Optional override. Empty = style default (10 pt); the placeholder shows the effective value. |
| **Date locale** | e.g. `de-DE`, `en-GB`, `en-US` — format of the date output. |
| **Letter language** | Language of the printed labels: `Deutsch` (Anlagen, Ihr Zeichen, Datum, Tel.) or `English` (Enclosures, Your ref., Date, Phone). Overridable per letter via the `language` frontmatter field. |
| **Default closing** | Default closing when `closing` is missing from the frontmatter. Empty = the language default ("Mit freundlichen Grüßen" / "Kind regards"). |

## Frontmatter (per letter)

A compact overview of all frontmatter fields directly in the settings, plus an
**Insert frontmatter template** button (also the command
**Insert letter frontmatter into note**): adds recipient, subject, salutation,
place, date and enclosures to the frontmatter of the active note without
overwriting existing values. Full reference: [frontmatter fields](frontmatter.md).

## Advanced

| Setting | Meaning |
|---------|---------|
| **Output target** | Where the exported PDF is written: **Next to the note** · **Obsidian's attachment folder** · **Custom folder** · **Do not save, share directly**. Applies to the vector PDF export, not to the desktop print dialog — there the OS decides where the file goes. An existing file is never overwritten: a `" (2)"` is appended instead. |
| **Custom folder** | Vault-relative target folder, e.g. `Export/Letters`. Only shown when **Output target** is set to *Custom folder* — a field that is inert in the other three modes would be a trap. |
| **Filename scheme** | Name of the exported PDF, and the name the print dialog proposes. See the placeholder table below. |
| **Custom CSS (optional)** | Your own CSS for details beyond style + info line; loaded last and wins. The field is pre-filled with a **fully commented-out** (inactive) preset that documents all tokens — uncomment a line to activate it. **Reset preset** restores the initial state. See [theming](theming.md). |

### Filename placeholders

Anything in the field that is not a placeholder is kept literally, so
`Letter {datum} — {empfaenger}` works as written. Characters a filesystem
rejects are replaced; an empty result falls back to the note name.

| Placeholder | Yields |
|-------------|--------|
| `{notiz}` | Name of the note the letter was generated from. |
| `{datum}` | Date as **YYYY-MM-DD**, so letters sort chronologically in a file manager. This normalises the raw frontmatter value — it does not reformat the date printed in the letter. |
| `{datum_lang}` | The date as it appears in the letter (per the **Date locale** setting). |
| `{empfaenger}` | First line of the recipient address. |
| `{betreff}` | Subject line. |
| `{unserzeichen}` | The `unser zeichen` / `our ref.` field. |

### Defaults for new and existing installations

Fresh installations start with **Output target: Next to the note** and the
filename scheme **`{datum} {empfaenger}`**. Existing installations keep the
behaviour they had before these settings existed — output target **Do not save,
share directly** and the scheme **`{notiz}`** — so an update never silently
changes where your letters land.

> **Gone in 1.4.0:** the **Mobile export** setting used to offer a choice between
> the vector PDF and an HTML/Quick Look route. The fallback was dropped in favour
> of the degradation model (mobile export always produces a PDF; anything the
> engine cannot represent is reported as a notice). The dropdown was removed in a
> later cleanup; the stored key is still accepted so old configurations load.
