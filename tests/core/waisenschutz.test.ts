import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Block } from '../../src/vendor/kit/pdf';

/* Waisenschutz: eine Überschrift darf nicht allein am Seitenende vor einem Bild stehen, das auf die
   nächste Seite rutscht (Kit-Option `headingKeepWithLines`, Vorausschau über die volle Bildhöhe).
   Der Schalter `ablauf.schutzAus` setzt die Option auf 0 und ist die Gegenprobe: ohne sie wäre der
   Test grün über einen Aufbau, der den Fall gar nicht herstellt (CORE-TEST-08). */
const ablauf = vi.hoisted(() => ({ schutzAus: false }));
vi.mock('../../src/vendor/kit/pdf', async (orig) => {
  const mod = await orig<typeof import('../../src/vendor/kit/pdf')>();
  return {
    ...mod,
    layoutDocument: (doc: Block[], opts: import('../../src/vendor/kit/pdf').LayoutOptions) =>
      mod.layoutDocument(
        doc,
        ablauf.schutzAus ? { ...opts, pagination: { ...opts.pagination, headingKeepWithLines: 0 } } : opts
      ),
  };
});

import { layoutBody } from '../../src/core/body-ir';
import { DEFAULT_SETTINGS } from '../../src/core/model';

const MODELL = { stil: 'sachlich', labels: {}, betreff: 'Waisenschutz', anrede: 'Sehr geehrte Damen und Herren,' };

function koerper(fuellzeilen: number): Block[] {
  const body: Block[] = [];
  for (let i = 1; i <= fuellzeilen; i++) body.push({ type: 'paragraph', inlines: [{ text: `Fuellzeile ${i}` }] });
  body.push({ type: 'heading', level: 2, inlines: [{ text: 'Ueberschrift direkt vor dem Bild' }] });
  // Das Bild des Smoke-Fixtures: 64×64 px (assets/probe.png).
  body.push({ type: 'image', data: new Uint8Array(4), wPx: 64, hPx: 64 });
  return body;
}

function seiten(fuellzeilen: number, schutzAus: boolean): { ueberschrift: number; bild: number } {
  ablauf.schutzAus = schutzAus;
  try {
    const { ops } = layoutBody(MODELL, DEFAULT_SETTINGS, koerper(fuellzeilen), 98.46);
    const kopf = ops.find((o) => o.kind === 'text' && o.str.startsWith('Ueberschrift'));
    const bild = ops.find((o) => o.kind === 'image');
    if (!kopf || !bild) throw new Error('Überschrift oder Bild fehlt im Layout');
    return { ueberschrift: kopf.page, bild: bild.page };
  } finally {
    ablauf.schutzAus = false;
  }
}

describe('Waisenschutz — Überschrift vor einem Bild am Seitenende', () => {
  it('es gibt Füllzeilen-Zahlen, bei denen der Schutz die Überschrift mit dem Bild nach vorn holt', () => {
    const treffer = [];
    for (let n = 1; n <= 60; n++) {
      const ohne = seiten(n, true);
      if (ohne.ueberschrift !== ohne.bild) treffer.push(n);
    }
    expect(treffer.length).toBeGreaterThan(0);
  });

  it('mit Schutz stehen Überschrift und Bild immer auf derselben Seite', () => {
    for (let n = 1; n <= 60; n++) {
      const mit = seiten(n, false);
      expect(mit.ueberschrift, `${n} Füllzeilen`).toBe(mit.bild);
    }
  });

  it('das Fixture Smoke-Waisen.md stellt den Fall her: ohne Schutz allein am Seitenende, mit Schutz beim Bild', () => {
    const quelle = readFileSync(join(__dirname, '../../fixtures/vault/notes/Smoke-Waisen.md'), 'utf8');
    const n = (quelle.match(/^Fuellzeile \d+ /gm) ?? []).length;
    expect(n).toBeGreaterThan(0);
    const ohne = seiten(n, true);
    const mit = seiten(n, false);
    expect(ohne.ueberschrift).not.toBe(ohne.bild); // Gegenprobe: ohne Schutz ist der Fall da
    expect(mit.ueberschrift).toBe(mit.bild);
    // Spielraum: ±1 Zeile Abweichung zwischen Obsidian-DOM und diesem Aufbau darf den Fall nicht verlieren.
    expect(seiten(n - 1, true).ueberschrift).not.toBe(seiten(n - 1, true).bild);
    expect(seiten(n + 1, true).ueberschrift).not.toBe(seiten(n + 1, true).bild);
  });
});
