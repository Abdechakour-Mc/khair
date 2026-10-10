#!/usr/bin/env bash
#
# Makes the printable poster that gets Khair onto a wall: a QR code pointing
# at the live site, the mosque's name, and one line in each language.
#
#   ./scripts/poster.sh https://khair.example
#
# The QR is generated locally with qrencode inside the project's own
# container, so no image is uploaded to anybody's service to produce it: a
# poster for a mosque wall should not need a third party to exist.

set -euo pipefail

URL="${1:-}"
OUT_DIR="${2:-poster}"

if [[ -z "$URL" ]]; then
  echo "usage: ./scripts/poster.sh <live-url> [output-dir]" >&2
  exit 1
fi

MOSQUE="${MOSQUE_NAME:-}"
if [[ -z "$MOSQUE" && -f .env ]]; then
  MOSQUE=$(grep -E "^MOSQUE_NAME=" .env | tail -n1 | cut -d= -f2- || true)
fi
MOSQUE="${MOSQUE:-Khair}"

mkdir -p "$OUT_DIR"

# -m 2: a quiet zone inside the image as well as the white padding the
# poster draws around it. A camera held at an angle finds the code by its
# margin, and a QR butted against a border is the usual reason a poster
# "does not scan". -l M: medium error correction, which survives a thumb
# print and a bit of rain on a noticeboard.
# The CLI lives in libqrencode-tools; libqrencode alone is just the library,
# which installs happily and then leaves you with no qrencode and an empty
# file. Errors are not swallowed here for that reason.
MSYS_NO_PATHCONV=1 docker compose run --rm --no-deps -e HOME=/tmp -T web sh -c "
  apk add --no-cache libqrencode-tools >/dev/null 2>&1 ||
    apk add --no-cache libqrencode >/dev/null 2>&1
  command -v qrencode >/dev/null 2>&1 || { echo 'qrencode did not install' >&2; exit 1; }
  qrencode -t SVG -l M -m 2 -o - '$URL'
" > "$OUT_DIR/khair-qr.svg"

if [[ ! -s "$OUT_DIR/khair-qr.svg" ]] || ! grep -q '<svg' "$OUT_DIR/khair-qr.svg"; then
  echo "the QR code did not generate, so the poster would be blank" >&2
  rm -f "$OUT_DIR/khair-qr.svg"
  exit 1
fi

# The <svg> comes back with an XML prolog that cannot sit inside HTML.
QR_SVG=$(grep -v '^<?xml' "$OUT_DIR/khair-qr.svg" | grep -v '^<!DOCTYPE')

cat > "$OUT_DIR/khair-poster.html" <<POSTER
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Khair poster</title>
<style>
  /* A4 portrait, with margins a cheap office printer will not clip. */
  @page { size: A4 portrait; margin: 18mm; }

  :root {
    --ink: #16201a;
    --muted: #59665d;
    --accent: #1f6b45;
    --line: #dde5de;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: var(--ink);
    background: #fff;
    display: flex;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
  }

  .sheet {
    width: 100%;
    max-width: 174mm;
    text-align: center;
    padding: 10mm 0;
  }

  .mosque {
    font-size: 15pt;
    font-weight: 600;
    color: var(--muted);
    margin: 0 0 4mm;
  }

  h1 {
    font-size: 34pt;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin: 0 0 6mm;
  }

  .lines {
    display: grid;
    gap: 2mm;
    margin: 0 0 10mm;
    font-size: 13pt;
    color: var(--muted);
  }

  .lines .ar { font-size: 15pt; color: var(--ink); direction: rtl; }

  /* The QR is the point of the page, so it gets the space. */
  .qr {
    width: 86mm;
    height: 86mm;
    margin: 0 auto 6mm;
    padding: 5mm;
    border: 1.5pt solid var(--line);
    border-radius: 4mm;
  }

  .qr svg { width: 100%; height: 100%; display: block; }

  .url {
    font-size: 12pt;
    font-weight: 600;
    color: var(--accent);
    word-break: break-all;
    margin: 0 0 8mm;
  }

  .foot {
    font-size: 10pt;
    color: var(--muted);
    border-top: 1pt solid var(--line);
    padding-top: 4mm;
    margin: 0;
  }

  .foot .ar { direction: rtl; display: block; margin-top: 1mm; }

  @media screen {
    body { background: #f3f6f2; padding: 10mm; }
    .sheet { background: #fff; padding: 16mm 12mm; border-radius: 4mm; box-shadow: 0 2px 20px rgba(0,0,0,.08); }
  }
</style>
</head>
<body>
  <div class="sheet">
    <p class="mosque">$MOSQUE</p>
    <h1>Volunteer with us</h1>

    <div class="lines">
      <span class="ar">امسح الرمز لترى أين تلزم المساعدة</span>
      <span>Scan with your phone camera. No app, no account.</span>
      <span>Scannez avec votre téléphone. Sans appli, sans compte.</span>
    </div>

    <div class="qr">$QR_SVG</div>

    <p class="url">$URL</p>

    <p class="foot">
      Pick anything you can manage.
      <span class="ar">وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى</span>
    </p>
  </div>
</body>
</html>
POSTER

echo "poster:  $OUT_DIR/khair-poster.html"
echo "qr only: $OUT_DIR/khair-qr.svg"
echo
echo "Open the poster and print it (Ctrl-P). The QR points at $URL"
