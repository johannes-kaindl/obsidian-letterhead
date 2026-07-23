// Obsidian-Guideline-Gate (PROF-OBS-08): type-checked gegen ECHTE obsidian-Typen.
// KEIN Inline-`// eslint-disable` — genuin unvermeidbare Ausnahmen NUR als file-scoped
// Override unten, mit Begruendung. Erzwungen von `scripts/check-no-inline-disables.mjs`
// (erster Schritt von `npm run lint`); der Store wertet ein Inline-disable als ERROR.
//
// Eingefuehrt in 1.4.1, nachdem der Store-Review von 1.4.0 vier Errors fand, die lokal
// unsichtbar waren: letterhead war das letzte Dach-Plugin ohne dieses Gate.
import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
  { ignores: ["main.js", "node_modules/", "tests/", "src/vendor/"] },
  ...tseslint.configs.recommendedTypeChecked,
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // Keine Regel-Overrides mehr: obsidianmd/prefer-create-el ist seit 1.6.1 im Code
    // aufgeloest statt abgeschaltet — canvas via Factory-Injektion in core/image.ts,
    // createEl/createDiv in src/obsidian/*.ts (iframe-Realm ueber doc.adoptNode). Der
    // frueher noetige `--fix`-Schutz entfaellt damit; der Store meldet 0 Warnings.
  },
);
