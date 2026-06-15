# Letterhead – DIN 5008 & modern letters

> 🇬🇧 English · [🇩🇪 Deutsch](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/README.de.md)

An Obsidian plugin that turns a note into a professionally formatted business letter — German **DIN 5008** or a clean **modern** layout — and exports it to PDF: on desktop via the OS print dialog, on **iPhone/iPad** via Quick Look → Print → Save to Files.

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE)
[![Docs: CC BY-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--SA%204.0-lightgrey.svg)](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE-DOCS)
![Platform](https://img.shields.io/badge/platform-Obsidian%20(Desktop%20%7C%20iOS)-lightgrey)

<p>
  <img src="https://raw.githubusercontent.com/johannes-kaindl/obsidian-letterhead/main/docs/images/hero-din-de.png" alt="DIN 5008 business letter (German)" width="340">
  <img src="https://raw.githubusercontent.com/johannes-kaindl/obsidian-letterhead/main/docs/images/hero-modern-en.png" alt="Modern business letter (English)" width="340">
</p>

<sub><b>DIN 5008</b> (German) · <b>Modern</b> (English) — two layouts, two letter languages.</sub>


## Features

- **Letters from your notes:** a note's frontmatter holds the metadata, the note body (Markdown) becomes the letter text — one command turns it into a finished, formatted business letter.
- **PDF export & printing, everywhere:** Desktop (macOS/Windows/Linux) → OS print dialog → “Save as PDF”; **iPhone/iPad** → guided steps via the system share sheet (Open → Quick Look → Share → Print → pinch the preview open → “Save to Files”). The OS renders the CSS — no Electron, no Node. Page margins are set automatically (page 1: 10 mm top, continuation pages: 25 mm, bottom: 20 mm) — DIN positions stay paper-exact.
- **Two layouts:** `DIN 5008` (German standard, ready for a window envelope) and `Modern` (international) — choose in **Settings → Layout**.
- **Three styles via dropdown:** matter-of-fact (sans), classic (serif), technical (monospaced accents) — plus a full info block or a plain date line; both overridable per letter in frontmatter.
- **Bilingual:** the plugin UI follows the Obsidian app language (English/German); the letter language is a separate setting — German or English letter labels (Anlagen/Enclosures, Ihr Zeichen/Your ref., …), switchable per letter via the `sprache` frontmatter field.
- **Metadata from frontmatter:** recipient and sender as YAML lists, subject, salutation, closing, date, info block (incl. tax number + free-form rows), enclosures — German and English field aliases. The command **Insert letter frontmatter into note** scaffolds the fields; the settings tab shows a field reference.
- **Sender profile** in the settings, overridable per letter (list `absender`/`sender` or individual fields).
- **Paginated preview:** shows the final A4 sheets including page breaks.
- **DIN extras:** fold marks (105/210 mm or 87/192 mm), hole mark (148.5 mm), print-offset fine-tuning for the envelope window.
- **No CSS required** — style and info line are plain settings; for fine-tuning there are documented CSS design tokens + a one-click commented preset.
- **Fully offline** — no network calls, no telemetry; rendering happens locally via the OS print engine.
- Dependency-free, mobile-ready (`isDesktopOnly: false`), AGPL-3.0.

## Quick Start

Repository: [github.com/johannes-kaindl/obsidian-letterhead](https://github.com/johannes-kaindl/obsidian-letterhead)
(source mirror: [codeberg.org/jkaindl/obsidian-letterhead](https://codeberg.org/jkaindl/obsidian-letterhead))

### Install from Obsidian (recommended)

1. Open **Settings → Community plugins → Browse**.
2. Search for **"Letterhead"** and select **Install**.
3. **Enable** Letterhead, then fill in your sender profile in the settings.

### Manual install

```bash
# Copy the plugin into your vault
cp manifest.json main.js styles.css versions.json \
   "<your-vault>/.obsidian/plugins/letterhead/"

# …or, with OBSIDIAN_PLUGIN_DIR exported:
npm run deploy
```

Then: Obsidian → Settings → Community plugins → reload → enable **Letterhead** → fill in your sender profile.

## Usage

1. Open a note and scaffold the fields with **Insert letter frontmatter into note** (or see the [example](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/examples/example-letter.md)), then fill them in.
2. Run **Export letter as PDF / print** (command palette or the envelope ribbon icon). Use **Open letter preview** for a paginated preview first.
3. **Desktop:** In the print dialog choose **Save as PDF** (macOS: PDF dropdown bottom-left); keep scaling at 100%. **iPhone/iPad:** iOS shows a dialog — tap **Open** → **Quick Look** → Share → **Print** → pinch the preview open with two fingers (it becomes the PDF) → Share → **Save to Files**.

The note body below the frontmatter is the letter text and is rendered as Markdown.

## Documentation

- [Tutorial — your first letter](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/tutorial.md)
- [Reference — frontmatter fields](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/frontmatter.md) · [settings](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/settings.md) · [theming / CSS tokens](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/theming.md)
- [Explanation — DIN 5008 measurements](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/explanation/din5008.md)

## Theming

Pick a style and info-line mode directly in the settings — no CSS required. For fine-tuning beyond that, the look is driven entirely by CSS custom properties (design tokens): the **Custom CSS** field (**Settings → Advanced**) comes pre-filled with a fully commented-out preset — uncomment a line and adjust it; the **Reset preset** button restores that initial state, or you can copy [`presets/letterhead-theme.css`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/presets/letterhead-theme.css). Geometry tokens marked *DIN-critical* keep the address block aligned with the envelope window — change them deliberately. Full token list: [docs/reference/theming.md](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/docs/reference/theming.md).

## Development

Dependency-free vanilla JS: `main.js` is both source and build output — no npm install, no build step. Edit it and `npm run deploy` (or copy the files) into your vault, then reload Obsidian.

```bash
npm run check     # node --check main.js (syntax gate)
npm run deploy    # copy manifest.json main.js styles.css versions.json → $OBSIDIAN_PLUGIN_DIR
```

This is a deliberate deviation from the workspace `ts-node · obsidian-plugin` profile — see `AGENTS.md` → *Abweichungen von der Leitkonvention*.

## Privacy & security

Letterhead runs entirely on your device: no network calls, no telemetry, no tracking. Because it ships as readable source — the released `main.js` is the committed file, unminified, unbundled, with no build step — you can audit exactly what it does. The only `btoa()` call embeds your configured logo as an inline `data:` URL. Full statement and how to report a vulnerability: [`SECURITY.md`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/SECURITY.md).

## License

Code: **AGPL-3.0-or-later** — see [`LICENSE`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE); commercial dual-license option in [`LICENSING.md`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSING.md).
Documentation/text: **CC BY-SA 4.0** — see [`LICENSE-DOCS`](https://github.com/johannes-kaindl/obsidian-letterhead/blob/main/LICENSE-DOCS).
