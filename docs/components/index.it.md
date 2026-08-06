---
title: Panoramica
---

# Componenti

MeshBee si divide in tre aree: quello che sta **nell'arnia**, quello che gira sul **server** e
l'**app** nella tasca dell'apicoltore. Ogni pagina qui è un riassunto breve: cos'è il pezzo, cosa fa
e i pochi fatti che vale la pena conoscere prima di aprirlo. La documentazione autorevole è il
README nel repository di ciascun componente, linkato in fondo a ogni pagina.

## Arnia

Tutto quello che sta nell'apiario: alimentato a energia solare, irraggiungibile e con l'aspettativa
di funzionare per anni senza una visita. Due repository, un solo oggetto fisico.

| Componente | Cos'è | Repository |
| --- | --- | --- |
| [Hardware](hive/hardware.md) | Schede, contenitori e parti stampabili in 3D | [`meshbee-hardware`](https://github.com/fablab-imperia/meshbee-hardware) |
| [Firmware](hive/firmware.md) | Sketch ESP32 per i nodi sensore e gateway | [`meshbee-firmware`](https://github.com/fablab-imperia/meshbee-firmware) |

## Server

Tutto quello che sta tra la radio e il telefono. Tutti e tre vivono in un unico repository,
[`meshbee-server`](https://github.com/fablab-imperia/meshbee-server), come container separati.

| Componente | Cos'è |
| --- | --- |
| [MQTT](server/mqtt.md) | Il percorso di ingest: il broker Mosquitto e l'handler che salva ciò che arriva |
| [API](server/api.md) | Il servizio REST FastAPI — l'unica cosa con cui l'app parla |
| [Core e database](server/core.md) | La libreria condivisa che possiede tutto l'SQL, e lo schema PostgreSQL su cui scrive |

Nello stesso repository c'è anche `caddy`, un reverse proxy che termina l'HTTPS su `:8443`. Serve
per lo sviluppo locale e non contiene codice nostro, quindi non ha una pagina qui; un
`docker-compose up` semplice raggiunge l'API direttamente su `:8000`.

## App

| Componente | Cos'è | Repository |
| --- | --- | --- |
| [App mobile](app.md) | App Expo / React Native per apicoltori | [`meshbee-app`](https://github.com/fablab-imperia/meshbee-app) |

## Come leggere queste pagine

Vedi [Architettura](../architecture.md) per come si collegano le aree e perché il server è diviso
così, e [il contratto](../contract/index.md) per l'accordo tra di esse — il formato del payload
MQTT e l'API HTTP, ed è per questo che sono versionati e pubblicati a parte.

Se una pagina sembra scarna, di solito riflette lo stato del README a monte, non lo stato del
codice. Dove succede, è segnalato esplicitamente.
