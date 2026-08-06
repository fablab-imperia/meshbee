---
title: API
---

# API

The **HTTP face of the backend**, and the only piece the mobile app talks to. FastAPI under uvicorn
on port 8000.

It is deliberately thin: every handler validates its input, opens one cursor, calls *one* service
from [`meshbee_core`](core.md), and translates the outcome into a status code. **There is no SQL
here.**

## What it does

- Authenticates beekeepers and issues JWTs.
- Serves hives, readings and the activity log to the accounts allowed to see them.
- Exposes chart-shaped series endpoints — `{timestamp, temperatura}` and friends — because a chart
  needs two columns, not a row of eight.
- Gives admins full management of accounts, nodes, hives and access grants.

## Key facts

| | |
| --- | --- |
| Port | 8000 (`--reload` in development) |
| Operations | 36, grouped as Autenticazione · Utente · Admin · Info |
| Auth | JWT bearer, HS256. The user row is re-read on **every** request |
| Permissions | none → user → admin, plus per-hive `read` / `write`. Admins bypass per-hive checks |
| Contract | `api/openapi.json`, committed and regenerated with `make openapi` |

`/health` **always answers 200** — the verdict is in the body (`"status": "healthy"` /
`"unhealthy"`). A monitor must read the body, not the status code.

`POST /api/admin/letture` and the MQTT ingest path end at the same INSERT but differ on purpose for
unknown references: this route answers **404** for an unknown hive, while
[ingest](mqtt.md) provisions the node and hive on the fly.

In local development `caddy` sits in front of the API and terminates HTTPS on `:8443`. It is
optional — without `make certs`, the app reaches the API directly on `:8000`.

## Full documentation

<https://github.com/fablab-imperia/meshbee-server/blob/main/api/README.md>

## Related

- [API reference](../../contract/api.md) — the full endpoint reference, rendered from the live spec.
- [Core & database](core.md) — where the decisions and the SQL actually live.
- [App](../app.md) — the client on the other end.
