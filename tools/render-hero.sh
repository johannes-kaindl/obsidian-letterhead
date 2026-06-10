#!/usr/bin/env bash
#
# Reproducibly render docs/images/hero.png from docs/images/sample-letter.html.
# (CORE-META-03: hero/screenshots reproducible per script.)
#
# Requirements:
#   - poppler / pdftoppm     (brew install poppler  |  apt install poppler-utils)
#   - python3 + weasyprint   (pip install weasyprint)  — or, as fallback,
#     Google Chrome (headless --print-to-pdf)
#
# Usage:  tools/render-hero.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

if python3 -c "import weasyprint" 2>/dev/null; then
  python3 -c "from weasyprint import HTML; HTML('docs/images/sample-letter.html').write_pdf('docs/images/hero.pdf')"
else
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  command -v google-chrome >/dev/null 2>&1 && CHROME="google-chrome"
  command -v chromium >/dev/null 2>&1 && CHROME="chromium"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf=docs/images/hero.pdf \
    "file://$PWD/docs/images/sample-letter.html" 2>/dev/null
fi

pdftoppm -png -r 110 -singlefile docs/images/hero.pdf docs/images/hero
rm -f docs/images/hero.pdf

echo "wrote docs/images/hero.png"
