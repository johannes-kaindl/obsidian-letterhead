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

/** Die echte Kette des Smoke-Fixtures: `Smoke-Waisen.md` hat keine Anrede (die Vorgabe `salutation` kommt nur über den Briefkopf-Dialog), also fehlt die Anredezeile. */
const MODELL_OHNE_ANREDE = { stil: 'sachlich', labels: {}, betreff: 'MARKWAISEBETREFF Waisenschutz' };

function seiten(fuellzeilen: number, schutzAus: boolean, opts: { ohneAnrede?: boolean; versatzMm?: number } = {}): { ueberschrift: number; bild: number } {
  ablauf.schutzAus = schutzAus;
  try {
    const settings = opts.versatzMm ? { ...DEFAULT_SETTINGS, printOffsetTopMm: opts.versatzMm } : DEFAULT_SETTINGS;
    const { ops } = layoutBody(opts.ohneAnrede ? MODELL_OHNE_ANREDE : MODELL, settings, koerper(fuellzeilen), 98.46);
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

/* Messung 2026-11-18 (GUI-Smoke, Zweitinstanz, Log in der echten Kette): Smoke-N1 ist rot, weil das obige Modell eine Anrede trägt, das Fixture aber nicht.
   Ohne Anredezeile (8,5 pt + Zeilenhöhe 14,5 pt = 23 pt) liegt die letzte der 18 Füllzeilen bei y = 157,98 pt statt 134,98 pt; die Überschrift (12,5 pt, Kopf 25,0 pt)
   und das Bild (48 pt + 6 pt) passen laut Vorausschau noch hin (136,48 − 79,0 = 57,48 pt ≥ 56,69 pt Unterkante), die Überschrift wird gesetzt, das Bild nicht mehr.
   Ursache im Kit (obsidian-kit pdf/layout.ts, `renderBlock` case heading): die Vorausschau `headH` zählt den Abstand `baseSize * 0.28` unter der Überschrift nicht mit, den
   `emitInlines` danach abzieht. Betroffen ist ein Fenster der Breite 0,28 × Grundschrift (2,8 pt) in der Lage des Seitenendes, deshalb trifft die Zeilenschritt-Reihe oben nie hinein. */
describe('Waisenschutz — echte Kette ohne Anrede (Fixture Smoke-Waisen.md)', () => {
  const quelle = readFileSync(join(__dirname, '../../fixtures/vault/notes/Smoke-Waisen.md'), 'utf8');
  const n = (quelle.match(/^Fuellzeile \d+ /gm) ?? []).length;

  it('Gegenprobe: ohne Schutz steht die Überschrift allein auf Seite 1, das Bild auf Seite 2', () => {
    const ohne = seiten(n, true, { ohneAnrede: true });
    expect(ohne).toEqual({ ueberschrift: 0, bild: 1 });
  });

  // Bekannter Kit-Fehler: mit Schutz bleibt die Überschrift trotzdem allein. `it.fails` wird rot, sobald das Kit die Lücke schließt; dann hier auf `it` umstellen
  // und Smoke-N1 prüfen (Task «Waisenschutz greift in der echten Kette nicht»).
  it.fails('mit Schutz stehen Überschrift und Bild auf derselben Seite', () => {
    const mit = seiten(n, false, { ohneAnrede: true });
    expect(mit.ueberschrift).toBe(mit.bild);
  });

  it('die verwaisten Lagen liegen in einem Fenster von höchstens 0,28 × Grundschrift (Ursache: Abstand unter der Überschrift fehlt in der Vorausschau)', () => {
    const versatze: number[] = [];
    for (let mm = -9; mm <= 9; mm += 0.02) {
      const r = seiten(n, false, { ohneAnrede: true, versatzMm: Math.round(mm * 100) / 100 });
      if (r.ueberschrift !== r.bild) versatze.push(mm);
    }
    // Wirkt das Fenster auf einen Bereich von 18 mm mit Zeilenschritt 21,5 pt (7,6 mm) 2,4-mal, liegen die Treffer in zwei, drei getrennten Gruppen: die Breite einer Gruppe zählt.
    const gruppen: number[][] = [];
    for (const v of versatze) {
      const g = gruppen[gruppen.length - 1];
      if (g && v - g[g.length - 1] < 0.1) g.push(v); else gruppen.push([v]);
    }
    // Gemessen: eine Gruppe von −0,70 bis +0,26 mm (2,7 pt, Raster 0,02 mm), der Versatz 0 liegt darin. Mit dem Kit-Fix gibt es keine Gruppe: dann diesen Test streichen.
    expect(gruppen).toHaveLength(1);
    const breitePt = ((gruppen[0][gruppen[0].length - 1] - gruppen[0][0]) * 72) / 25.4;
    expect(breitePt).toBeGreaterThan(10 * 0.28 - 0.3);
    expect(breitePt).toBeLessThanOrEqual(10 * 0.28);
  });
});
