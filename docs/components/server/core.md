---
title: Core & database
---

# Core & database

Where the data actually lives, and the only code allowed to touch it. `meshbee_core` owns every
SQL statement in the project; the PostgreSQL schema is what those statements write to. Treating
them as one component is deliberate — neither is useful without the other, and a change to one is
almost always a change to both.

## The core library

**A library, not a service**: no `main`, no port, no container of its own. Both entry points — the
[API](api.md) and the [MQTT handler](mqtt.md) — import it, and that is the whole point. A reading
arriving over MQTT and one posted to the REST API go through the *same* validation and the *same*
INSERT.

| Part | What it is |
| --- | --- |
| `schemas.py` | Every pydantic model, and the validation ranges |
| `repository/` | **All the SQL.** One module per table |
| `services/` | Business decisions. One module per domain area |
| `db.py` | The connection pool and `get_db_cursor()` |
| `security.py` | Password hashing — bcrypt at cost 12, framework-free |
| `errors.py` | `NotFound`, `Conflict`, `InvalidData` — the vocabulary services raise |

### The layer rule

This is the reason the package exists, and it is worth stating flatly:

- **`repository/` = tables and queries.** No decisions, no validation. Every function takes a cursor
  as its first argument.
- **`services/` = decisions.** They raise `NotFound` / `Conflict` / `InvalidData`, **never
  `HTTPException`** — a service does not know it is being called over HTTP, and the MQTT handler
  calls the same code.
- **Entry points** validate input, call *one* service, and translate the outcome into a status code
  or a log line.

So new business logic goes in a service, new SQL goes in a repository, and a new route is a thin
call into an existing service. **SQL appearing in `api/` or `mqtt_handler/` means it went to the
wrong place.**

### Transactions

The **caller owns the transaction**. `get_db_cursor()` borrows a connection from the pool and, on
the way out, commits on a clean exit or rolls back and re-raises on an exception. Several service
calls in one block are therefore one atomic unit — and returning quietly instead of raising will
commit a partial write.

## The database

PostgreSQL 15. Domain names are **Italian throughout** because that is the vocabulary of the
project, not an accident of translation.

| Table | What it holds |
| --- | --- |
| `utenti` | Accounts. Soft-deleted, never removed. bcrypt cost 12 |
| `nodi` | Transmitters. PK is `id_nodo` — the id the firmware publishes under |
| `arnie` | Hives. `(id_nodo, id_sensore_fisico)` is how ingest resolves a reading to a hive |
| `utenti_arnie` | Who may see which hive, at `read` / `write` / `admin` |
| `letture` | The telemetry. `BIGSERIAL` on purpose — this is the table that grows |
| `log_attivita` | What the beekeeper did: inspections, treatments, harvests |
| `token_sessione` | Unused, deliberately — the right shape for refresh-token revocation when it lands |

Plus one view, `v_arnie_stato`, and one trigger.

| | |
| --- | --- |
| Engine | PostgreSQL 15, named volume `postgres_data` |
| Port | 5432, published for `psql` and GUI clients |
| Schema | `init.sql` — **runs only once, on an empty volume** |
| Migrations | `migrate_v2.sql` … `migrate_v4.sql` for existing databases |

All three measurements on `letture` are nullable — a node that only carries a scale is valid — and
each carries a CHECK constraint mirroring the ranges enforced in the library: temperature
−50…100 °C, humidity 0…100 %, weight ≥ 0 kg. **Nothing links the two sides**; the integration tests
are what keep them honest.

!!! warning "Never write `nodi.ultimo_messaggio` from application code"

    A trigger on `letture` owns that column and fires after you. Note it records the **node's**
    timestamp, not arrival time, so a node with a wrong clock will make itself look stale.

Two schema facts that surprise people: `utenti.ruolo` is `'user'`, **not** `'utente'` — the one
Italian/English seam in the data. And there is **no `sensori` table**; it was removed in
`migrate_v4.sql` as the alternative model that was never joined to `arnie` and never read.

## Full documentation

- Core library — <https://github.com/fablab-imperia/meshbee-server/blob/main/meshbee_core/README.md>
- Database — <https://github.com/fablab-imperia/meshbee-server/blob/main/database/README.md>

## Related

- [API](api.md) and [MQTT](mqtt.md) — the two callers.
- [The contract](../../contract/index.md) — the interface these schemas have to honour.
