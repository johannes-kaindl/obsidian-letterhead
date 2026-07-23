// @vitest-environment happy-dom
//
// Regressionsgitter fuer die zwei Store-Review-Errors aus 1.4.0 (obsidianmd/no-forbidden-elements
// + no-unsanitized/property): doPrint hing frueher ein <style> in Obsidians document.head und
// schrieb den Brief per innerHTML in Obsidians document.body. Beides ist im Community-Store
// verboten. Der Brief lebt jetzt in einem eigenen iframe — dieselbe Kapselung, die das
// Preview-Modal laengst nutzt und die der Review-Bot nicht beanstandet hat.
//
// Diese Tests pruefen die KAPSELUNG, nicht das Drucken selbst: window.print() ist in happy-dom
// nicht sinnvoll ausloesbar, und die Druckausgabe bleibt Jays Geraete-Abnahme.
import { describe, it, expect, beforeEach } from 'vitest';
import '../setup/dom-shim'; // stellt createEl (Obsidian-Global) unter happy-dom bereit
import { doPrint, PRINT_FRAME_CLASS } from '../../src/obsidian/html-engine';

const LETTER = '<div class="bk-letter">Sehr geehrte Frau Muster</div>';

describe('doPrint — store compliance', () => {
  beforeEach(() => {
    document.head.textContent = '';
    document.body.textContent = '';
  });

  it('injects no <style> element into the app document', () => {
    doPrint(LETTER, '.bk-letter{ color:#f00 }');
    expect(document.querySelectorAll('style').length).toBe(0);
  });

  it('keeps the letter out of the app DOM and inside the iframe', () => {
    doPrint(LETTER, '');
    const frame = document.querySelector<HTMLIFrameElement>(`iframe.${PRINT_FRAME_CLASS}`);
    expect(frame).not.toBeNull();
    expect(frame?.srcdoc).toContain('Sehr geehrte Frau Muster');
    expect(document.body.textContent).not.toContain('Sehr geehrte Frau Muster');
  });

  it('carries the caller css into the iframe document', () => {
    doPrint(LETTER, '.bk-letter{ color:#f00 }');
    const frame = document.querySelector<HTMLIFrameElement>(`iframe.${PRINT_FRAME_CLASS}`);
    expect(frame?.srcdoc).toContain('color:#f00');
    expect(frame?.srcdoc).toContain('@page');
  });

  it('replaces a stale frame instead of stacking frames', () => {
    doPrint(LETTER, '');
    doPrint(LETTER, '');
    expect(document.querySelectorAll(`iframe.${PRINT_FRAME_CLASS}`).length).toBe(1);
  });

  /* The OS print dialog proposes the TOP-LEVEL window title as the filename —
     Obsidian's, e.g. "Beispielbrief - 10_Pallas - Obsidian 1.13.2". doPrint swaps
     it so the user is offered the letter's own name instead. The app title must
     never stay stuck: cleanup() restores it, and also runs from the safety net. */
  it('swaps the document title so the print dialog proposes the letter name', () => {
    document.title = 'Beispielbrief - 10_Pallas - Obsidian 1.13.2';
    doPrint(LETTER, '', '9.6.2026 Mustermann GmbH');
    expect(document.title).toBe('9.6.2026 Mustermann GmbH');
  });

  it('restores the app title once printing is done', () => {
    const original = 'Beispielbrief - 10_Pallas - Obsidian 1.13.2';
    document.title = original;
    const cancel = doPrint(LETTER, '', '9.6.2026 Mustermann GmbH');
    cancel();
    expect(document.title).toBe(original);
  });

  /* Regression: a second print must finish the first one properly. Otherwise it
     captures the FIRST run's filename as the title to restore, and the app title
     never finds its way back to Obsidian's own. */
  it('restores the ORIGINAL title after two prints in a row', () => {
    const original = 'Beispielbrief - 10_Pallas - Obsidian 1.13.2';
    document.title = original;
    doPrint(LETTER, '', 'Erster Brief');
    const cancel = doPrint(LETTER, '', 'Zweiter Brief');
    expect(document.title).toBe('Zweiter Brief');
    cancel();
    expect(document.title).toBe(original);
  });

  it('leaves the title alone when no filename is given', () => {
    const original = 'Beispielbrief - 10_Pallas - Obsidian 1.13.2';
    document.title = original;
    doPrint(LETTER, '');
    expect(document.title).toBe(original);
  });

  it('positions the frame via a css class, not inline styles', () => {
    doPrint(LETTER, '');
    const frame = document.querySelector<HTMLIFrameElement>(`iframe.${PRINT_FRAME_CLASS}`);
    expect(frame?.getAttribute('style')).toBeNull();
  });
});
