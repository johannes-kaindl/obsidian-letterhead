/**
 * Aufnahme-Treiber fuer die README-Bilder — faehrt den Vertrag aus `docs/images/README.md`
 * gegen ein **laufendes** Obsidian (Zweitinstanz mit eigenem Profil und Port).
 *
 * Bruecke, Aufnahme-Primitive und Fixture→Vault liegen zentral im Dach
 * (`obsidian-plugins/tools/obsidian-cdp/`); dieser Treiber importiert sie von dort.
 * Vorlage fuer die Form: `3d-codeblocks/scripts/shots.ts`.
 *
 * ```bash
 * npm run build && npm run shots -- --setup          # Vault aus docs/images/fixture/ bauen
 * # Zweitinstanz auf eigenem Profil und Port starten (Dach-AGENTS § Staging-Vaults), dann:
 * npm run shots -- --port 9402                       # alles aufnehmen
 * npm run shots -- --port 9402 --only hero.png       # ein Bild nachziehen
 * npm run shots -- --list                            # Vertrag anzeigen
 * ```
 *
 * Jeder Shot stellt seine Voraussetzungen selbst her (Notiz, Plugin-Einstellungen,
 * Fenstergroesse); gelaufen wird ein Bild pro frischem Obsidian-Start.
 */

import { cwd, argv, exit } from 'node:process';
import { join } from 'node:path';

import {
  attachTo,
  Cdp,
  closeExtraLeaves,
  openExisting,
  pollUntil,
  setAppConfig,
} from '../../tools/obsidian-cdp/cdp.js';
import { boxOf, capture, setWindowSize, writeShot, type Rect } from '../../tools/obsidian-cdp/shot.js';
import { buildVault, stagingVaultDir } from '../../tools/obsidian-cdp/vault.js';

const PLUGIN_ID = 'letterhead';
const REPO_NAME = 'obsidian-letterhead';
const REPO_ROOT = cwd();
const OUT_DIR = join(REPO_ROOT, 'docs/images');
const FIXTURE_DIR = join(OUT_DIR, 'fixture');
const CAPTURE_WIDTH = 1200;
const THUMB_WIDTH = 380;
const NOTE = 'Quotation.md';
const WINDOW = { w: 1440, h: 900 };

/** Ein Shot liefert den Ausschnitt — und, wenn das Motiv in einem anderen Fenster liegt
 *  (die Einstellungen sind in der Zweitinstanz ein eigenes Pop-out), dessen Verbindung. */
interface Aufnahme {
  clip: Rect;
  cdp?: Cdp;
}

interface Shot {
  name: string;
  klasse: 'hero' | 'feature' | 'detail';
  run(cdp: Cdp, port: number): Promise<Aufnahme | null>;
}

/** Demo-Absender und Briefsprache — generisch, englisch. */
const EINSTELLUNGEN = {
  theme: 'din5008',
  stil: 'sachlich',
  infozeile: 'vollstaendig',
  briefSprache: 'en',
  locale: 'en-GB',
  sender: {
    name: 'Acme Consulting',
    zusatz: 'Business advisory',
    strasse: '1 Example Road',
    plzOrt: 'EC1A 1AA London',
    telefon: '+1 555 0100',
    email: 'hello@example.com',
    web: 'example.com',
  },
};

async function vorbereiten(cdp: Cdp): Promise<void> {
  await cdp.send('Page.bringToFront');
  await setWindowSize(cdp, WINDOW.w, WINDOW.h);
  await setAppConfig(cdp, 'readableLineLength', true);
  await cdp.evaluate(`
    const p = app.plugins.plugins[${JSON.stringify(PLUGIN_ID)}];
    Object.assign(p.settings, ${JSON.stringify(EINSTELLUNGEN)});
    await p.saveSettings();
    return true;
  `);
  if (!(await openExisting(cdp, NOTE, 'preview'))) throw new Error(`${NOTE} liess sich nicht oeffnen`);
  await closeExtraLeaves(cdp);
}

async function vorschauOeffnen(cdp: Cdp): Promise<void> {
  await cdp.evaluate(`
    app.commands.executeCommandById(${JSON.stringify(`${PLUGIN_ID}:open-preview`)});
    return true;
  `);
  const da = await pollUntil<boolean>(cdp, `
    const m = document.querySelector('.briefkopf-preview-modal');
    if (!m) return null;
    const f = m.querySelector('iframe');
    const sheet = f && f.contentDocument && f.contentDocument.querySelector('.bk-sheet, .bk-letter');
    return sheet ? true : null;
  `, 15_000, 300);
  if (!da) throw new Error('Vorschau-Modal rendert nicht');
  await new Promise((r) => setTimeout(r, 800));
}

