# Fixture-Vault für den GUI-Smoke

`scripts/gui-smoke.ts --setup` baut daraus den Staging-Vault
(`$STAGING_VAULTS_DIR/obsidian-letterhead`). Der Vault ist Wegwerfware, **dieses
Verzeichnis ist die Quelle** — verloren heißt neu gebaut, nicht rekonstruiert.

- `notes/` → Vault-Wurzel. Die `MARK…`-Marker sind der Zweck: sie machen im
  erzeugten PDF mechanisch entscheidbar, welches Frontmatter-Feld und welches
  Markdown-Element den Weg durch `dom-to-ir` und die Layout-Schicht überstanden hat.
  Ein Marker steht nie allein im Text, sondern immer am Feld, das er belegt.
- `obsidian/` → `.obsidian/` des Vaults. Nur Letterhead aktiv, helles Theme, keine
  fremden Post-Prozessoren, die das Export-DOM verändern würden.
- `make-assets.mjs` → erzeugt `assets/probe.png` im Vault. Binäres Prüfmaterial wird
  **erzeugt statt getrackt**: ein PNG im Repo ist ein Blob, den niemand reviewen kann.
  `logo.svg` liegt dagegen als Textdatei unter `notes/assets/` — SVG ist lesbar.

## Welche Notiz wofür

| Notiz | Prüfzweck |
|---|---|
| `Smoke.md` | Grundfall: alle Briefteile deutsch, Infoblock, Anlagen, Umlaute/€ (WinAnsi) |
| `Smoke-Englisch.md` | Englische Aliasse **und** die Schlüssel-Normalisierung: `Subject`, `SALUTATION`, `Your ref`, `our-ref` müssen dieselben Felder treffen wie ihre kanonischen Namen |
| `Smoke-Reich.md` | Degradation: Tabelle, Task-Zustände, Codeblöcke (darunter der **klebende Fence**, der bis 1.6.4 einen Codeblock verschluckte), rohes SVG → `[Grafik]`, eingebettetes Bild |
| `Smoke-Lang.md` | Mehrseitigkeit: 40 Absätze erzwingen den Seitenumbruch; der letzte Marker belegt, dass hinten nichts abfällt |
| `Unterordner/Smoke-Unterordner.md` | `nextToNote` aus einem Unterordner — die Pfad-Fügung, die seit 1.6.5 aus dem Kit kommt |

## Warum ein eigener Vault und nicht der Arbeitsvault

Im Arbeitsvault läge (a) womöglich der Store-Build statt des Repo-Stands und (b) fremdes
Prüfmaterial. Beides macht einen Lauf unbelegt, und `manifest.version` ist gegen den ersten
Fall strukturell blind: Store- und Repo-Build tragen dieselbe Nummer. Der Treiber prüft die
Herkunft deshalb am sha1 (`requireEigenerBuild`), und zwar an dem Pfad, den die **laufende**
Instanz nennt — nicht an dem, den die Konvention vorsieht.
