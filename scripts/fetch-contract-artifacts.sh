#!/usr/bin/env bash
# Fetch generated contract artifacts from the latest meshbee-server release.
# Safe before that repo has releases: on any failure, keep the committed placeholders.
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
    echo "  · no release asset yet — keeping committed placeholder $DEST/$out"
  fi
}

fetch "openapi.json"             "openapi.json"
fetch "mqtt-payload.schema.json" "mqtt-payload.schema.json"
echo "done."
