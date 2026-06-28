'use strict';
/*
 * Einmaliger Generator für den AFM_WIDTHS-Block in main.js (Sektion
 * "PDF · Schriftmetriken"). Gibt die WinAnsi-Glyph-Advance-Breiten (/1000 em)
 * der Adobe Core-14-Standardschriften aus — die Daten, die den deterministischen
 * Zeilenumbruch der Vektor-PDF-Engine tragen (ohne canvas/DOM, in Node testbar).
 *
 * Datenquelle: das Paket @pdf-lib/standard-fonts (MIT) liefert die Core-14-
 * Metriken + die WinAnsi-Encoding-Map. Courier ist monospaced (fix 600) und wird
 * nicht eingebettet — charWidth1000() liefert dafür konstant 600.
 *
 * Reproduktion (außerhalb des Repos, z. B. im Scratchpad — KEINE Runtime-Dependency
 * des Plugins, nur Dev-Zeit):
 *   npm install @pdf-lib/standard-fonts pako
 *   node tools/gen-afm-widths.js > /tmp/afm-block.js
 * Dann den `const AFM_WIDTHS = {…};`-Block in main.js ersetzen und
 * `npm test` (test/metrics.test.js prüft bekannte Breiten) grün fahren.
 */
const { Font, Encodings } = require('@pdf-lib/standard-fonts');

const MAP = {
  helv: 'Helvetica', helvB: 'Helvetica-Bold', helvI: 'Helvetica-Oblique', helvBI: 'Helvetica-BoldOblique',
  times: 'Times-Roman', timesB: 'Times-Bold', timesI: 'Times-Italic', timesBI: 'Times-BoldItalic'
};
const win = Encodings.WinAnsi.unicodeMappings; // unicodeCodePoint -> [code, glyphName]
const out = {};
for (const [key, fname] of Object.entries(MAP)) {
  const font = Font.load(fname);
  const widths = {};
  for (const cp of Object.keys(win)) {
    const [code, glyph] = win[cp];
    const w = font.getWidthOfGlyph(glyph);
    if (typeof w === 'number') widths[code] = w;
  }
  out[key] = widths;
}
process.stdout.write('const AFM_WIDTHS = ' + JSON.stringify(out) + ';\n');
