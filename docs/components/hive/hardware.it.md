---
title: Hardware
---

# Hardware

Il lato fisico di un nodo arnia: la scheda su cui gira, il contenitore che lo tiene in vita in un
apiario e le parti stampabili che reggono i sensori.

## Cosa contiene

- **`3d-print/`** — file CAD per le parti stampabili in 3D, realizzati con FreeCAD: il modulo
  arnia (due revisioni) e il guscio del sensore.
- **`pcb/`** — lo schema elettrico della scheda, il pinout dell'ESP32 e i datasheet di riferimento
  dei componenti usati (ESP32, amplificatore per celle di carico HX711, multiplexer CD74HC4067).

## Fatti chiave

| | |
| --- | --- |
| Licenza | CERN-OHL-S v2 — hardware aperto fortemente reciproco |
| Formato CAD | FreeCAD (`.FCStd`) |
| Rilevamento | Temperatura e umidità, più quattro celle di carico per il peso dell'arnia |
| Alimentazione | Solare, dimensionata per far funzionare un nodo senza interventi |

!!! note "Documentazione in corso"

    Il repository hardware non pubblica ancora una distinta base, una guida al montaggio o note
    sulle revisioni della scheda. Quello che esiste oggi sono i file CAD e gli schemi stessi. Se
    stai costruendo un nodo, apri una issue sul repository invece di basarti solo su questa pagina.

## Documentazione completa

<https://github.com/fablab-imperia/meshbee-hardware>

## Collegamenti

- [Firmware](firmware.md) — il codice che gira su questa scheda.
- [Architettura](../../architecture.md) — dove si colloca un nodo nel sistema.
