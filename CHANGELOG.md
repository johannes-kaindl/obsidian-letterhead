# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/) (tags **without** a `v` prefix).

## [Unreleased]

## [1.9.0] — 2026-10-14

### Added
- The vector PDF (iPhone/iPad and "Export letter as PDF (vector)") now reads the same design tokens as print and preview. Colours, font size, line height, spacing and name size set as `--bk-*` values in Custom CSS apply to the PDF as well, so one theme gives the same letter on every device. Font stacks, the Modern layout and class rules still apply to print and preview only, and the PDF keeps the 14 standard fonts. The settings descriptions and the theming reference now say which part applies where.
- "Reset preset" asks for confirmation first and saves your current Custom CSS to `custom-css-backup.css` in the plugin folder.

### Changed
- In the English interface the style names are translated ("A · Neutral (sans-serif)", "B · Classic (serif)", "C · Technical (monospaced accents)"). The frontmatter field is still `style`; the German alias `stil` keeps working.
- The DIN form entries and the output-folder hint follow the interface language ("Export/Letters" in English).
- Test files are now type-checked in the gate.
- Share export (mobile "share directly" mode): files in the hidden `.letterhead-export` folder that the plugin did not write are no longer deleted without asking. PDFs left by earlier exports are still replaced silently; anything else asks first, and if you say no it stays and the export goes on. Two quick exports in a row no longer delete each other's file.
- Internal: the plugin now builds on the shared library at obsidian-kit 0.60.2 and code-kit 0.27.1. The PDF engine and the settings helpers are unchanged. One visible detail: an embedded image whose data cannot be decoded is now skipped with a placeholder in the PDF instead of being turned into garbage bytes.
- Exported file names are cut to the same lengths as before (48 characters per recipient or subject, 120 overall), now by the shared library instead of a local copy. Checked identical at the boundaries, including a space exactly at the cut.

### Removed
- The unused `mobileExport` setting is dropped from the stored settings on load.

## [1.8.1] — 2026-10-03

### Fixed
- The preview modal is now wide enough to show the full A4 page. Its width rule never applied (the class sits on the modal element itself), so the modal stayed at Obsidian's default width and the letter sheet was cropped on the right.

### Changed

- The changelog is now written entirely in English.
- The README now shows screenshots of the letter preview, the settings and a letter note with its properties.

## [1.8.0] — 2026-09-27

### Added
- The GitHub release now also carries a ready-to-unpack `letterhead.zip` (the plugin folder with `main.js`, `manifest.json` and `styles.css`) and a `checksums.sha256` file. For a manual install, download the zip and unpack it into `.obsidian/plugins/` instead of creating the folder and saving three files by hand.

### Fixed
- An image inside a list item no longer just counts as "not shown" and vanishes — it now appears in the PDF as its own image, right behind the item's text (Kit 0.42.0).

### Changed
- An image inside a table cell that cannot be embedded now shows its alt text as `[Image: …]` (or `[Image]` without alt text) instead of only raising the "simplified" count silently (Kit 0.42.0).
- Internal: the PDF engine (`src/vendor/kit/pdf`) is on Kit 0.44.0 now (was 0.30.0). `resolveImages` takes the failure texts as an explicit option instead of a fixed German string; letterhead feeds them from `model.labels` (`phImage`/`phImageFailed`), so the printed placeholder keeps following the letter language, not the interface language — same as the existing `phFormula`/`phGraphic`.

## [1.7.1] — 2026-09-26

### Changed
- Internal: kit vendoring now runs through the central umbrella tool (`tools/kit-sync.json`; `tools/sync-kit.sh` is just a call to it). All vendored files are byte-identical, nothing changes for users.
- Internal: `settings_walker.ts` and `folder-suggest.ts` are now on Kit 0.43.0 (previously 0.25.0, missed by the vendoring script). The only new thing is the additional function `installTabRefreshOnOpen`, which this plugin does not call; behaviour stays the same.

## [1.7.0] — 2026-09-26

### Added
- **A help row at the very top of the settings**, with links to the documentation and the issue tracker (`bug` button).

