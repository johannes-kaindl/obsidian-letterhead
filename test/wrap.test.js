'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { wrapRuns, textWidthPt } = require('../main.js').__test__;

test('kurzer Text → eine Zeile', () => {
  const lines = wrapRuns([{ text: 'Hallo Welt', fontKey: 'helv' }], 200, 10);
  assert.strictEqual(lines.length, 1);
  assert.strictEqual(lines[0].segments.map(s => s.text).join(''), 'Hallo Welt');
});

test('Umbruch bei Überbreite', () => {
  const w = textWidthPt('helv', 10, 'Wort ');
  const lines = wrapRuns([{ text: 'Wort Wort Wort Wort', fontKey: 'helv' }], w * 2, 10);
  assert.ok(lines.length >= 2);
});

test('jede Zeilenbreite ≤ max (außer Einzelwort)', () => {
  const lines = wrapRuns([{ text: 'aaa bbb ccc ddd eee', fontKey: 'helv' }], 40, 10);
  for (const l of lines) {
    const single = l.segments.length === 1 && !l.segments[0].text.includes(' ');
    assert.ok(l.widthPt <= 40 + 1e-6 || single);
  }
});

test('Stilwechsel bleibt als Segment erhalten', () => {
  const lines = wrapRuns([
    { text: 'normal ', fontKey: 'helv' },
    { text: 'fett', fontKey: 'helvB' }
  ], 500, 10);
  const segs = lines[0].segments;
  assert.ok(segs.some(s => s.fontKey === 'helvB' && s.text.includes('fett')));
});
