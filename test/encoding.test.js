'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { winAnsiBytes, pdfTextBytes } = require('../main.js').__test__;

test('ASCII passt 1:1', () => {
  assert.deepStrictEqual(winAnsiBytes('AB'), [0x41, 0x42]);
});
test('Umlaute (Latin-1)', () => {
  assert.deepStrictEqual(winAnsiBytes('äöüß'), [0xE4, 0xF6, 0xFC, 0xDF]);
});
test('Euro liegt in WinAnsi bei 0x80', () => {
  assert.deepStrictEqual(winAnsiBytes('€'), [0x80]);
});
test('unbekanntes Zeichen → ?', () => {
  assert.deepStrictEqual(winAnsiBytes('☃'), [0x3F]);
});
test('Klammern/Backslash werden escaped', () => {
  assert.deepStrictEqual(pdfTextBytes('a(b)\\'), [0x61, 0x5C, 0x28, 0x62, 0x5C, 0x29, 0x5C, 0x5C]);
});
