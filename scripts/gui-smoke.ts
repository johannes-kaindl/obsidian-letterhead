/**
 * GUI-Smoke-Treiber — fährt die mechanisch entscheidbaren Abnahmepunkte gegen ein
 * **laufendes** Obsidian statt von Hand.
 *
 * Warum getrackt (CORE-TEST-02 b): Letterheads teuerste Defekte lagen alle in der Naht
 * zwischen Obsidian und der puren Engine, wo kein Unit-Test hinsieht — **das Export-DOM
 * ist nicht das Preview-DOM**. Drei belegte Fälle, alle gegen den Obsidian-Mock unsichtbar
 * und hier rot: ein Codeblock verschwand aus dem PDF, sobald ein Fence ohne Leerzeile an
 * einer Textzeile klebte, und `LETTERHEADCODE0` wurde stattdessen als Fließtext gedruckt
 * (bestand seit 1.4.0, behoben in 1.6.4); MathJax und nacktes SVG fielen spurlos UND
 * ungezählt aus dem PDF, weil der Fallback nur `textContent` prüfte; `- [ ]`/`- [x]`
 * wurden optisch gleiche Bullets.
 *
 * Der Prüfgegenstand ist deshalb nicht das DOM, sondern **das erzeugte PDF**: der Treiber
 * liest die Datei, die im Vault landet, und misst ihren Text. Das ist das Versprechen des
 * Plugins („echtes, textselektierbares Vektor-PDF") und zugleich der einzige Ort, an dem
 * sich Degradation von Verlust unterscheiden lässt.
 *
 * ## Was er bewusst NICHT auslöst
 *
 * `letterhead:export-letter` — der Haupt-/Ribbon-Befehl — ruft auf dem Desktop `doPrint()`
 * und öffnet damit den **OS-Druckdialog**. Ein modaler Systemdialog blockiert jede weitere
 * CDP-Kommunikation, der Lauf hinge und niemand sähe warum. Gemessen wird stattdessen
 * `letterhead:export-letter-pdf` (`exportViaPdf`), der auf beiden Plattformen dieselbe
 * Vektor-Engine fährt und die Datei in den Vault schreibt. Der Druckpfad bleibt Handarbeit
 * und steht als übersprungener Punkt im Protokoll — eine stillschweigend ausgelassene
 * Prüfung liest sich hinterher wie eine grüne.
 *
 * ## Voraussetzung
 *
 * Der Treiber läuft gegen eine **Zweitinstanz** mit eigenem Profil und eigenem Port — nie gegen
 * die reguläre Instanz (9222), an der andere Sessions hängen; ein `quit` träfe deren Zustand.
 * `--port` ist Pflicht, einen Standardport gibt es nicht.
 *
 * ```bash
 * npm run build && npm run smoke:gui -- --setup   # Staging-Vault aus fixtures/vault/ ($STAGING_VAULTS_DIR)
 * UD=/tmp/obs-test-obsidian-letterhead; mkdir -p "$UD"
 * cp ~/Library/Application\ Support/obsidian/obsidian-*.asar "$UD"/     # aktuelle App-Version
 * # Vault und "language":"en" in "$UD/obsidian.json" eintragen (Obsidian liest sie nur beim Start)
 * lsof -nP -iTCP:9389 -sTCP:LISTEN                                        # Port frei?
 * /Applications/Obsidian.app/Contents/MacOS/Obsidian --user-data-dir="$UD" --remote-debugging-port=9389 &
 * python3 ~/.claude/hooks/obsidian-cdp-lock.py acquire --label obsidian-letterhead --intent "GUI-Smoke" --exclusive focus --port 9389 --ttl 300
 * npm run smoke:gui -- --port 9389
 * python3 ~/.claude/hooks/obsidian-cdp-lock.py release --port 9389
 * ```
 *
 * Vertrauensdialog und Restricted Mode des frischen Profils hebt der Treiber selbst auf
 * (`bereiteInstanzVor`, Punkt A1). Je Messlauf ein frischer Prozess; der erste Lauf nach der
 * Profilanlage ist ein Aufwärmlauf und zählt nicht.
 *
 * Bilanz: vier Zustände nach CORE-TEST-19 (grün · rot · übersprungen · nichts gemessen), die
 * Soll-Liste `PUNKTE` ist der Nenner; Exit 1 bei Rot oder „nichts gemessen“, Exit 2 bei Abbruch.
 *
 * Typen: `tsconfig.scripts.json` (im `gate` über `npm run typecheck:scripts`).
 */

import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { createBilanz, parseArgs, runDriver } from '../../tools/obsidian-cdp/bilanz.js';
import { Cdp, attachTo, beimAbbruch, bereiteInstanzVor, clearNotices, closeExtraLeaves, istAbgebrochen, notices, openExisting, pollUntil, requireVisible, schliesseDialog, schliesseEinstellungen } from '../../tools/obsidian-cdp/cdp.js';
import { beurteileTeilen, gegenprobeAntwort, loeseExportAus, raeumeOrdnerAuf, stelleOrdnerHer, stubAn, stubAus, type TeilenBeobachtung, type TeilenTeilurteil } from '../../tools/obsidian-cdp/teilen.js';
import { buildVault, requireEigenerBuild, stagingVaultDir } from '../../tools/obsidian-cdp/vault.js';

const REPO_NAME = 'obsidian-letterhead';
const PLUGIN_ID = 'letterhead';
const REPO_ROOT = cwd();
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/vault');

/* ---------------------------------------------------------------- Protokoll */

/** Soll-Liste aller Prüfpunkte — der Nenner der Bilanz (CORE-TEST-19). Ein Punkt, der nie
 *  aufgezeichnet wird, zählt als „nichts gemessen“ und setzt Exit 1. */
