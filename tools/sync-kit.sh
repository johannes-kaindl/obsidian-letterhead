#!/bin/sh
# Re-vendor the pure kit code this plugin consumes (PDF engine + flat pure modules)
# from obsidian-kit. Run after kit updates.
#
# Added 2026-08-05 (drift-audit). Before this, the vendor tree was copied by hand — and
# `pdf/index.ts` silently stayed at the 0.16.1 state while VENDOR.json claimed 0.17.0, so
# the three re-exports added in 0.17.0 (dom-to-ir, code-blocks, image) were missing. Copying
# by hand is exactly how that happens; this script is the fix for the cause, not the symptom.
#
# CORE-META-22 (binding since 2026-08-30): read from a FIXED GIT REF, never from the
# neighbour repo's working tree. `cp ../obsidian-kit/...` yields whatever that repo's HEAD
# happens to be — a parallel session there changes what lands here, and the stamped SHA
# names a commit no release carries. `git show <ref>:<path>` is reproducible and does not
# disturb the neighbour. The ref is peeled with `^{commit}`: obsidian-kit tags lightweight
# today, but an annotated tag would otherwise stamp the TAG OBJECT's sha, which appears
# nowhere in `git log` (measured in code-kit, 2026-09-02).
set -e

KIT="${KIT_DIR:-../obsidian-kit}"
KIT_REF="${KIT_REF:-0.27.0}"

git -C "$KIT" rev-parse --verify --quiet "${KIT_REF}^{commit}" >/dev/null \
  || { echo "Ref '$KIT_REF' existiert nicht in $KIT (KIT_REF setzen)" >&2; exit 1; }

VER=$(git -C "$KIT" describe --tags --abbrev=0 "$KIT_REF")
SHA=$(git -C "$KIT" rev-parse --short "${KIT_REF}^{commit}")

# Flat modules from the kit's pure layer (kit/src/pure/*.ts → src/vendor/kit/*.ts), so the
# vendor tree mirrors the kit tree — which is what the stamp line has always claimed.
# Deliberately an explicit list, not a `src/pure/*.ts` glob: only what this plugin actually
# imports gets vendored. A glob would drag in modules no test and no bundle ever touches,
# and every one of them would still have to pass typecheck, check:pure and lint here.
# All modules listed here must be import-free — the kit's cross-layer import rewrite
# (`../pure/` → `../kit/`) is NOT implemented in this script.
PURE_FLAT="filename-template vault-path"

# The pdf file list comes from the REF, not from a working-tree glob — a glob would mirror
# whatever happens to lie in src/vendor/kit/pdf/ locally and silently skip a file the ref
# added.
PDF_FILES=$(git -C "$KIT" ls-tree --name-only "$KIT_REF:src/pure/pdf")

# Check every source path BEFORE writing anything. Aborting halfway leaves the vendor tree
# half on the new ref and half on the old one, which is worse than not running at all.
fehlend=""
for base in $PDF_FILES; do
  git -C "$KIT" cat-file -e "$KIT_REF:src/pure/pdf/$base" 2>/dev/null || fehlend="$fehlend src/pure/pdf/$base"
done
for m in $PURE_FLAT; do
  git -C "$KIT" cat-file -e "$KIT_REF:src/pure/$m.ts" 2>/dev/null || fehlend="$fehlend src/pure/$m.ts"
done
[ -z "$fehlend" ] || { echo "FEHLER: in obsidian-kit@$KIT_REF fehlen:$fehlend — nichts geschrieben" >&2; exit 1; }

# Stamp and content are written in ONE redirection: if `git show` fails, the target file is
# not left holding a header above stale content. The kit sources carry no such marker, so it
# has to be prepended here. The header also records the version, making a drifted pin visible
# in the file itself, not only in VENDOR.json.
vendor() { # vendor <kit-relative-path> <target>
  { printf '%s\n' "// vendored from obsidian-kit@$VER, $1 — do not hand-edit; re-vendor via tools/sync-kit.sh"
    git -C "$KIT" show "$KIT_REF:$1"; } > "$2"
}

for base in $PDF_FILES; do
  vendor "src/pure/pdf/$base" "src/vendor/kit/pdf/$base"
done
echo "vendored obsidian-kit@$VER/pure/pdf → src/vendor/kit/pdf"

for m in $PURE_FLAT; do
  vendor "src/pure/$m.ts" "src/vendor/kit/$m.ts"
done
echo "vendored obsidian-kit@$VER/pure/{$(echo "$PURE_FLAT" | tr ' ' ',')} → src/vendor/kit"

# VENDOR.json answers "which kit is this?" without diffing the sources. The `vendored`
# field is built from the same list the loop above runs on, so it cannot drift from it.
VENDORED="pdf/*.ts"
for m in $PURE_FLAT; do VENDORED="$VENDORED, $m.ts"; done
cat > src/vendor/kit/VENDOR.json <<JSON
{
  "source": "obsidian-kit",
  "version": "$VER",
  "sha": "$SHA",
  "vendored": "$VENDORED",
  "note": "Verbatim snapshot. Never hand-edit. Re-vendor via tools/sync-kit.sh (reads from tag $KIT_REF)."
}
JSON
echo "VENDOR.json → $VER ($SHA)"
