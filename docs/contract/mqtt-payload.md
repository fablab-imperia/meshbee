---
title: MQTT payload
---

# MQTT payload

A node publishes one JSON object per reading.

```json
{"v":1,"id":"hive-03","t":21.4,"rh":58.2,"w":34210,"vbat":3.91,"ts":"2026-07-17T09:14:00Z"}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `v` | integer | **Payload major version.** Required. |
| `id` | string | Node identifier. Required. |
| `t` | number | Temperature, °C |
| `rh` | number | Relative humidity, % |
| `w` | number | Hive weight, grams |
| `vbat` | number | Battery voltage, V |
| `ts` | string | Reading time, RFC 3339 |

Only `v` and `id` are required. A node that has no weight cell simply omits `w`; a node with no
clock sync omits `ts` and the server stamps arrival time. Keys are short because they're paid for
on every transmission, from a battery, over WiFi.

## The version integer

`v` is the whole compatibility mechanism. The server reads it **first**, on every message, and
decides what to do with the rest of the object based on what it says.

This exists because the fleet is permanently heterogeneous — see
[Architecture](../architecture.md). Nodes are solar-powered boards in fields; you cannot push an
update to them and you cannot assume they'll ever be uniform. The message has to describe itself.

The rule when the major version is one the server doesn't know:

!!! danger "Log loudly on unknown major. Don't write nulls."

    An unrecognised `v` means the server does not understand the payload. It must **reject the
    message and log it loudly** — not parse what it recognises, not insert a row with `NULL` in
    the fields it couldn't read.

    A null in the database is indistinguishable from a sensor that failed. Writing them turns a
    "we shipped firmware the server doesn't know about" problem into a silent, permanent data
    quality problem that nobody discovers until they try to plot it months later. Loud failure is
    recoverable; quiet corruption is not.

Bump the major when a change would make an existing consumer misread the payload. Adding a new
optional field is not that — consumers ignore keys they don't recognise, which is why the schema
sets `additionalProperties: true`.

## Schema

The authoritative JSON Schema (draft 2020-12) is published at its canonical URL:

<https://fablab-imperia.github.io/meshbee/contract/mqtt-payload.schema.json>

Reference it by that absolute URL, not a relative path. It's the single real artifact, and it's
what the schema's own `$id` points to.

Which payload versions go with which component releases is recorded in the
[compatibility matrix](compatibility.md).
