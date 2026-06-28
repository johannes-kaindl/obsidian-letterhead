'use strict';
/*
 * Erzeugt ein Beispiel-Brief-PDF allein über die puren Engine-Funktionen
 * (__test__.layoutLetter + __test__.PdfWriter) — ohne Obsidian. Dient dem
 * Viewer-Matrix-Gate (Task 13 des Implementierungsplans): das Ergebnis in
 * iOS Files/Quick Look, macOS Preview, Adobe Reader und Chrome öffnen und auf
 * korrektes Layout + selektierbaren Text prüfen.
 *
 *   node tools/sample-letter.js [ziel.pdf]   (Default: ./letterhead-sample.pdf)
 */
const fs = require('fs');
const { layoutLetter, PdfWriter } = require('../main.js').__test__;

const model = {
  recipient: ['Firma Beispiel GmbH', 'Herr Dr. Schäfer', 'Königsallee 42', '40212 Düsseldorf'],
  betreff: 'Angebot über Schreibwaren — Bestellung Nr. 2026/0815',
  anrede: 'Sehr geehrter Herr Dr. Schäfer,',
  gruss: 'Mit freundlichen Grüßen', unterschrift: 'Erika Müller-Lüdenscheidt',
  datum: '28.06.2026', ort: 'Berlin', anlagen: ['Preisliste', 'AGB'], infozeile: 'vollstaendig',
  labels: { datum: 'Datum', steuernummer: 'Steuernummer', anlage: 'Anlage', anlagen: 'Anlagen', telPrefix: 'Tel. ' },
  infoExtra: [['Kundennr.', 'K-4711']], steuernummer: '12/345/67890',
  senderName: 'Erika Müller-Lüdenscheidt', senderStrasse: 'Beispielweg 2', senderPlzOrt: '54321 Beispielstadt',
  senderTelefon: '030 1234567', senderEmail: 'info@example.com', senderWeb: 'www.example.com',
  ruecksende: 'E. Müller-Lüdenscheidt · Beispielweg 2 · 54321 Beispielstadt', logo: '', stil: 'klassisch'
};
const settings = { dinForm: 'B', theme: 'din5008', showFoldMarks: true, showHoleMark: true, printOffsetTopMm: 0 };

const body = [{ kind: 'li', runs: [{ text: 'Erster Listenpunkt (fett)', bold: true, italic: false }] }];
for (let i = 0; i < 60; i++) {
  body.push({ kind: 'p', runs: [{ text: 'Dies ist ein längerer Absatz mit Umlauten (ä, ö, ü, ß) und dem Euro-Zeichen €, der über mehrere Zeilen umbricht und damit Umbruch und Pagination prüft.', bold: false, italic: false }] });
}

const { pageCount, ops } = layoutLetter(model, settings, body);
const w = new PdfWriter();
const pages = [];
for (let i = 0; i < pageCount; i++) pages.push(w.addPage());
for (const o of ops) {
  const pg = pages[o.page] || pages[pages.length - 1];
  if (o.kind === 'text') pg.text(o.x, o.y, o.str, o.fontKey, o.sizePt, o.rgb);
  else if (o.kind === 'line') pg.line(o.x1, o.y1, o.x2, o.y2, o.wPt, o.rgb);
}
const out = process.argv[2] || 'letterhead-sample.pdf';
fs.writeFileSync(out, Buffer.from(w.build()));
process.stdout.write(`wrote ${out} — ${pageCount} pages, ${ops.length} draw-ops\n`);
