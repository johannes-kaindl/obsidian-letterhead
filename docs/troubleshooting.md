# Troubleshooting

Each entry starts with what you see — the wording is the plugin's own English text — then the cause and what to do. If yours is not here, see [Getting help](#getting-help).

## Open a Markdown note first

> Letterhead: Open a Markdown note first.

**Cause:** a command ran while no Markdown note had focus — a PDF, an image, a canvas or an empty pane is in front.

**Fix:** click into the letter note and run the command again.

## No recipient in the frontmatter

> Letterhead: No recipient in the frontmatter (field "empfaenger").

**Cause:** the note has no recipient. The message names the German field; `recipient` (and `an`, `to`, `adresse`, `anschrift`) are the same field. The letter is still produced, just without an address in the window.

**Fix:** add the recipient as a list, one bullet per envelope line:

```yaml
recipient:
  - Muster GmbH
  - Frau Erika Beispiel
  - Musterstraße 12
  - 12345 Musterstadt
```

The command **Insert letter frontmatter into note** scaffolds the main fields. All fields: [frontmatter reference](reference/frontmatter.md).

## Printing is not possible

> Letterhead: Printing is not possible.

**Cause:** on the desktop the letter is handed to the operating system's print dialog through a hidden frame, and opening that dialog failed.

**Fix:** run **Export letter as PDF / print** again. If it keeps failing, use **Export letter as PDF (vector)**, which writes the PDF itself and does not need the print dialog.

## The file could not be handed to the system

> Letterhead: Could not hand the file to the system.

**Cause:** the vector PDF was built, but writing it or opening the share sheet failed. Details are in the developer console (Ctrl+Shift+I, or Cmd+Option+I on macOS).

**Fix:** under **Settings → Letterhead → Advanced** try a different **Output target** — a folder instead of *Do not save, share directly*, or the other way round — and export again. If the console shows an error, [open an issue](#getting-help) with it.

## The logo does not show

> Letterhead: Could not load the logo – assets/logo.png

**Cause:** **Logo path** is not a vault-relative path to an existing image. Supported are PNG, SVG, GIF, WebP and JPEG.

**Fix:** check the path under **Settings → Letterhead**, spelled exactly as in the file explorer, for example `assets/logo.png`.

## The address does not line up with the envelope window

**Cause:** printers and envelopes differ by a few millimetres.

**Fix:** raise **Print offset top (mm)** in the settings, try 2–4 mm, and print a test page against a real envelope. Leave scaling at 100 % in the print dialog; any other scaling moves the DIN positions.

## Some elements look simplified in the PDF

> Letterhead: 2 element(s) were simplified for the PDF.

**Cause:** when the plugin builds the PDF itself — always on iPhone and iPad, on the desktop through **Export letter as PDF (vector)** — what its engine cannot represent is reduced to plain text. The notice counts them.

**Fix:** check the letter against the PDF. On the desktop, **Export letter as PDF / print** renders through the operating system and does not have this limit.

## Getting help

Still stuck? [Open an issue](https://github.com/johannes-kaindl/obsidian-letterhead/issues) with your Obsidian version, the plugin version (Settings → Community plugins) and what you expected to happen.
