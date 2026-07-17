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

Beekeeping experience is as useful here as software experience. So is a 3D printer.

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

## Getting in touch

- **Questions, ideas, "is this a bug?"** → [Discussions](https://github.com/fablab-imperia/meshbee/discussions).
- **Security issues** → use GitHub's private vulnerability reporting on the affected repo, or
  email <info@fablabimperia.org>. Please don't open a public issue for these.

## Licensing

- **Code** — GPL-3.0
- **Hardware designs** — CERN-OHL-S
- **Documentation and other content** — CC-BY-SA

## Working on this site

The site is [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/), built from the
`docs/` directory of this repo.

```bash
pip install -r requirements-docs.txt
mkdocs serve
```

Italian pages use the `.it.md` suffix next to their English counterpart (`roadmap.md` →
`roadmap.it.md`). Every page must be listed in `nav` in `mkdocs.yml` — the build runs with
`--strict`, so an unlisted page fails CI rather than silently going missing.

Pushing to `main` deploys to <https://fablab-imperia.github.io/meshbee/> via GitHub Actions.
