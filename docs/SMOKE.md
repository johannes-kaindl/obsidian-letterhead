# GUI-Smoke — Abnahme gegen ein laufendes Obsidian

Erfüllt CORE-TEST-02 (b): das **getrackte** Werkzeug, das die mechanisch entscheidbaren
Abnahmepunkte gegen ein echtes Obsidian fährt statt gegen den Mock.

```bash
npm run build
npm run smoke:gui -- --setup          # Staging-Vault aus fixtures/vault/ bauen
npm run smoke:gui                     # Lauf gegen Port 9222, Vault obsidian-letterhead
npm run smoke:gui -- --port 9334      # gegen eine Zweitinstanz
npm run smoke:gui -- --keep           # erzeugte PDFs stehen lassen (Ansehen)
```

## Warum das PDF der Prüfgegenstand ist, nicht das DOM

Letterheads teuerste Defekte lagen alle in der Naht zwischen Obsidian und der puren Engine:
**das Export-DOM ist nicht das Preview-DOM.** Drei belegte Fälle, alle gegen den
Obsidian-Mock unsichtbar:

- Ein Fence, der ohne Leerzeile an einer Textzeile klebt, ist valides CommonMark. Der
  interne Platzhalter landete per Soft Break im selben Absatz, wurde nicht mehr aufgelöst —
  der Codeblock fiel aus dem PDF, und `LETTERHEADCODE0` wurde als Fließtext gedruckt.
  Bestand seit 1.4.0, behoben in 1.6.4 (Prüfpunkt **E4**).
- MathJax und nacktes SVG tragen keinen Textknoten; der Fallback prüfte nur `textContent`
  und ließ sie **spurlos und ungezählt** fallen — die Sammel-Notice schwieg, während Inhalt
  fehlte (**E5**, **E7**).
- `- [ ]` und `- [x]` wurden optisch gleiche Bullets: der Brief log über den Stand der
  Aufgaben (**E2**).

Der Treiber misst deshalb **die Datei, die im Vault landet**. Das ist zugleich der einzige
Ort, an dem sich Degradation von Verlust unterscheiden lässt: ein PDF ohne die Grafik und
ohne Zähler sieht von innen genauso aus wie eines, in dem nie eine war.

Gelesen wird ohne PDF-Bibliothek: die Engine schreibt ihre Content-Streams unkomprimiert
und jeden Textlauf als `(...) Tj`, escaped werden nur `(`, `)` und `\`. Das Fixture trägt
dafür `MARK…`-Marker an jedem Feld und jedem Element — sie machen mechanisch entscheidbar,
was den Weg durch `dom-to-ir` und die Layout-Schicht überstanden hat.

Die WinAnsi-Rückschrift im Treiber (`winAnsi()`) ist kein Beiwerk: Latin-1 und WinAnsi
stimmen erst ab `0xA0` überein, und das **€** liegt bei `0x80`. Ohne sie wäre C6 dauerhaft
rot bei intaktem Code — ein Prüfwerkzeug, das seinen eigenen Messkanal falsch dekodiert,
meldet den Fehler beim Prüfling.

## Was der Treiber bewusst NICHT auslöst

`letterhead:export-letter` — der Haupt- und Ribbon-Befehl — ruft auf dem Desktop
`doPrint()` und öffnet den **OS-Druckdialog**. Ein modaler Systemdialog blockiert jede
weitere CDP-Kommunikation; der Lauf hinge, und niemand sähe warum. Gemessen wird
stattdessen `letterhead:export-letter-pdf` (`exportViaPdf`) — dieselbe Vektor-Engine, ohne
Dialog. Der Druckpfad bleibt Handarbeit und steht als übersprungener Punkt im Protokoll.

Ebenfalls übersprungen und im Lauf begründet: die iOS-Share-Kaskade
(`navigator.canShare` → `share` → `openWithDefaultApp`, plattformgebunden) und das
SVG-Logo im Briefkopf — auf iOS taintet WebKit dort das Canvas (bekannter, vorbestehender
Bug), auf dem Desktop rastert Chromium korrekt. Ein grüner Punkt auf dem Desktop würde die
Grenze verdecken statt sie zu messen.

## Voraussetzung

⚠️ **Der Debug-Port ist geteilte Infrastruktur.** Vor jedem Lauf prüfen, wer sonst an
Obsidian hängt — ein `quit` zerstört fremde Messreihen, und der eigene Lauf ist danach
sauber grün:

```bash
lsof -nP -iTCP:9222 -sTCP:LISTEN >/dev/null && echo "läuft bereits — NICHT beenden"
curl -s http://127.0.0.1:9222/json/list | grep -o '"title":"[^"]*"'   # wen träfe ein Quit?
```

Der CDP-Lock ist die Eintrittskarte, nicht eine Schutzoption:

```bash
python3 ~/.claude/hooks/obsidian-cdp-lock.py acquire --label obsidian-letterhead \
  --exclusive focus --intent "GUI-Smoke, ca. 3 min, Staging-Vault obsidian-letterhead"
