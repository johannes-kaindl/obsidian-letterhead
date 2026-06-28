'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { charWidth1000, textWidthPt, BASE_FONTS } = require('../main.js').__test__;

test('bekannte Helvetica-Breiten (1000-em)', () => {
  assert.strictEqual(charWidth1000('helv', 0x20), 278); // space
  assert.strictEqual(charWidth1000('helv', 0x41), 667); // A
  assert.strictEqual(charWidth1000('helv', 0x61), 556); // a
  assert.strictEqual(charWidth1000('helv', 0x2E), 278); // . (Helvetica = 278)
  assert.strictEqual(charWidth1000('helv', 0xE4), 556); // ä
});
test('bekannte Times-Breiten', () => {
  assert.strictEqual(charWidth1000('times', 0x20), 250);
  assert.strictEqual(charWidth1000('times', 0x41), 722);
  assert.strictEqual(charWidth1000('times', 0x2E), 250); // . (Times = 250)
});
test('Courier ist fix 600', () => {
  assert.strictEqual(charWidth1000('cour', 0x41), 600);
  assert.strictEqual(charWidth1000('cour', 0x69), 600);
});
test('unbekannter Code → Fallback 500', () => {
  assert.strictEqual(charWidth1000('helv', 0x07), 500);
});
test('textWidthPt summiert korrekt', () => {
  // "AA" @ 10pt Helvetica = 2*667/1000*10 = 13.34
  assert.ok(Math.abs(textWidthPt('helv', 10, 'AA') - 13.34) < 1e-6);
});
test('BASE_FONTS deckt 12 Schlüssel', () => {
  assert.strictEqual(Object.keys(BASE_FONTS).length, 12);
});