const PUNKTE = [
  'A1 Plugin geladen',
  'A2 alle vier Befehle registriert',
  'A3 Ribbon-Knopf vorhanden',
  'B0 Kein liegen gebliebener Test-Ausgabepfad aus einem abgebrochenen Vorlauf',
  'B1 PDF entsteht neben der Notiz',
  'B2 Datei ist ein PDF',
  'B3 Notice nennt den gespeicherten Pfad',
  'B4 Text ist Vektor-Text in Core-14-Schriften',
  'C1 Empfängeranschrift, alle drei Zeilen',
  'C2 Betreff, Anrede, Gruß, Unterschrift',
  'C3 Infoblock trägt die Bezugszeichen',
  'C4 Anlagenvermerk',
  'C5 Absender aus den Einstellungen im Briefkopf',
  'C6 Umlaute und € kommen als WinAnsi durch',
  'C7 Fließtext samt Auszeichnungen',
  'D1 englische Aliasse treffen dieselben Felder',
  'D2 Schlüssel case-insensitiv, Trennzeichen egal',
  'D3 language: en schaltet die Brief-Etiketten um',
  'D4 Degradations-Platzhalter folgt der Briefsprache',
  'E1 Tabellenzellen stehen im PDF',
  'E2 Task-Zustände sind unterscheidbar',
  'E3 Codeblock mit Leerzeile davor',
  'E4 klebender Fence: Codeblock überlebt, kein roher Platzhalter',
  'E5 rohes SVG degradiert sichtbar zu [Grafik]',
  'E6 PNG ist als Bild eingebettet, nicht als Platzhalter',
  'E7 Notice zählt die vereinfachten Elemente',
  'F1 Brief bricht auf mehrere Seiten um',
  'F2 erster, mittlerer und letzter Absatz sind da',
  'G1 nextToNote legt neben der Notiz ab, nicht in der Wurzel',
  'G2 zweiter Export überschreibt nicht, sondern zählt hoch',
  'G3 Dateiname folgt dem Schema {datum} {empfaenger}',
  'G4 customFolder legt den Zielordner an und schreibt hinein',
  'G5 Ausgabeordner-Feld schlägt vorhandene Ordner vor',
  'H1 Vorschau-Modal öffnet',
  'H2 Vorschau paginiert in Blätter',
  'H3 Falz- und Lochmarken sind gezeichnet',
  'I1 Teilen: Fremddatei im Export-Ordner löst die Rückfrage aus, „Keep them“ lässt sie liegen',
  'I2 Teilen: „Delete them“ löscht die Fremddatei, eigene Reste verschwinden in beiden Fällen',
  'I3 Teilen: ohne Fremddatei keine Rückfrage, die Datei geht an die Standard-App (Stub)',
  'I4 Teilen: die Antwort auf die Rückfrage entscheidet (Gegenprobe zu I1 und I2)',
  'Desktop-Druckpfad (letterhead:export-letter)',
  'iOS-Share-Kaskade (navigator.canShare → share → openWithDefaultApp)',
  'SVG-Logo im Briefkopf',
] as const;

const bilanz = createBilanz({ punkte: PUNKTE });
const { record, skipped, unmeasured } = bilanz;

const warnungen: string[] = [];

/* ------------------------------------------------------- PDF ohne Bibliothek */

/* Die drei Lesefunktionen sind aus obsidian-paperize/scripts/gui-smoke.ts übernommen,
   2026-09-02 — beide Plugins fahren dieselbe vendorte Kit-Engine, also gelten dieselben
   Zusagen über das Dateiformat. Herkunft steht hier, damit die Extraktions-Schwelle
   (Dach-AGENTS Punkt 3) eine Kopier-Kette nicht als zweiten unabhängigen Beleg zählt.
   `winAnsi` ist neu und letterhead-eigen: das Fixture prüft ausdrücklich das €-Zeichen. */

/**
 * Text aus einem Letterhead-PDF.
 *
 * Geht ohne Parser, weil die Engine ihre Content-Streams **unkomprimiert** schreibt (kein
 * `/Filter /FlateDecode` auf Seiteninhalten) und jeden Textlauf als einzelnes `(...) Tj`
 * setzt. Escaped werden dort nur `(`, `)` und `\`, mehr muss diese Funktion nicht
 * rückgängig machen.
 *
 * Gelesen wird als latin1: die Bytes sind WinAnsi, und jeder andere Weg (utf8) macht aus
 * einem Umlaut zwei Ersatzzeichen — genau der Punkt, den C5 prüft.
 */
function pdfText(bytes: Buffer): string {
  const roh = bytes.toString('latin1');
  const stuecke: string[] = [];
  const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(roh)) !== null) {
    stuecke.push(m[1].replace(/\\([()\\])/g, '$1'));
  }
  return winAnsi(stuecke.join('\n'));
}

/**
 * WinAnsi → Unicode für den Bereich 0x80–0x9F.
 *
 * Latin-1 und WinAnsi stimmen ab 0xA0 überein — Umlaute kommen also von selbst richtig
 * heraus. Darunter liegt WinAnsis eigene Belegung, und dort steht das **€** (0x80). Ohne
 * diese Umschrift wäre der €-Prüfpunkt dauerhaft rot bei intaktem Code: das Zeichen ist im
 * PDF vorhanden und korrekt kodiert, nur der Leser hier läse es als Steuerzeichen. Ein
 * Prüfwerkzeug, das seinen eigenen Messkanal falsch dekodiert, meldet den Fehler beim
 * Prüfling.
 */
function winAnsi(s: string): string {
  const tabelle: Record<number, string> = {
    0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
    0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž',
    0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
    0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
  };
  return s.replace(/[\u0080-\u009f]/g, (c) => tabelle[c.charCodeAt(0)] ?? c);
}

/** Seitenzahl aus dem `/Pages`-Objekt. */
function pdfSeiten(bytes: Buffer): number {
  const m = /\/Type\s*\/Pages\s*\/Count\s+(\d+)/.exec(bytes.toString('latin1'));
  return m ? Number(m[1]) : 0;
}

/** Die Core-14-Schriften, die das PDF als `/Type1`-Objekte führt. Ein eingebetteter
 *  Font-Stream hätte `/FontFile`; letterheads bewusste Grenze ist, dass es keinen gibt. */
function pdfFonts(bytes: Buffer): string[] {
  const roh = bytes.toString('latin1');
  const namen = new Set<string>();
  const re = /\/BaseFont\s*\/([A-Za-z0-9-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(roh)) !== null) namen.add(m[1]);
  return [...namen].sort();
}

/** Enthält das PDF ein eingebettetes Rasterbild? Die Engine schreibt Bilder als JPEG
 *  (`/DCTDecode`) — das unterscheidet ein wirklich eingebettetes Bild von einem
 *  `[Bild: …]`-Platzhalter, der nur Text wäre. */
function pdfHatBild(bytes: Buffer): boolean {
  return /\/DCTDecode/.test(bytes.toString('latin1'));
}

/* ------------------------------------------------------------------ Helfer */

interface VaultInfo {
  basePath: string;
  configDir: string;
  name: string;
}

/** Wo liegt der Vault, gegen den DIESER Lauf fährt? Aus der laufenden Instanz gefragt,
 *  nicht aus `stagingVaultDir()` abgeleitet: ein Treiber dockt per `--vault` an ein
 *  beliebiges Fenster an, und ein Guard, der den konfigurierten statt des benutzten
 *  Gegenstands prüft, meldet grün über eine Datei, die mit dem Lauf nichts zu tun hat.
 *  Geprüft wird, was gemessen wird. */
async function vaultInfo(cdp: Cdp): Promise<VaultInfo> {
  return cdp.evaluate<VaultInfo>(`
    return {
      basePath: app.vault.adapter.basePath,
      configDir: app.vault.configDir,
      name: app.vault.getName(),
    };
  `);
}

