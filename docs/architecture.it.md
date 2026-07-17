---
title: Architettura
---

# Architettura

```text
  ┌──────────────┐
  │  Nodo arnia  │   ESP32 + sensori, alimentato a energia solare
  │  (firmware)  │
  └──────┬───────┘
         │  MQTT su WiFi
         ▼
  ┌──────────────┐
  │  mosquitto   │   broker MQTT
  └──────┬───────┘
         │  subscribe
         ▼
  ┌──────────────┐
  │ Handler MQTT │   valida il payload, decide la compatibilità per messaggio
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐      ┌────────────┐
  │   FastAPI    │◄────►│  Postgres  │
  └──────┬───────┘      └────────────┘
         │  HTTP /v1/
         ▼
  ┌──────────────┐
  │   App Expo   │
  └──────────────┘
```

## Perché è costruita così

Il ragionamento che guida gran parte del progetto: **il parco nodi è eterogeneo in modo
permanente.**

Un nodo è una scheda fissata a un pannello solare in un campo. Non esiste un modo affidabile per
inviargli un aggiornamento. Alcuni nodi continueranno a usare il firmware dell'anno scorso
finché sopravvivono fisicamente. Non c'è nessun giorno X, nessun aggiornamento coordinato,
nessun momento in cui tutti i nodi eseguono lo stesso codice.

Quindi il sistema non può dare per scontato nulla su chi sta dall'altra parte di un messaggio.
Glielo deve dire il messaggio stesso. Da qui tre conseguenze concrete:

- **Il payload MQTT porta con sé un intero di versione** (`v`). Il server decide la compatibilità
  **per messaggio**, non per deployment. Un nodo vecchio e uno nuovo possono pubblicare sullo
  stesso broker nello stesso momento ed essere gestiti entrambi correttamente.
- **L'API HTTP è versionata nel percorso** (`/v1/`). Le release dell'app in circolazione hanno lo
  stesso problema dei nodi: gli utenti aggiornano quando ne hanno voglia. Un'app vecchia continua
  a chiamare l'endpoint per cui è stata costruita.
- **Una [matrice di compatibilità](contract/compatibility.md)** registra quali versioni di
  firmware / server / app funzionano insieme, perché "compila" e "va d'accordo con ciò che è già
  installato sul campo" sono due domande diverse.

Non è generalità speculativa: è il minimo necessario per gestire un parco che non puoi richiamare.

## Dove sta cosa

L'handler MQTT e FastAPI stanno entrambi in [`meshbee-server`](https://github.com/fablab-imperia/meshbee-server).
Il broker (mosquitto) è infrastruttura, non codice applicativo. Il [contratto](contract/index.md)
è l'interfaccia tra i blocchi qui sopra: è la parte che non deve cambiare alla leggera.
