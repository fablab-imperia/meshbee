---
title: App mobile
---

# App mobile

Il client dell'apicoltore: un'app **Expo / React Native** che rilegge i dati delle arnie via HTTP.

È l'unico componente che parla con l'[API](server/api.md), e non parla con nient'altro: niente MQTT,
niente database. Tutto ciò che l'app riesce a mostrare, lo mostra perché esiste un endpoint che lo
fornisce.

## Cosa fa

- Mostra le arnie a cui un account ha accesso, ciascuna con la sua ultima lettura.
- Disegna i grafici di temperatura, umidità e peso nel tempo, usando gli endpoint di serie storiche
  dell'API.
- Registra e consulta il log delle attività: ispezioni, trattamenti, raccolte.
- Gestisce il login e conserva il bearer token usato a ogni richiesta.

## Fatti chiave

| | |
| --- | --- |
| Framework | Expo / React Native, TypeScript, Expo Router |
| Parla con | Solo l'API REST, via HTTP(S) |
| Autenticazione | Bearer token JWT ottenuto da `POST /api/auth/login` |
| Configurazione | `.env` — vedi `.env.example` nel repository |

!!! warning "Manca la documentazione a monte"

    Il README di `meshbee-app` è ancora il template `create-expo-app` non modificato: non dice
    nulla su MeshBee, sull'API o su come configurare una build. Di conseguenza questa pagina è
    volutamente breve: scrivere di più significherebbe documentare l'app a partire dal suo codice
    invece che da qualcosa dichiarato da chi la mantiene. Considera il repository la fonte di
    verità e mettiti in conto di leggere il codice.

    Nel repository esistono comunque due note sotto `docs/`, sul riepilogo dell'implementazione e
    sulla configurazione delle notifiche.

## Documentazione completa

<https://github.com/fablab-imperia/meshbee-app>

## Collegamenti

- [API](server/api.md) — il servizio che questa app consuma.
- [Riferimento API](../contract/api.md) — tutti gli endpoint a sua disposizione.
