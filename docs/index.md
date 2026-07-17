---
title: Home
---

# MeshBee

Solar-powered ESP32 nodes sit in beehives and report sensor readings — temperature, humidity,
hive weight, battery voltage — over **MQTT** to a **FastAPI + Postgres** backend. An **Expo**
app reads that data back over HTTP.

!!! warning "The data path is MQTT over WiFi, not Meshtastic"

    Despite the name, MeshBee does not use Meshtastic or LoRa mesh networking. Nodes connect
    to WiFi and publish to an MQTT broker. The name is historical.

## The four repositories

Each component is developed and released independently. Nothing here is a monorepo.

| Repository | What it is |
| --- | --- |
| [`meshbee-firmware`](https://github.com/fablab-imperia/meshbee-firmware) | ESP32 node firmware — reads sensors, publishes MQTT |
| [`meshbee-server`](https://github.com/fablab-imperia/meshbee-server) | FastAPI backend, MQTT handler, Postgres |
| [`meshbee-app`](https://github.com/fablab-imperia/meshbee-app) | Expo mobile app |
| [`meshbee-hardware`](https://github.com/fablab-imperia/meshbee-hardware) | Boards, enclosures, 3D-printable parts |

What holds them together is not a shared build — it's a **versioned contract**: the MQTT payload
schema and the HTTP API. Both are published on this site at stable URLs, so a component can ship
on its own schedule without breaking the others.

## Start here

- **[Architecture](architecture.md)** — how a reading gets from a hive to the app, and why it's
  built this way.
- **[The contract](contract/index.md)** — the MQTT payload, the API reference, and which versions
  are known to work together.
- **[Roadmap](roadmap.md)** — what's being worked on now.
- **[Get involved](contribute.md)** — this is a volunteer project and it's all in the open.
