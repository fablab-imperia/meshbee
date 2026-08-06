---
title: Core e database
---

# Core e database

Dove i dati stanno davvero, e l'unico codice autorizzato a toccarli. `meshbee_core` possiede ogni
istruzione SQL del progetto; lo schema PostgreSQL è ciò su cui quelle istruzioni scrivono.
Trattarli come un unico componente è una scelta: nessuno dei due è utile senza l'altro, e una
modifica a uno è quasi sempre una modifica a entrambi.

## La libreria core

**Una libreria, non un servizio**: nessun `main`, nessuna porta, nessun container proprio. Entrambi
i punti di ingresso — l'[API](api.md) e l'[handler MQTT](mqtt.md) — la importano, ed è tutto il
senso della cosa. Una lettura arrivata via MQTT e una inviata all'API REST passano per la *stessa*
validazione e la *stessa* INSERT.

| Parte | Cos'è |
| --- | --- |
| `schemas.py` | Tutti i modelli pydantic e gli intervalli di validazione |
| `repository/` | **Tutto l'SQL.** Un modulo per tabella |
| `services/` | Le decisioni di business. Un modulo per area di dominio |
| `db.py` | Il pool di connessioni e `get_db_cursor()` |
| `security.py` | Hashing delle password — bcrypt a costo 12, indipendente dal framework |
| `errors.py` | `NotFound`, `Conflict`, `InvalidData` — il vocabolario che i servizi sollevano |

### La regola dei livelli

È la ragione per cui questo package esiste, e vale la pena dirla chiaramente:

- **`repository/` = tabelle e query.** Nessuna decisione, nessuna validazione. Ogni funzione prende
  un cursore come primo argomento.
- **`services/` = decisioni.** Sollevano `NotFound` / `Conflict` / `InvalidData`, **mai
  `HTTPException`**: un servizio non sa di essere chiamato via HTTP, e l'handler MQTT chiama lo
  stesso codice.
- **I punti di ingresso** validano l'input, chiamano *un solo* servizio e traducono l'esito in uno
  status code o in una riga di log.

Quindi la nuova logica di business va in un servizio, il nuovo SQL va in un repository e una nuova
rotta è una chiamata sottile a un servizio esistente. **SQL che compare in `api/` o
`mqtt_handler/` significa che è finito nel posto sbagliato.**

### Transazioni

**La transazione appartiene a chi chiama.** `get_db_cursor()` prende una connessione dal pool e, in
uscita, fa commit se tutto è andato bene oppure rollback e rilancia l'eccezione. Più chiamate a
servizi dentro lo stesso blocco sono quindi un'unica unità atomica — e tornare in silenzio invece
di sollevare un'eccezione fa committare una scrittura parziale.

## Il database

PostgreSQL 15. I nomi di dominio sono **in italiano ovunque**, perché sono il vocabolario del
progetto, non un incidente di traduzione.

| Tabella | Cosa contiene |
| --- | --- |
| `utenti` | Account. Cancellati logicamente, mai rimossi. bcrypt a costo 12 |
| `nodi` | Trasmettitori. La PK è `id_nodo` — l'id con cui pubblica il firmware |
| `arnie` | Arnie. `(id_nodo, id_sensore_fisico)` è come l'ingest associa una lettura a un'arnia |
| `utenti_arnie` | Chi può vedere quale arnia, con permessi `read` / `write` / `admin` |
| `letture` | La telemetria. `BIGSERIAL` di proposito: è la tabella che cresce |
| `log_attivita` | Cosa ha fatto l'apicoltore: ispezioni, trattamenti, raccolte |
| `token_sessione` | Inutilizzata di proposito — è la forma giusta per la revoca dei refresh token quando arriverà |

Più una vista, `v_arnie_stato`, e un trigger.

| | |
| --- | --- |
| Motore | PostgreSQL 15, volume denominato `postgres_data` |
| Porta | 5432, esposta per `psql` e client grafici |
| Schema | `init.sql` — **viene eseguito una volta sola, su un volume vuoto** |
| Migrazioni | `migrate_v2.sql` … `migrate_v4.sql` per i database esistenti |

Tutte e tre le misure su `letture` ammettono NULL — un nodo che porta solo la bilancia è valido — e
ognuna ha un vincolo CHECK che rispecchia gli intervalli applicati nella libreria: temperatura
−50…100 °C, umidità 0…100 %, peso ≥ 0 kg. **Nulla collega i due lati**: sono i test di integrazione
a tenerli allineati.

!!! warning "Non scrivere mai `nodi.ultimo_messaggio` dal codice applicativo"

    Un trigger su `letture` possiede quella colonna e scatta dopo di te. Nota che registra il
    timestamp del **nodo**, non l'ora di arrivo: un nodo con l'orologio sbagliato sembrerà fermo.

Due dettagli dello schema che sorprendono: `utenti.ruolo` vale `'user'`, **non** `'utente'` —
l'unica cucitura italiano/inglese nei dati. E **non esiste una tabella `sensori`**: è stata rimossa
in `migrate_v4.sql`, era il modello alternativo mai unito ad `arnie` e mai letto.

## Documentazione completa

- Libreria core — <https://github.com/fablab-imperia/meshbee-server/blob/main/meshbee_core/README.md>
- Database — <https://github.com/fablab-imperia/meshbee-server/blob/main/database/README.md>

## Collegamenti

- [API](api.md) e [MQTT](mqtt.md) — i due chiamanti.
- [Il contratto](../../contract/index.md) — l'interfaccia che questi schemi devono rispettare.
