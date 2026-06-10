# Briefkopf – Letter Generator

> 🇬🇧 English · [🇩🇪 Deutsch](README.de.md)

An Obsidian plugin that turns a note into a professionally formatted business letter — German **DIN 5008** or a clean **modern** layout — and exports it to PDF through the OS print dialog, on desktop **and iPhone/iPad**.

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Docs: CC BY-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-DOCS)
![Platform](https://img.shields.io/badge/platform-Obsidian%20(Desktop%20%7C%20iOS)-lightgrey)

![Briefkopf — DIN 5008 letter](docs/images/hero.png)

## Features

- **Two layouts:** `DIN 5008` (German standard, ready for a window envelope) and `Modern` (international).
- **Three styles via dropdown:** matter-of-fact (sans), classic (serif), technical (monospaced accents) — plus a full info block or a plain date line; both overridable per letter in frontmatter.
- **Metadata from frontmatter:** recipient and sender as YAML lists, subject, salutation, closing, date, info block (incl. tax number + free-form rows), enclosures — German and English field aliases. The command **Insert letter frontmatter into note** scaffolds the fields; the settings tab shows a field reference.
- **Sender profile** in the settings, overridable per letter (list `absender` or individual fields).
- **PDF export via the print dialog** → “Save as PDF”. Cross-platform (desktop + iOS) because the OS renders the CSS — no Electron, no Node. Page margins are set automatically (page 1: 10 mm top, continuation pages: 25 mm, bottom: 20 mm) — DIN positions stay paper-exact.
- **Paginated preview:** shows the final A4 sheets including page breaks.
- **DIN extras:** fold marks (105/210 mm or 87/192 mm), hole mark (148.5 mm), print-offset fine-tuning for the envelope window.
- **No CSS required** — style and info line are plain settings; for fine-tuning there are documented CSS design tokens + a one-click commented preset.
- Dependency-free, mobile-ready (`isDesktopOnly: false`), AGPL-3.0.

## Quick Start

```bash
# Manual install: copy the plugin into your vault
cp manifest.json main.js styles.css versions.json \
   "<your-vault>/.obsidian/plugins/briefkopf/"

# …or, with OBSIDIAN_PLUGIN_DIR exported:
npm run deploy
```

Then: Obsidian → Settings → Community plugins → reload → enable **Briefkopf** → fill in your sender profile.

## Usage

1. Open a note and scaffold the fields with **Insert letter frontmatter into note** (or see the [example](examples/Beispielbrief.md)), then fill them in.
2. Run **Export letter as PDF / print** (command palette or the envelope ribbon icon). Use **Open letter preview** for a paginated preview first.
3. In the print dialog choose **Save as PDF** (macOS: PDF dropdown; iOS: Share → Save to Files); keep scaling at 100%.

The note body below the frontmatter is the letter text and is rendered as Markdown.

## Documentation

- [Tutorial — your first letter](docs/tutorial.md)
- [Reference — frontmatter fields](docs/reference/frontmatter.md) · [settings](docs/reference/settings.md) · [theming / CSS tokens](docs/reference/theming.md)
- [Explanation — DIN 5008 measurements](docs/explanation/din5008.md)

## Theming

Pick a style and info-line mode directly in the settings — no CSS required. For fine-tuning beyond that, the look is driven entirely by CSS custom properties (design tokens): open **Settings → Advanced → Insert preset** for a commented starter, or copy [`presets/briefkopf-theme.css`](presets/briefkopf-theme.css). Geometry tokens marked *DIN-critical* keep the address block aligned with the envelope window — change them deliberately. Full token list: [docs/reference/theming.md](docs/reference/theming.md).

## Development

Dependency-free vanilla JS: `main.js` is both source and build output — no npm install, no build step. Edit it and `npm run deploy` (or copy the files) into your vault, then reload Obsidian.

```bash
npm run check     # node --check main.js (syntax gate)
npm run deploy    # copy manifest.json main.js styles.css versions.json → $OBSIDIAN_PLUGIN_DIR
```

This is a deliberate deviation from the workspace `ts-node · obsidian-plugin` profile — see `AGENTS.md` → *Abweichungen von der Leitkonvention*.

## Before publishing

- Add Release/CI/Downloads badges with your forge owner once the repo is pushed (see `../_docs/templates/badges.md`).
- Set the repo description + topics on the forge (consistent with `package.json` keywords).
- The official Obsidian directory and **BRAT** pull releases from **GitHub** — create a GitHub mirror and a release (tag = version without `v`; assets `main.js`, `manifest.json`, `styles.css`).
- The example data (Max Mustermann, Muster GmbH, example.com) is intentionally sample/placeholder content.

## License

Code: **AGPL-3.0-or-later** — see [`LICENSE`](LICENSE); commercial dual-license option in [`LICENSING.md`](LICENSING.md).
Documentation/text: **CC BY-SA 4.0** — see [`LICENSE-DOCS`](LICENSE-DOCS).
