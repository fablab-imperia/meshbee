# Build e anteprima della documentazione

Questo sito è costruito con [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/). È
bilingue — l'inglese è canonico, le pagine italiane usano il suffisso `.it.md`. I sorgenti stanno
in `docs/` nel [repository umbrella](https://github.com/fablab-imperia/meshbee).

## Anteprima locale

### Con Docker Compose

L'immagine del devcontainer corrisponde alla CI (Python 3.12, tutte le dipendenze e `gh` già dentro):

```bash
docker compose -f .devcontainer/compose.yaml up -d --build
# → http://localhost:8000/meshbee/     (per fermare: ... down)
```

Il servizio esegue `mkdocs serve`: le modifiche si ricaricano da sole.
Se la porta 8000 è occupata: `DOCS_PORT=8001 docker compose -f ... up -d`.
Se il container esce subito, `... logs docs` mostra l'errore di configurazione.

Per servire anche in HTTPS come fa GitHub Pages (serve `mkcert`), genera i certificati una volta
sola: da lì in poi lo stesso `up -d` avvia anche il proxy TLS, e `down` ferma tutto:

```bash
./.devcontainer/make-certs.sh     # una volta sola
docker compose -f .devcontainer/compose.yaml up -d
# → https://localhost:8443/meshbee/
```

Senza certificati il proxy spiega cosa fare ed esce; l'HTTP funziona lo stesso.
Lo stesso file compose è usato anche da VS Code (*Reopen in Container*).

### Senza container

```bash
pip install -r requirements-docs.txt
mkdocs serve      # http://127.0.0.1:8000
```

## Verifica la build

Prima di fare push, verifica la build come fa la CI:

```bash
mkdocs build --strict
```

Ogni pagina deve essere elencata in `nav` dentro `mkdocs.yml`, altrimenti la build in strict fallisce.

## Deploy

Il deploy è automatico. Ogni push su `main` che tocca `docs/`, `mkdocs.yml`,
`requirements-docs.txt` o `scripts/` attiva il workflow `.github/workflows/docs.yml`, che
costruisce il sito con `mkdocs build --strict` e lo pubblica su GitHub Pages.
