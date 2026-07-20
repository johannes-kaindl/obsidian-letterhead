/* ------------------------------------------------------------------ *
 *  PDF output — write the generated vector PDF into the vault and hand
 *  it to the system (share / open). Adapted from the paperize `output.ts`,
 *  reduced to letterhead's single `'share'` flow.
 *
 *  Ported behavior from main.js.reference:1142-1170 (the write-to-hidden-
 *  dir + navigator.share / openWithDefaultApp path), minus the old
 *  return-false fallback signalling — the vector engine always yields a
 *  PDF now (Degradation model), so there is nothing to fall back to.
 *
 *  This file lives in src/obsidian/, so importing 'obsidian' is allowed
 *  (check:pure only restricts src/core and src/vendor).
 * ------------------------------------------------------------------ */

import { Notice, type App } from 'obsidian';
import { t } from '../i18n/strings';

/* Hidden scratch dir for the transient share export. Adapter API (not the
   Vault API): this is scratch space, not a tracked vault file. */
const EXPORT_DIR = '.letterhead-export';

/** Strips path separators and filesystem-illegal characters from a base
 *  filename, so a note title like "Re: A/B" becomes a safe "Re_ A_B". */
export function sanitizeBase(base: string): string {
  return (base || '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'Brief';
}

/** Where an exported letter goes (spec A2, modelled on paperize). */
export type OutputMode = 'nextToNote' | 'attachmentFolder' | 'customFolder' | 'share';

function joinPath(dir: string, file: string): string {
  const d = (dir || '').replace(/\/+$/, '');
  return d ? `${d}/${file}` : file;
}

/** Vault-relative path to write to, or null for the transient 'share' mode,
 *  which uses the hidden export dir as scratch space instead of a saved file. */
export function resolveOutputPath(
  mode: OutputMode,
  opts: { noteDir: string; baseName: string; customFolder: string; attachmentPath: string },
): string | null {
  const file = `${sanitizeBase(opts.baseName)}.pdf`;
  if (mode === 'share') return null;
  if (mode === 'nextToNote') return joinPath(opts.noteDir, file);
  if (mode === 'customFolder') return joinPath(opts.customFolder, file);
  /* attachmentFolder: a resolved vault path from getAvailablePathForAttachment.
     Obsidian has already handled collisions there — passing it through verbatim
     (and skipping uniquePath) avoids a second counter producing "Brief 1 (2).pdf". */
  return opts.attachmentPath;
}

/** After saving to the vault, mobile still needs the share sheet to get the PDF
 *  out of Obsidian; on desktop the file is simply there. 'share' mode shares by
 *  itself, so it must not be offered twice. */
export function shouldShareAfterSave(mode: OutputMode, isMobile: boolean): boolean {
  return isMobile && mode !== 'share';
}

/** Obsidian's " (2)", " (3)" … convention. Overwriting a letter PDF without a
 *  word would be data loss — paperize overwrites, letterhead deliberately does
 *  not. The cap keeps a lying `exists` from looping forever. */
export async function uniquePath(
  path: string,
  exists: (p: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(path))) return path;
  const dot = path.lastIndexOf('.');
  const stem = dot > path.lastIndexOf('/') ? path.slice(0, dot) : path;
  const ext = dot > path.lastIndexOf('/') ? path.slice(dot) : '';
  for (let n = 2; n <= 999; n++) {
    const candidate = `${stem} (${n})${ext}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${stem} (999)${ext}`;
}

/** Hands the PDF to the system: share sheet where available (the one-tap iOS
 *  path), otherwise open with the default app. `File`/`navigator.share` may be
 *  absent, hence the guards. */
async function shareBytes(bytes: Uint8Array, safe: string, app: App, path: string): Promise<void> {
  const fileObj = typeof File === 'function'
    ? new File([bytes as unknown as BlobPart], `${safe}.pdf`, { type: 'application/pdf' })
    : null;
  const nav = navigator as unknown as {
    canShare?: (d: { files: File[] }) => boolean;
    share?: (d: { files: File[] }) => Promise<void>;
  };
  if (fileObj && nav.canShare && nav.canShare({ files: [fileObj] }) && nav.share) {
    try {
      await nav.share({ files: [fileObj] });
      return;
    } catch (e) {
      if (e && (e as { name?: string }).name === 'AbortError') return; // user dismissed
    }
  }
  const openDefault = (app as unknown as { openWithDefaultApp?: (p: string) => Promise<void> }).openWithDefaultApp;
  if (typeof openDefault === 'function') await openDefault.call(app, path);
}

/** Writes `bytes` as a PDF and hands it to the user. For 'share' (mobile),
 *  the PDF goes into the hidden export dir and is offered via
 *  navigator.share, falling back to openWithDefaultApp. For 'save', it is
 *  written next to the note and opened with the default app. */
export async function writePdf(
  app: App,
  bytes: Uint8Array,
  mode: OutputMode,
  opts: { baseName: string; resolvedPath: string | null; isMobile?: boolean },
): Promise<void> {
  const safe = sanitizeBase(opts.baseName);
  const adapter = app.vault.adapter;
  try {
    if (opts.resolvedPath) {
      /* attachmentFolder paths come pre-deduplicated from Obsidian; everything
         else gets our own " (2)" pass rather than overwriting a letter. */
      const target = mode === 'attachmentFolder'
        ? opts.resolvedPath
        : await uniquePath(opts.resolvedPath, (p) => adapter.exists(p));
      const dir = target.slice(0, target.lastIndexOf('/'));
      if (dir && !(await adapter.exists(dir))) await adapter.mkdir(dir);
      await adapter.writeBinary(target, bytes.buffer as ArrayBuffer);
      new Notice(t('notice_saved') + target);
      // Mobile has no file manager to reveal it in — offer the share sheet.
      if (shouldShareAfterSave(mode, opts.isMobile === true)) await shareBytes(bytes, safe, app, target);
      return;
    }

    // 'share': reset the scratch dir, then write the single current export.
    const path = `${EXPORT_DIR}/${safe}.pdf`;
    if (await adapter.exists(EXPORT_DIR)) {
      const listing = await adapter.list(EXPORT_DIR);
      for (const f of listing.files) await adapter.remove(f);
    } else {
      await adapter.mkdir(EXPORT_DIR);
    }
    await adapter.writeBinary(path, bytes.buffer as ArrayBuffer);
    await shareBytes(bytes, safe, app, path);
  } catch (e) {
    console.error('Letterhead: PDF export failed', e);
    new Notice(t('notice_share_failed'));
  }
}