### Changed
- **Docs: the installation path and the attestation promise now say what actually holds.** Letterhead is currently not listed in the community directory and GitHub releases are suspended — yet the README still recommended searching the store, and `SECURITY.md` promised unconditionally that *every* release is built and Sigstore-signed by GitHub Actions. For 1.6.5 and 1.6.6 neither was true: they appeared on Forgejo only and carry `checksums.sha256` instead of an attestation. README and `SECURITY.md` (EN + DE each) now describe both delivery paths and **what each of them proves** — attestation = provenance from the tagged commit, checksum = integrity of the download, and a checksum from the same server as the files does not replace the former. The `gh attestation verify` call mentioned there now carries the caveat that its failure is currently the expected outcome and not a sign of tampering; the route via your own build from the tag is given as a substitute. Until further notice, installation goes through **AnySource Sideloader** (reads Forgejo directly) or manually from the Forgejo release. Since 2026-09-03 there is a subscribable **catalog** for this, which lists Letterhead alongside the author's other plugins — both READMEs mention it.
- **The READMEs show images again.** Both embedded hero images and all file links through absolute `github.com` URLs — 15 per language, all of them **404** since the account outage, visible as two broken images directly under the heading. They are now **repo-relative** (`SECURITY.md`, `LICENSE`, `docs/…`) and therefore work on any forge and in any clone. The **images** stay absolute, but on Forgejo raw instead of GitHub: a store page renders the README outside the repo and does not load relative image paths — which the README gate rightly pointed out. The repository line names Forgejo as the source instead of the unreachable mirror.

## [1.6.6] — 2026-09-03

### Changed
- **The placeholders for formulas and graphics that cannot be rendered now follow the letter language.** If a letter contains a formula or a pure graphic that the PDF cannot reproduce, Letterhead prints a visible note in its place. Until now it was always German — in an English letter, `[Grafik]` sat next to `Enclosures`. Now it follows `sprache`/`language` or the configured letter language: `[Formel]`/`[Grafik]` or `[Formula]`/`[Graphic]`. It does **not** follow the language of the Obsidian interface — a German Obsidian can set an English letter.
- The PDF engine comes from `obsidian-kit` **0.30.0**, the filename template from `code-kit` **0.5.0**. Both pins are in `src/vendor/kit/VENDOR.json`: since obsidian-kit `2ab1bb5` the domain-free pure subset lives in a separate repo, so the vendor tree now comes from two sources. `tools/sync-kit.sh` reads from both tag refs (`^{commit}`-peeled, mandatory for code-kit — its tags are annotated) and checks all source paths before it writes the first file. The move changes nothing about the vendored code: `filename-template.ts` in code-kit@0.5.0 is byte-identical to the previous state.

## [1.6.5] — 2026-09-02

### Changed
- The filename template and the vault-path calculation come from `obsidian-kit` 0.27.0 (`src/vendor/kit/filename-template.ts`, `src/vendor/kit/vault-path.ts`) instead of local copies. Both modules were merged from letterhead, obsidian-paperize and yijing-oracle; letterhead contributed the `Object.hasOwn` guard and the null guard in `sanitizeFilename`.
- `tools/sync-kit.sh` reads the kit code from a fixed tag ref (`git show 0.27.0:<path>`) instead of the working state of the neighbouring repo, and stamps the tag commit peeled with `^{commit}`. Before, the result depended on the HEAD of `../obsidian-kit`, and `VENDOR.json` named a SHA that no release carries. No vendored content changes as a result.
- `authorUrl` in the manifest points to the GitHub profile under which the code lives, instead of the self-hosted domain — the store review checks the field for reachability.

### Fixed
- **A leading slash in the target folder is now stripped.** The local path joining only stripped *trailing* slashes (`Export/PDF/` → `Export/PDF`); leading ones stayed and would have passed a non-normalised vault path (`/Export/Brief.pdf`) on to `adapter.mkdir`/`writeBinary`. No existing result changes — the custom target folder already runs through Obsidian's `normalizePath` beforehand, and the note's folder comes from Obsidian itself. A trap in the module goes away, not a visible bug: the guarantee now holds in the module instead of only at the one call site. The kit component additionally converts backslashes to `/` and collapses internal repeated slashes — the local version could do neither.

