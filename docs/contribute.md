---
title: Get involved
---

# Get involved

MeshBee is run by volunteers at [Fablab Imperia APS](https://github.com/fablab-imperia), and all
of it happens in the open. There's no private roadmap and no internal fork.

## Where to start

Each repo tags approachable work as **good first issue**:

- [`meshbee-firmware`](https://github.com/fablab-imperia/meshbee-firmware/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [`meshbee-server`](https://github.com/fablab-imperia/meshbee-server/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [`meshbee-app`](https://github.com/fablab-imperia/meshbee-app/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [`meshbee-hardware`](https://github.com/fablab-imperia/meshbee-hardware/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

Beekeeping experience is as useful here as software experience.

## Language

**Code, identifiers, and commit messages are English.** No exceptions — it keeps the codebase
readable to everyone and greppable across repos.

**User-facing documentation can be English or Italian.** This site is bilingual: write a page in
whichever language you're comfortable with, and someone can mirror it later. The English version
is canonical when the two drift.

The [contract pages](contract/index.md) are English-only by design — they're machine-facing.

## The rules

The [Code of Conduct](https://github.com/fablab-imperia/.github/blob/main/CODE_OF_CONDUCT.md) and
[Contributing guide](https://github.com/fablab-imperia/.github/blob/main/CONTRIBUTING.md) live in
the org `.github` repo and apply to every MeshBee repository.

## Commit messages and versioning

Every MeshBee repository follows
[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages
and [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) for releases. The full policy
lives in the org
[Contributing guide](https://github.com/fablab-imperia/.github/blob/main/CONTRIBUTING.md#commit-messages-and-versioning);
the short version is below.

### Conventional Commits

Each message starts with a **type**, an optional **scope**, then a short description:

```
feat(sensor): add null-read fallback
fix: correct temperature offset
docs(readme): document build steps
```

| Type | When to use it |
|---|---|
| `feat` | new functionality for end users |
| `fix` | a bug fix |
| `docs` | documentation-only changes |
| `style` | formatting, no behavior change |
| `refactor` | code change that neither fixes a bug nor adds a feature |
| `perf` | performance improvement |
| `test` | adding or updating tests |
| `build` | build system or dependency changes |
| `ci` | continuous-integration configuration |
| `chore` | maintenance outside source or tests |
| `revert` | reverts a previous commit |

Breaking changes are flagged with a `!` after the type/scope (`feat!:`) or a `BREAKING CHANGE:`
footer.

### Semantic Versioning

Releases are numbered `MAJOR.MINOR.PATCH`:

- **MAJOR** — incompatible changes
- **MINOR** — backward-compatible new features
- **PATCH** — backward-compatible bug fixes

The [compatibility matrix](contract/compatibility.md) tracks which component versions work
together.

## Getting in touch

- **Questions, ideas, "is this a bug?"** → [Discussions](https://github.com/fablab-imperia/meshbee/discussions).
- **Security issues** → use GitHub's private vulnerability reporting on the affected repo, or
  email <info@fablabimperia.org>. Please don't open a public issue for these.

## Licensing

- **Code** — GPL-3.0
- **Hardware designs** — CERN-OHL-S v2
- **Documentation and other content** — CC BY-SA 4.0
- **Interface contract** (`docs/contract/` — OpenAPI and MQTT schema) — Apache-2.0

## Working on this site

The site is [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/), built from the
`docs/` directory of this repo.

**From a terminal, with Docker Compose** — no editor involved:

```bash
docker compose -f .devcontainer/compose.yaml up -d --build
```

That's it — one command starts everything, and `mkdocs serve` is the docs service's default
command. Open <http://localhost:8000/meshbee/>, or <https://localhost:8443/meshbee/> once you've
generated certs (see [HTTPS locally](#https-locally) — HTTP works without them). Edits on your
machine reload live: the repo is bind-mounted, nothing is copied into the image. To follow the
build output or stop everything:

```bash
docker compose -f .devcontainer/compose.yaml logs -f docs
docker compose -f .devcontainer/compose.yaml down
```

Two things to know:

- If host port 8000 is taken, set `DOCS_PORT`. Prefix every compose command with it — it's read
  at container-create time, so `up` and `down` both need it:

    ```bash
    DOCS_PORT=8001 docker compose -f .devcontainer/compose.yaml up -d
    ```

- **A config error exits the container**, since `mkdocs serve` is its main process. That's by
  design — a dead serve shouldn't look healthy. `logs docs` shows the reason (it points at the
  offending line), and you can still get a shell to fix it:

    ```bash
    docker compose -f .devcontainer/compose.yaml run --rm docs bash
    ```

### HTTPS locally

GitHub Pages serves HTTPS. `mkdocs serve` is HTTP-only and has no TLS option, so for parity —
catching mixed-content or absolute-URL problems before they ship — an optional
[Caddy](https://caddyserver.com) proxy terminates TLS in front of it.

It needs [mkcert](https://github.com/FiloSottile/mkcert) (`brew install mkcert`), which issues a
cert from a CA in your system trust store. That's what makes the padlock real rather than a
click-through warning. Once:

```bash
./.devcontainer/make-certs.sh
```

Then the usual `up -d` serves HTTPS too — no extra flag:

```bash
docker compose -f .devcontainer/compose.yaml up -d
```

Open <https://localhost:8443/meshbee/>. Live reload still works — Caddy upgrades the WebSocket
transparently. Override the port with `HTTPS_PORT` if 8443 is taken.

Without certs the proxy prints how to generate them and exits, and HTTP carries on as normal —
so a fresh clone needs no setup until you want TLS. `down` stops the proxy along with everything
else.

!!! note "The certs are private keys"

    `.devcontainer/certs/` is gitignored. Never commit it. Every contributor generates their own
    — a shared dev key is a leaked key.

Other useful one-offs:

```bash
# build exactly as CI does
docker compose -f .devcontainer/compose.yaml exec docs mkdocs build --strict
```

There is no artifact-fetching step: the contract artifacts are read from `meshbee-server` when a
page loads, so a local build needs nothing from the network.

**With VS Code** — *Reopen in Container* uses the same compose file, so the two can't drift. It
replaces the default command with a keepalive (`overrideCommand`), so a serve crash can't take
your editor session down; start the server yourself in a VS Code terminal:

```bash
mkdocs serve -a 0.0.0.0:8000
```

The `-a 0.0.0.0:8000` is required inside a container — MkDocs otherwise binds the container's
own loopback, which your browser can't reach. Port 8000 is forwarded automatically.

**Without any container:**

```bash
pip install -r requirements-docs.txt
mkdocs serve
```

Before pushing, check the build the way CI does — an unlisted page or broken link fails there,
not in `serve`:

```bash
mkdocs build --strict
```

Italian pages use the `.it.md` suffix next to their English counterpart (`roadmap.md` →
`roadmap.it.md`). Every page must be listed in `nav` in `mkdocs.yml` — the build runs with
`--strict`, so an unlisted page fails CI rather than silently going missing.

Pushing to `main` deploys to <https://fablab-imperia.github.io/meshbee/> via GitHub Actions.
