---
title: MQTT
---

# MQTT

Il **percorso di ingest**: tutto ciò che un'arnia misura entra nel sistema da qui. Due processi che
hanno senso solo insieme — un broker che accetta ciò che i nodi pubblicano e un handler che
decodifica quei messaggi e li consegna alla libreria core perché vengano salvati.

## Il broker

Mosquitto, il punto di ingresso dei dati dei sensori. È un'immagine `eclipse-mosquitto:2.0` pronta
all'uso, quindi `mosquitto/` in `meshbee-server` non contiene codice applicativo: solo
configurazione e stato di runtime, montati nel container.

| | |
| --- | --- |
| Porte | **1883** MQTT (in uso) · **9001** WebSocket (configurata ma inutilizzata) |
| Configurazione | `config/mosquitto.conf` — l'unico file sorgente tracciato |
| Credenziali | `config/passwd`, hash bcrypt, generato da `make mqtt-passwd`. Ignorato da git |
| Log | stdout, ruotati da Docker |

!!! warning "Il broker non parte senza `config/passwd`"

    Gira con `allow_anonymous false`. Un file password mancante è la causa singola più comune di uno
    stack che non funziona. `make setup` lo genera su un clone nuovo; rigeneralo con
    `make mqtt-passwd` ogni volta che cambi `MQTT_PASSWORD`, perché il file contiene un hash e non
    segue automaticamente la variabile.

Il broker **non conserva nulla di nostro**: le letture stanno in PostgreSQL, quindi svuotare
`data/` costa al massimo qualche messaggio non consegnato. Oggi non ci sono ACL e tutti i nodi
condividono una sola credenziale, quindi un nodo compromesso non può essere revocato singolarmente.

## L'handler

Un **subscriber headless**: nessuna superficie HTTP, nessuna porta, nessun client. È un ciclo tra
Mosquitto e [`meshbee_core`](core.md) che decodifica ogni payload, lo valida e lo consegna perché
venga salvato.

**Non scrive SQL proprio.** Apre una transazione e chiama un solo servizio —
`meshbee_core.services.ingest` — e da lì in poi ogni query appartiene alla libreria core. È la
regola dei livelli su cui è costruito tutto il server, ed è il motivo per cui una lettura arrivata
via MQTT produce la stessa riga di database di una inviata a `POST /api/admin/letture`.

- Si iscrive a `beehive/+/data`; i nodi pubblicano su `beehive/<id_nodo>/data`.
- Applica gli intervalli delle misure — temperatura −50…100 °C, umidità 0…100 %, peso ≥ 0 kg.
- **Fa provisioning automatico**: un nodo che inizia a trasmettere prima che qualcuno lo registri
  viene registrato, e un `id_sensore` sconosciuto crea un'arnia invece di perdere la lettura.

!!! warning "Una lettura rifiutata viene scartata, non ritentata"

    Il broker riceve l'acknowledgement prima che l'handler guardi il payload, quindi un messaggio
    che fallisce la validazione viene registrato come `Lettura scartata` e sparisce. Non esiste una
    dead-letter queue.

Due modalità di guasto da conoscere. `+` corrisponde a **esattamente un livello**, quindi un nodo
che pubblica su `beehive/NODE001/sensors/data` si connette senza problemi, non riceve errori e
viene ignorato in silenzio: controlla prima questo quando un nodo "funziona" ma nel database non
arriva nulla. E **non c'è hot reload**: modificare un file non cambia nulla finché non esegui
`docker-compose restart mqtt-handler`.

L'[API](api.md) non tocca mai MQTT. Legge lo stesso database ma non è un client del broker, quindi
riavviare il broker non la disturba.

## Documentazione completa

- Broker — <https://github.com/fablab-imperia/meshbee-server/blob/main/mosquitto/README.md>
- Handler — <https://github.com/fablab-imperia/meshbee-server/blob/main/mqtt_handler/README.md>

## Collegamenti

- [Firmware](../hive/firmware.md) — cosa pubblica sul broker.
- [Payload MQTT](../../contract/mqtt-payload.md) — il formato del payload in dettaglio.
- [Core e database](core.md) — dove la lettura viene effettivamente scritta.