### Security
- The expressions in the release workflow now sit in `env:` instead of directly in `run:` scripts. In `run:`, GitHub interpolates the value before the shell starts, so a tag name can inject shell syntax there; via `env:` it reaches the script as a variable.

### Removed
- The null-prototype map in `buildFilename` (`Object.create(null)`) was removed **on purpose**. It was the second of two layers against the same leak; the first, the `Object.hasOwn` guard, now sits in the kit module and protects all three plugins there. `{toString}`, `{constructor}` & co. remain verbatim, unchanged (pinned by a test) — anyone who misses the map sees no regression, but the removed redundancy.

## [1.6.4] — 2026-08-14

### Fixed
- **A code block vanished from the PDF when a fence stuck directly to a line of text.** In CommonMark/Obsidian a fenced code block may interrupt a paragraph — if it sits directly under a line of text without a blank line, the internal placeholder ended up in the same paragraph via a line break. But only a stand-alone placeholder is resolved, so the code block dropped out of the PDF and the raw placeholder text (`LETTERHEADCODE0`) was printed as running text instead. Present since 1.4.0. Fixed upstream in `obsidian-kit` 0.26.1, re-vendored here.

### Changed
- PDF engine brought from `obsidian-kit` 0.22.0 up to 0.26.1 (apart from the code-block fix, no functional change — the other kit releases concerned other modules).
- The settings fallback walker comes from `obsidian-kit` 0.25.0 instead of a local copy.
- The ESLint core and the local mirror of the store scanner now come from the central release template — what `npm run lint` checks therefore matches what the store checks.
- Release tooling centralised (`../tools/release/`) instead of a repo-owned copy; `check-no-nul-bytes.mjs` is part of the test chain, CI uses `checkout`/`setup-node` v5.

## [1.6.3] — 2026-08-05

### Fixed
- **Graphically rendered elements vanished without a trace from the PDF.** MathJax formulas, Mermaid diagrams and bare SVG carry no text node; the DOM→IR conversion only checked `textContent` and dropped them uncounted — so the summary notice stayed silent too, and the PDF gave no hint that something was missing. Now `[Formel]`/`[Grafik]` appear as a visible simplification. Decorative elements (callout icons, `aria-hidden`) are still skipped instead of being wrongly reported as a lost graphic.
- **Task lists lost their state.** `- [ ]` and `- [x]` became visually identical bullet points; the state is now put in front again as `[ ]`/`[x]`.
- **A heading was left behind above an almost empty page.** The orphan protection measured text lines of the following block — pointless for an image, because it breaks atomically. Now the full image height counts.

All three come from `obsidian-kit` 0.18.0–0.22.0 and had been present since 1.4.0 (Kit 0.17.0).

## [1.6.2] — 2026-07-25

### Fixed
- **Embedded images did not appear in the vector PDF on iOS.** Obsidian's iOS app (Capacitor) delivers `src="capacitor://localhost/_capacitor_file_/…"` for embedded image elements instead of `app://` as on desktop. The image detection did not know this scheme and wrongly treated the full Capacitor URL as a vault-relative wikilink — its resolution failed, the image was never rasterised and appeared in the PDF only as placeholder text. Affected every embedded image format on iOS/iPadOS, not only SVG. Verified on iPhone.
- **Phantom folder on every export to the vault root.** With the export target "Custom folder" and the vault root (`/`), or directly next to the note in the root, the directory detection computed a folder name shortened by one character when writing the PDF and created it as an empty directory. Affected every export without a subfolder in the target path. Verified on iPhone.

## [1.6.1] — 2026-07-23

