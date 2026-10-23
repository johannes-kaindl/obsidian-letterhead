---
paths:
  - "src/core/model.ts"
  - "src/vendor/kit/pdf/dom-to-ir.ts"
  - "src/i18n/strings.ts"
  - "src/obsidian/main.ts"
  - "scripts/gui-smoke.ts"
  - "fixtures/vault/**"
---

# Degradations-Platzhalter — Briefsprache

- **Der Degradations-Platzhalter folgt der BRIEFsprache, nicht der Oberflächensprache.** `[Formel]`/`[Grafik]` bzw. `[Formula]`/`[Graphic]` (das Label-Set trägt auch die Bild-Platzhalter `phImage`/`phImageFailed`) stehen in `LETTER_LABELS` (`src/core/model.ts`) neben „Anlagen“/„Enclosures“, nicht in `src/i18n/strings.ts`: sie werden **gedruckt**. Ein deutsches Obsidian kann einen englischen Brief setzen — dort wäre ein `[Grafik]` neben `Enclosures` ein Sprachbruch. Kit 0.30.0 reicht die Texte über `domToIrSync(el, { placeholders })` durch (die Verdrahtung steht in `src/obsidian/main.ts`), statt sie in der puren Schicht festzuschreiben; ein i18n-Import dort hätte genau die Kopplung hereingeholt, gegen die `check:pure` läuft.
- **Bedingung, an der das hängt:** Prüfpunkt **D4** des GUI-Smoke ist der einzige, der die Verdrahtung misst — im deutschen Brief liefert der Kit-Default denselben Text, ein weggefallenes `placeholders` bliebe dort unsichtbar. Wer das Fixture `Smoke-Englisch.md` um sein rohes SVG erleichtert, nimmt dem Punkt seinen Gegenstand.
