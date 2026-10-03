# Recording contract — README images

The images in this folder are recorded by `scripts/shots.ts` (`npm run shots`) against a second Obsidian instance, using the fixture in `docs/images/fixture/` (generic English example data, only Letterhead enabled).

| File | Class | Referenced by | Must show |
|---|---|---|---|
| `hero.png` | hero | `README.md`, `README.de.md` | The Obsidian window with the letter preview modal open over the `Quotation` note |
| `settings.png` | feature | `README.md`, `README.de.md` | The Letterhead settings tab: help row, sender profile, style and output options |
| `note-and-frontmatter.png` | feature | `README.md`, `README.de.md` | The `Quotation` note with its letter frontmatter properties |
| `hero-din-de.png` | feature | `README.md`, `README.de.md` | The printed result: a DIN 5008 letter in German (rendered by `tools/render-hero.sh`) |
| `hero-modern-en.png` | feature | `README.md`, `README.de.md` | The printed result: a Modern letter in English (rendered by `tools/render-hero.sh`) |

`hero-din-de.png` and `hero-modern-en.png` are not recorded by `shots.ts`; `tools/render-hero.sh` renders them from the sample letters.

Reproduce: `npm run build && STAGING_VAULTS_DIR=… npm run shots -- --setup`, start a second Obsidian instance on its own profile and debug port, then `npm run shots -- --port <port>`. Recipe and pitfalls: skill `readme-shots`.
