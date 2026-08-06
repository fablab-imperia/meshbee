---
title: Overview
---

# Components

MeshBee splits into three areas: what sits **in the hive**, what runs on the **server**, and the
**app** in the beekeeper's pocket. Each page here is a short summary — what the piece is, what it
does, and the handful of facts worth knowing before you open it. The authoritative documentation is
the README in its own repository, linked at the bottom of every page.

## Hive

Everything out in the apiary: solar-powered, unreachable, and expected to keep running for years
without a visit. Two repositories, one physical object.

| Component | What it is | Repository |
| --- | --- | --- |
| [Hardware](hive/hardware.md) | Boards, enclosures and 3D-printable parts | [`meshbee-hardware`](https://github.com/fablab-imperia/meshbee-hardware) |
| [Firmware](hive/firmware.md) | ESP32 sketches for the sensor and gateway nodes | [`meshbee-firmware`](https://github.com/fablab-imperia/meshbee-firmware) |

## Server

Everything between the radio and the phone. All three live in a single repository,
[`meshbee-server`](https://github.com/fablab-imperia/meshbee-server), as separate containers.

| Component | What it is |
| --- | --- |
| [MQTT](server/mqtt.md) | The ingest path: the Mosquitto broker and the handler that stores what arrives |
| [API](server/api.md) | The FastAPI REST service — the only thing the app talks to |
| [Core & database](server/core.md) | The shared library that owns all the SQL, and the PostgreSQL schema it writes to |

`caddy` also ships in that repository — a reverse proxy terminating HTTPS on `:8443`. It exists for
local development and has no code of ours, so it gets no page here; a plain `docker-compose up`
reaches the API directly on `:8000`.

## App

| Component | What it is | Repository |
| --- | --- | --- |
| [Mobile app](app.md) | Expo / React Native app for beekeepers | [`meshbee-app`](https://github.com/fablab-imperia/meshbee-app) |

## Reading these pages

See [Architecture](../architecture.md) for how the areas connect and why the server is split the
way it is, and [the contract](../contract/index.md) for the agreement between them — the MQTT
payload format and the HTTP API, which is why those are versioned and published separately.

If a page looks thin, that usually reflects the state of the upstream README rather than the state
of the code. Those gaps are called out where they exist.
