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

  it('positions the frame via a css class, not inline styles', () => {
    doPrint(LETTER, '');
    const frame = document.querySelector<HTMLIFrameElement>(`iframe.${PRINT_FRAME_CLASS}`);
    expect(frame?.getAttribute('style')).toBeNull();
  });
});
