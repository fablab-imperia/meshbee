---
title: Partecipa
---

# Partecipa

MeshBee è portato avanti dai volontari del [Fablab Imperia APS](https://github.com/fablab-imperia),
e si sviluppa tutto allo scoperto. Non c'è una roadmap privata né un fork interno.

## Da dove iniziare

Ogni repository etichetta il lavoro adatto a chi arriva come **good first issue**:

- [`meshbee-firmware`](https://github.com/fablab-imperia/meshbee-firmware/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [`meshbee-server`](https://github.com/fablab-imperia/meshbee-server/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [`meshbee-app`](https://github.com/fablab-imperia/meshbee-app/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [`meshbee-hardware`](https://github.com/fablab-imperia/meshbee-hardware/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

L'esperienza in apicoltura qui vale quanto quella nel software. Idem una stampante 3D.

## Lingua

**Codice, identificatori e messaggi di commit sono in inglese.** Senza eccezioni: mantiene il
codice leggibile a tutti e cercabile con grep tra i repository.

**La documentazione per le persone può essere in inglese o in italiano.** Questo sito è
bilingue: scrivi una pagina nella lingua in cui ti trovi a tuo agio, qualcuno potrà rispecchiarla
più avanti. Quando le due versioni divergono, fa fede quella inglese.

Le [pagine del contratto](contract/index.md) sono solo in inglese per scelta: si rivolgono alle
macchine.

## Le regole

Il [Codice di Condotta](https://github.com/fablab-imperia/.github/blob/main/CODE_OF_CONDUCT.md) e
la [guida per contribuire](https://github.com/fablab-imperia/.github/blob/main/CONTRIBUTING.md)
stanno nel repository `.github` dell'organizzazione e valgono per ogni repository MeshBee.

## Messaggi di commit e versioning

Ogni repository MeshBee segue i
[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) per i messaggi di
commit e il [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) per i rilasci. La
policy completa sta nella
[guida per contribuire](https://github.com/fablab-imperia/.github/blob/main/CONTRIBUTING.md#commit-messages-and-versioning)
dell'organizzazione; qui sotto la versione breve.

### Conventional Commits

Ogni messaggio inizia con un **tipo**, uno **scope** facoltativo e poi una breve descrizione (i
messaggi di commit sono in inglese):

```
feat(sensor): add null-read fallback
fix: correct temperature offset
docs(readme): document build steps
```

| Tipo | Quando usarlo |
|---|---|
| `feat` | nuova funzionalità per gli utenti |
| `fix` | correzione di un bug |
| `docs` | modifiche solo alla documentazione |
| `style` | formattazione, nessun cambio di comportamento |
| `refactor` | modifica al codice che non corregge bug né aggiunge funzionalità |
| `perf` | miglioramento delle prestazioni |
| `test` | aggiunta o modifica di test |
| `build` | modifiche al sistema di build o alle dipendenze |
| `ci` | configurazione dell'integrazione continua |
| `chore` | manutenzione fuori da sorgenti o test |
| `revert` | annulla un commit precedente |

I breaking change si segnalano con un `!` dopo il tipo/scope (`feat!:`) oppure con un footer
`BREAKING CHANGE:`.

### Semantic Versioning

I rilasci hanno numero `MAJOR.MINOR.PATCH`:

- **MAJOR** — modifiche incompatibili
- **MINOR** — nuove funzionalità retrocompatibili
- **PATCH** — correzioni di bug retrocompatibili

La [matrice di compatibilità](contract/compatibility.md) indica quali versioni dei componenti
funzionano insieme.

## Come contattarci

- **Domande, idee, "è un bug?"** → [Discussions](https://github.com/fablab-imperia/meshbee/discussions).
- **Problemi di sicurezza** → usa la segnalazione privata di vulnerabilità di GitHub sul
  repository interessato, oppure scrivi a <info@fablabimperia.org>. Per favore non aprire una
  issue pubblica per queste cose.

## Licenze

- **Codice** — GPL-3.0
- **Progetti hardware** — CERN-OHL-S v2
- **Documentazione e altri contenuti** — CC BY-SA 4.0
- **Contratto di interfaccia** (`docs/contract/` — OpenAPI e schema MQTT) — Apache-2.0

## Lavorare su questo sito

Il sito usa [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) ed è costruito
dalla cartella `docs/` di questo repository.

**Da terminale, con Docker Compose** — senza usare nessun editor:

```bash
docker compose -f .devcontainer/compose.yaml up -d --build
```

Tutto qui: un solo comando avvia tutto, e `mkdocs serve` è il comando predefinito del servizio
docs. Apri <http://localhost:8000/meshbee/>, oppure <https://localhost:8443/meshbee/> dopo aver
generato i certificati (vedi [HTTPS in locale](#https-in-locale): senza certificati l'HTTP
funziona lo stesso). Le modifiche fatte sulla tua macchina si ricaricano subito: il repository è
montato in bind, non viene copiato dentro l'immagine. Per seguire l'output o fermare tutto:

```bash
docker compose -f .devcontainer/compose.yaml logs -f docs
docker compose -f .devcontainer/compose.yaml down
```

Due cose da sapere:

- Se la porta 8000 sull'host è occupata, usa `DOCS_PORT`. Mettilo davanti a ogni comando compose:
  viene letto quando il container viene creato, quindi serve sia a `up` sia a `down`:

    ```bash
    DOCS_PORT=8001 docker compose -f .devcontainer/compose.yaml up -d
    ```

- **Un errore di configurazione fa uscire il container**, perché `mkdocs serve` è il suo processo
  principale. È voluto: un serve morto non deve sembrare sano. `logs docs` mostra il motivo
  (indica la riga incriminata) e puoi comunque aprire una shell per sistemare:

    ```bash
    docker compose -f .devcontainer/compose.yaml run --rm docs bash
    ```

### HTTPS in locale

GitHub Pages serve in HTTPS. `mkdocs serve` funziona solo in HTTP e non ha opzioni TLS, quindi
per avere le stesse condizioni della produzione — e scoprire prima problemi di contenuto misto o
di URL assoluti — un proxy [Caddy](https://caddyserver.com) opzionale termina il TLS davanti.

Serve [mkcert](https://github.com/FiloSottile/mkcert) (`brew install mkcert`), che emette un
certificato da una CA presente nel trust store del sistema: è questo che rende il lucchetto vero
invece di un avviso da saltare. Una volta sola:

```bash
./.devcontainer/make-certs.sh
```

Poi il solito `up -d` serve anche in HTTPS, senza flag aggiuntivi:

```bash
docker compose -f .devcontainer/compose.yaml up -d
```

Apri <https://localhost:8443/meshbee/>. Il live reload continua a funzionare: Caddy inoltra il
WebSocket in modo trasparente. Con `HTTPS_PORT` cambi la porta se la 8443 è occupata.

Senza certificati il proxy spiega come generarli ed esce, e l'HTTP continua a funzionare
normalmente: un clone appena fatto non richiede alcuna configurazione finché non vuoi il TLS.
`down` ferma il proxy insieme a tutto il resto.

!!! note "I certificati sono chiavi private"

    `.devcontainer/certs/` è nel gitignore. Non committarlo mai. Ogni persona genera i propri: una
    chiave di sviluppo condivisa è una chiave compromessa.

Altri comandi utili:

```bash
# build identica a quella della CI
docker compose -f .devcontainer/compose.yaml exec docs mkdocs build --strict
```

Non c'è nessun passaggio di download degli artefatti: gli artefatti del contratto vengono letti da
`meshbee-server` al caricamento della pagina, quindi una build locale non ha bisogno della rete.

**Con VS Code** — *Reopen in Container* usa lo stesso file compose, quindi le due strade non
possono divergere. VS Code sostituisce il comando predefinito con un keepalive
(`overrideCommand`), così un crash del serve non si porta via la sessione dell'editor: avvia tu
il server da un terminale di VS Code:

```bash
mkdocs serve -a 0.0.0.0:8000
```

Dentro un container `-a 0.0.0.0:8000` è obbligatorio: altrimenti MkDocs ascolta sul loopback del
container, che il tuo browser non raggiunge. La porta 8000 viene inoltrata da sola.

**Senza container:**

```bash
pip install -r requirements-docs.txt
mkdocs serve
```

Prima di fare push, controlla la build come fa la CI: una pagina non elencata o un link rotto
fallisce lì, non con `serve`:

```bash
mkdocs build --strict
```

Le pagine italiane usano il suffisso `.it.md` accanto alla controparte inglese (`roadmap.md` →
`roadmap.it.md`). Ogni pagina deve essere elencata in `nav` dentro `mkdocs.yml`: la build gira con
`--strict`, quindi una pagina non elencata fa fallire la CI invece di sparire in silenzio.

Un push su `main` pubblica su <https://fablab-imperia.github.io/meshbee/> tramite GitHub Actions.