async function setSettings(cdp: Cdp, patch: Record<string, unknown>): Promise<void> {
  await cdp.evaluate(`
    const p = app.plugins.plugins[${JSON.stringify(PLUGIN_ID)}];
    Object.assign(p.settings, ${JSON.stringify(patch)});
    await p.saveSettings();
    await new Promise((r) => setTimeout(r, 200));
    return true;
  `);
}

async function readSettings(cdp: Cdp): Promise<Record<string, unknown>> {
  return cdp.evaluate<Record<string, unknown>>(`
    return JSON.parse(JSON.stringify(app.plugins.plugins[${JSON.stringify(PLUGIN_ID)}].settings));
  `);
}

/**
 * Eine Notiz öffnen und den **Vektor-PDF**-Befehl auslösen; liefert den Notice-Text.
 *
 * Die Notice wird VOR dem Warten auf die Datei gelesen — sie verschwindet nach wenigen
 * Sekunden, und ein Punkt, der beides aus einem Aufruf braucht, hätte sonst je nach
 * Schreibdauer mal Text und mal nicht: sporadisch rot bei intaktem Code, und das ist
 * teurer als dauerhaft rot.
 */
async function exportPdf(cdp: Cdp, notePath: string): Promise<string> {
  await clearNotices(cdp);
  const offen = await openExisting(cdp, notePath, 'preview');
  if (!offen) throw new Error(`Notiz ließ sich nicht öffnen oder rendern: ${notePath}`);
  await closeExtraLeaves(cdp);
  await cdp.evaluate(`
    app.commands.executeCommandById(${JSON.stringify(`${PLUGIN_ID}:export-letter-pdf`)});
    return true;
  `);
  const text = await pollUntil<string>(
    cdp,
    'const t = [...document.querySelectorAll(".notice")].map((n) => n.textContent.trim()).join(" | "); return t || null;',
    15_000,
    250,
  );
  // Der Schreibvorgang läuft asynchron weiter, auch wenn die Notice schon steht.
  await new Promise((r) => setTimeout(r, 600));
  return text ?? (await notices(cdp));
}

