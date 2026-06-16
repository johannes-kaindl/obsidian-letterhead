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

- **Die Quelle ist die Auslieferung.** Das Plugin ist abhängigkeitsfreies Zero-Build-
  Vanilla-JS. Das ausgelieferte `main.js` ist der committete Quellcode — unminifiziert,
  ungebündelt, byte-identisch. Es gibt keinen Build-Schritt, dem du vertrauen müsstest;
  du liest genau das, was läuft.
- **Keine Netzwerkzugriffe, keine Telemetrie.** Kein `fetch`/`XMLHttpRequest`, keine
  Remote-Endpunkte, kein Tracking. Alles passiert lokal in deinem Vault.
- **Keine dynamische Code-Ausführung.** Kein `eval`, kein `new Function`, kein
  dynamisches `import()`. Der einzige Modul-Import ist die Obsidian-API selbst.
- **Externe Assets nur als `data:`-URL.** Der einzige `btoa()`-Aufruf bettet dein
  konfiguriertes Logo (eine lokale Vault-Datei) als `data:`-URL in den Brief ein — es
  wird nichts aus dem Web geladen.
- **Minimaler Vault-Zugriff.** Liest Notizen über die Obsidian-API und schreibt nur den
  exportierten Brief in einen dedizierten Export-Ordner (der iOS-Druck-Pfad).

### Hinweis zum Community-Scorecard
Der Hinweis *„build verification not available"* im Verzeichnis-Scorecard ist eine
direkte Folge des bewussten Zero-Build-Designs: Es gibt keinen Build zu verifizieren,
weil die veröffentlichte Datei **die** Quelle ist. Wir betrachten lesbaren, ungebündelten
Quellcode als die stärkere Garantie und behalten das absichtlich bei (siehe
[`AGENTS.md`](AGENTS.md) → *Abweichungen von der Leitkonvention*).

Zusätzlich zu diesem lesbaren Quellcode tragen Releases eine **GitHub Artifact
Attestation** (Sigstore/SLSA-Build-Provenance): Der Release-Workflow signiert exakt die
committeten Bytes von `main.js`, `manifest.json` und `styles.css` — er baut nichts, das
attestierte Subjekt ist also byte-für-byte identisch mit der Quelle, die du lesen kannst.
Du bekommst beides: offenen Code, den du mit bloßem Auge prüfen kannst, und einen
kryptografischen Nachweis, woher die veröffentlichten Bytes stammen.
