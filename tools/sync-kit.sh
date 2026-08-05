#!/bin/sh
# Re-vendor the pure PDF engine from obsidian-kit. Run after kit updates.
#
# Added 2026-08-05 (drift-audit). Before this, the vendor tree was copied by hand — and
# `pdf/index.ts` silently stayed at the 0.16.1 state while VENDOR.json claimed 0.17.0, so
# the three re-exports added in 0.17.0 (dom-to-ir, code-blocks, image) were missing. Copying
# by hand is exactly how that happens; this script is the fix for the cause, not the symptom.
set -e

KIT=../obsidian-kit
VER=$(node -p "require('$KIT/package.json').version")
SHA=$(git -C "$KIT" rev-parse --short HEAD)

# Prepend the "do not hand-edit" marker. The kit sources carry no such marker, so a plain
# `cp` drops it. The header also records the version, making a drifted pin visible in the
# file itself, not only in VENDOR.json.
stamp() { # stamp <vendored-file> <kit-relative-path>
  header="// vendored from obsidian-kit@$VER, $2 — do not hand-edit; re-vendor via tools/sync-kit.sh"
  printf '%s\n' "$header" | cat - "$1" > "$1.tmp"
  mv "$1.tmp" "$1"
}

for f in "$KIT"/src/pure/pdf/*.ts; do
  base=$(basename "$f")
  cp "$f" "src/vendor/kit/pdf/$base"
  stamp "src/vendor/kit/pdf/$base" "src/pure/pdf/$base"
done
echo "vendored obsidian-kit@$VER/pure/pdf → src/vendor/kit/pdf"

# VENDOR.json answers "which kit is this?" without diffing the sources.
cat > src/vendor/kit/VENDOR.json <<JSON
{
  "source": "obsidian-kit",
  "version": "$VER",
  "sha": "$SHA",
  "vendored": "pdf/*.ts",
  "note": "Verbatim snapshot. Never hand-edit. Re-vendor via tools/sync-kit.sh."
}
JSON
echo "VENDOR.json → $VER ($SHA)"
