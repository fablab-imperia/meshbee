---
title: MQTT payload
---

# MQTT payload

A node publishes one JSON object per reading, to the topic **`beehive/<id_nodo>/data`**.

```json
{
  "id_sensore": "SENSOR01",
  "timestamp": "2026-08-05T14:30:00Z",
  "temperatura": 34.5,
  "umidita": 65.2,
  "peso": 42.35,
  "dati_raw": {"battery": 3.7, "rssi": -67}
}
```

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `id_nodo` | string | see below | Node identifier. Falls back to the topic segment. |
| `id_sensore` | string | no | Identifies the hive on that node. An unknown value creates one. |
| `timestamp` | string | no | ISO 8601. Absent or unparseable → server time. |
| `temperatura` | number | no | °C, **−50 to 100** |
| `umidita` | number | no | %, **0 to 100** |
| `peso` | number | no | kg, **≥ 0** |
| `dati_raw` | object | no | Stored verbatim as JSONB — battery, RSSI, whatever the firmware keeps. |

Every measurement is optional: a node carrying only a scale sends only `peso`. The payload must be
a JSON **object** — an array, a bare number, invalid UTF-8 or malformed JSON is logged and dropped.

## Rules the handler applies

- **The node id may come from either place, and the payload wins.** `id_nodo` in the body overrides
  the topic segment. A message is rejected only when neither supplies one.
- **A bad clock never costs a measurement.** A `Z` suffix is rewritten to `+00:00`; a value that
  still will not parse is logged as a warning and the reading is stored with the **server's** time.
- **The ranges are enforced, and a violation drops the whole message.** A `temperatura` of 200 is
  not stored partially — it is not stored at all. The same limits exist as CHECK constraints in the
  database, so a value that slipped past one would be refused by the other.
- **A rejected reading is dropped, not retried.** The broker was acknowledged before the handler
  read the payload. There is no dead-letter queue.

Unknown nodes and unknown `id_sensore` values are **provisioned on the fly** rather than rejected —
a node may start transmitting before anyone registers it. See the
[MQTT handler](../components/server/mqtt.md).

## Payload versioning

!!! warning "Not implemented yet"

    Everything in this section describes where the payload format is going. **Today the payload
    carries no version field** — the handler reads the fixed set of fields above and has no way to
    tell which firmware produced them.

The plan is a required **major version integer** (`v`) that the server reads *first*, on every
message, deciding what to do with the rest of the object based on what it says.

This exists because the fleet is permanently heterogeneous — see
[Architecture](../architecture.md). Nodes are solar-powered boards in fields; you cannot push an
update to them and you cannot assume they will ever be uniform. The message has to describe itself.

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

The JSON Schema (draft 2020-12) is published at its canonical URL:

<https://fablab-imperia.github.io/meshbee/contract/mqtt-payload.schema.json>

Reference it by that absolute URL, not a relative path. It's the single real artifact, and it's
what the schema's own `$id` points to.

!!! note "Maintained here by hand, for now"

    Unlike `openapi.json`, this schema is not generated from the server — `meshbee-server` has no
    exporter for it. It is written and kept in step by hand in this repository. When the server
    starts generating one, this artifact moves to the same fetch-from-upstream arrangement the
    OpenAPI spec already uses.

Which payload versions go with which component releases is recorded in the
[compatibility matrix](compatibility.md).
