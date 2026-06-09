# Referenz — Theming & CSS-Tokens

Das gesamte Aussehen läuft über **CSS Custom Properties** („Design-Tokens"). Das
Plugin erzeugt sie pro Brief; dein Feld **Eigenes CSS** wird *danach* geladen und
gewinnt. Du überschreibst also einfach die Tokens, die du ändern willst.

Schnellstart: **Einstellungen → Eigenes CSS → „Preset einfügen"** lädt einen
kommentierten Startpunkt (identisch mit [`presets/briefkopf-theme.css`](../../presets/briefkopf-theme.css)).

## Tokens — sicher anpassbar

| Token | Default | Wirkung |
|-------|---------|---------|
| `--bk-font-family` | `Helvetica, Arial, sans-serif` | Schriftfamilie (auch über die Einstellung „Schriftart"). |
| `--bk-font-size` | `11pt` | Grundschriftgröße. |
| `--bk-line-height` | `1.4` | Zeilenabstand. |
| `--bk-color-text` | `#111111` | Fließtextfarbe. |
| `--bk-color-muted` | `#555555` | Labels der Bezugszeichenzeile. |
| `--bk-color-rule` | `#000000` | Faltmarken + Unterstrich der Rücksendeangabe. |
| `--bk-color-hairline` | `#bbbbbb` | Trennlinie der Bezugszeile. |
| `--bk-space` | `2.6mm` | Absatz-Rhythmus. |
| `--bk-block-gap` | `6mm` | Abstand zwischen Brief-Blöcken. |
| `--bk-signature-gap` | `16mm` | Platz für die Unterschrift. |

## Tokens — DIN-kritisch (Fensterkuvert)

Diese Werte halten die Anschrift im Sichtfenster eines DIN-lang-Kuverts. Nur
ändern, wenn dein Kuvert abweicht. Kopfhöhe und Falzmarken hängen außerdem an der
Einstellung **DIN-5008-Form** (A/B).

| Token | Default (Form B) | Form A |
|-------|------------------|--------|
| `--bk-page-width` / `--bk-page-height` | `210mm` / `297mm` | — |
| `--bk-margin-left` / `--bk-margin-right` | `25mm` / `20mm` | — |
| `--bk-din-head-height` | `45mm` | `27mm` |
| `--bk-din-address-top` | `45mm` | `27mm` |
| `--bk-din-address-left` | `25mm` | — |
| `--bk-din-address-width` / `--bk-din-address-height` | `85mm` / `40mm` | — |
| `--bk-din-fold-1` | `105mm` | `87mm` |
| `--bk-din-fold-2` | `210mm` | `192mm` |
| `--bk-din-hole` | `148.5mm` | `148.5mm` |
| `--bk-din-content-top` | `98.46mm` | — |

Hintergrund: [DIN 5008](../explanation/din5008.md).

## Beispiel — eigenes CSS

```css
:root {
  --bk-font-family: "Iowan Old Style", Georgia, serif;
  --bk-font-size: 11.5pt;
  --bk-color-text: #1a1a1a;
  --bk-block-gap: 7mm;
}
.bk-betreff { color: #0a7d3c; }            /* Akzentfarbe Betreff */
```

## Komponenten-Klassen (für Feinheiten)

Reicht ein Token nicht, kannst du Klassen direkt überschreiben:

| Klasse | Element |
|--------|---------|
| `.bk-letter` | Briefcontainer (A4). |
| `.bk-betreff` · `.bk-anrede` · `.bk-gruss` · `.bk-signatur` | Textblöcke. |
| `.bk-body` | Brieftext (gerendertes Markdown). |
| `.bk-din .bk-head .bk-head-name` | Textbriefkopf (ohne Logo). |
| `.bk-din .bk-anschrift` · `.bk-din .bk-ruecksende` · `.bk-din .bk-empf` | Anschriftfeld. |
| `.bk-din .bk-info` | Absender-Infoblock (rechts). |
| `.bk-din .bk-bezug` | Bezugszeichenzeile. |
| `.bk-modern .bk-m-head` · `.bk-modern .bk-m-sender` | Kopf/Absender im Modern-Theme. |
| `.bk-mark` (`.bk-f1`/`.bk-f2`/`.bk-lo`) | Falt-/Lochmarken. |