### Changed
- **Store warning `obsidianmd/prefer-create-el` resolved in code instead of switched off.** The former `eslint` override (`prefer-create-el: off`) is removed; the linter now reports 0 warnings. `core/image.ts` no longer creates the raster `<canvas>` itself via `activeDocument.createElement` but receives it injected as a factory (`() => createEl('canvas')`) — so the pure core layer stays free of Obsidian globals. The print `iframe` (`doPrint`) uses `createEl`; the preview pagination creates its sheets with `createDiv()` and adopts them into the iframe realm via `doc.adoptNode()` (Obsidian's helpers do not exist there). Purely internal, no visible behaviour changed (desktop print, vector PDF and preview verified).

## [1.6.0] — 2026-07-23

### Removed
- **"Mobile export" setting removed.** Since 1.4.0 it offered only a single option and was no longer read by any code path — the HTML/Quick Look route had been abolished in favour of the degradation model back then, and the dropdown stayed as a dummy. The stored key is still accepted, so old configurations load unchanged; nothing changes in behaviour, only an ineffective row disappears from the settings.

### Fixed
- **The documentation described an export route that no longer exists.** The README (both languages) and the tutorial still walked through the old iOS detour (HTML file → Quick Look → Print → pinch open the preview → save) and referred to the "Mobile export" setting. Since 1.3.0, mobile export is a single tap. `AGENTS.md` and a comment in `core/model.ts` also asserted the selectable fallback.
- **Reference docs extended with the 1.5.0 settings:** output target, custom folder and filename template including the placeholder table were missing from `docs/reference/settings.md` entirely, although they determine where the PDF is written and what it is called.

### Changed
- **Internal:** `core/body-ir.ts` no longer takes the letter model as `any` but as the typed consumer shape `LetterBodyModel` (pattern of `LetterHeadModel`). This removes the repo's last 32 lint warnings, which showed up as warnings in the community store review. No behaviour change: all three changes are type constructs, the build output is identical apart from the minifier's identifier assignment (number literals byte-identical). The enclosures block is covered by tests for the first time (singular/plural label, fallback, position).
- **Settings tab switched to the declarative API (`getSettingDefinitions`).** On Obsidian 1.13 and later the settings render in the native card layout including settings search; on older versions the previous setup (`display()`) still applies, running through the same definitions — there is no second source. `minAppVersion` stays 1.8.7, fields and behaviour are identical. This removes the repo's last lint override without a justification.

## [1.5.0] — 2026-07-20

### Added
- **Output target** (Settings → Advanced): where the exported PDF is written — **next to the note**, into **Obsidian's attachment folder**, into a **custom folder**, or not saved at all and **shared directly**. Until now every export landed in the hidden intermediate folder and was opened externally; that is now one option of four instead of the only way. An existing file is not overwritten but gets `" (2)"` appended.
- **Filename template** (Settings → Advanced): what the PDF is called is configurable. Placeholders `{notiz}` `{datum}` `{datum_lang}` `{empfaenger}` `{betreff}` `{unserzeichen}`; everything else in the field stays literal. `{datum}` yields **YYYY-MM-DD** so that letters sort chronologically in the file manager; `{datum_lang}` outputs the date as it appears in the letter. New installations start with `{datum} {empfaenger}`.
- **The print dialog now suggests the letter name.** Until now it offered the window title — for example `Sample letter - MyVault - Obsidian 1.13.2.pdf`. It uses the same template as the PDF export.

### Changed
- Existing installations keep their previous behaviour and do not need to change anything: for them the output target is set to "share directly" and the filename template to `{notiz}`. Both can be changed in the settings.

## [1.4.1] — 2026-07-20

Fixes the four errors on which the community store review of 1.4.0 failed. The printed letter is unchanged — the changes concern **how** it is produced.

### Changed
- **Desktop print runs through its own iframe.** Until now the export attached a `<style>` to Obsidian's `document.head`, wrote the letter into the app DOM via `innerHTML` and hid all sibling elements via `display:none`. Both are forbidden in the community store. The letter is now printed as a stand-alone document in a hidden iframe. Side effect: your own custom CSS can no longer leak into the running app, and printing waits for the frame's `load` event instead of a 150 ms timer — embedded logos are therefore reliably in place before the print dialog opens.
- **`minAppVersion` 1.4.0 → 1.8.7.** The plugin uses `getLanguage` (from 1.8.7) and `processFrontMatter` (from 1.4.4); the previous value was simply too low.

### Fixed
- Objects in the frontmatter produced the literal string `[object Object]` in the finished letter (for instance with accidentally nested YAML under `betreff:` or `info_1:`). Such values now stay empty. All frontmatter values that worked so far — text, numbers, lists, dates — are rendered unchanged.

### Internal
- `eslint` + `eslint-plugin-obsidianmd` as a gate (`npm run lint`, part of `npm run gate`), including a ban on inline `eslint-disable` (the store counts those as errors). Store findings are thereby visible locally before the release — exactly the gap through which 1.4.0 failed.
- Pending as a separate cut: `src/core/body-ir.ts` takes the letter model as `any` (32 lint warnings). Proper typing exposes ~9 real type errors in envelope-critical layout code and does not belong in a compliance release.

## [1.4.0] — 2026-07-12

Rebuild of the build and provenance basis — the letter functionality is unchanged, but the mobile vector PDF export becomes considerably more capable.

### Changed
- **Build system:** the plugin is no longer dependency-free and build-free. `src/` (TypeScript) is bundled into `main.js` by `esbuild`; `main.js` is now a build artifact (gitignored), no longer committed source. Reason: the PDF engine core is vendored as a shared kit (`src/vendor/kit/`) instead of being rewritten per plugin — which is no longer practical with a pure zero-build setup.
- **Release/provenance model:** the GitHub attestation (`actions/attest-build-provenance`) now signs the **build output** (`main.js`/`manifest.json`/`styles.css`), freshly built from the tagged source state via `npm ci` + `npm run gate` — no longer committed bytes 1:1 (the previous `source = output` model from 1.2.2). Provenance guarantee: reproducible from the attested commit, verifiable with `gh attestation verify`.
- **The mobile vector PDF export now produces rich Markdown bodies:** tables, embedded images, code blocks and multi-page pagination are rendered directly in the vector PDF (degrading to a simpler representation for unsupported elements) — instead of falling back to the HTML/Quick Look route as before. The desktop print route (`window.print()`) is unchanged.
- **Code blocks stay intact even when other plugins colour them:** fenced code is read directly from the Markdown for the PDF route instead of from the rendered DOM. Obsidian's renderer runs all installed Markdown processors — a foreign plugin that turns e.g. ```json into its own widget (such as "JSON Editor") leaves no `<pre>` there any more, but its controls. In the PDF, the code you wrote now appears, regardless of your other plugins. The desktop print route still uses the rendered view (there the plugin's rendering is correct and intended).

