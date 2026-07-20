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
    // TEMPORARY AND NOT COVERED BY THE RULE — this override is on borrowed time.
    //
    // PROF-OBS-06 (_docs/CONVENTIONS.md) governs this exact choice: the card
    // layout of the declarative API and collapsible sections are mutually
    // exclusive, because SettingDefinitionGroup has no collapse (verified
    // against obsidian.d.ts 1.13.1: group/list/page/search/visible only).
    // Plugins that deliberately use collapsibles keep display() and may switch
    // this rule off. LETTERHEAD USES NO COLLAPSIBLES, so that exemption does
    // not apply here and the override is unjustified until the migration lands.
    //
    // Note the earlier reasoning in this file was plain wrong ("adopting it
    // would raise minAppVersion"): obsidian.d.ts:6630 says display() is to be
    // kept precisely "as a fallback for plugins that need to support versions
    // older than 1.13.0" — coexistence is the documented path and 1.8.7 stays.
    // vault-crews/src/obsidian/settings.ts:82 carries the same wrong reasoning;
    // do not restore it here.
    //
    // What the migration still needs to settle: getControlValue/setControlValue
    // map flat onto plugin.settings, but `sender` is nested (core/model.ts).
    // Whether dotted paths resolve is undocumented — an override on the
    // subclass may be required (obsidian.d.ts:6595). Reference implementation
    // to copy, including the <1.13 fallback:
    //   ../markdown-presentation/src/settings.ts:45 (and :161)
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
