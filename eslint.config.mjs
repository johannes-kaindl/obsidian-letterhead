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
    rules: {
      // Off, not warn — `--fix` rewrites warnings too, and this rule's autofix
      // BREAKS this repo in two ways, both observed while setting the gate up:
      //   src/core/image.ts   → `activeWindow.createEl('canvas')`, which is not
      //                         on the Window type at all (tsc TS2339), and
      //                         core/ must stay free of Obsidian globals.
      //   src/obsidian/*.ts   → bare `createEl()`, a global that only exists
      //                         inside a running Obsidian; the do-print tests
      //                         then die with "createEl is not defined".
      // Shimming createEl in the tests would mean asserting against our own
      // stub rather than Obsidian — the exact trap behind the 1.4.0 code-block
      // bug. The store reports this rule as a warning, never as a blocker.
      "obsidianmd/prefer-create-el": "off",
    },
  },
);
