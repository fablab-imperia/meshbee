# 🐝 MeshBee - Sistema di Monitoraggio Arnie

Sistema completo per il monitoraggio IoT di arnie con app mobile, backend server e hardware Arduino/ESP32.

<img width="2178" height="941" alt="Architettura" src="https://github.com/fablab-imperia/beehive-iot/blob/main/Hardware/Architettura.png" />

## 📁 Struttura del Progetto

```
meshbee/
├── mobile-app/         # App mobile React Native/Expo
│   ├── app/           # Schermate e routing (Expo Router)
│   ├── components/    # Componenti UI riutilizzabili
│   │   ├── charts/   # Grafici e visualizzazioni dati
│   │   └── ui/       # Componenti UI di base
│   ├── config/        # Configurazione (API endpoint)
│   ├── constants/     # Costanti (tema, colori)
│   ├── contexts/      # Context providers (Auth)
│   ├── hooks/         # Custom React hooks
│   ├── services/      # Servizi API e business logic
│   ├── types/         # TypeScript type definitions
│   ├── assets/        # Immagini, font, icone
│   ├── docs/          # Documentazione app mobile
│   └── package.json   # Dipendenze app mobile
│
├── server/            # Backend IoT (API REST + MQTT)
│   ├── api/          # FastAPI REST API
│   ├── mqtt-handler/ # Handler messaggi MQTT dai sensori
│   ├── database/     # Schema PostgreSQL e migrations
│   ├── mosquitto/    # Configurazione MQTT broker
│   ├── docs/         # Documentazione server
│   └── docker-compose.yml
│
└── hardware/          # Hardware e Arduino
    ├── Arduino/      # Codice ESP32 per sensori
    │   ├── receiver/ # Firmware ricevitore (gateway MQTT)
    │   ├── sender/   # Firmware trasmettitore (sensori)
    │   └── HX711/    # Libreria celle di carico
    ├── 3d-print/     # File CAD per stampa 3D (FreeCAD)
    └── pcb/          # Schemi elettrici e documentazione
```

## 🚀 Primo Avvio

### Prerequisiti

| Componente | Versione minima |
|---|---|
| Docker + Docker Compose | 20 / 2.0 |
| Node.js + npm | 18 / 8 |
| Expo CLI | ultima |
| Arduino IDE (solo hardware) | 2.0 |

---

### 1. Backend Server

Il server è composto da quattro container Docker (PostgreSQL, Mosquitto, MQTT handler, FastAPI).

**a) Configura le variabili d'ambiente**

```bash
cd server
cp .env.example .env
```

Apri `.env` e imposta password sicure per tutti i campi. Per il JWT secret usa:

```bash
openssl rand -hex 32
```

> ⚠️ Non committare mai il file `.env` nel repository.

**b) Primo avvio**

```bash
make setup
```

Questo comando:
1. Genera il file delle password per il broker MQTT (`mosquitto/config/passwd`)
2. Avvia tutti i container Docker
3. Inizializza il database con lo schema e crea gli utenti di default

Al termine il backend è raggiungibile su:

| Servizio | URL |
|---|---|
| REST API | `http://localhost:8000` |
| Swagger UI | `http://localhost:8000/docs` |
| Health check | `http://localhost:8000/health` |
| MQTT broker | `mqtt://localhost:1883` |

**c) Verifica**

```bash
curl http://localhost:8000/health
```

Risposta attesa: `{"status": "ok", ...}`

**Comandi utili**

```bash
make logs          # log in tempo reale
make status        # stato dei container
make stop          # ferma tutto
make restart       # riavvia tutto
make db-shell      # shell PostgreSQL
```

---

### 2. App Mobile (React Native / Expo)

**a) Configura l'URL del backend**

```bash
cd mobile-app
cp .env.example .env
```

Apri `.env` e imposta l'IP del tuo server:

```
EXPO_PUBLIC_API_URL=http://<ip-del-tuo-server>:8000
```

> Per test in locale: `http://localhost:8000` (su emulatore Android usare `http://10.0.2.2:8000`).

**b) Installa le dipendenze**

```bash
npm install
```

**c) Avvia in development**

```bash
npx expo start
```

Scansiona il QR code con l'app **Expo Go** (iOS/Android) oppure premi `a` per l'emulatore Android o `i` per il simulatore iOS.

> Le credenziali di accesso sono quelle configurate nelle variabili `ADMIN_PASSWORD` e `USER_PASSWORD` del file `server/.env`.

---

### 3. Hardware ESP32

**a) Configura le credenziali**

Apri il file `hardware/Arduino/receiver/credentials.h` e sostituisci i placeholder `xxx` con i valori reali:

```c
const char* mqtt_server = "192.168.1.100";  // IP del tuo server
const char* user        = "beehive";        // valore di MQTT_USER in .env
const char* pass        = "...";            // valore di MQTT_PASSWORD in .env

const char* ssid        = "NomeRete";       // SSID Wi-Fi
const char* password    = "...";            // password Wi-Fi
```

> ⚠️ Non committare `credentials.h` dopo aver inserito le credenziali reali. Usa il file `credentials.h.example` come riferimento.

**b) Carica il firmware**

