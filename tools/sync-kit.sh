#!/bin/sh
# uebernommen aus obsidian-paperize/tools/sync-kit.sh, 2026-09-02 (Zwei-Quellen-Struktur)
# uebernommen aus vault-rag + 3d-codeblocks/tools/sync-kit.sh, 2026-09-02 (Ref-Lesen)
#
# Beides sind UEBERNAHMEN, kein eigener Beleg — die Extraktions-Schwelle ist eine Zaehlung,
# und eine Kopier-Kette sieht darin aus wie eine Mehrheit. Was hier aus welcher Quelle kommt:
#   - Zwei Quellen in einem Skript + beide Pins in einer VENDOR.json: obsidian-paperize
#     (`0125875`, 2026-09-02 17:30; diese Fassung hier entstand 53 min spaeter, nach Lektuere).
#   - `git show <ref>:<pfad>` statt `cp` aus dem Arbeitsstand, `^{commit}`-Peelung,
#     Vorab-Existenzpruefung, Dateiliste per `ls-tree`: die CORE-META-22-konformen Fassungen
#     in vault-rag und 3d-codeblocks.
# Eigen ist allein die KOMBINATION: paperize liest seine zwei Quellen weiterhin per `cp` aus
# dem Arbeitsverzeichnis der Nachbar-Repos und ist damit nicht CORE-META-22-konform; die
# Ref-Fassungen wiederum kennen nur eine Quelle. Das ist die Anwendung zweier Vorlagen
# aufeinander, keine neue Abstraktion.
#
# Re-vendor the pure kit code this plugin consumes (PDF engine + flat pure modules).
# Run after kit updates.
#
# Added 2026-08-05 (drift-audit). Before this, the vendor tree was copied by hand — and
# `pdf/index.ts` silently stayed at the 0.16.1 state while VENDOR.json claimed 0.17.0, so
# the three re-exports added in 0.17.0 (dom-to-ir, code-blocks, image) were missing. Copying
# by hand is exactly how that happens; this script is the fix for the cause, not the symptom.
#
# CORE-META-22 (binding since 2026-08-30): read from a FIXED GIT REF, never from a
# neighbour repo's working tree. `cp ../obsidian-kit/...` yields whatever that repo's HEAD
# happens to be — a parallel session there changes what lands here, and the stamped SHA
# names a commit no release carries. `git show <ref>:<path>` is reproducible and does not
# disturb the neighbour. Every ref is peeled with `^{commit}`: obsidian-kit tags lightweight,
# but **code-kit tags ANNOTATED** — without peeling, `rev-parse 0.5.0` yields the tag
# object's sha (41e96e0), which appears nowhere in `git log`. That is not hypothetical; it
# happened in obsidian-kit on 2026-09-02.
#
# TWO SOURCES since obsidian-kit `2ab1bb5` ("domaenenfreie pure-Teilmenge zieht nach
# code-kit"): `filename-template.ts` no longer exists under `obsidian-kit/src/pure/` — it
# moved to its own repo. A run against obsidian-kit >= 0.28.0 that still looks for it there
# aborts (correctly, via the pre-flight check below) instead of leaving a torso behind.
set -e

KIT="${KIT_DIR:-../obsidian-kit}"
KIT_REF="${KIT_REF:-0.30.0}"
CODE_KIT="${CODE_KIT_DIR:-../../libs/code-kit}"
CODE_KIT_REF="${CODE_KIT_REF:-0.5.0}"

for paar in "$KIT|$KIT_REF" "$CODE_KIT|$CODE_KIT_REF"; do
  repo=$(printf '%s' "$paar" | cut -d'|' -f1)
  ref=$(printf '%s' "$paar" | cut -d'|' -f2)
  [ -d "$repo" ] || {
    echo "FEHLER: $repo fehlt. obsidian-kit liegt neben diesem Repo, code-kit neben dem Dach." >&2
    exit 2
  }
  git -C "$repo" rev-parse --verify --quiet "${ref}^{commit}" >/dev/null \
    || { echo "FEHLER: Ref '$ref' existiert nicht in $repo." >&2; exit 2; }
done

VER=$(git -C "$KIT" describe --tags --abbrev=0 "$KIT_REF")
SHA=$(git -C "$KIT" rev-parse --short "${KIT_REF}^{commit}")
CODE_VER=$(git -C "$CODE_KIT" describe --tags --abbrev=0 "$CODE_KIT_REF")
CODE_SHA=$(git -C "$CODE_KIT" rev-parse --short "${CODE_KIT_REF}^{commit}")

# Explizite Listen, kein Glob ueber das Arbeitsverzeichnis: nur was dieses Plugin wirklich
# importiert, wird vendored. Ein Glob zoege Module herein, die kein Test und kein Bundle je
# anfasst — und jedes davon muesste hier trotzdem typecheck, check:pure und lint bestehen.
# Alle gelisteten Module muessen importfrei sein; ein Cross-Layer-Rewrite gibt es hier nicht.
KIT_FLAT="vault-path"
CODE_FLAT="filename-template"

