// vendored from obsidian-kit@0.86.0, src/pure/image-source.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
// Pure Weichen fürs Einbetten von Bildern in ein Druckdokument: woher kommt die Quelle, und welcher MIME-Typ gehört zu den Bytes? Kein obsidian-Import.
//
// Herkunft: `obsidian-paperize/src/core/image-source.ts` (`imageSourceKind`, `mimeForBytes`) und die Typ-Wahl in `obsidian-letterhead/src/obsidian/main.ts` (`inlineImages`); zusammengeführt
// in Welle 33 (Auftrag F, Paket 8), Gegenüberstellung der beiden Fassungen im Kopf von `obsidian/inline-images.ts`.
import { mimeForExtension } from "./data-url";

export type ImageSourceKind = "remote" | "direct" | "vault";

/** `remote` = http(s), muss über `requestUrl` geholt werden (Canvas-Taint und CORS); `direct` = app:, data: oder blob:, direkt ladbar; `vault` = ein Pfad, den der Renderer aufgelöst hat. */
export function imageSourceKind(src: string): ImageSourceKind {
  if (/^https?:/i.test(src)) return "remote";
  if (/^(data:|app:|blob:)/i.test(src)) return "direct";
  return "vault";
}

const startsWith = (bytes: Uint8Array, ...head: number[]): boolean => head.every((b, i) => bytes[i] === b);

function sniff(bytes: Uint8Array): string | null {
  if (startsWith(bytes, 0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (startsWith(bytes, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(bytes, 0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (startsWith(bytes, 0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  const head = new TextDecoder().decode(bytes.subarray(0, 256)).replace(/^\uFEFF/, "").trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "image/svg+xml";
  return null;
}

/** MIME-Typ eines Bildes: ein `image/*`-Header zuerst (ein Header, der kein Bild nennt, etwa `text/html` einer Fehlerseite, zählt nicht), dann die Bytes (PNG, JPEG, GIF, WebP, SVG), dann die Endung der Quelle
 *  (Query und Anker abgeschnitten), sonst `application/octet-stream`. Die Bytes stehen vor der Endung: eine `.jpg`, die ein PNG ist, bleibt ein PNG. */
export function imageMime(header: string, bytes: Uint8Array, src: string): string {
  const h = (header || "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (h.startsWith("image/")) return h;
  const sniffed = sniff(bytes);
  if (sniffed !== null) return sniffed;
  const ext = (src.split(/[?#]/)[0] ?? "").split(".").pop() ?? "";
  return mimeForExtension(ext) ?? "application/octet-stream";
}
