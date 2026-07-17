# Python 3.12 to match the version pinned in .github/workflows/docs.yml —
# local previews and CI should never build on different interpreters.
FROM mcr.microsoft.com/devcontainers/python:1-3.12-bookworm

# gh is what scripts/fetch-contract-artifacts.sh uses to pull contract
# artifacts from the latest meshbee-server release. Installed here rather
# than as a devcontainer feature so `docker compose` gets it too.
RUN set -eux; \
    # The base image ships a yarn apt repo whose signing key has rotated, which
    # fails `apt-get update` for every repo, not just yarn's. Nothing here needs
    # yarn, so drop it rather than chase the key.
    rm -f /etc/apt/sources.list.d/yarn.list; \
    mkdir -p -m 755 /etc/apt/keyrings; \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      -o /etc/apt/keyrings/githubcli-archive-keyring.gpg; \
    chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg; \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends gh; \
    rm -rf /var/lib/apt/lists/*

# Baked into the image so the container is usable immediately. The workspace
# is bind-mounted over at runtime, but site-packages live outside it.
COPY requirements-docs.txt /tmp/requirements-docs.txt
RUN pip install --no-cache-dir -r /tmp/requirements-docs.txt \
 && rm /tmp/requirements-docs.txt

EXPOSE 8000