# Die pdf-Dateiliste kommt aus der REF, nicht aus einem Arbeitsverzeichnis-Glob — ein Glob
# spiegelte, was lokal in src/vendor/kit/pdf/ liegt, und uebergaenge eine Datei, die die Ref
# neu hinzugefuegt hat.
PDF_FILES=$(git -C "$KIT" ls-tree --name-only "$KIT_REF:src/pure/pdf")

# Alle Quellpfade pruefen, BEVOR irgendetwas geschrieben wird. Ein Abbruch mitten im Lauf
# laesst den Vendor-Baum halb auf der neuen und halb auf der alten Ref zurueck — und die
# Ausgabe-Umleitung legt die Zieldatei an, bevor `git show` ueberhaupt laeuft: zurueck bliebe
# ein Torso mit gueltig aussehendem Kopfstempel (in obsidian-paperize am 2026-09-02 belegt).
fehlend=""
for base in $PDF_FILES; do
  git -C "$KIT" cat-file -e "$KIT_REF:src/pure/pdf/$base" 2>/dev/null || fehlend="$fehlend obsidian-kit:src/pure/pdf/$base"
done
for m in $KIT_FLAT; do
  git -C "$KIT" cat-file -e "$KIT_REF:src/pure/$m.ts" 2>/dev/null || fehlend="$fehlend obsidian-kit:src/pure/$m.ts"
done
for m in $CODE_FLAT; do
  git -C "$CODE_KIT" cat-file -e "$CODE_KIT_REF:src/ts/pure/$m.ts" 2>/dev/null || fehlend="$fehlend code-kit:src/ts/pure/$m.ts"
done
[ -z "$fehlend" ] || {
  echo "FEHLER: es fehlen:$fehlend — nichts geschrieben." >&2
  echo "  obsidian-kit@$KIT_REF liefert pdf/ und vault-path.ts;" >&2
  echo "  code-kit@$CODE_KIT_REF liefert filename-template.ts (seit obsidian-kit 2ab1bb5)." >&2
  exit 2
}

# Stempel und Inhalt entstehen in EINER Umleitung: schlaegt `git show` fehl, bleibt die
# Zieldatei nicht mit einem Kopf ueber veraltetem Inhalt zurueck. Die Kit-Quellen tragen den
# Marker nicht, er muss hier davor. Der Kopf nennt zugleich Quelle und Version, damit ein
# abgedrifteter Pin in der Datei selbst sichtbar ist, nicht nur in VENDOR.json.
vendor() { # vendor <repo> <ref> <quellname> <version> <pfad-in-der-ref> <ziel>
  { printf '%s\n' "// vendored from $3@$4, $5 — do not hand-edit; re-vendor via tools/sync-kit.sh"
    git -C "$1" show "$2:$5"; } > "$6"
}

for base in $PDF_FILES; do
  vendor "$KIT" "$KIT_REF" obsidian-kit "$VER" "src/pure/pdf/$base" "src/vendor/kit/pdf/$base"
done
echo "vendored obsidian-kit@$VER/pure/pdf → src/vendor/kit/pdf"

for m in $KIT_FLAT; do
  vendor "$KIT" "$KIT_REF" obsidian-kit "$VER" "src/pure/$m.ts" "src/vendor/kit/$m.ts"
  echo "vendored obsidian-kit@$VER/pure/$m.ts → src/vendor/kit/$m.ts"
done

for m in $CODE_FLAT; do
  vendor "$CODE_KIT" "$CODE_KIT_REF" code-kit "$CODE_VER" "src/ts/pure/$m.ts" "src/vendor/kit/$m.ts"
  echo "vendored code-kit@$CODE_VER/ts/pure/$m.ts → src/vendor/kit/$m.ts"
done

# VENDOR.json beantwortet "welches Kit ist das?", ohne die Quellen zu diffen. Beide Pins
# stehen drin, weil der Baum aus zwei Quellen stammt — eine einzelne Versionsangabe waere
# hier eine Aussage ueber die Haelfte des Inhalts.
VENDORED="pdf/*.ts"
for m in $KIT_FLAT; do VENDORED="$VENDORED, $m.ts"; done
CODE_VENDORED=""
for m in $CODE_FLAT; do CODE_VENDORED="${CODE_VENDORED:+$CODE_VENDORED, }$m.ts"; done
cat > src/vendor/kit/VENDOR.json <<JSON
{
  "source": "obsidian-kit",
  "version": "$VER",
  "sha": "$SHA",
  "vendored": "$VENDORED (aus obsidian-kit@$VER)",
  "code_kit_version": "$CODE_VER",
  "code_kit_sha": "$CODE_SHA",
  "code_kit_vendored": "$CODE_VENDORED (aus code-kit@$CODE_VER)",
  "note": "Verbatim snapshot aus ZWEI Quellen. Never hand-edit. Re-vendor via tools/sync-kit.sh (liest aus den Tag-Refs $KIT_REF bzw. $CODE_KIT_REF, gepeelt mit ^{commit}). Seit obsidian-kit 2ab1bb5 liegt die domaenenfreie pure-Teilmenge in code-kit; der Kopf jeder Datei nennt ihre Herkunft."
}
JSON
echo "VENDOR.json → obsidian-kit@$VER ($SHA) + code-kit@$CODE_VER ($CODE_SHA)"
