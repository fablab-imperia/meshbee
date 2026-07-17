---
title: Decisions (ADRs)
---

# Architecture decisions

Architecture Decision Records capture choices that shaped MeshBee, along with the context that
made them reasonable at the time. See
[ADR-0001](0001-record-architecture-decisions.md) for why we keep them at all.

## Records

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |

## To backfill

These decisions were made before we started writing ADRs. They're the ones worth reconstructing,
because each one is still actively constraining the project:

- **The four-repo split.** Why components live in separate repositories and release independently,
  rather than as a monorepo.
- **Publishing contract artifacts on GitHub Pages.** Why the OpenAPI spec and payload schema are
  published from this site, fetched from server releases, instead of living in a dedicated
  contracts repository.
- **Interface versioning.** The MQTT payload version integer and the `/v1/` API path — driven by
  a node fleet that cannot be updated. This is the load-bearing one.
- **Replacing `init.sql` + `migrate_v*.sql` with a real migration tool.** Hand-rolled SQL
  migration files don't track what's been applied.

Writing one up is a genuinely useful contribution — see [Get involved](../contribute.md).
