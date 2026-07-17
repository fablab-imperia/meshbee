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

## Come contattarci

- **Domande, idee, "è un bug?"** → [Discussions](https://github.com/fablab-imperia/meshbee/discussions).
- **Problemi di sicurezza** → usa la segnalazione privata di vulnerabilità di GitHub sul
  repository interessato, oppure scrivi a <info@fablabimperia.org>. Per favore non aprire una
  issue pubblica per queste cose.

## Licenze

- **Codice** — GPL-3.0
- **Progetti hardware** — CERN-OHL-S
- **Documentazione e altri contenuti** — CC-BY-SA

## Lavorare su questo sito

Il sito usa [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) ed è costruito
dalla cartella `docs/` di questo repository.

```bash
pip install -r requirements-docs.txt
mkdocs serve
```

Le pagine italiane usano il suffisso `.it.md` accanto alla controparte inglese (`roadmap.md` →
`roadmap.it.md`). Ogni pagina deve essere elencata in `nav` dentro `mkdocs.yml`: la build gira con
`--strict`, quindi una pagina non elencata fa fallire la CI invece di sparire in silenzio.

Un push su `main` pubblica su <https://fablab-imperia.github.io/meshbee/> tramite GitHub Actions.
