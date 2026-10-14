// vendored from obsidian-kit@0.60.2, src/obsidian/share-export.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
import { Notice, type App } from "obsidian";
import { confirmAction } from "./confirm";

/** Eine erzeugte Datei (PDF, EPUB …) dem Nutzer übergeben: in einen versteckten Ordner im Vault schreiben und
 *  über das Teilen-Blatt des Systems anbieten, ersatzweise mit der Standard-App öffnen. Der „Teilen“-Weg der
 *  Exporter (mobil der Ein-Tipp-Weg, auf dem Desktop `openWithDefaultApp`).
 *
 *  Herkunft: epub-exporter `src/obsidian/output.ts:28-52`, obsidian-paperize `src/obsidian/output.ts:71-86`,
 *  obsidian-letterhead `src/obsidian/output.ts:21, 76-94, 127-133` — dieselbe Schrittfolge in drei Fassungen.
 *
 *  Unterschiede der Vorlagen und was daraus wurde:
 *  - **Ordner leeren.** Alle drei löschten ungefragt jede Datei im Ordner (`adapter.list(dir).files`). Hier werden die
 *    EIGENEN Reste ohne Rückfrage gelöscht, alles andere nur nach Rückfrage (siehe `clearExportDir`).
 *  - **Notice.** epub-exporter zeigte „bereit zum Teilen“, paperize nichts, letterhead nur bei einem Fehler. Ein Grund steht
 *    nirgends; gewählt: Fehler immer (der Nutzer sonst vor einem stummen Nichts), `stored` (nichts hat sich geöffnet,
 *    die Datei liegt im versteckten Ordner), und die Erfolgsmeldung nur, wenn `strings.done` gesetzt ist — das Teilen-Blatt
 *    und die geöffnete App sind schon Rückmeldung genug, epub-exporter behält seine Meldung über `done`.
 *  - **Fehler.** letterhead fing alles und zeigte eine Notice, die beiden anderen ließen den Fehler zum Aufrufer durch. Gewählt:
 *    nie werfen, `outcome: "failed"` plus Notice; der Aufrufer sieht den Fehler in `error` und muss ihn nicht noch einmal melden.
 *  - **AbortError.** epub prüfte `instanceof Error`, letterhead nur `.name`: gewählt `.name` (ein `DOMException` ist nicht überall
 *    ein `Error`).
 *  - **Ordnername, Dateiname.** Je Plugin ein eigener Ordner (`.epub-export` …) — Parameter. Die Bereinigung des Namens bleibt beim
 *    Aufrufer (fachlich: Fallbackname „Brief“ vs. Titel der Notiz); der Helfer prüft nur, dass er EIN Pfadsegment ist.
 *  - **Parallele Aufrufe.** Je Ordner laufen Exporte nacheinander (`runExclusive`): ein Doppelklick ließ in allen drei Vorlagen zwei Läufe
 *    sich gegenseitig die Datei löschen, und die Rückfrage verlängert das Fenster.
 *  - **Puffer.** Die Vorlagen schrieben `bytes.buffer`, also den ganzen Puffer hinter der Sicht (falsch bei einem `subarray`); hier
 *    nur die Bytes der Sicht (eine Kopie, nur wenn die Sicht nicht den ganzen Puffer deckt).
 *  - **Wächter werfen.** `dir` und `fileName` sind Programmierfehler, wenn sie nicht passen: das ist die eine Ausnahme von „wirft nie“.
 *  - **Teilen nach dem Speichern.** letterhead bot mobil auch eine bereits gespeicherte Datei zum Teilen an: `shareFile`. */

export interface ShareExportStrings {
  /** Fehlermeldung bei einem Fehler beim Schreiben oder Teilen. */
  failed: string;
  /** Nichts hat sich geöffnet (kein Teilen-Blatt, keine Standard-App): `{0}` = Pfad im Vault. */
  stored: (path: string) => string;
  /** Optionale Erfolgsmeldung nach Teilen oder Öffnen; ohne sie bleibt es still. */
  done?: string;
  /** Rückfrage, wenn der Ordner fremde Dateien enthält. */
  confirm: { title: string; message: (dir: string, names: string[]) => string; clear: string; keep: string };
}

export const SHARE_EXPORT_STRINGS_EN: ShareExportStrings = {
  failed: "The export could not be shared.",
  stored: (path) => `Exported to ${path}.`,
  confirm: {
    title: "Clear export folder?",
    message: (dir, names) => `The export folder ${dir} contains files this plugin did not create: ${names.join(", ")}. Delete them too?`,
    clear: "Delete them",
    keep: "Keep them",
  },
};

