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

/** Vault-relative path a persistent 'save' mode would write to (next to the
 *  source note). Returns null for the transient 'share' mode, which uses the
 *  hidden export dir as scratch space rather than a saved output file. */
export function resolveOutputPath(
  mode: string,
  opts: { baseName: string; sourceDir?: string },
): string | null {
  const safe = sanitizeBase(opts.baseName);
  if (mode === 'save') {
    const dir = (opts.sourceDir || '').replace(/\/+$/, '');
    return dir ? `${dir}/${safe}.pdf` : `${safe}.pdf`;
  }
  // 'share' (and any unknown mode) → transient hidden-dir export, no path.
  return null;
}

/** Writes `bytes` as a PDF and hands it to the user. For 'share' (mobile),
 *  the PDF goes into the hidden export dir and is offered via
 *  navigator.share, falling back to openWithDefaultApp. For 'save', it is
 *  written next to the note and opened with the default app. */
export async function writePdf(
  app: App,
  bytes: Uint8Array,
  mode: string,
  opts: { baseName: string; sourceDir?: string },
): Promise<void> {
  const safe = sanitizeBase(opts.baseName);
  const savePath = resolveOutputPath(mode, opts);
  const adapter = app.vault.adapter;
  const openDefault = (app as unknown as { openWithDefaultApp?: (p: string) => Promise<void> }).openWithDefaultApp;
  try {
    if (savePath) {
      await adapter.writeBinary(savePath, bytes.buffer as ArrayBuffer);
      if (typeof openDefault === 'function') await openDefault.call(app, savePath);
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

    // Mobile: one-tap share sheet. `File`/`navigator.share` may be absent.
    const fileObj = typeof File === 'function'
      ? new File([bytes as unknown as BlobPart], `${safe}.pdf`, { type: 'application/pdf' })
      : null;
    const nav = navigator as unknown as {
      canShare?: (d: { files: File[] }) => boolean;
      share?: (d: { files: File[] }) => Promise<void>;
    };
    if (fileObj && nav.canShare && nav.canShare({ files: [fileObj] })) {
      try {
        await nav.share!({ files: [fileObj] });
        return;
      } catch (e) {
        if (e && (e as { name?: string }).name === 'AbortError') return; // user dismissed
      }
    }
    if (typeof openDefault === 'function') {
      await openDefault.call(app, path);
      return;
    }
  } catch (e) {
    console.error('Letterhead: PDF export failed', e);
    new Notice(t('notice_share_failed'));
  }
}