## [1.3.0] — 2026-06-28

Mobile PDF export as **one tap** — the weakest spot of the plugin (the manual Quick Look dance on iOS) is fixed.

### Added
- **Mobile vector PDF export:** on iPhone/iPad the letter now produces a real, text-selectable vector PDF and shares it directly via the system share sheet (`navigator.share()`) — instead of writing HTML and sending the user through Quick Look → Print → pinch open → Save. Own **dependency-free and build-free** PDF writer (PDF 1.7, Adobe Core 14 standard fonts, WinAnsi with umlauts/€); no new library, no network access — the zero-build/`source = output` guarantee stays unchanged.
- New command **"Export letter as PDF (vector)"** — produces the vector PDF on desktop and mobile.
- Setting **"Mobile export"** (`Vector PDF` ⁄ `Print / Quick Look`) as a safety valve; the default is the new vector PDF.
- Node tests (`npm test`, plain `node --test` without a build toolchain) for the pure engine functions (units, encoding, metrics, writer, wrapping, layout, body).

### Notes
- Complex body content (tables, embedded images, code blocks) automatically triggers the previous HTML/Quick Look route as a fallback; the desktop print route is unchanged.

## [1.2.2] — 2026-06-16

Supply-chain transparency — no functional changes to the letter.

### Added
- **GitHub artifact attestation** for release files: releases are published via GitHub Actions and cryptographically sign `main.js`, `manifest.json` and `styles.css` (Sigstore/SLSA provenance). Since the plugin is dependency-free and build-free, **nothing is built** — exactly the committed bytes that you read and install are signed. Verifiable with `gh attestation verify`. The readable, unbundled source remains the primary guarantee; the attestation puts a provenance layer on top.

