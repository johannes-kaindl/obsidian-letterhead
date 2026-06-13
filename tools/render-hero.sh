#!/usr/bin/env bash
#
# Reproducibly render the README hero images from their HTML sources.
#   docs/images/sample-din-de.html    -> docs/images/hero-din-de.png
#   docs/images/sample-modern-en.html -> docs/images/hero-modern-en.png
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

USE_WEASYPRINT=0
if python3 -c "import weasyprint" 2>/dev/null; then
  USE_WEASYPRINT=1
else
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  command -v google-chrome >/dev/null 2>&1 && CHROME="google-chrome"
  command -v chromium >/dev/null 2>&1 && CHROME="chromium"
fi

render() {
  local html="$1" png="$2" pdf="${2%.png}.pdf"
  if [ "$USE_WEASYPRINT" -eq 1 ]; then
    python3 -c "from weasyprint import HTML; HTML('$html').write_pdf('$pdf')"
  else
    "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
      --print-to-pdf="$pdf" \
      "file://$PWD/$html" 2>/dev/null
  fi
  pdftoppm -png -r 110 -singlefile "$pdf" "${png%.png}"
  rm -f "$pdf"
  echo "wrote $png"
}

render docs/images/sample-din-de.html    docs/images/hero-din-de.png
render docs/images/sample-modern-en.html  docs/images/hero-modern-en.png
