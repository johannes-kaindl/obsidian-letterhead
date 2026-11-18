// vendored from obsidian-kit@0.96.0, src/obsidian/inline-images.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
// Bilder eines gerenderten Dokuments als data:-URL einbetten, damit `printHtmlToPdf` sie im unsichtbaren `<webview>` findet.
//
// Warum es das gibt: das Druck-`<webview>` hat kein app://-Origin; ein Bild mit `app://…`-Quelle oder einem Vault-Pfad lädt dort nicht. Paperize (`export-desktop.ts`, `inlineImages` und `toDataUrl`) und Letterhead
// (`main.ts`, `inlineImages`) bauten dasselbe getrennt (Welle 32). Die zwei Fassungen, Punkt für Punkt, mit der Entscheidung:
//   1. **Fernquellen (https):** Paperize holt sie über `requestUrl` (Hauptprozess, kein CORS) und bettet sie ein; Letterhead lässt sie stehen („das Webview lädt https selbst“). Entscheidung: Paperize.
//      Grund: eine eingebettete Quelle hängt beim Druck nicht vom Netz ab; ob `printToPDF` auf ein nachladendes https-Bild wartet, ist ungemessen, die Annahme von Letterhead ist unbelegt (Drift ohne Grund).
//      Folge für Letterhead: https-Bilder gehen künftig mit (bis `timeoutMs` Wartezeit je Bild, ein Fehlschlag lässt das Bild stehen wie bisher).
//   2. **Frist:** Paperize begrenzt jedes Laden auf 15 s (`withTimeout`), Letterhead nicht (ein hängendes `fetch` hielte den Export an). Entscheidung: Paperize, Vorgabe 15 000 ms.
//   3. **MIME-Typ:** Paperize nahm den Header (nur `image/*`), sonst die Bytes (PNG, JPEG, GIF), sonst `application/octet-stream`; Letterhead nahm jeden Header ungeprüft, sonst die Endung, sonst `image/jpeg`.
//      Entscheidung: `imageMime` (pure/image-source): `image/*`-Header, dann Bytes (zusätzlich WebP und SVG), dann Endung, sonst `application/octet-stream`. Grund: ein Header wie `text/html` einer Fehlerseite
//      macht kein Bild; Bytes lügen nicht; ein geratenes `image/jpeg` ist falscher als ein ehrliches „unbekannt“. Folge für Letterhead: ein Bild unbekannten Typs ohne Endung bekommt `application/octet-stream`
//      statt `image/jpeg` (Chromium erkennt Rasterformate in `<img>` auch so).
//   4. **Was übersprungen wird:** beide lassen `data:` und leere Quellen stehen. Gleich.
//   5. **Fehler:** beide lassen das Bild bei einem Fehlschlag stehen (ein kaputtes Bild im PDF, kein gescheiterter Export) und loggen mit `console.warn`; hier meldet `onFail` und die Rückgabe zählt (`failed`),
//      das Plugin entscheidet über Meldung und Notice. Das Kit loggt nicht selbst.
//   6. **Reihenfolge:** beide holen nacheinander. Gleich, hier auch (ein hängendes Bild verzögert höchstens um seine Frist; parallel wäre ein anderes Verhalten ohne Messung).
// Die Plugins stellen sie auf diesen Baustein um (Folgearbeit, ein Re-Vendoring von `inline-images.ts`, `pure/image-source.ts` und `code-kit/data-url`); hier sind sie nicht angefasst.

import { requestUrl } from "obsidian";
import { realClock, type ClockPort } from "./clock";
import { withTimeout } from "../kit/timeout";
import { bytesToBase64 } from "../kit/data-url";
import { imageMime, imageSourceKind } from "../kit/image-source";

/** Antwort eines Ladevorgangs, auf das reduziert, was das Einbetten braucht. */
export interface ImageAnswer { ok: boolean; bytes: Uint8Array; contentType: string }

export interface InlineImagesPorts {
  /** Lokale Quellen (app:, blob:, Vault-Pfad): Vorgabe `activeWindow.fetch`. */
  fetchLocal(src: string): Promise<ImageAnswer>;
  /** Fernquellen (http, https): Vorgabe `requestUrl` (Hauptprozess). */
  fetchRemote(src: string): Promise<ImageAnswer>;
}

export interface InlineImagesOptions {
  /** Frist je Bild in Millisekunden; Vorgabe 15 000. Danach bleibt das Bild stehen. */
  timeoutMs?: number;
  /** Meldet ein Bild, das nicht eingebettet werden konnte (Fehler oder Frist, `error` ist dann `undefined`). */
  onFail?: (src: string, error?: unknown) => void;
  clock?: ClockPort;
  ports?: InlineImagesPorts;
}

export interface InlineImagesResult { inlined: number; failed: string[] }

export const INLINE_IMAGES_TIMEOUT_MS = 15000;

const defaultPorts: InlineImagesPorts = {
  async fetchLocal(src) {
    const res = await activeWindow.fetch(src);
    return { ok: res.ok, bytes: new Uint8Array(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? "" };
  },
  async fetchRemote(src) {
    const res = await requestUrl({ url: src, throw: false });
    return { ok: res.status >= 200 && res.status < 300, bytes: new Uint8Array(res.arrayBuffer), contentType: res.headers["content-type"] ?? "" };
  },
};

/** Ersetzt die `src` jedes `<img>` unter `root` durch eine data:-URL. Was nicht gelesen werden kann (Fehler, Status ohne 2xx, Frist), bleibt, wie es war, und steht in `failed`. Wirft nie. */
export async function inlineImages(root: HTMLElement, opts: InlineImagesOptions = {}): Promise<InlineImagesResult> {
  const ports = opts.ports ?? defaultPorts;
  const clock = opts.clock ?? realClock;
  const timeoutMs = opts.timeoutMs ?? INLINE_IMAGES_TIMEOUT_MS;
  const result: InlineImagesResult = { inlined: 0, failed: [] };
  const fail = (src: string, error?: unknown): void => { result.failed.push(src); opts.onFail?.(src, error); };
  for (const img of Array.from(root.querySelectorAll("img"))) {
    const src = img.getAttribute("src");
    if (!src) continue;
    const kind = imageSourceKind(src);
    if (kind === "direct" && /^data:/i.test(src)) continue;
    try {
      const got = await withTimeout(kind === "remote" ? ports.fetchRemote(src) : ports.fetchLocal(src), timeoutMs, clock);
      if (got.timedOut) { fail(src); continue; }
      if (!got.value.ok) { fail(src); continue; }
      const { bytes, contentType } = got.value;
      img.setAttribute("src", `data:${imageMime(contentType, bytes, src)};base64,${bytesToBase64(bytes)}`);
      result.inlined += 1;
    } catch (e) {
      fail(src, e);
    }
  }
  return result;
}
