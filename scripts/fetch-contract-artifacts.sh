#!/usr/bin/env bash
# Fetch generated contract artifacts from the latest meshbee-server release.
# On any failure, keep the copy committed here — the fetch must never fail the docs build.
#
# openapi.json is NOT fetched: the API reference page reads it live from meshbee-server's
# main branch in the browser, so this repo keeps no copy of it at all.
set -uo pipefail

SERVER_REPO="fablab-imperia/meshbee-server"
DEST="docs/contract"

fetch() {  # fetch <asset-pattern> <dest-filename>
  local pattern="$1" out="$2"
  echo "→ trying to fetch $pattern from latest $SERVER_REPO release…"
  if gh release download --repo "$SERVER_REPO" --pattern "$pattern" \
       --output "$DEST/$out" --clobber 2>/dev/null; then
    echo "  ✓ fetched $out from release"
  else
    echo "  · no release asset yet — keeping the copy committed at $DEST/$out"
  fi
}

# Hand-maintained here until meshbee-server generates one; see docs/contract/index.md.
fetch "mqtt-payload.schema.json" "mqtt-payload.schema.json"
echo "done."