const SHOTS: Shot[] = [
  {
    name: 'hero.png',
    klasse: 'hero',
    async run(cdp) {
      await vorbereiten(cdp);
      await vorschauOeffnen(cdp);
      return { clip: { x: 0, y: 0, width: WINDOW.w, height: WINDOW.h } };
    },
  },
  {
    name: 'settings.png',
    klasse: 'feature',
    async run(cdp, port) {
      await vorbereiten(cdp);
      await cdp.evaluate(`
        app.setting.open();
        app.setting.openTabById(${JSON.stringify(PLUGIN_ID)});
        return true;
      `);
      await new Promise((r) => setTimeout(r, 1500));
      const fenster = await attachTo('settings', port, REPO_NAME);
      if (!fenster) return null;
      const da = await pollUntil<boolean>(fenster, `
        return document.querySelector('.vertical-tab-content .setting-item') ? true : null;
      `, 10_000, 300);
      if (!da) return null;
      // openTabById laesst Zeichen in der Suchleiste zurueck — sie stuenden im Bild.
      await fenster.evaluate(`
        const i = document.querySelector('.search-input-container input');
        if (i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }
        return true;
      `);
      await new Promise((r) => setTimeout(r, 800));
      const box = await boxOf(fenster, '.modal.mod-settings, .modal-container', 0);
      return box ? { clip: box, cdp: fenster } : null;
    },
  },
  {
    name: 'note-and-frontmatter.png',
    klasse: 'feature',
    async run(cdp) {
      await vorbereiten(cdp);
      // Quelltext-Ansicht: dort steht das Frontmatter, aus dem der Brief entsteht.
      await setAppConfig(cdp, 'livePreview', false);
      if (!(await openExisting(cdp, NOTE, 'source'))) return null;
      await new Promise((r) => setTimeout(r, 800));
      return { clip: { x: 0, y: 0, width: WINDOW.w, height: WINDOW.h } };
    },
  },
];

async function main(): Promise<void> {
  const args = argv.slice(2);
  if (args.includes('--list')) {
    for (const s of SHOTS) console.log(`${s.name}\t${s.klasse}`);
    return;
  }
  const vaultDir = stagingVaultDir(REPO_NAME);
  if (args.includes('--setup')) {
    const log = buildVault({ repoRoot: REPO_ROOT, vaultDir, fixtureDir: FIXTURE_DIR, pluginId: PLUGIN_ID });
    console.log(log.join('\n'));
    return;
  }
  const portArg = args.indexOf('--port');
  const port = portArg >= 0 ? Number(args[portArg + 1]) : 9222;
  const onlyArg = args.indexOf('--only');
  const only = onlyArg >= 0 ? args[onlyArg + 1] : null;

  const cdp = await attachTo('workspace', port, REPO_NAME);
  if (!cdp) throw new Error(`Kein Obsidian-Fenster fuer den Vault "${REPO_NAME}" auf Port ${port}`);

  const lang = await cdp.evaluate<string>('return window.localStorage.getItem("language") || "en"');
  if (lang !== 'en') throw new Error(`Oberflaeche steht auf "${lang}", Aufnahme verlangt Englisch`);

  for (const shot of SHOTS) {
    if (only && shot.name !== only) continue;
    try {
      const aufnahme = await shot.run(cdp, port);
      if (!aufnahme) {
        console.log(`  ✗ ${shot.name} — nicht aufnehmbar`);
        continue;
      }
      const quelle = aufnahme.cdp ?? cdp;
      const png = await capture(quelle, aufnahme.clip, 2);
      if (aufnahme.cdp) aufnahme.cdp.close();
      const info = await writeShot(cdp, shot.name, png, {
        outDir: OUT_DIR,
        captureWidth: CAPTURE_WIDTH,
        thumbWidth: THUMB_WIDTH,
        thumb: shot.klasse === 'detail',
      });
      console.log(`  ✓ ${info}`);
    } catch (e) {
      console.log(`  ✗ ${shot.name} — ${(e as Error).message}`);
    }
  }
  cdp.close();
}

main().catch((e) => {
  console.error(e);
  exit(1);
});
