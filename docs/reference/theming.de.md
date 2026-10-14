# Referenz — Theming & CSS-Tokens

> 🇩🇪 Deutsch · [🇬🇧 English](theming.md)

Das gesamte Aussehen läuft über **CSS Custom Properties** („Design-Tokens").
Der in den Einstellungen gewählte **Stil** (Sachlich / Klassisch / Technisch)
setzt die Token-Defaults; dein optionales Feld **Custom CSS** wird *danach*
geladen und gewinnt. Du überschreibst also einfach die Tokens, die du ändern
willst — für die meisten Anpassungen reicht aber schon die Stil-Auswahl.

Schnellstart: Das Feld **Custom CSS** (Einstellungen → Advanced) ist mit einem
komplett auskommentierten Preset vorbefüllt — Zeile einkommentieren, Wert
anpassen, fertig. **Reset preset** stellt den Ausgangszustand wieder her
(identisch mit [`presets/letterhead-theme.css`](../../presets/letterhead-theme.css)) nach einer Rückfrage; dein bisheriges CSS wird vorher als `custom-css-backup.css` im Plugin-Ordner gesichert.

> Hinweis: Das Token-Präfix `--bk-…` und die Klassen `.bk-…` sind historisch —
> `bk` = „Briefkopf", das deutsche Wort für den Briefkopf und der ursprüngliche
> Projektname.

## Tokens — sicher anpassbar

Defaults je Stil in Klammern: Sachlich / Klassisch / Technisch.

| Token | Default | Wirkung |
|-------|---------|---------|
| `--bk-font-family` | Helvetica-Stack / Palatino-Stack / Helvetica-Stack | Schriftfamilie (auch über die Einstellung „Schriftart"). |
| `--bk-font-size` | `10pt` (alle Stile) | Grundschriftgröße. |
| `--bk-line-height` | `1.45` / `1.5` / `1.5` | Zeilenabstand. |
| `--bk-name-font` | Textschrift / Textschrift / Monospace-Stack | Schrift des Namens im Briefkopf. |
| `--bk-name-size` | `15.5pt` / `18pt` / `12.5pt` | Größe des Namens. |
| `--bk-name-weight` | `600` | Gewicht des Namens. |
| `--bk-name-spacing` | `0.005em` / `0.005em` / `0.12em` | Sperrung des Namens. |
| `--bk-name-transform` | `none` / `none` / `uppercase` | Versalien-Schaltung. |
| `--bk-color-text` | `#1a1a1a` / `#1c1a17` / `#15171a` | Fließtextfarbe. |
| `--bk-color-muted` | `#5a5a5a` / `#5a554e` / `#6a7078` | Infoblock-Labels, Kopf-Kontakt, Rücksendezeile. |
| `--bk-color-rule` | `#111` / `#1c1a17` / `#15171a` | Faltmarken + Unterstrich der Rücksendeangabe. |
| `--bk-color-hairline` | `#cfcfcf` / `#c9c2b6` / `#d4d7da` | Trennlinie unter dem Briefkopf. |
| `--bk-space` | `2.6mm` / `2.8mm` / `2.6mm` | Absatz-Rhythmus. |
| `--bk-block-gap` | `6mm` / `6.5mm` / `6mm` | Abstand zwischen Brief-Blöcken. |
| `--bk-signature-gap` | `16mm` / `17mm` / `16mm` | Platz für die Unterschrift. |

## Tokens — DIN-kritisch (Fensterkuvert)

Diese Werte halten die Anschrift im Sichtfenster eines DIN-lang-Kuverts. Nur
ändern, wenn dein Kuvert abweicht. Positionen hängen außerdem an der
Einstellung **DIN-5008-Form** (A/B).

Alle Positionen sind **ab Papierkante** gemessen. Gedruckt wird mit festen
`@page`-Rändern (Seite 1 oben 10 mm, Folgeseiten oben 25 mm, unten überall
20 mm — Tokens `--bk-print-margin-top`/`-bottom` für Seite 1), damit Drucker
nichts abschneiden und Seitenumbrüche dokumentübliche Ränder haben; die
Komponenten ziehen den oberen Rand intern wieder ab, sodass die
Papierpositionen exakt stimmen.

| Token | Default (Form B) | Form A |
|-------|------------------|--------|
| `--bk-page-width` / `--bk-page-height` | `210mm` / `297mm` | — |
| `--bk-margin-left` / `--bk-margin-right` | `25mm` / `20mm` | — |
| `--bk-print-margin-top` / `--bk-print-margin-bottom` | `10mm` / `20mm` (Seite 1; Folgeseiten oben `25mm`) | — |
| `--bk-print-offset` | `0mm` (Einstellung **Print offset top**) | — |
| `--bk-din-head-top` | `14mm` (+ Versatz) | `12mm` |
| `--bk-din-address-top` | `45mm` (+ Versatz) | `27mm` |
| `--bk-din-address-left` | `25mm` | — |
| `--bk-din-address-width` / `--bk-din-address-height` | `85mm` / `40mm` | — |
| `--bk-din-info-top` | `50mm` | `32mm` |
| `--bk-din-info-width` | `64mm` | — |
| `--bk-din-dateline-top` | `84mm` | — |
| `--bk-din-fold-1` | `105mm` | `87mm` |
| `--bk-din-fold-2` | `210mm` | `192mm` |
| `--bk-din-hole` | `148.5mm` | `148.5mm` |
| `--bk-din-content-top` | `98.46mm` | — |

Hintergrund: [DIN 5008](../explanation/din5008.de.md).

## Welche Tokens das Vektor-PDF liest

Der Desktop-Druck und die Vorschau rendern HTML/CSS, dort gilt jedes Token und jede Klassenregel von oben. Das **Vektor-PDF** (mobil und der Befehl „Brief als PDF exportieren (Vektor)“) zeichnet eine eigene Engine. Seit 1.9.0 gehen beide Wege von demselben aufgelösten Token-Satz aus: Stil-Defaults, dann die Einstellungen, dann deine `--bk-*`-Angaben im Feld **Custom CSS**. Das PDF übernimmt nur einfache Werte:

| Token | Im PDF akzeptiert |
|-------|-------------------|
| `--bk-font-size`, `--bk-name-size`, `--bk-space`, `--bk-block-gap`, `--bk-signature-gap` | Längen in `pt` oder `mm` (`--bk-font-size` in `pt`) |
| `--bk-line-height` | eine einfache Zahl |
| `--bk-color-text`, `--bk-color-muted`, `--bk-color-rule`, `--bk-color-hairline` | Hex-Farben (`#rgb` oder `#rrggbb`) |
| `--bk-name-transform` | `none` oder `uppercase` |

Alles andere bleibt bei Druck und Vorschau: `var(...)`-Werte, Schriftstapel (`--bk-font-family`, `--bk-name-font`), Schriftgewichte, das Modern-Layout und Klassenregeln wie `.bk-betreff`. Das PDF schreibt die 14 PDF-Standardschriften, eine Hausschrift lässt sich also nicht einbetten — das ist Absicht.

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
| `.bk-din .bk-head` | Briefkopf (Name/Logo links, Kontakt rechts, Hairline darunter). |
| `.bk-din .bk-head-name` · `.bk-din .bk-head-zusatz` · `.bk-din .bk-head-contact` | Name, Firmenzusatz, Kontaktblock im Kopf. |
| `.bk-din .bk-address`¹ · `.bk-din .bk-return`² · `.bk-din .bk-recipient`³ | Anschriftfeld, Rücksendezeile, Empfänger. |
| `.bk-din .bk-infoblock` (`.bk-info-item` / `.bk-info-label` / `.bk-info-value`) | Infoblock rechts (Infozeile „Vollständig"). |
| `.bk-din .bk-dateline` | Orts-/Datumszeile (Infozeile „Nur Datum"). |
| `.bk-betreff` · `.bk-greeting`⁴ · `.bk-closing`⁵ · `.bk-signature`⁶ | Textblöcke. |
| `.bk-body` | Brieftext (gerendertes Markdown). |
| `.bk-enclosures` (`.bk-encl-label` / `.bk-encl-list`) | Anlagenvermerk. |
| `.bk-modern .bk-m-head` · `.bk-modern .bk-m-sender` | Kopf/Absender im Modern-Layout. |
| `.bk-mark` (`.bk-f1`/`.bk-f2`/`.bk-lo`) | Falt-/Lochmarken. |

¹–⁶ Die Elemente tragen zusätzlich ihre alten 1.0-Klassennamen als Aliasse
(`.bk-anschrift`, `.bk-ruecksende`, `.bk-empf`, `.bk-anrede`, `.bk-gruss`,
`.bk-signatur`) — bestehendes eigenes CSS funktioniert weiter.
