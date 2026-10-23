---
paths:
  - "src/obsidian/main.ts"
  - "src/obsidian/html-engine.ts"
  - "src/obsidian/output.ts"
---

# Export und Druck — Gotchas

Aufbau der beiden Export-Wege: `docs/internal/architecture.md`.

- **Der Desktop-Druck läuft seit 1.4.1 über ein eigenes iframe** (`doPrint`, `srcdoc` = `buildStandaloneDoc`) statt über `@media print` + Ausblenden der Obsidian-DOM. Grund: der Store-Review von 1.4.0 verbot beides (`<style>` in `document.head`, `innerHTML` auf der App-DOM). **Bedingung, an der das hängt:** `doPrint` darf ausschließlich hinter `Platform.isDesktopApp` aufgerufen werden (aktuell genau eine Stelle, `main.ts` in `exportLetter`). Auf iOS druckt iframe-`print()` das Eltern-Dokument — dort geht der Export über `exportViaPdf`, nie über `doPrint`. Wer einen zweiten `doPrint`-Aufrufer ergänzt, muss dieses Gate mitziehen.
- ⚠️ **`buildStandaloneDoc` ist kein Löschkandidat.** Bis 1.3.0 schrieb `exportViaShare()` damit ein eigenständiges HTML für den Quick-Look-Umweg; diese Methode **existiert seit 1.4.0 nicht mehr**, Mobile ist seither immer Vektor-PDF. Hier stand bis 2026-09-02 das Gegenteil („wird von keinem Export-Pfad mehr aufgerufen“). Der Satz stimmte für genau eine Version: 1.4.1 hat den **Desktop**-Druck darauf umgestellt (`html-engine.ts`, `frame.srcdoc = buildStandaloneDoc(...)`, plus zwei Tests). Eine Herkunftsnotiz altert mit dem Code, den sie beschreibt.
- **SVG-Bilder werden auf iOS nicht ins Vektor-PDF gerastert** (bekannter Bug, vorbestehend seit 1.4.0): WebKit taintet das Canvas beim `drawImage` eines SVG → `toDataURL()` wirft `SecurityError` → `imageToJpeg` gibt `null` → `[Bild: …]`-Platzhalter. Betrifft SVG-Logos/-Body-Bilder nur auf iOS; PNG/JPEG sind unbetroffen. Desktop (Chromium) rastert SVG korrekt.
