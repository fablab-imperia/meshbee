---
title: Mobile app
---

# Mobile app

The beekeeper's client: an **Expo / React Native** app that reads hive data back over HTTP.

It is the only component that talks to the [API](server/api.md), and it talks to nothing else — no MQTT,
no database. Whatever the app can show, it can show because an endpoint exists for it.

## What it does

- Shows the hives an account has access to, each with its latest reading.
- Charts temperature, humidity and weight over time, using the API's series endpoints.
- Records and reviews the activity log — inspections, treatments, harvests.
- Handles login and holds the bearer token used for every request.

## Key facts

| | |
| --- | --- |
| Framework | Expo / React Native, TypeScript, Expo Router |
| Talks to | The REST API only, over HTTP(S) |
| Auth | JWT bearer token obtained from `POST /api/auth/login` |
| Configuration | `.env` — see `.env.example` in the repository |

!!! warning "Upstream documentation is missing"

    `meshbee-app`'s README is still the unmodified `create-expo-app` template — it says nothing
    about MeshBee, the API, or how to configure a build. This page is deliberately short as a
    result: writing more would mean documenting the app from its source rather than from anything
    its maintainers have stated. Treat the repository as the source of truth and expect to read
    code.

    Two notes do exist under `docs/` in that repository, covering the implementation summary and
    notification setup.

## Full documentation

<https://github.com/fablab-imperia/meshbee-app>

## Related

- [API](server/api.md) — the service this app consumes.
- [API reference](../contract/api.md) — every endpoint available to it.
