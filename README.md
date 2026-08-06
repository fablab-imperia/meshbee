# 🐝 MeshBee

**English** · [Italiano](README.it.md)

Open beehive telemetry: solar ESP32 nodes report temperature, humidity, weight and battery
over a Meshtastic LoRa mesh to a FastAPI backend — and back out to your phone.

📖 **Documentation:** <https://fablab-imperia.github.io/meshbee/>
🛠️ **Built by:** [Fablab Imperia APS](https://www.fablabimperia.org)

The docs site covers the architecture, roadmap and the versioned **contract** (MQTT payload
schema, API reference and compatibility matrix) that holds the components together.

## Repository structure

This is the **umbrella** repository — documentation-first. The actual firmware, server, app and
hardware live in their own repositories and ship on their own schedules:

| Repository | What it is |
|---|---|
| **[meshbee](https://github.com/fablab-imperia/meshbee)** (this one) | Umbrella repo: documentation, architecture and the versioned MQTT/API contract. |
| **[meshbee-firmware](https://github.com/fablab-imperia/meshbee-firmware)** | ESP32 firmware for the sensor and gateway nodes (Meshtastic + MQTT). |
| **[meshbee-server](https://github.com/fablab-imperia/meshbee-server)** | Backend: FastAPI REST API, MQTT handler, Mosquitto broker and PostgreSQL, via Docker Compose. |
| **[meshbee-app](https://github.com/fablab-imperia/meshbee-app)** | Mobile app in React Native / Expo — dashboards, charts and push alerts. |
| **[meshbee-hardware](https://github.com/fablab-imperia/meshbee-hardware)** | Hardware design: PCB schematics and 3D-printed enclosures. |

## License

MeshBee is documentation-first, so licenses follow the content:

- **Documentation & other content** (`docs/`, README) — CC BY-SA 4.0 · see [`LICENSE`](LICENSE)
- **Dev config** (`.devcontainer/`) — GPL-3.0 · see [`LICENSE-CODE`](LICENSE-CODE) — kept GPL-3.0 to stay license-compatible with the MeshBee code repos it serves
- **Interface contract** (`docs/contract/` — OpenAPI & MQTT schema) — Apache-2.0 · see [`docs/contract/LICENSE`](docs/contract/LICENSE) — so downstream implementers can generate clients freely, without share-alike obligations
- **Hardware designs** — CERN-OHL-S v2, in the [meshbee-hardware](https://github.com/fablab-imperia/meshbee-hardware) repo

## Contributing to these docs

To preview or build the documentation site locally, see
**[Build & preview the docs](https://fablab-imperia.github.io/meshbee/develop/)**
([source](docs/develop.md)).

## Versioning

Releases follow [![SemVer 2.0.0](https://img.shields.io/badge/SemVer-2.0.0-blue.svg)](https://semver.org/spec/v2.0.0.html).

Commits follow [![Conventional Commits 1.0.0](https://img.shields.io/badge/Conventional%20Commits-1.0.0-blue.svg)](https://www.conventionalcommits.org/en/v1.0.0/).

See [CONTRIBUTING](https://github.com/fablab-imperia/.github/blob/main/CONTRIBUTING.md)
and the [compatibility matrix](https://fablab-imperia.github.io/meshbee/contract/compatibility/).

---

Made with ❤️ for the bees 🐝
