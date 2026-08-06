---
title: Firmware
---

# Firmware

Il codice ESP32 che gira nell'apiario. Due sketch, uno per ciascun ruolo che un nodo può avere.

## Cosa fa

- **`sender/`** — il nodo sensore. Legge temperatura, umidità e peso dell'arnia, poi trasmette.
- **`receiver/`** — il nodo gateway. È il nodo con una connessione a internet: inoltra le letture
  al broker MQTT.
- **`HX711/`** — libreria per l'amplificatore delle celle di carico, inclusa nel repository e usata
  per leggere le quattro celle di peso.

## Fatti chiave

| | |
| --- | --- |
| Toolchain | Arduino IDE ≥ 2.0 con board support ESP32 (`esp32 by Espressif`) |
| Librerie | `HX711`, `DHT sensor library`, `PubSubClient`, `ArduinoJson` |
| Scheda | ESP32 Dev Module |
| Credenziali | `receiver/credentials.h`, creato da `credentials.h.example` — non committarlo mai |
| Licenza | GPL-3.0 |

Il file delle credenziali contiene l'indirizzo del broker, utente e password MQTT (corrispondenti a
`MQTT_USER` e `MQTT_PASSWORD` nel `.env` del server) e SSID e password del WiFi.

!!! note "La documentazione è indietro rispetto al sistema"

    Il README del firmware descrive MQTT su WiFi e non menziona ancora la mesh LoRa Meshtastic che
    porta le letture dal nodo sensore al gateway. La tratta mesh è reale — vedi
    [Architettura](../../architecture.md). Considera il README a monte autorevole per i passi di build
    e di flash, e questo sito per come si collegano i pezzi.

## Documentazione completa

<https://github.com/fablab-imperia/meshbee-firmware>

## Collegamenti

- [Hardware](hardware.md) — la scheda su cui gira.
- [MQTT](../server/mqtt.md) — dove pubblica il gateway.
- [Payload MQTT](../../contract/mqtt-payload.md) — il formato che un nodo deve inviare.