npm run smoke:gui
python3 ~/.claude/hooks/obsidian-cdp-lock.py release
```

**`--exclusive focus`, nicht `quit-reload`:** der Treiber ruft `requireVisible`, holt das
Fenster also nach vorn. Ein fremdes `activate` mittendrin zerschösse die Messung, und
`quit-reload` deckt nur `{quit}`. Umgekehrt gilt dasselbe — hält jemand anderes einen
`focus`-Lock, hilft auch **keine Zweitinstanz**: der macOS-Fokus ist systemweit, nicht
instanzgebunden. Dann warten.

## Prüfpunkte

| Gruppe | Punkte |
|---|---|
| **A · Grundlage** | Plugin geladen · alle vier Befehle registriert · Ribbon-Knopf |
| **B · Vektor-PDF** | PDF entsteht neben der Notiz · Datei ist ein PDF · Notice nennt den Pfad · Core-14-Schriften ohne `/FontFile` |
| **C · Briefinhalt** | Empfängeranschrift (3 Zeilen) · Betreff/Anrede/Gruß/Unterschrift · Infoblock-Bezugszeichen · Anlagenvermerk · Absender aus den Einstellungen · Umlaute und € als WinAnsi · Fließtext samt Auszeichnungen |
| **D · Frontmatter** | englische Aliasse · Schlüssel case-insensitiv, Trennzeichen egal · `language: en` schaltet die Brief-Etiketten · Degradations-Platzhalter folgt der Briefsprache |
| **E · Reiche Inhalte** | Tabelle · Task-Zustände unterscheidbar · Codeblock · **klebender Fence** · rohes SVG → `[Grafik]` · PNG als `/DCTDecode` eingebettet · Notice zählt die vereinfachten Elemente |
| **F · Mehrseitigkeit** | Umbruch auf mehrere Seiten · erster, mittlerer und letzter Absatz sind da |
| **G · Ablage** | `nextToNote` im Unterordner · zweiter Export zählt hoch statt zu überschreiben · Dateiname folgt `{datum} {empfaenger}` · `customFolder` legt den Zielordner an |
| **H · Vorschau** | Modal öffnet · paginiert in `.bk-sheet` · Falz- und Lochmarken gezeichnet |

**Nicht mechanisch geprüft und deshalb weiter Handarbeit:** wie der Brief *aussieht* — die
DIN-Maße am Fensterkuvert, Grauwert, Umbruchästhetik, Logo-Platzierung. Dafür bleibt der
Blick aufs Papier (siehe `tools/render-hero.sh`).

## Durchläufe

| Datum | Obsidian | Ergebnis | Gegenprobe |
|---|---|---|---|
| 2026-09-02 | 1.13.7 | **33/33 grün**, 3 begründet übersprungen | **32/33 — genau E4 rot** |
| 2026-09-02 (Kit 0.30.0) | 1.13.7 | **34/34 grün** | **33/34 — genau D4 rot** |

**Zur Gegenprobe vom 2026-09-02:** ausgebaut wurde die Leerzeilen-Polsterung in
`extractCodeBlocks` (`src/vendor/kit/pdf/code-blocks.ts`) — der Fix, der den
Codeblock-Verlust bei klebendem Fence behoben hat. E4 wurde rot und nannte dabei das
historische Symptom wörtlich: *„Inhalt FEHLT · LETTERHEADCODE als Fließtext SICHTBAR"*.
**Kein anderer Punkt fiel mit** — insbesondere blieb E3 (Codeblock *mit* Leerzeile davor)
grün, was belegt, dass E4 den klebenden Fall misst und nicht Codeblöcke im Allgemeinen.
Der Vendor-Baum wurde danach per `git checkout` wiederhergestellt; Gate grün, und der
Build im Staging-Vault ist per sha1 wieder identisch mit dem Repo-Build.

**Zwei Mängel fand der erste Lauf im Treiber selbst, nicht im Plugin** (beide behoben):

- `readSettings` lief **vor** Prüfpunkt A1. Fehlte das Plugin, brach der Lauf mit
  `TypeError … reading 'settings'` ab — einer Meldung, die auf einen Treiberdefekt zeigt
  statt auf den tatsächlichen Zustand. A1 läuft jetzt zuerst.
- Ein frisch gebauter Staging-Vault startet in Obsidians **Restricted Mode**; die
  `community-plugins.json` des Fixtures allein hebt das nicht auf. Der Treiber schaltet
  jetzt selbst frei — aber nur, wenn der Vault-Name dem Repo-Namen entspricht. In einem
  fremden Vault wäre das ein Eingriff in den Wirt; dort bleibt der Punkt rot und nennt den
  Grund.

**Womit der Lauf gefahren wurde:** einer **eigenen Zweitinstanz** auf Port 9334
(`--user-data-dir` mit eigener `obsidian.json`, in der der Staging-Vault vor dem Start
steht). Zwei Gründe: an der regulären Instanz hingen acht fremde Vault-Fenster, und
`obsidian://open?path=` hat den frisch gebauten Vault **nicht** registriert (gemessen
17:03 — `obsidian.json` blieb unverändert). Der CDP-Lock wird trotzdem genommen: der
macOS-Fokus ist systemweit, eine Zweitinstanz ändert daran nichts.

