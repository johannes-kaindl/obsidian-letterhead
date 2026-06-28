'use strict';
const { test } = require('node:test');
const assert = require('node:assert');

test('main.js lädt in Node und exportiert __test__', () => {
  const mod = require('../main.js');
  assert.strictEqual(typeof mod, 'function');           // Plugin-Klasse
  assert.strictEqual(typeof mod.__test__, 'object');    // Test-Hook
});
