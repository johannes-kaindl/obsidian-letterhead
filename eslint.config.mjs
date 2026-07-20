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
    // The settings tab keeps the classic display() API on purpose — but NOT
    // because the declarative getSettingDefinitions API (1.13.0) would raise
    // minAppVersion. That was this file's earlier reasoning and it is WRONG:
    // obsidian.d.ts:6630 states display() is to be kept precisely "as a
    // fallback for plugins that need to support versions older than 1.13.0",
    // i.e. coexistence is the documented migration path and 1.8.7 can stay.
    // Conditional visibility (`visible: () => …`, needed for outputFolder) and
    // a `type: 'folder'` picker both exist, so there is no technical blocker.
    //
    // The real reasons to defer, both open:
    //   1. Dual-support means every settings change must be made twice or the
    //      two implementations drift apart per Obsidian version.
    //   2. getControlValue/setControlValue map flat onto plugin.settings, but
    //      `sender` is nested (core/model.ts). Whether dotted paths resolve is
    //      undocumented — an override may be required (obsidian.d.ts:6595).
    // Adopt as its own cut, after clarifying (2). No neighbour plugin uses the
    // API yet, so letterhead would be setting the roof-wide pattern.
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
