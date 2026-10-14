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
import { t, detectUiLang } from '../i18n/strings';
import { joinVaultPath, vaultDirname } from '../vendor/kit/vault-path';
import {
  shareExport, shareFile, SHARE_EXPORT_STRINGS_DE, SHARE_EXPORT_STRINGS_EN, type ShareExportStrings,
} from '../vendor/kit-obsidian/share-export';

/* Hidden scratch dir for the transient share export. Adapter API (not the
   Vault API): this is scratch space, not a tracked vault file. */
const EXPORT_DIR = '.letterhead-export';
const PDF_MIME = 'application/pdf';

/** Kit strings per UI language, with letterhead's own failure notice. */
function shareStrings(): ShareExportStrings {
  const kit = detectUiLang() === 'de' ? SHARE_EXPORT_STRINGS_DE : SHARE_EXPORT_STRINGS_EN;
  return { ...kit, failed: t('notice_share_failed') };
}

/** Strips path separators and filesystem-illegal characters from a base
 *  filename, so a note title like "Re: A/B" becomes a safe "Re_ A_B". */
export function sanitizeBase(base: string): string {
  return (base || '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'Brief';
}

/** Where an exported letter goes (spec A2, modelled on paperize). */
export type OutputMode = 'nextToNote' | 'attachmentFolder' | 'customFolder' | 'share';

/** Vault-relative path to write to, or null for the transient 'share' mode,
 *  which uses the hidden export dir as scratch space instead of a saved file. */
export function resolveOutputPath(
  mode: OutputMode,
  opts: { noteDir: string; baseName: string; customFolder: string; attachmentPath: string },
): string | null {
  const file = `${sanitizeBase(opts.baseName)}.pdf`;
  if (mode === 'share') return null;
  if (mode === 'nextToNote') return joinVaultPath(opts.noteDir, file);
  if (mode === 'customFolder') return joinVaultPath(opts.customFolder, file);
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
      /* Vault root ('' — no '/' in the target) is a valid answer here; the
         phantom-folder case is documented in the kit module. */
      const dir = vaultDirname(target);
      if (dir && !(await adapter.exists(dir))) await adapter.mkdir(dir);
      await adapter.writeBinary(target, bytes.buffer as ArrayBuffer);
      new Notice(t('notice_saved') + target);
      // Mobile has no file manager to reveal it in — offer the share sheet.
      if (shouldShareAfterSave(mode, opts.isMobile === true)) await shareFile(app, bytes, `${safe}.pdf`, PDF_MIME, target);
      return;
    }

    // 'share': the kit helper owns the scratch dir (clears its own leftovers, asks before touching anything else).
    await shareExport(app, bytes, { dir: EXPORT_DIR, fileName: `${safe}.pdf`, mime: PDF_MIME, strings: shareStrings() });
  } catch (e) {
    console.error('Letterhead: PDF export failed', e);
    new Notice(t('notice_share_failed'));
  }
}