export const SHARE_EXPORT_STRINGS_DE: ShareExportStrings = {
  failed: "Der Export konnte nicht geteilt werden.",
  stored: (path) => `Exportiert nach ${path}.`,
  confirm: {
    title: "Export-Ordner leeren?",
    message: (dir, names) => `Der Export-Ordner ${dir} enthält Dateien, die dieses Plugin nicht angelegt hat: ${names.join(", ")}. Auch löschen?`,
    clear: "Löschen",
    keep: "Behalten",
  },
};

export interface ShareExportOptions {
  /** Versteckter Ordner direkt im Vault, z. B. `.epub-export`. */
  dir: string;
  /** Fertiger Dateiname mit Endung, bereits bereinigt (ein Pfadsegment). */
  fileName: string;
  mime: string;
  strings?: ShareExportStrings;
}

/** `shared`: das Teilen-Blatt hat die Datei angenommen · `dismissed`: der Nutzer hat es geschlossen · `opened`: die
 *  Standard-App wurde gerufen · `stored`: nichts davon ging, die Datei liegt im Ordner · `failed`: Schreiben oder Teilen warf. */
export type ShareOutcome = "shared" | "dismissed" | "opened" | "stored" | "failed";
export interface ShareExportResult { outcome: ShareOutcome; path: string | null; error?: unknown }

interface ShareCapableNavigator {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { files: File[] }) => Promise<void>;
}
interface ExportAdapter {
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  list(path: string): Promise<{ files: string[]; folders: string[] }>;
  remove(path: string): Promise<void>;
  rmdir(path: string, recursive: boolean): Promise<void>;
  writeBinary(path: string, data: ArrayBuffer): Promise<void>;
}
interface AppWithDefaultApp { openWithDefaultApp?: (path: string) => Promise<void> }

/** Feste Ordner, auf die `clearExportDir` nie zeigen darf. Verglichen wird kleingeschrieben (APFS und NTFS unterscheiden die Schreibweise
 *  nicht). **Der Konfigurationsordner steht nicht hier, sondern kommt aus `app.vault.configDir`:** er heißt nicht zwingend `.obsidian`, und ein
 *  Literal dafür löst im Lint jedes Konsumenten und im Store-Scanner `obsidianmd/hardcoded-config-path` aus (0.60.1 trug es hier). */
const PROTECTED_DIRS = new Set([".trash", ".git", ".github"]);

/** Der Helfer LÖSCHT im Ordner. Deshalb nur ein verstecktes Verzeichnis direkt im Vault-Stamm, dessen Name auf `-export` endet
 *  (alle drei bisherigen tun es: `.epub-export`, `.paperize-export`, `.letterhead-export`): so kann ein Tippfehler im Aufrufer
 *  (`""`, `"/"`, `"notes"`) oder ein fremder Dot-Ordner (`.smart-env`, `.claude`) keine Nutzerdaten treffen. */
function assertExportDir(dir: string, configDir: string | undefined): void {
  const lower = dir.toLowerCase();
  if (!/^\.[A-Za-z0-9][A-Za-z0-9._-]*-export$/.test(dir) || dir.includes("..") || PROTECTED_DIRS.has(lower)
    || (configDir !== undefined && configDir !== "" && lower === configDir.toLowerCase())) {
    throw new Error(`share-export: ungültiger Export-Ordner „${dir}“ (erwartet: ein verstecktes Verzeichnis im Vault-Stamm, Name endet auf -export)`);
  }
}

function assertFileName(name: string): void {
  if (name === "" || name === "." || name === ".." || /[\\/\0]/.test(name) || extOf(name) === "") {
    throw new Error(`share-export: ungültiger Dateiname „${name}“ (erwartet: ein Pfadsegment mit Endung)`);
  }
}

/** Dateien, die das Betriebssystem in einen Ordner legt, sobald jemand ihn ansieht. Sie sind weder Export noch Nutzerdaten: still löschen, nie fragen. */
const SYSTEM_JUNK = new Set([".ds_store", "thumbs.db", "desktop.ini"]);

const extOf = (name: string): string => { const i = name.lastIndexOf("."); return i > 0 ? name.slice(i).toLowerCase() : ""; };
const baseOf = (path: string): string => path.slice(path.lastIndexOf("/") + 1);

