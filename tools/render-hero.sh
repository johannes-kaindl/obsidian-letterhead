#!/usr/bin/env bash
#
# Reproducibly render docs/images/hero.png from docs/images/sample-letter.html.
# (CORE-META-03: hero/screenshots reproducible per script.)
#
# Requirements:
#   - python3 + weasyprint   (pip install weasyprint)
#   - poppler / pdftoppm     (brew install poppler  |  apt install poppler-utils)
#
# Usage:  tools/render-hero.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

python3 -c "from weasyprint import HTML; HTML('docs/images/sample-letter.html').write_pdf('docs/images/hero.pdf')"
pdftoppm -png -r 110 -singlefile docs/images/hero.pdf docs/images/hero
rm -f docs/images/hero.pdf

echo "wrote docs/images/hero.png"