## [1.2.1] — 2026-06-13

Polish after the community directory review — no functional changes to the letter.

### Changed
- Language detection now uses only `getLanguage()` + `moment.locale()`; the redundant `localStorage` fallback was removed.
- `ui-monospace` removed from the monospace stack of the technical style — not supported on older Obsidian versions; the named system fonts cover all platforms.

### Removed
- Obsolete design drafts under `design/` (the styles have lived in `main.js` since 1.1.0, theming in `presets/letterhead-theme.css`).

### Added
- `package-lock.json` (empty lockfile — the plugin is dependency-free) for reproducible builds.

## [1.2.0] — 2026-06-13

### Added
- **PDF export on iPhone/iPad** via the system share sheet: since `window.print()` has no effect in the mobile Obsidian WebView, the plugin writes the letter as a stand-alone HTML file (file name = note name) into a hidden export folder and hands it to the system via "Open in default app". A dialog guides through the steps: Quick Look → Share → Print → pinch open the preview → Share → Save to Files.
- The **frontmatter template** now fills `gruss` and `unterschrift` with the effective default values (instead of leaving them empty) and creates `info_1` … `info_4` in full.

### Changed
- **Renamed from "Briefkopf" to "Letterhead"** (plugin ID `letterhead`, repository `obsidian-letterhead`) — an internationally understandable, functional name. The letter functionality stays unchanged; existing frontmatter fields remain valid.
- On mobile devices the preview now scales via `transform` instead of CSS `zoom` (WebKit ignores `zoom`) and is displayed in full again on iPhone/iPad.
- Plugin description made more precise: print dialog on desktop, share sheet on iOS.
- Export button in the preview shortened to "PDF export".

### Fixed
- The preview was cut off on the right on iOS (the A4 sheet was not scaled down).

## [1.1.1] — 2026-06-12

### Fixed
- **Plugin UI was English despite a German Obsidian app**: language detection now uses the official `getLanguage()` API (fallback: `moment.locale()`, then legacy `localStorage`). Found in the pre-submission test.

### Added
- **Flat info block fields `info_1` … `info_4`** in the format "Label: Value" — directly editable in Obsidian's properties view (the `info:` map is kept for YAML users; without a colon the label "Info" is used).
- The **frontmatter template follows the letter language**: English field names (`recipient`, `subject`, `salutation`, …) when the letter language is English, and it now inserts all fields (`gruss`, `unterschrift`, `stil`, `infozeile`, `sprache`, `info_1`) — empty = settings/language default, everything editable in the properties.

### Changed
- **The custom CSS field comes pre-filled** with a fully commented-out, ineffective preset (documenting all tokens in place); the button is now called **"Reset preset"**. Migration: empty fields and the old *active* preset (which overrode the style selection) are replaced.
- Shorter settings descriptions — closer to the Obsidian standard layout.

## [1.1.0] — 2026-06-10

### Added
- **Three built-in styles** (setting "Style", overridable per letter via frontmatter `stil`): A Objective-modern (sans-serif), B Classic-serious (serif), C Technical-precise (monospaced accents) — taken over from `design/css/`, without a web font import (offline-capable, system monospace stack).
- **Info line layout** (setting "Info line", frontmatter `infozeile`): "Full" = info block to the right of the address (label-value rows), "Date only" = plain right-aligned place/date line.
- **Enclosure note**: frontmatter `anlagen` (list or block scalar) produces a stacked enclosures block below the signature ("Anlage"/"Anlagen").
- **Free info block rows**: frontmatter map `info` (e.g. customer number), plus the built-in field `steuernummer`.
- New design tokens for the letterhead name (`--bk-name-font`, `-size`, `-weight`, `-spacing`, `-transform`) as well as `--bk-din-head-top`, `--bk-din-info-top`, `--bk-din-info-width`, `--bk-din-dateline-top`.
- Setting **"Print offset top (mm)"** (token `--bk-print-offset`): fine adjustment if the address sits too high in the envelope window; pushes the letter content down, fold/punch marks stay unchanged relative to the paper.
- **Frontmatter section in the settings**: compact overview of all fields + button/command **"Insert letter frontmatter into note"** (adds recipient, subject, salutation, place, date, enclosures, without overwriting existing values).
- **`absender` as a simple YAML list** (one envelope line per list item; phone/email/web/postcode+city are detected automatically) — in addition to the individual fields `absender_name` & co., which still win field by field.
- **Paginated letter preview**: shows real A4 sheets with the same page-break positions as the print instead of an endless page.
- **Multilingual support**: the plugin UI automatically follows the Obsidian app language (English default, German localised). New is the independent setting **Letter language** (frontmatter `sprache`): German or English letter labels (Anlage/Enclosure, Ihr Zeichen/Your ref., Datum/Date, Tel./Phone) including a language default for the closing formula ("Mit freundlichen Grüßen" / "Kind regards"); "Default closing" empty = language default (the existing German default is migrated).

