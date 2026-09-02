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
| **D · Frontmatter** | englische Aliasse · Schlüssel case-insensitiv, Trennzeichen egal · `language: en` schaltet die Brief-Etiketten |
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
| — | — | steht aus | steht aus |
