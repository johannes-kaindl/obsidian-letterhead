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
  {
    // body-ir.ts takes the letter model as `any`. Typing it properly is real
    // work, not a rename: switching to LetterModel surfaces ~9 genuine type
    // errors in envelope-critical layout code (anlagen/.length/string
    // assumptions). Deliberately deferred to its own cut rather than rushed
    // into the store-compliance release — the 1.4.0 regression came out of
    // exactly this layer. Kept at "warn" (not off) so the debt stays visible;
    // no-explicit-any is off because its autofix (any → unknown) does not
    // compile here.
    files: ["src/core/body-ir.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    },
  },
  {
    // The settings tab keeps the classic display() API on purpose: manifest
    // minAppVersion is 1.8.7, and the declarative getSettingDefinitions API the
    // linter recommends requires 1.13.0 — adopting it would raise the floor for
    // users with no functional gain. Established roof-wide pattern (vault-crews).
    files: ["src/obsidian/settings.ts"],
    rules: {
      "@typescript-eslint/no-deprecated": "off",
      "obsidianmd/settings-tab/prefer-setting-definitions": "off",
      // "Form A (27 mm)" / "Form B (45 mm)" are the DIN 5008 letterhead forms.
      // The rule wants "Form a"/"Form b", which is simply the wrong name for a
      // standardised form — sentence case does not apply to proper designators.
      "obsidianmd/ui/sentence-case": "off",
    },
  },
);
