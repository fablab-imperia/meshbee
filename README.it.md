# 🐝 MeshBee

[English](README.md) · **Italiano**

Telemetria open per arnie: nodi ESP32 a energia solare inviano temperatura, umidità, peso e
batteria attraverso una mesh LoRa Meshtastic a un backend FastAPI — e di nuovo fino al tuo telefono.

📖 **Documentazione:** <https://fablab-imperia.github.io/meshbee/>
🛠️ **Realizzato da:** [Fablab Imperia APS](https://www.fablabimperia.org)

Il sito della documentazione descrive l'architettura, la roadmap e il **contratto** versionato
(schema del payload MQTT, riferimento API e matrice di compatibilità) che tiene insieme i componenti.

## Struttura dei repository

Questo è il repository **umbrella** — prima di tutto documentazione. Firmware, server, app e
hardware vivono nei propri repository e vengono rilasciati con tempi propri:

| Repository | Cos'è |
|---|---|
| **[meshbee](https://github.com/fablab-imperia/meshbee)** (questo) | Repository umbrella: documentazione, architettura e contratto MQTT/API versionato. |
| **[meshbee-firmware](https://github.com/fablab-imperia/meshbee-firmware)** | Firmware ESP32 per i nodi sensore e gateway (Meshtastic + MQTT). |
| **[meshbee-server](https://github.com/fablab-imperia/meshbee-server)** | Backend: API REST FastAPI, handler MQTT, broker Mosquitto e PostgreSQL, via Docker Compose. |
| **[meshbee-app](https://github.com/fablab-imperia/meshbee-app)** | App mobile in React Native / Expo — dashboard, grafici e notifiche push. |
| **[meshbee-hardware](https://github.com/fablab-imperia/meshbee-hardware)** | Progetto hardware: schemi PCB e contenitori stampati in 3D. |

## Licenza

MeshBee è prima di tutto documentazione, quindi le licenze seguono i contenuti:

- **Documentazione e altri contenuti** (`docs/`, README) — CC BY-SA 4.0 · vedi [`LICENSE`](LICENSE)
- **Script e configurazione di sviluppo** (`scripts/`, `.devcontainer/`) — GPL-3.0 · vedi [`LICENSE-CODE`](LICENSE-CODE) — mantenuti GPL-3.0 per restare compatibili con i repository di codice MeshBee che servono
- **Contratto di interfaccia** (`docs/contract/` — OpenAPI e schema MQTT) — Apache-2.0 · vedi [`docs/contract/LICENSE`](docs/contract/LICENSE) — così chi implementa a valle può generare client liberamente, senza obblighi di share-alike
- **Progetti hardware** — CERN-OHL-S v2, nel repository [meshbee-hardware](https://github.com/fablab-imperia/meshbee-hardware)

## Contribuire a questa documentazione

Per l'anteprima o la build del sito della documentazione in locale, vedi
**[Build e anteprima della documentazione](https://fablab-imperia.github.io/meshbee/it/develop/)**
([sorgente](docs/develop.it.md)).

---

Fatto con ❤️ per le api 🐝
