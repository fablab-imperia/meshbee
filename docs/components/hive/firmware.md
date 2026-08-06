---
title: Firmware
---

# Firmware

The ESP32 code that runs in the apiary. Two sketches, one for each role a node can play.

## What it does

- **`sender/`** — the sensor node. Reads temperature, humidity and hive weight, then transmits.
- **`receiver/`** — the gateway node. The node with an internet connection; it forwards readings
  on to the MQTT broker.
- **`HX711/`** — vendored load-cell amplifier library, used to read the four weight cells.

## Key facts

| | |
| --- | --- |
| Toolchain | Arduino IDE ≥ 2.0 with ESP32 board support (`esp32 by Espressif`) |
| Libraries | `HX711`, `DHT sensor library`, `PubSubClient`, `ArduinoJson` |
| Board | ESP32 Dev Module |
| Credentials | `receiver/credentials.h`, created from `credentials.h.example` — never commit it |
| License | GPL-3.0 |

The credentials file carries the broker address, the MQTT user and password (matching `MQTT_USER`
and `MQTT_PASSWORD` in the server's `.env`), and the WiFi SSID and password.

!!! note "Documentation lags the system"

    The firmware README describes MQTT over WiFi and does not yet mention the Meshtastic LoRa mesh
    that carries readings from a sensor node to the gateway. The mesh leg is real — see
    [Architecture](../../architecture.md). Treat the upstream README as authoritative for build and
    flashing steps, and this site for how the pieces connect.

## Full documentation

<https://github.com/fablab-imperia/meshbee-firmware>

## Related

- [Hardware](hardware.md) — the board this runs on.
- [MQTT](../server/mqtt.md) — what the gateway publishes to.
- [MQTT payload](../../contract/mqtt-payload.md) — the format a node must send.
