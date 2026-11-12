// vendored from code-kit@0.63.0, src/ts/pure/css-color.ts — do not hand-edit; re-vendor via tools/sync-kit.sh
// Origin: obsidian-plugins `3d-codeblocks/src/core/shapes/parse.ts` (`HEX`, `normalizeColor`), 2026-11; the same pattern stood character for
// character in `obsidian-letterhead/src/core/model.ts` (`HEX_COLOR`) and, as a transitional copy, in `svg-studio/src/core/background.ts`.

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Is `v` a hex colour of the form `#rgb` or `#rrggbb` (any case, no alpha, no colour name, no `rgb()`)? A guard for values that come from saved
 *  settings or user input; the string is returned unchanged by the guard, use {@link normalizeHex} for a canonical form. */
export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && HEX.test(v);
}

/** The canonical form of a hex colour: lower case, always six digits (`#ABC` → `#aabbcc`); `null` if `v` is not a hex colour in the sense of
 *  {@link isHexColor}. */
export function normalizeHex(v: string): string | null {
  if (!isHexColor(v)) return null;
  const hex = v.slice(1).toLowerCase();
  return hex.length === 3 ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : `#${hex}`;
}