/** Leert den Export-Ordner. **Eigen** ist eine Datei mit der Endung des Exports (`.pdf`, `.epub`): der Helfer legt dort
 *  nur solche an, und die Reste früherer Fassungen der Plugins tragen sie ebenfalls (eine Markierungsdatei hielte sie für
 *  fremd und fragte beim ersten Lauf nach jedem Update). **Fremd** ist alles andere, auch ein Unterordner. Fremdes wird
 *  nur nach Rückfrage gelöscht; sagt der Nutzer nein, bleibt es liegen und der Export läuft trotzdem weiter. Schwäche, die
 *  bleibt: eine vom Nutzer selbst in den versteckten Ordner gelegte Datei derselben Endung gilt als eigen. */
async function clearExportDir(app: App, adapter: ExportAdapter, dir: string, ext: string, strings: ShareExportStrings): Promise<void> {
  if (!(await adapter.exists(dir))) { await adapter.mkdir(dir); return; }
  const listing = await adapter.list(dir);
  const isOwn = (f: string): boolean => extOf(f) === ext || SYSTEM_JUNK.has(baseOf(f).toLowerCase());
  const own = listing.files.filter(isOwn);
  const foreign = [...listing.files.filter((f) => !isOwn(f)), ...listing.folders];
  for (const f of own) await adapter.remove(f);
  if (foreign.length === 0) return;
  const names = foreign.map(baseOf);
  const clear = await confirmAction(app, {
    title: strings.confirm.title,
    message: strings.confirm.message(dir, names),
    confirmLabel: strings.confirm.clear,
    cancelLabel: strings.confirm.keep,
  });
  if (!clear) return;
  for (const f of listing.files.filter((x) => !isOwn(x))) await adapter.remove(f);
  for (const d of listing.folders) await adapter.rmdir(d, true);
}

/** Bietet die Datei am Pfad dem System an: Teilen-Blatt, sonst Standard-App. Wirft nicht (außer die App-Funktion). Auch
 *  allein nutzbar, etwa für eine bereits gespeicherte Datei (letterhead mobil). */
export async function shareFile(app: App, bytes: Uint8Array, fileName: string, mime: string, path: string): Promise<"shared" | "dismissed" | "opened" | "stored"> {
  const file = typeof File === "function" ? new File([bytes as unknown as BlobPart], fileName, { type: mime }) : null;
  const nav = (typeof navigator === "undefined" ? {} : navigator) as ShareCapableNavigator;
  if (file && nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file] });
      return "shared";
    } catch (e) {
      if ((e as { name?: string } | null)?.name === "AbortError") return "dismissed";   // der Nutzer hat das Blatt geschlossen
    }
  }
  const open = (app as unknown as AppWithDefaultApp).openWithDefaultApp;
  if (typeof open === "function") {
    await open.call(app, path);
    return "opened";
  }
  return "stored";
}

const running = new Map<string, Promise<unknown>>();

/** Hintereinander je Schlüssel: der nächste Lauf startet, wenn der vorige fertig ist, auch wenn er fehlschlug. */
function runExclusive<T>(key: string, job: () => Promise<T>): Promise<T> {
  const prev = running.get(key) ?? Promise.resolve();
  const next = prev.then(job, job);
  const tail = next.catch(() => undefined);
  running.set(key, tail);
  void tail.then(() => { if (running.get(key) === tail) running.delete(key); });
  return next;
}

/** Schreibt `bytes` in `<dir>/<fileName>` (vorher den Ordner leeren, siehe `clearExportDir`) und übergibt sie dem System. */
export async function shareExport(app: App, bytes: Uint8Array, opts: ShareExportOptions): Promise<ShareExportResult> {
  assertExportDir(opts.dir, (app.vault as { configDir?: string }).configDir);
  assertFileName(opts.fileName);
  const strings = opts.strings ?? SHARE_EXPORT_STRINGS_EN;
  const adapter = app.vault.adapter as unknown as ExportAdapter;
  const path = `${opts.dir}/${opts.fileName}`;
  return runExclusive(opts.dir, () => exportLocked(app, adapter, bytes, opts, strings, path));
}

async function exportLocked(app: App, adapter: ExportAdapter, bytes: Uint8Array, opts: ShareExportOptions, strings: ShareExportStrings, path: string): Promise<ShareExportResult> {
  try {
    await clearExportDir(app, adapter, opts.dir, extOf(opts.fileName), strings);
    const whole = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength;
    await adapter.writeBinary(path, (whole ? bytes.buffer : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)) as ArrayBuffer);
    const outcome = await shareFile(app, bytes, opts.fileName, opts.mime, path);
    if (outcome === "stored") new Notice(strings.stored(path));
    else if (outcome !== "dismissed" && strings.done) new Notice(strings.done);
    return { outcome, path };
  } catch (error) {
    new Notice(strings.failed);
    return { outcome: "failed", path: null, error };
  }
}