/** Auf eine Datei im Vault warten (Node-seitig — der Treiber liest sie danach selbst). */
async function warteAufDatei(pfad: string, fristMs = 12_000): Promise<boolean> {
  const ende = Date.now() + fristMs;
  while (Date.now() < ende) {
    if (existsSync(pfad)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/** Erzeugte PDFs wieder wegräumen. Der Staging-Vault ist Wegwerfware, aber ein Lauf, der
 *  seine Ausgabe stehen lässt, verfälscht den nächsten: G2 misst die " (2)"-Zählung, und
 *  die wäre beim zweiten Mal grün aus dem falschen Grund. */
function raeumePdfs(vaultDir: string): number {
  let n = 0;
  const lauf = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const eintrag of readdirSync(dir, { withFileTypes: true })) {
      if (eintrag.name === '.obsidian') continue;
      const p = join(dir, eintrag.name);
      if (eintrag.isDirectory()) lauf(p);
      else if (eintrag.name.endsWith('.pdf')) { rmSync(p, { force: true }); n++; }
    }
  };
  lauf(vaultDir);
  return n;
}

/** Alle Marker, die im PDF-Text stehen müssen — und die, die nicht dürfen. Liefert eine
 *  lesbare Bilanz statt eines nackten `false`: ein roter Punkt, der weder Eingabe noch
 *  Antwort nennt, blockiert die Fehlersuche (CORE-TEST-14). */
function markerBilanz(text: string, erwartet: string[]): { ok: boolean; detail: string } {
  const fehlend = erwartet.filter((m) => !text.includes(m));
  return {
    ok: fehlend.length === 0,
    detail: fehlend.length === 0
      ? `${erwartet.length}/${erwartet.length} Marker im PDF`
      : `fehlend: ${fehlend.join(', ')} (von ${erwartet.length})`,
  };
}

/* ------------------------------------------------------------- Prüfpunkte */

async function pruefeGrundlage(cdp: Cdp, v: VaultInfo): Promise<void> {
  console.log('\nA · Grundlage');

  // Ein frisches Profil startet im Restricted Mode und fragt nach dem Vertrauen in den Vault-
  // Ersteller; beides erledigt `bereiteInstanzVor` — aber NUR im eigenen Staging-Vault
  // (`nurVault`). In einem fremden Vault wäre das ein Eingriff in den Wirt; dort bleibt der
  // Punkt rot und nennt den Grund.
  const klar = await bereiteInstanzVor(cdp, { pluginIds: [PLUGIN_ID], nurVault: REPO_NAME, sprache: 'en' });
  const geladen = await cdp.evaluate<boolean>(
    `return Boolean(app.plugins.plugins[${JSON.stringify(PLUGIN_ID)}]);`,
  );

  record(
    'A1 Plugin geladen',
    geladen,
    geladen
      ? `Vault ${v.name} (${klar.hinweis})`
      : `app.plugins.plugins.${PLUGIN_ID} fehlt — ${klar.hinweis}${
          v.name === REPO_NAME ? '' : ` · Vault "${v.name}" ist nicht der Staging-Vault, deshalb kein Freischaltversuch`
        }`,
  );
  if (!geladen) throw new Error('Ohne geladenes Plugin ist jeder weitere Punkt gegenstandslos.');

  const befehle = await cdp.evaluate<string[]>(`
    const ids = ["export-letter", "export-letter-pdf", "open-preview", "insert-frontmatter"];
    return ids.filter((id) => Boolean(app.commands.commands[${JSON.stringify(PLUGIN_ID)} + ":" + id]));
  `);
  record(
    'A2 alle vier Befehle registriert',
    befehle.length === 4,
    `${befehle.length}/4: ${befehle.join(' · ') || 'keiner'}`,
  );

  // Über den plugin-eigenen aria-label einsteigen, nicht über `.side-dock-ribbon-action`:
  // die Klasse gehört Obsidian, und dessen eigene Ribbon-Knöpfe stehen davor.
  const ribbon = await cdp.evaluate<string | null>(`
    const kandidaten = [...document.querySelectorAll(".side-dock-ribbon-action")];
    const treffer = kandidaten.find((el) => /brief|letter/i.test(el.getAttribute("aria-label") || ""));
    return treffer ? treffer.getAttribute("aria-label") : null;
  `);
  record('A3 Ribbon-Knopf vorhanden', Boolean(ribbon), ribbon ?? 'kein Ribbon-Knopf mit Brief-/Letter-Label');
}

async function pruefeGrundfall(cdp: Cdp, vaultDir: string): Promise<Buffer> {
  console.log('\nB · Vektor-PDF, Grundfall');

  await setSettings(cdp, {
    outputMode: 'nextToNote',
    filenameTemplate: '{notiz}',
    sender: {
      name: 'MARKSENDNAME Absender AG', zusatz: 'MARKSENDZUSATZ Abteilung Vertrieb',
      strasse: 'MARKSENDSTR Senderweg 9', plzOrt: 'MARKSENDORT 54321 Senderstadt',
      telefon: 'MARKSENDTEL +49 30 000', email: 'MARKSENDMAIL post@example.com',
      web: 'MARKSENDWEB example.com',
    },
  });

  const notice = await exportPdf(cdp, 'Smoke.md');
  const ziel = join(vaultDir, 'Smoke.pdf');
  const da = await warteAufDatei(ziel);
  record(
    'B1 PDF entsteht neben der Notiz',
    da,
    da ? `Smoke.pdf · ${readFileSync(ziel).length} Bytes` : `keine Datei nach 12 s · Notice: ${notice || '(keine)'}`,
  );
  if (!da) throw new Error(`Ohne PDF ist der Rest gegenstandslos. Notice des Prüflings: ${notice || '(keine)'}`);

  const bytes = readFileSync(ziel);
  const magic = bytes.subarray(0, 5).toString('latin1') === '%PDF-';
  record(
    'B2 Datei ist ein PDF',
    magic && bytes.length > 2000,
    `${bytes.subarray(0, 8).toString('latin1').replace(/\n/g, '')} · ${bytes.length} Bytes · ${pdfSeiten(bytes)} Seite(n)`,
  );

  record('B3 Notice nennt den gespeicherten Pfad', notice.includes('Smoke.pdf'), notice || '(keine Notice)');

  // Das Kernversprechen: Vektor-PDF mit echtem Text, keine Rastergrafik einer Seite.
  const fonts = pdfFonts(bytes);
  const core14 = fonts.length > 0 && fonts.every((f) => /^(Helvetica|Times|Courier)/.test(f));
  const eingebettet = /\/FontFile\d?\b/.test(bytes.toString('latin1'));
  record(
    'B4 Text ist Vektor-Text in Core-14-Schriften',
    core14 && !eingebettet,
    `${fonts.join(', ') || 'keine /BaseFont-Objekte'}${eingebettet ? ' · WARNUNG: /FontFile gefunden' : ''}`,
  );

  return bytes;
}

function pruefeBriefinhalt(bytes: Buffer): void {
  console.log('\nC · Der Brief steht im PDF');
  const text = pdfText(bytes);

  const empf = markerBilanz(text, ['MARKEMPFA', 'MARKEMPFB', 'MARKEMPFC']);
  record('C1 Empfängeranschrift, alle drei Zeilen', empf.ok, empf.detail);

  const teile = markerBilanz(text, ['MARKBETREFF', 'MARKANREDE', 'MARKGRUSS', 'MARKSIG']);
  record('C2 Betreff, Anrede, Gruß, Unterschrift', teile.ok, teile.detail);

  const info = markerBilanz(text, ['MARKIHRZ', 'MARKUNSZ', 'MARKDURCHWAHL', 'MARKSTNR']);
  record('C3 Infoblock trägt die Bezugszeichen', info.ok, info.detail);

  const anlagen = markerBilanz(text, ['MARKANLAGE']);
  record('C4 Anlagenvermerk', anlagen.ok, anlagen.detail);

  const absender = markerBilanz(text, ['MARKSENDNAME', 'MARKSENDSTR', 'MARKSENDORT']);
  record('C5 Absender aus den Einstellungen im Briefkopf', absender.ok, absender.detail);

  // Der Zweck der WinAnsi-Kodierung. Ein Ersatzzeichen hier heißt: die Sonderzeichen sind
  // im PDF, aber falsch kodiert — für einen Geschäftsbrief ein sichtbarer Fehler.
  const zeichen = ['äöüß', 'ÄÖÜ', '€'];
  const fehlendeZeichen = zeichen.filter((z) => !text.includes(z));
  record(
    'C6 Umlaute und € kommen als WinAnsi durch',
    fehlendeZeichen.length === 0,
    fehlendeZeichen.length === 0
      ? 'äöüß ÄÖÜ € im PDF-Text'
      : `nicht gefunden: ${fehlendeZeichen.join(' ')} — Ersatzzeichen statt Sonderzeichen?`,
  );

  const body = markerBilanz(text, ['MARKBODY', 'MARKBOLD', 'MARKITAL', 'MARKINLINE', 'MARKABSATZ2']);
  record('C7 Fließtext samt Auszeichnungen', body.ok, body.detail);
}

async function pruefeFrontmatter(cdp: Cdp, vaultDir: string): Promise<void> {
  console.log('\nD · Frontmatter-Auflösung (englische Aliasse + Schlüssel-Normalisierung)');

  const notice = await exportPdf(cdp, 'Smoke-Englisch.md');
  const ziel = join(vaultDir, 'Smoke-Englisch.pdf');
  if (!(await warteAufDatei(ziel))) {
    unmeasured('D1 englische Aliasse treffen dieselben Felder', `Gegenstand nicht erreicht: keine Datei · Notice: ${notice || '(keine)'}`);
    return;
  }
  const text = pdfText(readFileSync(ziel));

  const aliasse = markerBilanz(text, ['MARKENEMPF', 'MARKENGRUSS', 'MARKENSIG', 'MARKENENCL']);
  record('D1 englische Aliasse treffen dieselben Felder', aliasse.ok, aliasse.detail);

  // Der eigentliche Punkt: `norm()` senkt die Schreibweise und wirft `_`, `-`, `.` und
  // Leerzeichen weg. Die drei Schlüssel im Fixture sind absichtlich unterschiedlich
  // geschrieben — `Subject` groß, `SALUTATION` versal, `Your ref` mit Leerzeichen,
  // `our-ref` mit Bindestrich. Fällt die Normalisierung aus, fehlen genau diese Werte,
  // während die kanonisch geschriebenen weiter durchkommen.
  const norm = markerBilanz(text, ['MARKENSUBJ', 'MARKENANREDE', 'MARKENYOURREF', 'MARKENOURREF']);
  record('D2 Schlüssel case-insensitiv, Trennzeichen egal', norm.ok, norm.detail);

  // `language: en` schaltet die gedruckten Etiketten um — nicht die Plugin-Oberfläche.
  const enLabel = /Enclosure/i.test(text);
  const deLabel = /Anlage/i.test(text);
  record(
    'D3 language: en schaltet die Brief-Etiketten um',
    enLabel && !deLabel,
    enLabel ? (deLabel ? 'beide Sprachen im selben Brief' : '"Enclosure(s)" statt "Anlage(n)"') : 'kein englisches Anlagen-Etikett gefunden',
  );

  // Der Degradations-Platzhalter ist ein GEDRUCKTER Text und folgt deshalb der Brief-,
  // nicht der Oberflächensprache. Dieser Punkt ist der einzige, der die Verdrahtung in
  // `main.ts` überhaupt messen kann: im deutschen Brief liefert der Kit-Default denselben
  // Text (`[Grafik]`), ein weggefallenes `placeholders` bliebe dort also unsichtbar.
  const enPh = text.includes('[Graphic]');
  const dePh = text.includes('[Grafik]');
  record(
    'D4 Degradations-Platzhalter folgt der Briefsprache',
    enPh && !dePh,
    enPh
      ? (dePh ? '[Graphic] UND [Grafik] im selben Brief' : '[Graphic] im englischen Brief')
      : (dePh ? '[Grafik] im englischen Brief — placeholders kommen nicht an' : 'kein Platzhalter gefunden — SVG spurlos verschwunden?'),
  );
}

async function pruefeDegradation(cdp: Cdp, vaultDir: string): Promise<void> {
  console.log('\nE · Reiche Inhalte und Degradation');

  const notice = await exportPdf(cdp, 'Smoke-Reich.md');
  const ziel = join(vaultDir, 'Smoke-Reich.pdf');
  if (!(await warteAufDatei(ziel))) {
    unmeasured('E1 Tabellenzellen stehen im PDF', `Gegenstand nicht erreicht: keine Datei · Notice: ${notice || '(keine)'}`);
    return;
  }
  const bytes = readFileSync(ziel);
  const text = pdfText(bytes);

  const tab = markerBilanz(text, ['MARKTABA', 'MARKTABB']);
  record('E1 Tabellenzellen stehen im PDF', tab.ok, tab.detail);

  // Der Zustand muss unterscheidbar sein — bis 1.6.3 wurden beide zu optisch gleichen
  // Bullets, der Brief log also über den Stand der Aufgaben.
  const tasks = markerBilanz(text, ['MARKTASKOPEN', 'MARKTASKDONE']);
  const zustandSichtbar = /\[\s?\]|\[x\]|☐|☑|✓/i.test(text);
  record(
    'E2 Task-Zustände sind unterscheidbar',
    tasks.ok && zustandSichtbar,
    `${tasks.detail}${zustandSichtbar ? ' · Zustandsmarker vorhanden' : ' · KEIN Zustandsmarker — offen und erledigt sehen gleich aus'}`,
  );

  const code = markerBilanz(text, ['MARKCODEA']);
  record('E3 Codeblock mit Leerzeile davor', code.ok, code.detail);

  // Die Regression aus 1.4.0, behoben in 1.6.4: ein Fence, der ohne Leerzeile an einer
  // Textzeile klebt, ist valides CommonMark. Der Platzhalter landete per Soft Break im
  // selben Absatz, wurde nicht mehr aufgelöst — der Codeblock fiel aus dem PDF UND
  // `LETTERHEADCODE0` wurde als Fließtext gedruckt. Beide Hälften werden geprüft: der
  // Inhalt muss da sein, der rohe Platzhalter darf es nicht.
  const klebendDa = text.includes('MARKCODEKLEBEND');
  const rohSichtbar = /LETTERHEADCODE\d/.test(text);
  record(
    'E4 klebender Fence: Codeblock überlebt, kein roher Platzhalter',
    klebendDa && !rohSichtbar,
    `${klebendDa ? 'Inhalt da' : 'Inhalt FEHLT'} · ${rohSichtbar ? 'LETTERHEADCODE als Fließtext SICHTBAR' : 'kein roher Platzhalter'}`,
  );

  // Rohes SVG trägt keinen Textknoten. Der Fallback prüfte bis 1.6.3 nur `textContent`
  // und ließ es spurlos UND ungezählt fallen.
  record(
    'E5 rohes SVG degradiert sichtbar zu [Grafik]',
    text.includes('[Grafik]'),
    text.includes('[Grafik]') ? '[Grafik] im PDF' : 'kein [Grafik]-Platzhalter — SVG spurlos verschwunden?',
  );

  // Ein wirklich eingebettetes Bild ist ein /DCTDecode-Objekt. Der `[Bild: …]`-Text wäre
  // die Degradation — auf dem Desktop rastert Chromium PNG korrekt, hier muss also das
  // echte Bild stehen.
  const bild = pdfHatBild(bytes);
  record(
    'E6 PNG ist als Bild eingebettet, nicht als Platzhalter',
    bild,
    bild ? '/DCTDecode-Objekt im PDF' : 'kein Bildobjekt — Platzhalter statt Bild?',
  );

  // Die Sammel-Notice ist der Unterschied zwischen Degradation und Verlust: sie sagt, DASS
  // etwas vereinfacht wurde. Schweigt sie, während Inhalt fehlt, ist der Fehler unsichtbar.
  const zahl = /(\d+)\s*(Element|element)/.exec(notice);
  record(
    'E7 Notice zählt die vereinfachten Elemente',
    zahl !== null && Number(zahl[1]) >= 1,
    zahl ? `${zahl[1]} Element(e) gemeldet` : `keine Zahl in der Notice: ${notice || '(keine)'}`,
  );
}

async function pruefeMehrseitig(cdp: Cdp, vaultDir: string): Promise<void> {
  console.log('\nF · Mehrseitigkeit');

  const notice = await exportPdf(cdp, 'Smoke-Lang.md');
  const ziel = join(vaultDir, 'Smoke-Lang.pdf');
  if (!(await warteAufDatei(ziel))) {
    unmeasured('F1 Brief bricht auf mehrere Seiten um', `Gegenstand nicht erreicht: keine Datei · Notice: ${notice || '(keine)'}`);
    return;
  }
  const bytes = readFileSync(ziel);
  const seiten = pdfSeiten(bytes);
  record('F1 Brief bricht auf mehrere Seiten um', seiten >= 2, `${seiten} Seite(n)`);

  // Der letzte Absatz ist der Prüfstein: ein Paginierer, der hinten abschneidet, liefert
  // trotzdem ein gültiges mehrseitiges PDF. Erst der letzte Marker belegt Vollständigkeit.
  const text = pdfText(bytes);
  const bilanz = markerBilanz(text, ['MARKLANG01', 'MARKLANG20', 'MARKLANG40']);
  record('F2 erster, mittlerer und letzter Absatz sind da', bilanz.ok, bilanz.detail);
}

/** Öffnet den Einstellungs-Tab und liest die Vorschläge des Ausgabeordner-Felds. Unter Obsidian 1.13+ steht der
 *  Tab je nach Lage im Hauptfenster (`.modal.mod-settings`) oder in einem eigenen Fenster (`about:blank`);
 *  im zweiten Fall sieht das Hauptfenster ihn nicht. */
async function messeOrdnerFeld(cdp: Cdp, port: number, vault: string): Promise<{ feld: boolean; items: string[] }> {
  await cdp.evaluate(`
    app.setting.open();
    await new Promise((r) => setTimeout(r, 500));
    app.setting.openTabById(${JSON.stringify(PLUGIN_ID)});
    await new Promise((r) => setTimeout(r, 1200));
    return true;
  `);
  const alsModal = await cdp.evaluate<boolean>(`return Boolean(document.querySelector('.modal.mod-settings'));`);
  const fenster = alsModal ? cdp : await attachTo('settings', port, vault);
  try {
    if (!fenster) return { feld: false, items: [] };
    const findeFeld = `[...document.querySelectorAll('input[type="text"]')].find((i) => i.placeholder.startsWith('Export/'))`;
    const feldDa = await pollUntil<boolean>(fenster, `return ${findeFeld} ? true : null;`, 8_000, 250);
    if (feldDa !== true) return { feld: false, items: [] };
    return await fenster.evaluate<{ feld: boolean; items: string[] }>(`
      const feld = ${findeFeld};
      feld.focus();
      feld.value = '';
      feld.dispatchEvent(new Event('input'));
      await new Promise((r) => setTimeout(r, 400));
      const items = [...document.querySelectorAll('.suggestion-container .suggestion-item')].map((e) => e.textContent);
      return { feld: true, items };
    `);
  } finally {
    if (fenster && fenster !== cdp) fenster.close();
    await schliesseEinstellungen(cdp).catch(() => undefined);
  }
}

async function pruefeAblage(cdp: Cdp, vaultDir: string, port: number, vault: string): Promise<void> {
  console.log('\nG · Ablage und Dateiname');

  // nextToNote aus einem Unterordner — die Pfad-Fügung, die seit 1.6.5 aus dem Kit kommt.
  await setSettings(cdp, { outputMode: 'nextToNote', filenameTemplate: '{notiz}' });
  const noticeU = await exportPdf(cdp, 'Unterordner/Smoke-Unterordner.md');
  const zielU = join(vaultDir, 'Unterordner', 'Smoke-Unterordner.pdf');
  const daU = await warteAufDatei(zielU);
  record(
    'G1 nextToNote legt neben der Notiz ab, nicht in der Wurzel',
    daU && !existsSync(join(vaultDir, 'Smoke-Unterordner.pdf')),
    daU ? 'Unterordner/Smoke-Unterordner.pdf' : `nicht im Unterordner · Notice: ${noticeU || '(keine)'}`,
  );

  // Letterhead überschreibt bewusst NICHT (anders als paperize): ein zweiter Export
  // desselben Briefs bekommt Obsidians " (2)"-Konvention. Ein Überschreiben wäre
  // Datenverlust ohne ein Wort.
  await exportPdf(cdp, 'Smoke.md');
  const zweit = join(vaultDir, 'Smoke (2).pdf');
  const daZweit = await warteAufDatei(zweit, 8000);
  record(
    'G2 zweiter Export überschreibt nicht, sondern zählt hoch',
    daZweit,
    daZweit ? 'Smoke (2).pdf' : 'keine " (2)"-Datei — wurde der erste Export überschrieben?',
  );

  // Der Dateiname folgt dem Schema. `{datum} {empfaenger}` ist der Auslieferungs-Default;
  // gemessen wird er hier ausdrücklich, weil das Schema seit 1.6.5 aus dem Kit kommt.
  await setSettings(cdp, { filenameTemplate: '{datum} {empfaenger}' });
  const noticeN = await exportPdf(cdp, 'Smoke.md');
  const erwartet = '2026-03-14 MARKEMPFA Beispiel GmbH.pdf';
  const daN = await warteAufDatei(join(vaultDir, erwartet), 8000);
  record(
    'G3 Dateiname folgt dem Schema {datum} {empfaenger}',
    daN,
    daN ? erwartet : `erwartet "${erwartet}" · Notice: ${noticeN || '(keine)'}`,
  );

  // customFolder: ein Ordner, den es noch nicht gibt — der Schreibpfad legt ihn an.
  await setSettings(cdp, { outputMode: 'customFolder', outputFolder: 'Export/Briefe', filenameTemplate: '{notiz}' });
  const noticeC = await exportPdf(cdp, 'Smoke.md');
  const zielC = join(vaultDir, 'Export', 'Briefe', 'Smoke.pdf');
  const daC = await warteAufDatei(zielC);
  record(
    'G4 customFolder legt den Zielordner an und schreibt hinein',
    daC,
    daC ? 'Export/Briefe/Smoke.pdf' : `nicht angelegt · Notice: ${noticeC || '(keine)'}`,
  );

  // Das Feld „Custom folder“ ist ein Ordner-Feld mit Vorschlägen (Kit-FolderSuggest), kein freies
  // Textfeld. G4 hat `Export/Briefe` eben angelegt: leeres Feld fokussieren, der Vorschlag muss ihn nennen.
  // Erst die Existenz des Feldes belegen, dann die Vorschläge messen.
  const vorschlag = await messeOrdnerFeld(cdp, port, vault);
  record(
    'G5 Ausgabeordner-Feld schlägt vorhandene Ordner vor',
    vorschlag.feld && vorschlag.items.includes('Export/Briefe'),
    vorschlag.feld ? `${vorschlag.items.length} Vorschläge: ${vorschlag.items.slice(0, 5).join(', ')}` : 'Feld mit Platzhalter "Export/…" nicht gefunden (8 s)',
  );
}

async function pruefeVorschau(cdp: Cdp): Promise<void> {
  console.log('\nH · Vorschau');

  await cdp.evaluate(`
    app.commands.executeCommandById(${JSON.stringify(`${PLUGIN_ID}:open-preview`)});
    return true;
  `);

  // Erst die Existenz des Modals belegen, dann seine Eigenschaften messen — ein Vergleich
  // gegen ein nicht existierendes Element wird sonst grün, ausgerechnet im Defektfall.
  const modal = await pollUntil<boolean>(
    cdp,
    'return document.querySelector(".briefkopf-preview-modal") ? true : null;',
    10_000,
    250,
  );
  record('H1 Vorschau-Modal öffnet', modal === true, modal === true ? '.briefkopf-preview-modal im DOM' : 'kein Modal nach 10 s');
  if (modal !== true) return;

  // Die Paginierung arbeitet im iframe — eigene Realm, deshalb über contentDocument.
  const rahmen = await pollUntil<{ sheets: number; marks: number; letter: boolean }>(
    cdp,
    `
    const frame = document.querySelector(".briefkopf-preview-frame");
    if (!frame || !frame.contentDocument) return null;
    const doc = frame.contentDocument;
    const sheets = doc.querySelectorAll(".bk-sheet").length;
    if (!sheets) return null;
    return {
      sheets,
      marks: doc.querySelectorAll(".bk-mark").length,
      letter: Boolean(doc.querySelector(".bk-letter")),
    };
    `,
    10_000,
    250,
  );

  if (!rahmen) {
    record('H2 Vorschau paginiert in Blätter', false, 'kein .bk-sheet im iframe nach 10 s');
    unmeasured('H3 Falz- und Lochmarken sind gezeichnet', 'Gegenstand nicht erreicht: kein .bk-sheet im iframe');
  } else {
    record('H2 Vorschau paginiert in Blätter', rahmen.sheets >= 1, `${rahmen.sheets} .bk-sheet`);
    // Falz- und Lochmarken sind kuvert-kritisch; sie fehlen still, wenn eine Einstellung
    // kippt. Drei Marken bei Voreinstellung: zwei Falze, eine Lochmarke.
    record(
      'H3 Falz- und Lochmarken sind gezeichnet',
      rahmen.marks >= 3,
      `${rahmen.marks} .bk-mark (erwartet ≥ 3: zwei Falze, eine Lochmarke)`,
    );
  }

  // Schliessen-Knopf in beiden Formen (.modal-close-button bis 1.12, .modal-header-button ab 1.14), sonst Escape.
  await schliesseDialog(cdp);
}

/* ------------------------------------------------------------------- Lauf */

function setupVault(): void {
  const vaultDir = stagingVaultDir(REPO_NAME);
  const log = buildVault({
    repoRoot: REPO_ROOT,
    vaultDir,
    fixtureDir: FIXTURE_DIR,
    pluginId: PLUGIN_ID,
    generator: 'make-assets.mjs',
  });
  console.log(`Staging-Vault gebaut: ${vaultDir}`);
  for (const zeile of log) console.log(`  · ${zeile}`);
  console.log('\nDen Vault in Obsidian öffnen (registriert ihn zugleich):');
  console.log(`  open "obsidian://open?path=${encodeURIComponent(join(vaultDir, 'Smoke.md'))}"`);
}

/* ------------------------------------------------------------------ Teilen */

const TEILEN_ORDNER = '.letterhead-export';

/** Urteil der Brücke (`gruen`/`rot`/`nichts-gemessen`) in die Bilanz übertragen: „nichts gemessen“ ist kein Rot und kein Grün. */
function zeichne(name: (typeof PUNKTE)[number], u: TeilenTeilurteil): void {
  if (u.urteil === 'nichts-gemessen') unmeasured(name, u.detail);
  else record(name, u.urteil === 'gruen', u.detail);
}

/** Der Teilen-Weg (`outputMode: 'share'`): die Datei geht in den versteckten Export-Ordner und dann an die Standard-App. Auf dem
 *  Desktop wäre das ein fremdes Fenster; der Stub aus der Brücke fängt den Aufruf ab. Prüfung und Stub liegen in
 *  `tools/obsidian-cdp/teilen.ts` (Dach, Welle 24), hier bleiben Notiz, Befehl und erwarteter Dateiname. */
async function pruefeTeilen(cdp: Cdp, vaultDir: string): Promise<void> {
  console.log('\nI · Teilen-Modus (Fremddatei im Export-Ordner)');

  const notiz = 'Smoke.md';
  const erwartung = { exportName: 'Smoke.pdf', exportPfad: `${TEILEN_ORDNER}/Smoke.pdf` };
  const fall = async (mitFremd: boolean, antwort: 'loeschen' | 'behalten'): Promise<TeilenBeobachtung> => {
    // Ausgangszustand VOR dem Lauf, nicht erst im `finally` (CORE-TEST-21).
    const stand = stelleOrdnerHer(vaultDir, TEILEN_ORDNER, { mitFremddatei: mitFremd });
    await clearNotices(cdp);
    const offen = await openExisting(cdp, notiz, 'preview');
    if (!offen) throw new Error(`Notiz ließ sich nicht öffnen oder rendern: ${notiz}`);
    await closeExtraLeaves(cdp);
    const lauf = await loeseExportAus(cdp, { befehl: `${PLUGIN_ID}:export-letter-pdf`, antwort });
    await new Promise((r) => setTimeout(r, 400));
    return { vorher: stand.vorher, nachher: readdirSync(stand.ordner).sort(), lauf };
  };

  const stub = await stubAn(cdp);
  try {
    await setSettings(cdp, { outputMode: 'share', filenameTemplate: '{notiz}' });
    if (!stub.aktiv) {
      const grund = 'Stub für openWithDefaultApp/canShare nicht aktiv — Fälle nicht hergestellt';
      for (const n of PUNKTE.filter((p) => p.startsWith('I'))) unmeasured(n, grund);
      return;
    }
    const behalten = await fall(true, 'behalten');
    const loeschen = await fall(true, 'loeschen');
    const still = await fall(false, 'loeschen');
    zeichne('I1 Teilen: Fremddatei im Export-Ordner löst die Rückfrage aus, „Keep them“ lässt sie liegen', beurteileTeilen('behalten', behalten, erwartung));
    zeichne('I2 Teilen: „Delete them“ löscht die Fremddatei, eigene Reste verschwinden in beiden Fällen', beurteileTeilen('loeschen', loeschen, erwartung));
    zeichne('I3 Teilen: ohne Fremddatei keine Rückfrage, die Datei geht an die Standard-App (Stub)', beurteileTeilen('still', still, erwartung));
    zeichne('I4 Teilen: die Antwort auf die Rückfrage entscheidet (Gegenprobe zu I1 und I2)', gegenprobeAntwort(behalten, loeschen, {}));
  } finally {
    const ende = await stubAus(cdp);
    if (!ende.wiederhergestellt) warnungen.push('Teilen-Stub nicht wiederhergestellt (openWithDefaultApp/canShare)');
    if (!raeumeOrdnerAuf(vaultDir, TEILEN_ORDNER)) warnungen.push(`${TEILEN_ORDNER} ließ sich nicht entfernen`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.has('setup')) {
    setupVault();
    return;
  }

  // Kein Standardport: 9222 gehört der regulären Instanz, an der andere Sessions hängen.
  const portArg = args.value('port');
  if (!portArg || !Number.isInteger(Number(portArg))) {
    throw new Error('--port <Port> ist Pflicht (Zweitinstanz, z. B. --port 9389) — kein Standardport.');
  }
  const port = Number(portArg);
  const vaultFilter = args.value('vault') ?? REPO_NAME;
  const behalten = args.has('keep');

  const cdp = await attachTo('workspace', port, vaultFilter);
  if (!cdp) throw new Error(`Kein Obsidian-Fenster für Vault "${vaultFilter}" auf Port ${port}.`);

  let vorher: Record<string, unknown> | null = null;
  let vaultDir = '';
  // Die Test-Einstellungen (data.json des Vaults) und die erzeugten PDFs gehen als EIN Schritt beim Abbruch-Modul der
  // Bruecke zurueck (`beimAbbruch`, angemeldet VOR der ersten Aenderung). Ctrl-C/SIGTERM: das Modul sperrt den
  // Hauptzweig, faehrt den Schritt, druckt die Bilanz, Exit 130 — der fruehere lokale Handler lief neben dem `finally`
  // her (Rennen). `vorher` ist zum Zeitpunkt des Signals der jeweils aktuelle Wert (per closure, kein Snapshot).
  const zustandZurueck = async (): Promise<void> => {
    if (vorher) await setSettings(cdp, vorher);
    if (vaultDir && !behalten) raeumePdfs(vaultDir);
  };
  const zustand = beimAbbruch(zustandZurueck, 'Einstellungen und erzeugte PDFs zurücksetzen');

  try {
    await cdp.mitschnitt((zeile) => { if (/error|exception/i.test(zeile)) warnungen.push(`Renderer: ${zeile}`); });
    await requireVisible(cdp);

    const v = await vaultInfo(cdp);
    vaultDir = v.basePath;
    console.log(`Vault: ${v.name} (${v.basePath})`);

    // Läuft dieser Lauf gegen den eigenen Stand? `manifest.version` ist dagegen blind:
    // Store-Build und Repo-Build tragen dieselbe Nummer. Der Pfad kommt aus der LAUFENDEN
    // Instanz, nicht aus stagingVaultDir() — sonst prüfte der Guard eine andere Datei als
    // die benutzte.
    requireEigenerBuild(
      join(v.basePath, v.configDir, 'plugins', PLUGIN_ID, 'main.js'),
      join(REPO_ROOT, 'main.js'),
      (m) => warnungen.push(m),
    );

    // A1 zuerst, DANN der Settings-Vorwert. Andersherum bricht der Lauf bei fehlendem
    // Plugin in readSettings ab — mit `TypeError ... reading 'settings'`, einer Meldung,
    // die auf einen Defekt im Treiber zeigt statt auf den tatsächlichen Zustand. Gemessen
    // im ersten Lauf gegen einen frischen Staging-Vault (2026-09-02, 17:08).
    await pruefeGrundlage(cdp, v);

    vorher = await readSettings(cdp);
    // B0 — ein per Ctrl-C abgebrochener Vorlauf haette `vorher` NIE zurueckgeschrieben; der
    // hier gelesene Wert waere dann bereits der letzte Test-Patch (pruefeAblage schreibt zum
    // Schluss outputMode:'customFolder', outputFolder:'Export/Briefe') statt des echten
    // Ausgangszustands. Ohne diese Reparatur wuerde JEDER kuenftige Lauf den kaputten Wert als
    // "Original" uebernehmen und dauerhaft auf sich selbst zurueckschreiben — eine Korruption,
    // die sich selbst verewigt, statt beim naechsten Lauf aufzufallen.
    const kaputtesVorher = vorher.outputMode === 'customFolder' && vorher.outputFolder === 'Export/Briefe';
    record(
      'B0 Kein liegen gebliebener Test-Ausgabepfad aus einem abgebrochenen Vorlauf',
      !kaputtesVorher,
      kaputtesVorher
        ? 'outputMode/outputFolder trugen den G4-Testwert — auf Plugin-Default (nextToNote/"") zurueckgesetzt'
        : 'Ausgangszustand unauffaellig',
    );
    if (kaputtesVorher) {
      vorher = { ...vorher, outputMode: 'nextToNote', outputFolder: '', filenameTemplate: '{notiz}' };
    }
    raeumePdfs(vaultDir);
    const grundBytes = await pruefeGrundfall(cdp, vaultDir);
    pruefeBriefinhalt(grundBytes);
    await pruefeFrontmatter(cdp, vaultDir);
    await pruefeDegradation(cdp, vaultDir);
    await pruefeMehrseitig(cdp, vaultDir);
    await pruefeAblage(cdp, vaultDir, port, vaultFilter);
    await pruefeVorschau(cdp);
    await pruefeTeilen(cdp, vaultDir);

    skipped(
      'Desktop-Druckpfad (letterhead:export-letter)',
      'ruft doPrint() und öffnet den OS-Druckdialog — ein modaler Systemdialog blockiert jede weitere CDP-Kommunikation. Bleibt Handarbeit',
    );
    skipped(
      'iOS-Share-Kaskade (navigator.canShare → share → openWithDefaultApp)',
      'der Desktop-Teil der Kaskade (canShare falsch → openWithDefaultApp) läuft in I1–I4 gegen einen Stub; `navigator.share()` und das System-Share-Sheet gibt es nur auf dem Gerät — Geräte-Gegenprobe',
    );
    skipped(
      'SVG-Logo im Briefkopf',
      'auf iOS taintet WebKit das Canvas beim drawImage eines SVG (bekannter, vorbestehender Bug); auf dem Desktop rastert Chromium korrekt, der Punkt würde die Grenze also verdecken statt sie zu messen',
    );
  } finally {
    // Nach Ctrl-C räumt das Abbruch-Modul auf, druckt die Bilanz und beendet den Prozess; dieser Zweig darf dann weder ein
    // zweites Mal aufräumen noch die Bilanz ein zweites Mal drucken.
    if (istAbgebrochen()) return;
    // Normalweg: Vorwert zurück. Die Settings des Prüflings sind das Einzige, was
    // dieser Lauf am Wirt verändert — die PDFs sind seine eigene Ausgabe.
    if (vorher) {
      try {
        await setSettings(cdp, vorher);
        const nachher = await readSettings(cdp);
        const gleich = JSON.stringify(nachher) === JSON.stringify(vorher);
        console.log(`\nEinstellungen zurückgeschrieben: ${gleich ? 'byte-gleich' : 'ABWEICHUNG — von Hand prüfen'}`);
      } catch (e) {
        console.error(`Einstellungen NICHT zurückgeschrieben: ${(e as Error).message}`);
      }
    }
    if (vaultDir && !behalten) {
      const n = raeumePdfs(vaultDir);
      console.log(`Erzeugte PDFs entfernt: ${n}`);
    }
    // Abmelden, sonst liefe ein SPAETES Signal (nach normalem Abschluss, cdp schon zu) gegen eine tote Verbindung.
    zustand();
    cdp.close();
  }

  bilanz.abschluss();
  for (const w of warnungen) console.log(`WARNUNG: ${w}`);
  console.log(
    'Nicht mechanisch geprüft: wie der Brief AUSSIEHT — DIN-Maße am Fensterkuvert, Grauwert,\n' +
    'Umbruchästhetik, Logo-Platzierung. Dafür bleibt der Blick aufs Papier.',
  );
}

runDriver(main);