1. Apri Arduino IDE 2.x
2. Installa il board support per ESP32 (Boards Manager → `esp32 by Espressif`)
3. Installa le librerie: `HX711`, `DHT sensor library`, `PubSubClient`, `ArduinoJson`
4. Apri il file `.ino` corretto (`sender/sender.ino` o `receiver/receiver.ino`)
5. Seleziona la board `ESP32 Dev Module` e la porta COM/USB corretta
6. Clicca **Upload**

**c) Verifica ricezione dati**

```bash
# Dal server, verifica i messaggi MQTT in arrivo
cd server
make logs-mqtt
```

## 🏗️ Architettura Sistema

```
┌─────────────────┐
│  App Mobile     │  ← React Native + Expo
│  (mobile-app/)  │     - Autenticazione
└────────┬────────┘     - UI/UX nativa
         │ HTTPS
         ▼
┌─────────────────┐
│  REST API       │  ← FastAPI + PostgreSQL
│  (server/api)   │     - JWT Authentication
└────────┬────────┘     - CRUD operations
         │
         │ Database
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (server/)      │
└─────────────────┘
         ▲
         │ MQTT
         │
┌────────┴────────┐
│  MQTT Handler   │  ← Paho MQTT
│ (mqtt-handler/) │     - Riceve dati sensori
└────────┬────────┘     - Salva su DB
         ▲
         │ MQTT (1883)
         │
┌────────┴────────┐
│  Mosquitto      │  ← MQTT Broker
│  Broker         │
└────────┬────────┘
         ▲
         │ WiFi/Meshtastic
         │
┌────────┴────────┐
│  ESP32 + HX711  │  ← Hardware sensori
│  (hardware/)    │     - Temperatura
└─────────────────┘     - Umidità
                        - Peso (celle di carico)
```

## 📱 Componenti Principali

### mobile-app (React Native/Expo)
- **Framework**: Expo Router (file-based routing)
- **UI**: React Native + componenti custom
- **Auth**: Authentication
- **State**: React Context API
- **Notifiche**: Expo Notifications
- **Backend**: REST API

### Server Backend
- **API**: FastAPI (Python) con autenticazione JWT
- **Database**: PostgreSQL con schema completo
- **MQTT**: Eclipse Mosquitto broker
- **Handler**: Python MQTT subscriber
- **Deploy**: Docker Compose

### Hardware IoT
- **MCU**: ESP32 (WiFi + dual-core)
- **Sensori**:
  - DHT22 (temperatura/umidità)
  - HX711 + Load cells (peso arnia)
- **Comunicazione**: MQTT over WiFi o Meshtastic LoRa
- **Power**: Batteria + pannello solare

## 🔧 Requisiti

### Mobile App Development
```bash
Node.js >= 18
npm >= 8
Expo CLI
```

### Server Backend
```bash
Docker >= 20
Docker Compose >= 2.0
```

### Hardware Development
```bash
Arduino IDE >= 2.0
ESP32 Board Support
Librerie: HX711, DHT, PubSubClient
```

## 📚 Documentazione Dettagliata

### App Mobile
- [`mobile-app/README.md`](mobile-app/README.md) - Setup e sviluppo
- [`mobile-app/docs/IMPLEMENTATION_SUMMARY.md`](mobile-app/docs/IMPLEMENTATION_SUMMARY.md) - Implementazione
- [`mobile-app/docs/NOTIFICATIONS_SETUP.md`](mobile-app/docs/NOTIFICATIONS_SETUP.md) - Notifiche push
- [`mobile-app/docs/MIGRATION_FASTAPI.md`](mobile-app/docs/MIGRATION_FASTAPI.md) - Migrazione a FastAPI
  
### Server Backend
- [`server/README.md`](server/README.md) - Documentazione completa API
- [`server/docs/QUICKSTART.md`](server/docs/QUICKSTART.md) - Guida rapida
- [`server/docs/PROGETTO.md`](server/docs/PROGETTO.md) - Architettura e decisioni
- [`server/docs/VSCODE_GUIDE.md`](server/docs/VSCODE_GUIDE.md) - Setup VS Code

### Hardware
- Schemi elettrici in `hardware/pcb/`
- File 3D print in `hardware/3d-print/`
- Codice Arduino in `hardware/Arduino/`

## 🌟 Features

### App Mobile
✅ Autenticazione utenti
✅ Dashboard con dati in tempo reale
✅ Grafici temperatura, umidità, peso
✅ Notifiche push per allarmi
✅ Gestione profilo e impostazioni
✅ Dark mode / Light mode
✅ Supporto Android e iOS

### Backend
✅ API RESTful complete con JWT
✅ MQTT broker per IoT devices
✅ Database PostgreSQL robusto
✅ Sistema allarmi automatici
✅ Multi-tenant con permessi
✅ Docker Compose deploy

### Hardware
✅ Sensori temperatura/umidità
✅ Misurazione peso arnia (4 celle carico)
✅ Trasmissione MQTT via WiFi
✅ Low power mode
✅ Alimentazione solare

## 📄 Licenza

Questo progetto è distribuito sotto licenza GPLv3.

## 👥 Team

Sviluppato per apicoltori e monitoraggio ambientale.

---

**Fatto con ❤️ per le api** 🐝
