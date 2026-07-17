#!/usr/bin/env bash
# Generate a locally-trusted TLS cert for the HTTPS dev proxy.
#
# Runs on the HOST, not in a container: mkcert has to write to the system trust
# store, which a container can't do for your browser. Certs land in
# .devcontainer/certs/ (gitignored) and are mounted read-only into Caddy.
set -euo pipefail

cd "$(dirname "$0")"
CERT_DIR="certs"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. On macOS:  brew install mkcert" >&2
  echo "Then re-run this script." >&2
  exit 1
fi

# Idempotent: installs mkcert's root CA into the system trust store if it
# isn't there yet. This is why the browser shows a real padlock rather than a
# self-signed warning.
echo "→ ensuring mkcert root CA is trusted…"
mkcert -install

mkdir -p "$CERT_DIR"

echo "→ issuing cert for localhost / 127.0.0.1 / ::1…"
mkcert -cert-file "$CERT_DIR/localhost.pem" \
       -key-file  "$CERT_DIR/localhost-key.pem" \
       localhost 127.0.0.1 ::1

chmod 600 "$CERT_DIR/localhost-key.pem"

cat <<'EOF'

✓ certs written to .devcontainer/certs/ (gitignored)

Start everything (HTTP + HTTPS) with:
  docker compose -f .devcontainer/compose.yaml up -d
  → https://localhost:8443/meshbee/
EOF
