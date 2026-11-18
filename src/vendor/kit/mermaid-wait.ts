// vendored from obsidian-kit@0.96.0, src/pure/mermaid-wait.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
// mermaid-wait.ts — wartet, bis Obsidian die Mermaid-Diagramme eines Hosts gezeichnet hat. Kein `obsidian`-Import.
//
// Warum hier und nicht in code-kit (erste Frage aus AGENTS.md / CONTRIBUTING § 2): der Vertrag trägt eine Annahme über die gerenderte Form von Obsidian: ein gezeichnetes Diagramm ist ein `svg` in einem
// `.mermaid`-Element (gemessen 2026-11-12 in Obsidian 1.15.1, `pilot/mermaid-dom.ts`; dieselbe Annahme trägt `pdf/dom-to-ir`). Der Host ist nur strukturell typisiert (`querySelectorAll`), damit das Modul in `src/pure/`
// Node-testbar bleibt. Die Zahl der erwarteten Diagramme liefert der Aufrufer (code-kit `countFences(md, "mermaid")`).
//
// Herkunft: obsidian-paperize `src/obsidian/export-desktop.ts` (`waitForMermaid`, privat; Fest 10 s und 100 ms), derselbe Wunsch von obsidian-letterhead. Unterschied, mit Grund: die Fassung
// dort gibt nichts zurück; wer wissen will, ob die Frist ablief (Hinweis an den Nutzer, Diagramm fehlt im PDF), braucht `{ drawn, timedOut }`. Zeit und Pause sind einspielbar (Test ohne echte Uhr).

/** Das Wenige, das `waitForMermaid` vom Host braucht: ein `HTMLElement` erfüllt es. */
export interface MermaidHost { querySelectorAll(selector: string): { length: number } }

export interface WaitForMermaidOptions {
  /** Frist in Millisekunden, Standard 10 000. Eine ungültige Angabe (negativ, keine Zahl) gilt als Standard. */
  timeoutMs?: number;
  /** Abstand der Abfragen in Millisekunden, Standard 100. Eine ungültige Angabe (null, negativ, keine Zahl) gilt als Standard (sonst eine Endlosschleife). */
  pollMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export interface MermaidWaitResult {
  /** Wie viele gezeichnete Diagramme (`.mermaid svg`) beim letzten Zählen da waren. */
  drawn: number;
  /** `true`, wenn die Frist ablief, bevor `expected` Diagramme da waren. Was dann fehlt, bleibt so. */
  timedOut: boolean;
}

export const MERMAID_WAIT_TIMEOUT_MS = 10_000;
export const MERMAID_WAIT_POLL_MS = 100;

const defaultSleep = (ms: number): Promise<void> => new Promise<void>((resolve) => { window.setTimeout(resolve, ms); });

function count(host: MermaidHost): number {
  try {
    const n = host.querySelectorAll(".mermaid svg").length;
    return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;   // eine Abfrage, die scheitert, zählt als „noch nichts da“; die Frist begrenzt das Warten
  }
}

/** Wartet, bis `host` mindestens `expected` gezeichnete Mermaid-Diagramme (`.mermaid svg`) trägt, höchstens `timeoutMs`. Wirft nie: eine fehlschlagende Abfrage zählt als 0, eine fehlschlagende Pause beendet das Warten
 *  mit `timedOut: true`. `expected <= 0` (oder keine Zahl) kehrt sofort zurück, ohne Pause (die Schleife läuft dann nie: `drawn < expected` ist falsch). Nach der letzten Pause wird noch einmal gezählt: ein Diagramm, das genau in der letzten Pause fertig wird, zählt. */
export async function waitForMermaid(host: MermaidHost, expected: number, opts: WaitForMermaidOptions = {}): Promise<MermaidWaitResult> {
  const timeoutMs = typeof opts.timeoutMs === "number" && Number.isFinite(opts.timeoutMs) && opts.timeoutMs >= 0 ? opts.timeoutMs : MERMAID_WAIT_TIMEOUT_MS;
  const pollMs = typeof opts.pollMs === "number" && Number.isFinite(opts.pollMs) && opts.pollMs > 0 ? opts.pollMs : MERMAID_WAIT_POLL_MS;
  const sleep = opts.sleep ?? defaultSleep;
  const now = opts.now ?? Date.now;
  let drawn = count(host);
  const deadline = now() + timeoutMs;
  while (drawn < expected) {
    if (now() >= deadline) return { drawn, timedOut: true };
    try { await sleep(pollMs); } catch { return { drawn, timedOut: true }; }
    drawn = count(host);
  }
  return { drawn, timedOut: false };
}
