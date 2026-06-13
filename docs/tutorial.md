# Tutorial — your first letter

> 🇬🇧 English · [🇩🇪 Deutsch](tutorial.de.md)

Goal: go from an empty note to a finished PDF business letter in five minutes.

## 1. Install & enable the plugin

Copy `manifest.json`, `main.js`, `styles.css`, `versions.json` into
`<your-vault>/.obsidian/plugins/letterhead/` (or run `npm run deploy`),
then in Obsidian → Settings → Community plugins reload and enable **Letterhead**.

## 2. Set sender & style once

Settings → **Letterhead**:

- Fill in the **Sender profile** (name, company, street, postal code + city,
  phone, email, website). It applies to every letter and is overridable per
  letter.
- Choose a **Style**: matter-of-fact (sans), classic (serif) or technical (mono).
- **Info line**: "Full" (info block with reference/date) or "Date only"
  (a plain place/date line, e.g. for job applications and private mail).

## 3. Create a letter note

Open a new note, then run the command palette → **Insert letter frontmatter into
note** — this scaffolds the most important fields (also available as a button in
the settings under "Frontmatter"). Fill them in and write the letter text below:

```markdown
---
recipient:
  - Muster GmbH
  - Frau Erika Beispiel
  - Musterstraße 12
  - 12345 Musterstadt
subject: Quote no. 2026-0042
salutation: Dear Ms Beispiel,
date: 2026-06-10
enclosures:
  - Schedule of services
  - Terms and conditions
---

Thank you for your enquiry. Please find our quote enclosed …
```

Lists such as `recipient` and `enclosures` have one bullet per line and can also
be edited comfortably in Obsidian's Properties view. All fields (including
`sender` as a list, `style`, `info line`, info-block rows):
[frontmatter reference](reference/frontmatter.md). A complete example lives at
[`examples/example-letter.md`](../examples/example-letter.md).

## 4. Check the preview

Command palette → **Open letter preview**. The preview shows the finished
A4 sheets including page breaks — so you can see the layout without printing.

## 5. Export as PDF

Command palette or the envelope icon → **Export letter as PDF / print**.

- **Desktop (macOS/Windows/Linux):** The operating system's print dialog opens.
  PDF dropdown or destination → **"Save as PDF"**; keep scaling at **100%**.
- **iPhone/iPad:** The plugin writes the letter as an HTML file (named after the
  note) into the vault and hands it to iOS. The export then goes like this:

  1. A small dialog appears — tap **"Open"**.
  2. iOS shows a chooser — tap **"Quick Look"**.
  3. In Quick Look, tap the **Share** icon (bottom right).
  4. Choose **"Print"**.
  5. **Pinch the preview open with two fingers** — it becomes the finished PDF
     with correct margins and page breaks.
  6. Tap the **Share** icon again, then **"Save to Files"**.

The plugin sets the print margins automatically (page 1: 10 mm top, continuation
pages: 25 mm, bottom: 20 mm) — this applies on both paths, so there's nothing to
adjust.

## 6. Fold & insert into the envelope

Fold along the fold marks (left edge, at 105/210 mm) and slip the letter into the
DIN-long window envelope so the address sits in the window. If it sits a few
millimetres too high for your envelope, the **Print offset top (mm)** setting
helps (try 2–4 mm).

## Next

- All fields: [frontmatter reference](reference/frontmatter.md)
- All settings: [settings reference](reference/settings.md)
- Fine-tuning with CSS: [theming / CSS tokens](reference/theming.md)
- Why these measurements: [DIN 5008](explanation/din5008.md)
