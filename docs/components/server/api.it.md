---
title: API
---

# API

Il **volto HTTP del backend**, e l'unico pezzo con cui l'app mobile parla. FastAPI sotto uvicorn
sulla porta 8000.

È volutamente sottile: ogni handler valida il proprio input, apre un solo cursore, chiama *un solo*
servizio di [`meshbee_core`](core.md) e traduce l'esito in uno status code. **Qui non c'è SQL.**

## Cosa fa

- Autentica gli apicoltori ed emette i JWT.
- Serve arnie, letture e log delle attività agli account autorizzati a vederli.
- Espone endpoint di serie storiche pensati per i grafici — `{timestamp, temperatura}` e simili —
  perché a un grafico servono due colonne, non una riga da otto.
- Dà agli admin la gestione completa di account, nodi, arnie e permessi di accesso.

## Fatti chiave

| | |
| --- | --- |
| Porta | 8000 (`--reload` in sviluppo) |
| Operazioni | 36, raggruppate in Autenticazione · Utente · Admin · Info |
| Autenticazione | JWT bearer, HS256. La riga utente viene riletta a **ogni** richiesta |
| Permessi | nessuno → utente → admin, più `read` / `write` per singola arnia. Gli admin saltano i controlli per arnia |
| Contratto | `api/openapi.json`, committato e rigenerato con `make openapi` |

`/health` **risponde sempre 200** — il verdetto sta nel corpo (`"status": "healthy"` /
`"unhealthy"`). Un sistema di monitoraggio deve leggere il corpo, non lo status code.

`POST /api/admin/letture` e il percorso di ingest MQTT finiscono sulla stessa INSERT ma si
comportano diversamente di proposito con i riferimenti sconosciuti: questa rotta risponde **404**
per un'arnia sconosciuta, mentre l'[ingest](mqtt.md) registra nodo e arnia al volo.

In sviluppo locale `caddy` sta davanti all'API e termina l'HTTPS su `:8443`. È opzionale: senza
`make certs`, l'app raggiunge l'API direttamente su `:8000`.

## Documentazione completa

<https://github.com/fablab-imperia/meshbee-server/blob/main/api/README.md>

## Collegamenti

- [Riferimento API](../../contract/api.md) — il riferimento completo degli endpoint, generato dalla
  specifica live.
- [Core e database](core.md) — dove stanno davvero le decisioni e l'SQL.
- [App](../app.md) — il client dall'altra parte.
