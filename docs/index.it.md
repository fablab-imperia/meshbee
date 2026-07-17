---
title: MeshBee
hide:
  - navigation
  - toc
---

<div class="mb-hero" markdown>

![MeshBee](/meshbee/assets/logo.svg){ .mb-hero-logo }

# Telemetria aperta per le arnie {.mb-hero-title}

Nodi ESP32 a energia solare dentro l'arnia, che inviano temperatura, umidità, peso e
batteria attraverso una rete Meshtastic a un backend FastAPI — e da lì fino al telefono.
{ .mb-hero-lead }

[Leggi la documentazione](overview.md){ .md-button .md-button--primary }
[Il contratto](contract/index.md){ .md-button }

Sviluppato dal [Fablab Imperia APS](https://www.fablabimperia.org).
{ .mb-hero-byline }

</div>

<div class="grid cards" markdown>

-   **Quattro repository, un contratto**

    ---

    Firmware, server, app e hardware vengono rilasciati secondo i propri tempi. A tenerli
    insieme è un contratto versionato: lo schema del payload MQTT e l'API HTTP, pubblicati
    qui a URL stabili.

    [:octicons-arrow-right-24: Come si incastra tutto](architecture.md)

-   **Il contratto versionato**

    ---

    Lo schema del payload MQTT, il riferimento API generato da OpenAPI e la matrice delle
    versioni che sappiamo funzionare insieme.

    [:octicons-arrow-right-24: Leggi il contratto](contract/index.md)

-   **Sviluppato allo scoperto**

    ---

    MeshBee è un progetto di volontari del Fablab Imperia APS. Le schede, i contenitori, il
    codice e questa documentazione sono pubblici, e la roadmap è una board pubblica.

    [:octicons-arrow-right-24: Partecipa](contribute.md)

</div>

!!! info "Il percorso di una lettura"

    I nodi nelle arnie comunicano tra loro su una rete mesh LoRa **Meshtastic** — nell'apiario
    non serve il WiFi. Una lettura rimbalza di nodo in nodo finché non raggiunge un nodo con
    accesso a internet, che fa da gateway e la inoltra via internet al broker **MQTT**.