## Was der zweite Durchlauf gelehrt hat (2026-09-02, Kit 0.30.0)

**D4 ist der einzige Punkt, der die Platzhalter-Verdrahtung überhaupt messen kann.** Im
deutschen Brief liefert der Kit-Default denselben Text (`[Grafik]`) — ein weggefallenes
`placeholders` bliebe dort unsichtbar. Deshalb trägt `Smoke-Englisch.md` ein rohes SVG, und
deshalb stehen die beiden erwarteten Texte dort **absichtlich nicht im Fließtext**: in der
ersten Fassung taten sie das, wurden mitgedruckt, und D4 konnte nicht mehr unterscheiden, ob
das Wort vom Platzhalter oder aus dem Erklärsatz stammte. Wer das Fixture kürzt, nimmt dem
Punkt seinen Gegenstand.

⚠️ **Ein Gegenproben-Skript, das mit `git checkout` aufräumt, löscht uncommittete Arbeit.**
Am 2026-09-02 hat genau das die frisch gebaute Verdrahtung entfernt — der Lauf davor war
grün gewesen *für Code, den es danach nicht mehr gab*. Aufgefallen ist es nur, weil nach
einer Fixture-Reparatur noch einmal gefahren wurde. **Also: erst committen, dann sabotieren.**
Dann ist `git checkout` im Aufräumpfad eine Rückkehr zum geprüften Stand statt ein
Datenverlust. Wer nicht committen will, sichert die Datei vorher als Kopie und spielt die
zurück — der Zustand vor der Sabotage ist der Bezugspunkt, nicht `HEAD`.
