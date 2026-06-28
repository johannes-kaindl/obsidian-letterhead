'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { mmToPt, yTopMmToPt, dinGeometry, PAGE_H_PT } = require('../main.js').__test__;

test('mmToPt: 0, 10, 210', () => {
  assert.ok(Math.abs(mmToPt(0) - 0) < 1e-9);
  assert.ok(Math.abs(mmToPt(10) - 28.3464567) < 1e-4);
  assert.ok(Math.abs(mmToPt(210) - 595.275591) < 1e-3);
});

test('yTopMmToPt spiegelt an der Seitenhöhe', () => {
  assert.ok(Math.abs(yTopMmToPt(0) - PAGE_H_PT) < 1e-6);
  assert.ok(Math.abs(yTopMmToPt(297) - (PAGE_H_PT - mmToPt(297))) < 1e-6);
});

test('dinGeometry Form A vs B', () => {
  const a = dinGeometry('A'); const b = dinGeometry('B');
  assert.strictEqual(a.addrTopMm, 27);
  assert.strictEqual(b.addrTopMm, 45);
  assert.strictEqual(a.fold1Mm, 87);
  assert.strictEqual(b.fold1Mm, 105);
  assert.strictEqual(b.holeMm, 148.5);
  assert.strictEqual(b.marginLeftMm, 25);
});
