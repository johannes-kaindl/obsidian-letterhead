# Reference — theming & CSS tokens

> 🇬🇧 English · [🇩🇪 Deutsch](theming.de.md)

The entire look runs on **CSS custom properties** ("design tokens"). The **style**
chosen in the settings (matter-of-fact / classic / technical) sets the token
defaults; your optional **Custom CSS** field is loaded *afterwards* and wins. So
you simply override the tokens you want to change — though for most adjustments
the style selection alone is enough.

Quick start: The **Custom CSS** field (Settings → Advanced) is pre-filled with a
fully commented-out preset — uncomment a line, adjust the value, done. **Reset
preset** restores the initial state (identical to
[`presets/letterhead-theme.css`](../../presets/letterhead-theme.css)).

> Note: the `--bk-…` token prefix and `.bk-…` classes are historical — `bk` =
> "Briefkopf", the German word for letterhead and the project's original name.

## Tokens — safe to adjust

Defaults per style in brackets: matter-of-fact / classic / technical.

| Token | Default | Effect |
|-------|---------|--------|
| `--bk-font-family` | Helvetica stack / Palatino stack / Helvetica stack | Font family (also via the "Font" setting). |
| `--bk-font-size` | `10pt` (all styles) | Base font size. |
| `--bk-line-height` | `1.45` / `1.5` / `1.5` | Line spacing. |
| `--bk-name-font` | Body font / body font / monospace stack | Font of the name in the letterhead. |
| `--bk-name-size` | `15.5pt` / `18pt` / `12.5pt` | Size of the name. |
| `--bk-name-weight` | `600` | Weight of the name. |
| `--bk-name-spacing` | `0.005em` / `0.005em` / `0.12em` | Letter-spacing of the name. |
| `--bk-name-transform` | `none` / `none` / `uppercase` | Uppercase switch. |
| `--bk-color-text` | `#1a1a1a` / `#1c1a17` / `#15171a` | Body text colour. |
| `--bk-color-muted` | `#5a5a5a` / `#5a554e` / `#6a7078` | Info-block labels, header contact, return-address line. |
| `--bk-color-rule` | `#111` / `#1c1a17` / `#15171a` | Fold marks + underline of the return address. |
| `--bk-color-hairline` | `#cfcfcf` / `#c9c2b6` / `#d4d7da` | Divider below the letterhead. |
| `--bk-space` | `2.6mm` / `2.8mm` / `2.6mm` | Paragraph rhythm. |
| `--bk-block-gap` | `6mm` / `6.5mm` / `6mm` | Gap between letter blocks. |
| `--bk-signature-gap` | `16mm` / `17mm` / `16mm` | Space for the signature. |

## Tokens — DIN-critical (window envelope)

These values keep the address inside the window of a DIN-long envelope. Only
change them if your envelope differs. The positions also depend on the
**DIN 5008 form** setting (A/B).

All positions are measured **from the paper edge**. Printing uses fixed `@page`
margins (page 1 top 10 mm, continuation pages top 25 mm, bottom 20 mm
everywhere — tokens `--bk-print-margin-top`/`-bottom` for page 1), so printers
don't clip anything and page breaks keep document-standard margins; the
components subtract the top margin again internally, so the paper positions
match exactly.

| Token | Default (Form B) | Form A |
|-------|------------------|--------|
| `--bk-page-width` / `--bk-page-height` | `210mm` / `297mm` | — |
| `--bk-margin-left` / `--bk-margin-right` | `25mm` / `20mm` | — |
| `--bk-print-margin-top` / `--bk-print-margin-bottom` | `10mm` / `20mm` (page 1; continuation pages top `25mm`) | — |
| `--bk-print-offset` | `0mm` (setting **Print offset top**) | — |
| `--bk-din-head-top` | `14mm` (+ offset) | `12mm` |
| `--bk-din-address-top` | `45mm` (+ offset) | `27mm` |
| `--bk-din-address-left` | `25mm` | — |
| `--bk-din-address-width` / `--bk-din-address-height` | `85mm` / `40mm` | — |
| `--bk-din-info-top` | `50mm` | `32mm` |
| `--bk-din-info-width` | `64mm` | — |
| `--bk-din-dateline-top` | `84mm` | — |
| `--bk-din-fold-1` | `105mm` | `87mm` |
| `--bk-din-fold-2` | `210mm` | `192mm` |
| `--bk-din-hole` | `148.5mm` | `148.5mm` |
| `--bk-din-content-top` | `98.46mm` | — |

Background: [DIN 5008](../explanation/din5008.md).

## Example — custom CSS

```css
:root {
  --bk-font-family: "Iowan Old Style", Georgia, serif;
  --bk-font-size: 11.5pt;
  --bk-color-text: #1a1a1a;
  --bk-block-gap: 7mm;
}
.bk-betreff { color: #0a7d3c; }            /* accent colour for the subject */
```

## Component classes (for fine details)

When a token isn't enough, you can override classes directly:

| Class | Element |
|-------|---------|
| `.bk-letter` | Letter container (A4). |
| `.bk-din .bk-head` | Letterhead (name/logo left, contact right, hairline below). |
| `.bk-din .bk-head-name` · `.bk-din .bk-head-zusatz` · `.bk-din .bk-head-contact` | Name, company addition, contact block in the header. |
| `.bk-din .bk-address`¹ · `.bk-din .bk-return`² · `.bk-din .bk-recipient`³ | Address field, return-address line, recipient. |
| `.bk-din .bk-infoblock` (`.bk-info-item` / `.bk-info-label` / `.bk-info-value`) | Info block on the right (info line "Full"). |
| `.bk-din .bk-dateline` | Place/date line (info line "Date only"). |
| `.bk-betreff` · `.bk-greeting`⁴ · `.bk-closing`⁵ · `.bk-signature`⁶ | Text blocks. |
| `.bk-body` | Letter text (rendered Markdown). |
| `.bk-enclosures` (`.bk-encl-label` / `.bk-encl-list`) | Enclosure note. |
| `.bk-modern .bk-m-head` · `.bk-modern .bk-m-sender` | Header/sender in the Modern layout. |
| `.bk-mark` (`.bk-f1`/`.bk-f2`/`.bk-lo`) | Fold/hole marks. |

¹–⁶ These elements also carry their old 1.0 class names as aliases
(`.bk-anschrift`, `.bk-ruecksende`, `.bk-empf`, `.bk-anrede`, `.bk-gruss`,
`.bk-signatur`) — existing custom CSS keeps working.
