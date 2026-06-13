# Design: iOS-Export + Vorschau-Fix

- **Datum:** 2026-06-13
- **Ziel-Release:** 1.2.0
- **Status:** freigegeben (Design), Umsetzung offen

## Problem

Aus dem Pre-Submission-Handover (Runde 2) auf dem iPhone:

1. **Frontmatter-Vorlage unvollständig** — „In aktive Notiz einfügen" setzte nur `info_1`,
   obwohl das Plugin `info_1`…`info_4` rendert (Loop in `writeLetterModel`).
2. **iOS-PDF-Export funktioniert nicht** — der Export hängt an `window.print()`, das in
   der Obsidian-Mobile-WKWebView ein toter No-op ist (kein Druckdialog). Bestätigt am Gerät:
   beim Tippen auf „Als PDF exportieren" passiert sichtbar gar nichts.
3. **Vorschau auf iOS abgeschnitten** — die A4-Blätter (`.bk-sheet`) laufen auf schmalem
   Viewport rechts heraus (Absender-Rücksendezeile, Infoblock).

Nicht-Befund: „Failed to migrate to JSON storage" stammt **nicht** von Briefkopf
(String existiert nirgends im Code) — Fremd-Plugin/BRAT. Kein Handlungsbedarf.

### Randbedingung (entscheidend)

Test-Vault ist ein **reiner Obsidian-Sync-Vault im privaten App-Sandbox-Speicher** →
die iOS-Dateien-App sieht ihn nicht. Ein simples „HTML-Datei in den Vault schreiben und
in der Dateien-App drucken" läuft daher ins Leere. Der Export muss die Datei selbst ans
System übergeben.

## Lösung

### 0. Frontmatter-Vorlage (bereits umgesetzt)

`insertFrontmatterTemplate()` setzt jetzt `info_1`…`info_4` per Schleife statt nur `info_1`.
Aliasse je Feld beibehalten. Kein zweiter Bug: fehlende `empfaenger`/`betreff` in der
Nutzer-Meldung kamen daher, dass die Zielnotiz sie schon hatte (korrekt übersprungen).

### 1. iOS-Export via Teilen-Sheet (A')

Plattform-Verzweigung in der Export-Logik:

- **`Platform.isDesktopApp`** → bisheriger `doPrint()` (`window.print()`). **Unverändert.**
- **Mobile (iOS/iPad/Android)** → neuer `exportViaShare()`:
  1. `buildStandaloneDoc(letterHtml, css)` — vollständiges `<!DOCTYPE html>`-Dokument mit
     **eigenem** Wrapper-CSS. Anders als `PRINT_WRAPPER_CSS` (das den Brief mit
     `#briefkopf-print-root{display:none}` am Bildschirm versteckt und nur in `@media print`
     zeigt) muss der Brief hier auch am Bildschirm sichtbar sein, mit erhaltenen
     `@page`-Rändern (Seite 1 oben 10 mm, Folgeseiten oben 25 mm, unten 20 mm). Logo ist
     bereits inline als `data:`-URL.
  2. Schreibt das Dokument in die feste Datei `.briefkopf-export.html` im Vault-Root,
     bei jedem Export überschrieben (führender Punkt → in Obsidian unauffällig, minimaler
     Sync-Ballast).
  3. `app.openWithDefaultApp(pfad)` → iOS-Öffnen/Teilen-Sheet.
  4. **Kleines Modal** mit der Schritt-Anleitung: „In Safari öffnen → Teilen → Drucken →
     als PDF sichern."
- Greift an allen drei Triggern: Ribbon-Icon, Command, Vorschau-Button „Als PDF exportieren".

### 2. Vorschau-Fix

Die `.bk-sheet`-Blätter im Vorschau-Modal responsiv auf die Modal-/Viewport-Breite
skalieren (CSS `transform: scale()` bzw. responsive max-width), sodass eine A4-Seite
vollständig ins iPhone-Modal passt, statt rechts abgeschnitten zu werden. Druck-Schnitthöhen
unberührt lassen (Toleranz ±1 Zeile, AGENTS.md-Gotcha).

### 3. manifest + Doku ehrlich

`manifest.json`-Description: Export via Druckdialog auf Desktop, via Teilen-Sheet auf
iPhone/iPad. Doku (`docs/`) entsprechend angleichen.

## Risiken & Fallback B

- **`openWithDefaultApp`** ist eine reale, aber in den offiziellen Typen **undokumentierte**
  Obsidian-API (Obsidians eigene, kein roher Capacitor-Hack). Der Community-Review *kann*
  eine undokumentierte API beanstandet — Risiko mittel.
- Ob iOS bei einer `.html`-Datei sauber den Safari-Druckpfad anbietet, ist **am Gerät zu
  verifizieren**.

**Verifikations-Gate vor Release:** auf dem iPhone — Brief → Export → öffnet Safari? →
Teilen → Drucken → PDF mit korrekten Rändern?

**Fallback B** (falls Gate scheitert oder Review beanstandet): iOS-Export ausblenden
(`Platform.isDesktopApp`-Guard auf den Button), Description auf „Desktop-Export"
zurücknehmen. iOS behält Brief-Generierung + (gefixte) Vorschau.

## Architektur-Treue

- Kein Node/Electron, kein Netzwerk, keine neue Dependency (Zero-Build bleibt).
- Reine Bau-Funktion `buildStandaloneDoc` bleibt Obsidian-frei und damit Node-testbar.
- `data:`-URL-Logo, `@page`-Ränder und papierbezogene `--bk-din-*`-Tokens unverändert.
