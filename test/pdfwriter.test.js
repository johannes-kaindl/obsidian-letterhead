'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { PdfWriter } = require('../main.js').__test__;

function decodeLatin1(u8) { let s = ''; for (const b of u8) s += String.fromCharCode(b); return s; }

test('leeres Dokument: gültiges Grundgerüst', () => {
  const w = new PdfWriter();
  w.addPage();
  const s = decodeLatin1(w.build());
  assert.ok(s.startsWith('%PDF-1.7'));
  assert.ok(s.includes('/Type /Catalog'));
  assert.ok(s.includes('/Type /Pages'));
  assert.ok(s.includes('/MediaBox [0 0 595.28 841.89]'));
  assert.ok(s.includes('startxref'));
  assert.ok(s.trimEnd().endsWith('%%EOF'));
});

test('xref-Offset zeigt exakt auf "1 0 obj"', () => {
  const w = new PdfWriter(); w.addPage();
  const s = decodeLatin1(w.build());
  const sx = s.lastIndexOf('startxref');
  const xrefStart = parseInt(s.slice(sx + 'startxref'.length).trim().split(/\s/)[0], 10);
  const lines = s.slice(xrefStart).split(/\r?\n/);
  // [0]='xref' [1]='0 N' [2]=freier Eintrag (Obj 0) [3]=Obj 1
  const off1 = parseInt(lines[3].slice(0, 10), 10);
  assert.strictEqual(s.slice(off1, off1 + 7), '1 0 obj');
});

test('Text + Font landet im Stream und in Resources', () => {
  const w = new PdfWriter();
  const p = w.addPage();
  p.text(100, 700, 'Hallo (ä)', 'helv', 12, [0, 0, 0]);
  const s = decodeLatin1(w.build());
  assert.ok(s.includes('/BaseFont /Helvetica'));
  assert.ok(s.includes('/WinAnsiEncoding'));
  assert.ok(s.includes(' Tf'));
  assert.ok(s.includes('Hallo \\(')); // escaped Klammer
  assert.ok(s.includes(String.fromCharCode(0xE4))); // ä als WinAnsi-Byte
});

test('mehrere Seiten → Count + Kids stimmen', () => {
  const w = new PdfWriter();
  w.addPage(); w.addPage(); w.addPage();
  const s = decodeLatin1(w.build());
  assert.ok(s.includes('/Count 3'));
});

test('Linie erzeugt Pfad-Operator', () => {
  const w = new PdfWriter();
  const p = w.addPage();
  p.line(0, 100, 20, 100, 1, [0, 0, 0]);
  const s = decodeLatin1(w.build());
  assert.ok(/0 100 m 20 100 l S/.test(s));
});
