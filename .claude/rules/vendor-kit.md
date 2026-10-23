---
paths:
  - "src/vendor/**"
  - "tools/kit-sync.json"
  - "tools/sync-kit.sh"
  - "scripts/check-pure.mjs"
---

# Vendor und Kit — Gotchas

Das Vendoring läuft über das zentrale Werkzeug im Dach: `sh tools/sync-kit.sh` ruft `../tools/kit-sync/kit-sync.mjs` (`--check` vergleicht nur). Pins und Modulliste stehen in `tools/kit-sync.json`. Nie von Hand nachziehen; Änderungen gehören stromaufwärts ins Kit.

- **Der Vendor-Baum stammt aus ZWEI Quellen (seit 2026-09-02).** `src/vendor/kit/pdf/*` und `vault-path.ts` kommen aus `obsidian-kit`, `filename-template.ts` (und `data-url`, `local-stamp`) aus **`code-kit`** — seit obsidian-kit `2ab1bb5` liegt die domänenfreie pure-Teilmenge in einem eigenen Repo, und ein Lauf, der sie weiter unter `obsidian-kit/src/pure/` sucht, findet sie nicht mehr. `src/vendor/kit/VENDOR.json` führt deshalb **beide** Pins; der Kopf jeder vendorten Datei nennt ihre Herkunft.
- **`kit-sync` peelt Tags selbst (`^{commit}`);** code-kit taggt annotiert, ein ungepeeltes `rev-parse` liefert die SHA des Tag-Objekts, die in `git log` der Quelle nie vorkommt (obsidian-kit taggt leichtgewichtig, dort fiele das Fehlen nicht auf).
- **Gelesen wird per `git show <ref>:<pfad>` aus den Tag-Refs** (CORE-META-22), nie aus dem Arbeitsstand des Nachbar-Repos, und alle Quellpfade werden geprüft, bevor die erste Datei geschrieben wird — sonst bliebe bei einem Abbruch mitten im Lauf eine Datei zurück, die den „do not hand-edit“-Kopf trägt und darunter leer ist.
- **Ein Kit-Modul, das ein weiteres importiert, bringt die Kante mit.** `kit-sync` bricht dann vor dem Schreiben mit „Hülle“ ab und nennt das fehlende Modul; die Konfig bekommt das Modul und ggf. ein `rewrite`.
- **Ein neues Obsidian-gekoppeltes Kit-Modul gehört nach `src/vendor/kit-obsidian/`,** nicht in eine weitere Ausnahme von `scripts/check-pure.mjs`: `EXCLUDED` trägt nur diesen einen Ordner.
- **`check:pure` ist ein Script, kein grep-Einzeiler** (`scripts/check-pure.mjs`): der frühere Einzeiler matchte nur `from 'obsidian'` mit einfachen Anführungszeichen — dem Repo-Stil. Das vendored Kit schreibt teils doppelte, womit das Gate blind war für genau den Fremdcode, den es prüft (gemessen im drift-audit 2026-08-05: Verstoß mit doppelten Quotes lief grün durch). Wer es anfasst: gegen einen echten Verstoß in **beiden** Quote-Stilen laufen lassen und den Exit-Code prüfen.
