---
title: Architecture
---

# Architecture

```text
  ┌──────────────┐
  │  Hive node   │   ESP32 + sensors, solar powered
  │ (firmware)   │
  └──────┬───────┘
         │  MQTT over WiFi
         ▼
  ┌──────────────┐
  │  mosquitto   │   MQTT broker
  └──────┬───────┘
         │  subscribe
         ▼
  ┌──────────────┐
  │ MQTT handler │   validates payload, decides per-message compatibility
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐      ┌────────────┐
  │   FastAPI    │◄────►│  Postgres  │
  └──────┬───────┘      └────────────┘
         │  HTTP /v1/
         ▼
  ┌──────────────┐
  │  Expo app    │
  └──────────────┘
```

## Why it's built this way

The rationale that drives most of the design: **the node fleet is permanently heterogeneous.**

A node is a board bolted to a solar panel in a field. There is no reliable way to push an update
to it. Some nodes will run last year's firmware for as long as they physically survive. There is
no flag day, no coordinated upgrade, no moment where every node runs the same code.

So the system cannot assume anything about what's on the other end of a message. It has to be
told, by the message itself. That gives us three concrete consequences:

- **The MQTT payload carries a version integer** (`v`). The server decides compatibility
  **per message**, not per deployment. An old node and a new node can publish to the same broker
  at the same time and both get handled correctly.
- **The HTTP API is path-versioned** (`/v1/`). App releases in the wild have the same problem as
  nodes: users update when they feel like it. An old app keeps hitting the endpoint it was built
  against.
- **A [compatibility matrix](contract/compatibility.md)** records which firmware / server / app
  versions are known to work together, because "it builds" and "it interoperates with what's
  already deployed" are different questions.

None of this is speculative generality. It's the minimum needed to run a fleet you cannot recall.

## Where things live

The MQTT handler and FastAPI are both in [`meshbee-server`](https://github.com/fablab-imperia/meshbee-server).
The broker (mosquitto) is infrastructure, not application code. The [contract](contract/index.md)
is the interface between the boxes above — it's the part that must not change casually.
