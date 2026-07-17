---
title: Home
---

# MeshBee

Nodi ESP32 alimentati a energia solare stanno dentro le arnie e inviano letture dei sensori —
temperatura, umidità, peso dell'arnia, tensione della batteria — via **MQTT** a un backend
**FastAPI + Postgres**. Un'app **Expo** rilegge quei dati via HTTP.

!!! warning "I dati passano da MQTT su WiFi, non da Meshtastic"

    Nonostante il nome, MeshBee non usa Meshtastic né reti mesh LoRa. I nodi si collegano al
    WiFi e pubblicano su un broker MQTT. Il nome è di origine storica.

## I quattro repository

Ogni componente è sviluppato e rilasciato in modo indipendente. Qui non c'è nessun monorepo.

| Repository | Cos'è |
| --- | --- |
| [`meshbee-firmware`](https://github.com/fablab-imperia/meshbee-firmware) | Firmware dei nodi ESP32 — legge i sensori, pubblica su MQTT |
| [`meshbee-server`](https://github.com/fablab-imperia/meshbee-server) | Backend FastAPI, handler MQTT, Postgres |
| [`meshbee-app`](https://github.com/fablab-imperia/meshbee-app) | App mobile Expo |
| [`meshbee-hardware`](https://github.com/fablab-imperia/meshbee-hardware) | Schede, contenitori, parti stampabili in 3D |

Ciò che tiene insieme il tutto non è una build condivisa, ma un **contratto versionato**: lo
schema del payload MQTT e l'API HTTP. Entrambi sono pubblicati su questo sito a URL stabili, così
ogni componente può essere rilasciato secondo i propri tempi senza rompere gli altri.

## Da dove iniziare

- **[Architettura](architecture.md)** — come una lettura arriva dall'arnia all'app, e perché è
  costruita così.
- **[Il contratto](contract/index.md)** — il payload MQTT, il riferimento API e quali versioni
  funzionano insieme.
- **[Roadmap](roadmap.md)** — su cosa stiamo lavorando adesso.
- **[Partecipa](contribute.md)** — questo è un progetto di volontari e si sviluppa tutto allo
  scoperto.
