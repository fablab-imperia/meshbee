---
title: Panoramica
---

# MeshBee

Nodi ESP32 alimentati a energia solare stanno dentro le arnie e inviano letture dei sensori —
temperatura, umidità, peso dell'arnia, tensione della batteria — attraverso una rete
**Meshtastic** e poi via **MQTT** a un backend **FastAPI + Postgres**. Un'app **Expo** rilegge
quei dati via HTTP.

!!! info "Il percorso di una lettura"

    I nodi nelle arnie comunicano tra loro su una rete mesh LoRa **Meshtastic** — nell'apiario
    non serve il WiFi. Una lettura rimbalza di nodo in nodo finché non raggiunge un nodo con
    accesso a internet, che fa da gateway e la inoltra via internet al broker **MQTT**. Il
    percorso è quindi una tratta mesh seguita da una normale tratta internet, non l'una o l'altra.

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

Il sistema si divide in tre aree — l'**arnia**, il **server** e l'**app** — e `meshbee-server` è a
sua volta tre pezzi: il percorso di ingest MQTT, l'API REST e la libreria core condivisa con il suo
database. Ognuno ha una pagina breve nella sezione **[Componenti](components/index.md)**.

## Da dove iniziare

- **[Architettura](architecture.md)** — come una lettura arriva dall'arnia all'app, e perché è
  costruita così.
- **[Componenti](components/index.md)** — un riassunto breve di ogni pezzo del sistema e dove sta
  la sua documentazione completa.
- **[Il contratto](contract/index.md)** — il payload MQTT, il riferimento API e quali versioni
  funzionano insieme.
- **[Roadmap](roadmap.md)** — su cosa stiamo lavorando adesso.
- **[Partecipa](contribute.md)** — questo è un progetto di volontari e si sviluppa tutto allo
  scoperto.
