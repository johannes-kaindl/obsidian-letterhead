/**
 * Erzeugt die binaeren Fixture-Beilagen im Staging-Vault.
 *
 * Warum erzeugt statt getrackt: ein PNG im Repo waere ein Binaerblob, den niemand
 * reviewen kann und dessen Inhalt beim naechsten Lesen geraten werden muss. Erzeugt
 * ist er in zwanzig Zeilen nachlesbar — und deterministisch, was fuer ein Fixture
 * die eigentliche Anforderung ist. `logo.svg` liegt dagegen als Textdatei unter
 * `notes/assets/`; SVG ist lesbar und braucht keinen Generator.
 *
 * Aufgerufen von `buildVault` (tools/obsidian-cdp/vault.ts) mit dem Vault-Verzeichnis
 * als erstem Argument.
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const vaultDir = process.argv[2];
if (!vaultDir) {
  console.error('make-assets.mjs: Vault-Verzeichnis als Argument erwartet.');
  process.exit(1);
}

/** CRC32 nach PNG-Spezifikation (Tabelle wird einmal aufgebaut). */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(typ, daten) {
  const laenge = Buffer.alloc(4);
  laenge.writeUInt32BE(daten.length, 0);
  const koerper = Buffer.concat([Buffer.from(typ, 'latin1'), daten]);
  const pruef = Buffer.alloc(4);
  pruef.writeUInt32BE(crc32(koerper), 0);
  return Buffer.concat([laenge, koerper, pruef]);
}

/** 64x64 RGB-PNG mit einem Farbverlauf — gross genug, dass eine fehlende
 *  Skalierung im PDF auffiele, klein genug fuer einen schnellen Lauf. */
function pngVerlauf(groesse = 64) {
  const roh = [];
  for (let y = 0; y < groesse; y++) {
    roh.push(0); // Filtertyp 0 je Zeile
    for (let x = 0; x < groesse; x++) {
      roh.push((x * 255 / groesse) | 0, (y * 255 / groesse) | 0, 128);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(groesse, 0);
  ihdr.writeUInt32BE(groesse, 4);
  ihdr[8] = 8;  // Bittiefe
  ihdr[9] = 2;  // Farbtyp RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from(roh))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const assets = join(vaultDir, 'assets');
mkdirSync(assets, { recursive: true });
const png = pngVerlauf();
writeFileSync(join(assets, 'probe.png'), png);
console.log(`assets/probe.png (${png.length} Bytes, 64x64 RGB)`);
