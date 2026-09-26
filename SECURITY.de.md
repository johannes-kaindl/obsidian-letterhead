# Sicherheitsrichtlinie

> [🇬🇧 English](SECURITY.md) · 🇩🇪 Deutsch

## Unterstützte Versionen
Die jeweils zuletzt veröffentlichte Version erhält Sicherheits-Updates.

## Sicherheitslücke melden
Sicherheitslücken bitte **nicht** öffentlich als Issue melden, sondern per E-Mail an
**code@jkaindl.de** (gerne PGP-verschlüsselt). Du bekommst zeitnah eine Rückmeldung und
wirst über den Fix-Verlauf auf dem Laufenden gehalten.

## Auditierbarkeit & Lieferkette
Letterhead ist so gebaut, dass du durch Lesen überprüfen kannst, was es tut:

- **Lesbare Quelle, reproduzierbar gebaut.** Das Plugin ist TypeScript in `src/`, per
  `esbuild` zu `main.js` gebündelt. `main.js` ist ein Build-Artefakt — gitignored,
  nicht committet —, es gibt also keine byte-identische „Quelle = Auslieferung"-Datei
  mehr zu zeigen; stattdessen baut GitHub Actions ein Release frisch aus der getaggten
  Quelle und attestiert es kryptografisch (siehe *Auslieferungswege* unten — dort steht,
  was welcher Weg belegt und was nicht). Die Quelle selbst bleibt vollständig lesbar,
  unminifiziert und dependency-arm.
- **Keine Netzwerkzugriffe, keine Telemetrie.** Kein `fetch`/`XMLHttpRequest`, keine
  Remote-Endpunkte, kein Tracking. Alles passiert lokal in deinem Vault.
- **Keine dynamische Code-Ausführung.** Kein `eval`, kein `new Function`, kein
  dynamisches `import()`. Die einzige Laufzeit-Fremdabhängigkeit ist die Obsidian-API
  selbst.
- **Externe Assets nur als `data:`-URL.** Der einzige `btoa()`-Aufruf
  (`src/core/frontmatter.ts`) bettet dein konfiguriertes Logo (eine lokale
  Vault-Datei) als `data:`-URL in den Brief ein — es wird nichts aus dem Web geladen.
- **Minimaler Vault-Zugriff.** Liest Notizen über die Obsidian-API und schreibt nur den
  exportierten Brief (HTML oder das erzeugte PDF) in einen dedizierten Export-Ordner
  (der mobile Export-Pfad).
- **Eigene PDF-Engine, keine Laufzeit-Dependency.** Der mobile Vektor-PDF-Export
  entsteht in einem abhängigkeitsfreien PDF-Writer (die vendorte
  `obsidian-kit`-PDF-Engine unter `src/vendor/kit/pdf/`) — keine Fremdbibliothek für
  PDF, kein `fetch`. Die fertige Datei wird über das System-Teilen-Menü ans
  Betriebssystem übergeben.

### Hinweis zum Community-Scorecard
Frühere Versionen von Letterhead waren Zero-Build-Vanilla-JS, und der Hinweis
*„build verification not available"* im Verzeichnis-Scorecard spiegelte das wider —
es gab keinen Build zu verifizieren, weil die veröffentlichte Datei die Quelle *war*.
Seit das Plugin auf TypeScript + esbuild umgestellt hat (um die PDF-Engine über ein
vendortes Kit mit anderen Plugins zu teilen — siehe [`AGENTS.md`](AGENTS.md) →
*Abweichungen von der Leitkonvention*), gilt dieser Hinweis nicht mehr im selben Sinn:
`main.js` wird jetzt tatsächlich gebaut. Provenance kommt jetzt aus der unten
beschriebenen Reproducible-Build-Attestation, nicht mehr aus Byte-Identität von
Quelle und Auslieferung.

Ein GitHub-Release trägt eine **GitHub Artifact Attestation**
(Sigstore/SLSA-Build-Provenance): Der Release-Workflow checkt den getaggten Commit aus,
führt `npm ci` + `npm run gate` aus (inklusive Build) und signiert die dabei entstandenen
Dateien `main.js`, `manifest.json` und `styles.css` — exakt die Bytes, die er gerade gebaut
hat, per OIDC an den GitHub-Actions-Workflow-Lauf und den getaggten Commit gebunden. Wo
dieser Weg verfügbar ist, bekommst du beides: offenen, lesbaren TypeScript-Quellcode zum
Prüfen und den kryptografischen Nachweis, dass der ausgelieferte Build aus dieser Quelle
stammt.

### Auslieferungswege
Letterhead wird über zwei Wege ausgeliefert. Sie tragen **nicht** dieselbe Zusage, und es
lohnt sich zu wissen, woher die eigene Kopie stammt:

| Weg | Liefert | Belegt |
|---|---|---|
| **GitHub-Release** — von Actions gebaut | `main.js`, `manifest.json`, `styles.css` plus Sigstore/SLSA-Attestation | dass genau diese Bytes vom Workflow dieses Repositorys aus dem getaggten Commit gebaut wurden |
| **Forgejo-Release** — `git.jkaindl.de` | dieselben drei Dateien plus `checksums.sha256` | dass die heruntergeladenen Dateien die veröffentlichten sind — Unversehrtheit, keine Build-Provenance |

**Releases ohne Attestation:** 1.6.5 und 1.6.6 wurden nicht vom GitHub-Actions-Workflow gebaut und tragen deshalb keine Attestation (für 1.6.6 am 2026-09-26 geprüft: `gh attestation verify` findet keine). Am Build selbst ändert das nichts: beide entstanden über dasselbe `npm run gate` aus der getaggten Quelle, und `checksums.sha256` deckt die veröffentlichten Dateien ab. Was fehlt, ist die unabhängige kryptografische Verbindung zwischen diesen Dateien und dem Commit — eine Prüfsumme, die vom selben Server kommt wie die Dateien, kann diese Verbindung allein nicht herstellen.

Wer für eine dieser beiden Versionen Build-Provenance braucht, baut stattdessen selbst aus der Quelle: Tag auschecken, `npm ci && npm run build` ausführen und das entstandene `main.js` gegen das ausgelieferte halten. Über den Release-Workflow veröffentlichte Releases tragen die unten beschriebene Attestation.

### Release verifizieren
Wird ein Release über GitHub Actions veröffentlicht, baut der Workflow `main.js` aus der
getaggten Quelle und signiert es mit einer Sigstore/SLSA-Build-Provenance-Attestation. Du
kannst bestätigen, dass das laufende `main.js` vom Release-Workflow dieses Repositorys aus
der getaggten Quelle gebaut wurde:

```sh
gh attestation verify main.js --repo johannes-kaindl/obsidian-letterhead
```

⚠️ **Für 1.6.5 und 1.6.6 kann dieser Befehl nicht erfolgreich sein**, weil diese Releases keine Attestation haben. Ein Fehlschlag ist dort der erwartete Ausgang und **kein** Hinweis auf Manipulation; nutze stattdessen die oben beschriebene Prüfung durch eigenen Build.

Das bedeutet nicht, dass das ausgelieferte `main.js` byte-identisch mit einer Datei im
Repository ist (es gibt keine — es ist Build-Output); es bedeutet, dass die
attestierten Bytes durch einen verifizierbaren Build des getaggten Commits entstanden
sind und nicht nachträglich ausgetauscht wurden.
