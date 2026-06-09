# Briefkopf – Letter Generator

> 🇬🇧 English · [🇩🇪 Deutsch](README.de.md)

An Obsidian plugin that turns a note into a professionally formatted business letter — German **DIN 5008** or a clean **modern** layout — and exports it to PDF through the OS print dialog, on desktop **and iPhone/iPad**.

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Docs: CC BY-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-DOCS)
![Platform](https://img.shields.io/badge/platform-Obsidian%20(Desktop%20%7C%20iOS)-lightgrey)

![Briefkopf — DIN 5008 letter](docs/images/hero.png)

## Features

- **Two themes:** `DIN 5008` (German standard, ready for a window envelope) and `Modern` (international).
- **Metadata from frontmatter:** recipient, subject, salutation, closing, date, reference line, sender overrides — German and English field aliases.
- **Sender profile** in the settings, overridable per letter.
- **PDF export via the print dialog** → “Save as PDF”. Cross-platform (desktop + iOS) because the OS renders the CSS — no Electron, no Node.
- **DIN extras:** fold marks (105/210 mm or 87/192 mm) and hole mark (148.5 mm).
- **Fully themeable** via documented CSS design tokens + a one-click commented preset.
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

1. Open a note with letter frontmatter (see the [example](examples/Beispielbrief.md)).
2. Run **“Brief als PDF exportieren / drucken”** (command palette or the envelope ribbon icon). Use **“Brief-Vorschau öffnen”** to preview first.
3. In the print dialog choose **Save as PDF** (macOS: PDF dropdown; iOS: Share → Save to Files).

The note body below the frontmatter is the letter text and is rendered as Markdown.

## Documentation

- [Tutorial — your first letter](docs/tutorial.md)
- [Reference — frontmatter fields](docs/reference/frontmatter.md) · [settings](docs/reference/settings.md) · [theming / CSS tokens](docs/reference/theming.md)
- [Explanation — DIN 5008 measurements](docs/explanation/din5008.md)

## Theming

The look is driven entirely by CSS custom properties (design tokens). Open **Settings → Eigenes CSS → “Preset einfügen”** for a commented starter, or copy [`presets/briefkopf-theme.css`](presets/briefkopf-theme.css). Geometry tokens marked *DIN-critical* keep the address block aligned with the envelope window — change them deliberately. Full token list: [docs/reference/theming.md](docs/reference/theming.md).

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