### Changed
- **DIN letterhead redone**: name (or logo) on the left, contact details on the right, hairline below — instead of a right-aligned head + sender block next to the address.
- The horizontal reference line was replaced by the **info block**; the setting "Reference line" is migrated to "Info line".
- Settings migration: if one of the design variant files was pasted into the "Custom CSS" field, it is automatically adopted as style/info line and the field is emptied; old font defaults become "Style default".
- **Base font size of all styles set to 10 pt** (previously 11/11.5 pt); still freely changeable via setting or token.
- Print margins per document standard: follow-up pages 25 mm at the top, 20 mm at the bottom everywhere; page 1 keeps 10 mm at the top (the DIN letterhead sits high by design).
- The settings now show the effective default values as placeholders (font/size per style, automatic return address).
- **UI in English** in line with the Obsidian community guidelines (sentence case, `setHeading()` instead of custom headings, no top-level heading): commands are now called "Export letter as PDF / print", "Open letter preview", "Insert letter frontmatter into note". The command IDs were cleaned up (`export-letter`, `open-preview`, `insert-frontmatter` — without plugin prefix); assigned hotkeys have to be set again once. Letter contents (enclosures, your reference, closing formula …) stay German — they are letter language according to DIN, not UI.
- `ihr_schreiben` is now formatted as a date according to the locale; `telefon_bezug` no longer has a sender default (the phone number is already in the letterhead).
- **Settings without a CSS obligation**: style + info line as dropdowns; font/size are optional overrides (empty = style default); "Custom CSS" has moved to "Advanced".
- New component class names analogous to the design preview (`.bk-address`, `.bk-return`, `.bk-recipient`, `.bk-infoblock`, `.bk-dateline`, `.bk-greeting`, `.bk-closing`, `.bk-signature`, `.bk-enclosures`); the 1.0 names are kept as aliases in the markup.

### Fixed
- **Fixed print margins** (`@page` 10 mm at the top / 15 mm at the bottom): printers without borderless printing no longer cut off the letterhead, and multi-page letters break with clean margins instead of at the sheet edge (additionally `orphans`/`widows`; closing/signature/enclosures stay together). All DIN positions stay exact relative to the paper — the components subtract the page margin internally; the preview simulates it.
- **Letter preview**: the A4 page is now fitted completely into the preview window (zoom-to-fit, never above 100 %). Before, the mm-wide page was squeezed by the flex layout in narrow windows — text wrapped too early and the font looked too large.

## [1.0.0] — 2026-06-09

### Added
- First release.
- Two themes: **DIN 5008** (Form A/B, window-envelope suitable) and **Modern**.
- PDF export via the OS print dialog — works on desktop **and iPhone/iPad**.
- Frontmatter fields for recipient, subject, salutation, closing, date, reference marks and sender overrides (German + English aliases).
- Sender profile in the settings.
- Fold marks (105/210 mm and 87/192 mm) and punch mark (148.5 mm).
- Logo/letterhead from a vault image (embedded as a data URL).
- CSS design tokens + commented preset (file + "Insert preset" button).
- Preview modal before the export.
