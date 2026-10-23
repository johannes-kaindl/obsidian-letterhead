---
paths:
  - "src/obsidian/html-engine.ts"
  - "src/core/head-layout.ts"
  - "src/core/model.ts"
  - "styles.css"
  - "tools/render-hero.sh"
---

# DIN-Layout und Seitenränder — Gotchas

- **DIN-Maße (Kopf 45/27 mm, Falz 105/210 bzw. 87/192 mm, Loch 148,5 mm) sind kuvert-kritisch;** Änderungen nur mit Render-Check (siehe `tools/render-hero.sh`).
- **Gedruckt wird mit festen `@page`-Rändern** (Seite 1 oben 10 mm, Folgeseiten oben 25 mm, unten 20 mm — Drucker-Beschnitt + Seitenumbruch-Ränder). Die `--bk-din-*`-Tokens bleiben trotzdem **papierbezogen**: die Komponenten ziehen `--bk-print-margin-top` per `calc()` ab. Die Vorschau paginiert den Brief in `.bk-sheet`-Blätter mit denselben Schnitthöhen (Modal `paginate()`). Beim Ändern von Positionen immer dieses Schema beibehalten.
- **`createEl` im iframe-Realm gibt es nicht.** Die Vorschau-Paginierung (`html-engine.ts` `paginate()`) arbeitet auf `frame.contentDocument` — einer eigenen Realm, in der Obsidian weder `createEl`/`createDiv` noch `doc.win`/`setCssProps` augmentiert (dieselbe Grenze wie beim `<style id="bk-fit">`-Trick). `obsidianmd/prefer-create-el` schlägt dort `doc.win.createDiv()` vor — das wäre ein stiller `TypeError` im `catch`. Korrekt: in der Hauptseite mit `createDiv()` erzeugen und per `doc.adoptNode()` übernehmen. In `core/` gilt zusätzlich das Verbot von Obsidian-Globals (PROF-OBS-04) → dort Elemente injizieren (Canvas-Factory in `imageToJpeg`), nicht `createEl` aufrufen.
