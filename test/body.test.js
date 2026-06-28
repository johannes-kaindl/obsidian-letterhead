'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { walkBodyNodes } = require('../main.js').__test__;

const TEXT = 3, ELEM = 1;
const txt = (s) => ({ nodeType: TEXT, textContent: s });
const el = (name, kids) => ({ nodeType: ELEM, nodeName: name.toUpperCase(), childNodes: kids || [] });

test('Absatz mit Fett', () => {
  const root = el('div', [el('p', [txt('Hallo '), el('strong', [txt('Welt')])])]);
  const r = walkBodyNodes(root);
  assert.strictEqual(r.blocks.length, 1);
  assert.strictEqual(r.blocks[0].kind, 'p');
  assert.deepStrictEqual(r.blocks[0].runs, [
    { text: 'Hallo ', bold: false, italic: false },
    { text: 'Welt', bold: true, italic: false }
  ]);
  assert.strictEqual(r.hasUnsupported, false);
});

test('verschachteltes Kursiv', () => {
  const root = el('div', [el('p', [el('em', [txt('schräg')])])]);
  const r = walkBodyNodes(root);
  assert.deepStrictEqual(r.blocks[0].runs, [{ text: 'schräg', bold: false, italic: true }]);
});

test('Liste → li-Blöcke', () => {
  const root = el('div', [el('ul', [el('li', [txt('A')]), el('li', [txt('B')])])]);
  const r = walkBodyNodes(root);
  assert.deepStrictEqual(r.blocks.map(b => b.kind), ['li', 'li']);
});

test('Tabelle setzt hasUnsupported', () => {
  const root = el('div', [el('table', [txt('x')])]);
  const r = walkBodyNodes(root);
  assert.strictEqual(r.hasUnsupported, true);
});

test('verschachteltes div wird durchstiegen', () => {
  const root = el('div', [el('div', [el('p', [txt('tief')])])]);
  const r = walkBodyNodes(root);
  assert.strictEqual(r.blocks.length, 1);
  assert.strictEqual(r.blocks[0].runs[0].text, 'tief');
});
