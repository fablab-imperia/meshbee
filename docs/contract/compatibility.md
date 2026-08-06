---
title: Compatibility matrix
---

# Compatibility matrix

Known-good tuples: combinations that were actually run together, not combinations that should
theoretically work.

| Release | Firmware | Server | App | MQTT | API |
| --- | --- | --- | --- | --- | --- |
| `v0.2` "Field Trial" | 1.4.x | 1.x.x | 1.8.x | `v1` | `v1` |

!!! warning "Append rows. Never edit a shipped one."

    A row describes a combination that exists in the world — on a board in a field, or on a phone
    someone hasn't updated. Editing it doesn't change that reality, it just destroys the record
    of it. If something turns out to be wrong or a combination stops being supported, add a new
    row and annotate the old one. Never rewrite history here.

## Reading this table

The `MQTT` and `API` columns are the [interface versions](mqtt-payload.md) that release speaks —
the payload major integer and the HTTP path version. They move far more slowly than the component
versions next to them, and that's the point: a `v1` payload from 1.4.x firmware is still a `v1`
payload two server releases later.

!!! note "`v1` is nominal today"

    Neither interface carries its version explicitly yet: the MQTT payload has no version field and
    the API is served under `/api/…` with no version segment. `v1` in these columns means "the
    first and so far only shape of that interface" — it is a label this matrix applies, not a value
    you can read off a message or a URL. Once the versioning scheme lands, these columns start
    recording something the wire itself declares.

Component versions are `x.y.z` ranges because patch releases don't change the interface. If a
patch release did change the interface, that was a mistake in the patch release.
