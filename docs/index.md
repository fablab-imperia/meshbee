---
title: MeshBee
hide:
  - navigation
  - toc
---

<div class="mb-hero" markdown>

![MeshBee](/meshbee/assets/logo.svg){ .mb-hero-logo }

# Open beehive telemetry {.mb-hero-title}

Solar ESP32 nodes in the hive, reporting temperature, humidity, weight and battery
over a Meshtastic mesh to a FastAPI backend — and back out to your phone.
{ .mb-hero-lead }

[Read the docs](overview.md){ .md-button .md-button--primary }
[The contract](contract/index.md){ .md-button }

Developed by [Fablab Imperia APS](https://www.fablabimperia.org).
{ .mb-hero-byline }

</div>

<div class="grid cards" markdown>

-   **Four repos, one contract**

    ---

    Firmware, server, app and hardware ship on their own schedules. What holds them
    together is a versioned MQTT payload schema and HTTP API, published here at stable URLs.

    [:octicons-arrow-right-24: How it fits together](architecture.md)

-   **The versioned contract**

    ---

    The MQTT payload schema, the API reference rendered from OpenAPI, and the matrix of
    which component versions are known to work together.

    [:octicons-arrow-right-24: Read the contract](contract/index.md)

-   **Built in the open**

    ---

    MeshBee is a volunteer project at Fablab Imperia APS. The boards, the enclosures, the
    code and these docs are all public, and the roadmap is a public board.

    [:octicons-arrow-right-24: Get involved](contribute.md)

</div>

!!! info "How a reading travels"

    Hive nodes talk to each other over a **Meshtastic** LoRa mesh — no WiFi needed in the
    apiary. A reading hops across the mesh until it reaches a node with internet access, which
    acts as the gateway and forwards it over the internet to the **MQTT** broker.
