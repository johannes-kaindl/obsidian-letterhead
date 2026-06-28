'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { layoutLetter, styleFonts } = require('../main.js').__test__;

const baseModel = {
  recipient: ['Max Mustermann', 'Musterstr. 1', '12345 Musterstadt'],
  betreff: 'Testbetreff', anrede: 'Sehr geehrte Damen und Herren,',
  gruss: 'Mit freundlichen Grüßen', unterschrift: 'Erika Beispiel',
  datum: '28.06.2026', anlagen: [], infozeile: 'nurdatum', ort: 'Berlin',
  labels: { datum: 'Datum' }, infoExtra: [], senderName: 'Erika Beispiel',
  senderStrasse: 'Beispielweg 2', senderPlzOrt: '54321 Beispielstadt',
  senderTelefon: '', senderEmail: '', senderWeb: '',
  ruecksende: 'Erika Beispiel · Beispielweg 2 · 54321', logo: ''
};
const settings = { dinForm: 'B', theme: 'din5008', showFoldMarks: true, showHoleMark: true, printOffsetTopMm: 0 };
const blocks = [{ kind: 'p', runs: [{ text: 'Dies ist der Brieftext.', bold: false, italic: false }] }];

test('styleFonts mappt Stile', () => {
  assert.strictEqual(styleFonts('klassisch').body, 'times');
  assert.strictEqual(styleFonts('sachlich').body, 'helv');
  assert.strictEqual(styleFonts('sachlich').bold, 'helvB');
});

test('layout erzeugt mindestens eine Seite und gültige Ops', () => {
  const r = layoutLetter(baseModel, settings, blocks);
  assert.ok(r.pageCount >= 1);
  assert.ok(r.ops.length > 0);
  assert.ok(r.ops.every(o => o.page >= 0 && o.page < r.pageCount));
});

test('Empfänger erscheint als Text-Op auf Seite 0', () => {
  const r = layoutLetter(baseModel, settings, blocks);
  const txt = r.ops.filter(o => o.kind === 'text' && o.page === 0).map(o => o.str);
  assert.ok(txt.includes('Max Mustermann'));
});

test('Falz-/Lochmarken sind 3 Linien am Blattrand (x1=0) auf Seite 0', () => {
  const r = layoutLetter(baseModel, settings, blocks);
  const marks = r.ops.filter(o => o.kind === 'line' && o.page === 0 && o.x1 === 0);
  assert.strictEqual(marks.length, 3); // 2 Falz + 1 Loch
});

test('langer Body paginiert auf >= 2 Seiten', () => {
  const many = Array.from({ length: 120 }, () => ({ kind: 'p', runs: [{ text: 'Zeile über Zeile über Zeile.', bold: false, italic: false }] }));
  const r = layoutLetter(baseModel, settings, many);
  assert.ok(r.pageCount >= 2);
});

test('klassischer Stil nutzt Times im Body', () => {
  const m = Object.assign({}, baseModel, { stil: 'klassisch' });
  const r = layoutLetter(m, settings, blocks);
  const bodyText = r.ops.find(o => o.kind === 'text' && o.str === 'Dies ist der Brieftext.');
  assert.strictEqual(bodyText.fontKey, 'times');
});
