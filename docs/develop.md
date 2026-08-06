# Build & preview the docs

This site is built with [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/). It is
bilingual — English is canonical, Italian pages use the `.it.md` suffix. The sources live in
`docs/` in the [umbrella repository](https://github.com/fablab-imperia/meshbee).

## Local preview

### With Docker Compose

The devcontainer image matches CI (Python 3.12, all dependencies and `gh` inside):

```bash
docker compose -f .devcontainer/compose.yaml up -d --build
# → http://localhost:8000/meshbee/     (stop with: ... down)
```

The service runs `mkdocs serve`, so edits reload automatically.
If port 8000 is taken: `DOCS_PORT=8001 docker compose -f ... up -d`.
If the container exits immediately, `... logs docs` shows the configuration error.

To also serve over HTTPS like GitHub Pages does (needs `mkcert`), generate the certificates once —
from then on the same `up -d` also starts the TLS proxy, and `down` stops everything:

```bash
./.devcontainer/make-certs.sh     # once
docker compose -f .devcontainer/compose.yaml up -d
# → https://localhost:8443/meshbee/
```

Without certificates the proxy explains what to do and exits; HTTP still works.
The same compose file is used by VS Code (*Reopen in Container*).

### Without containers

```bash
pip install -r requirements-docs.txt
mkdocs serve      # http://127.0.0.1:8000
```

## Verify the build

Before pushing, verify the build the way CI does:

```bash
mkdocs build --strict
```

Every page must be listed in `nav` inside `mkdocs.yml`, otherwise the strict build fails.

## Deploy

Deployment is automatic. Every push to `main` that touches `docs/`, `mkdocs.yml` or
`requirements-docs.txt` triggers the `.github/workflows/docs.yml` workflow, which builds the site
with `mkdocs build --strict` and publishes it to GitHub Pages.

A contract change upstream needs no deploy here — the artifacts are read from `meshbee-server`
directly, so they are current the moment they land on its `main`.
