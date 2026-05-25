# 🐝 Beehive IoT System

Sistema completo per la gestione e monitoraggio di arnie tramite sensori IoT.

## 📋 Indice

- [Panoramica](#panoramica)
- [Architettura](#architettura)
- [Requisiti](#requisiti)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Utilizzo](#utilizzo)
- [API Endpoints](#api-endpoints)
- [Formato Dati MQTT](#formato-dati-mqtt)
- [Database Schema](#database-schema)
- [Sviluppo](#sviluppo)

## 🎯 Panoramica

Sistema IoT completo per il monitoraggio di arnie che include:

- **Database PostgreSQL** per archiviare dati sensori e utenti
- **Broker MQTT** (Mosquitto) per ricevere dati dai dispositivi IoT
- **API RESTful** (FastAPI) per accesso ai dati da applicazioni
- **Sistema di autenticazione** con JWT tokens
- **Gestione allarmi** automatici basati su soglie configurabili
- **Multi-tenant** con gestione utenti e permessi

### Funzionalità Principali

✅ Ricezione dati in tempo reale tramite MQTT  
✅ Archiviazione storica di temperatura, umidità e peso  
✅ API RESTful complete con autenticazione JWT  
✅ Gestione utenti e permessi  
✅ Sistema di allarmi automatici  
✅ Log attività degli apicoltori  
✅ Ottimizzato per Raspberry Pi 4  
✅ Completamente dockerizzato  

## 🏗️ Architettura

```
┌─────────────────┐
│  Dispositivi    │
│  IoT (Arnie)    │
└────────┬────────┘
         │ MQTT
         ▼
┌─────────────────┐     ┌──────────────┐
│   Mosquitto     │────▶│  PostgreSQL  │
│  MQTT Broker    │     │   Database   │
└────────┬────────┘     └──────▲───────┘
         │                     │
         │                     │
┌────────▼────────┐           │
│  MQTT Handler   │───────────┘
│  (Python)       │
└─────────────────┘

┌─────────────────┐     ┌──────────────┐
│   FastAPI       │────▶│  PostgreSQL  │
│   REST API      │     │   Database   │
└────────┬────────┘     └──────────────┘
         │
         ▼
┌─────────────────┐
│  App Mobile/Web │
│   (Client)      │
└─────────────────┘
```

## 💻 Requisiti

### Hardware Minimo
- **Raspberry Pi 4** (2GB RAM) o equivalente
- **16GB** storage
- Connessione di rete

### Software
- Docker & Docker Compose
- (Opzionale) Git per clonare il repository

## 🚀 Installazione

### 1. Clona il Repository

```bash
git clone <repository-url>
cd beehive-iot
```

### 2. Crea File di Configurazione

```bash
cp .env.example .env
```

### 3. Modifica Configurazione

Edita il file `.env` e modifica almeno:

```bash
# IMPORTANTE: Cambia queste password!
POSTGRES_PASSWORD=tua-password-sicura
JWT_SECRET_KEY=genera-chiave-con-openssl-rand-hex-32
```

Per generare una chiave JWT sicura:

```bash
openssl rand -hex 32
```

### 4. Avvia i Servizi

```bash
docker-compose up -d
```

### 5. Verifica il Funzionamento

```bash
# Verifica che tutti i container siano in esecuzione
docker-compose ps

# Controlla i log
docker-compose logs -f
```

L'API sarà disponibile su: `http://localhost:8000`  
La documentazione interattiva: `http://localhost:8000/docs`

## ⚙️ Configurazione

### Variabili d'Ambiente

Tutte le configurazioni sono nel file `.env`:

| Variabile | Descrizione | Default |
|-----------|-------------|---------|
| `POSTGRES_PASSWORD` | Password database | CHANGE_ME_IN_DOT_ENV |
| `JWT_SECRET_KEY` | Chiave per firmare JWT | (generare!) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durata token accesso | 30 |
| `MQTT_BROKER` | Host broker MQTT | mosquitto |
| `MQTT_PORT` | Porta MQTT | 1883 |

### Database Iniziale

Il database viene inizializzato automaticamente con:
- Schema completo
- Utente admin (email: `admin@beehive.local`, password: `YOUR_ADMIN_PASSWORD`)
- Utente test (email: `utente@test.local`, password: `YOUR_USER_PASSWORD`)
- Dati di esempio

**⚠️ IMPORTANTE:** Cambiare le password di default in produzione!

### Configurazione Soglie Allarmi

Le soglie possono essere configurate per ogni arnia tramite il campo `configurazione` (JSONB):

```json
{
  "soglia_temperatura_max": 38.0,
  "soglia_temperatura_min": 30.0,
  "soglia_umidita_max": 80.0,
  "soglia_umidita_min": 40.0,
  "soglia_peso_min": 25.0
}
```

## 📱 Utilizzo

### Test del Sistema

#### 1. Test API (Health Check)

```bash
curl http://localhost:8000/health
```

#### 2. Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "utente@test.local",
    "password": "YOUR_USER_PASSWORD"
  }'
```

Risposta:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### 3. Chiamata API Autenticata

```bash
TOKEN="<access_token_ricevuto>"

curl http://localhost:8000/api/user/arnie \
  -H "Authorization: Bearer $TOKEN"
```

### Test MQTT

Esegui lo script di test per inviare dati di esempio:

```bash
# Installa dipendenze (se non in Docker)
pip install paho-mqtt

# Esegui test
python test_mqtt_publisher.py
```

### Pubblicazione Manuale MQTT

```bash
# Usando mosquitto_pub
mosquitto_pub -h localhost -t "beehive/NODE001/data" -m '{
  "id_nodo": "NODE001",
  "id_sensore": "SENSOR01",
  "temperatura": 34.5,
  "umidita": 65.0,
  "peso": 42.5
}'
```

## 📡 API Endpoints

### Autenticazione

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login utente | No |
| GET | `/api/auth/me` | Info utente corrente | Sì |

### Endpoints Utente

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/arnie` | Lista arnie utente | User |
| GET | `/api/user/arnie/{id}/letture` | Letture arnia | User |
| GET | `/api/user/arnie/{id}/attivita` | Attività arnia | User |
| POST | `/api/user/arnie/{id}/attivita` | Aggiungi attività | User |
| GET | `/api/user/arnie/{id}/allarmi` | Allarmi arnia | User |

### Endpoints Admin

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/utenti` | Lista tutti utenti | Admin |
| POST | `/api/admin/utenti` | Crea utente | Admin |
| PUT | `/api/admin/utenti/{id}` | Aggiorna utente | Admin |
| GET | `/api/admin/nodi` | Lista nodi | Admin |
| GET | `/api/admin/arnie` | Lista arnie | Admin |
| POST | `/api/admin/arnie` | Crea arnia | Admin |
| POST | `/api/admin/utenti-arnie` | Associa utente-arnia | Admin |
| GET | `/api/admin/letture` | Tutte le letture | Admin |
| GET | `/api/admin/attivita` | Tutte le attività | Admin |

### Documentazione Interattiva

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📨 Formato Dati MQTT

### Topic Pattern

```
beehive/{ID_NODO}/data
```

Esempi:
- `beehive/NODE001/data`
- `beehive/APIARY_SOUTH/data`

### Payload JSON

```json
{
  "id_nodo": "NODE001",
  "id_sensore": "SENSOR01",
  "timestamp": "2024-02-01T12:00:00",
  "temperatura": 34.5,
  "umidita": 65.0,
  "peso": 42.350,
  "dati_raw": {
    "batteria": 3.8,
    "segnale": -65
  }
}
```

### Campi

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `id_nodo` | string | Sì | ID univoco del nodo trasmettitore |
| `id_sensore` | string | No | ID sensore (per multi-sensore) |
| `timestamp` | ISO 8601 | No | Timestamp lettura (default: ora corrente) |
| `temperatura` | float | No | Temperatura in °C |
| `umidita` | float | No | Umidità relativa % |
| `peso` | float | No | Peso in kg |
| `dati_raw` | object | No | Altri dati in formato libero |

## 🗄️ Database Schema

### Tabelle Principali

**utenti**
- Gestione utenti e autenticazione
- Ruoli: `user`, `admin`

**nodi**
- Dispositivi IoT trasmettitori
- Tracking ultimo messaggio ricevuto

**arnie**
- Arnie monitorate
- Associazione nodo-sensore
- Metadati configurabili

**letture**
- Dati telemetrici (temperatura, umidità, peso)
- Indicizzato per query temporali efficienti

**log_attivita**
- Registro interventi apicoltore
- Tipi: ispezione, trattamento, raccolta, etc.

**allarmi**
- Notifiche automatiche
- Livelli: info, warning, critical

**utenti_arnie**
- Associazione many-to-many utenti-arnie
- Gestione permessi (read, write, admin)

### Viste Utili

- `v_letture_recenti` - Letture ultimi 7 giorni
- `v_arnie_stato` - Arnie con ultime letture
- `v_allarmi_attivi` - Allarmi non risolti

## 🔧 Sviluppo

### Struttura Directory

```
beehive-iot/
├── api/                    # FastAPI REST API
│   ├── main.py            # Applicazione principale
│   ├── auth.py            # Autenticazione JWT
│   ├── models.py          # Modelli Pydantic
│   ├── database.py        # Connessione DB
│   ├── config.py          # Configurazione
│   ├── Dockerfile
│   └── requirements.txt
├── mqtt-handler/          # Handler messaggi MQTT
│   ├── mqtt_handler.py
│   ├── Dockerfile
│   └── requirements.txt
├── database/              # Schema database
│   └── init.sql
├── mosquitto/             # Configurazione MQTT
│   └── config/
│       └── mosquitto.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

### Comandi Utili

```bash
# Riavvia tutti i servizi
docker-compose restart

# Riavvia solo l'API
docker-compose restart api

# Visualizza log in tempo reale
docker-compose logs -f api

# Accedi al database
docker-compose exec postgres psql -U beehive_user -d beehive_iot

# Backup database
docker-compose exec postgres pg_dump -U beehive_user beehive_iot > backup.sql

# Ripristina database
docker-compose exec -T postgres psql -U beehive_user beehive_iot < backup.sql

# Ferma tutto e rimuovi volumi (ATTENZIONE: cancella i dati!)
docker-compose down -v
```

### Sviluppo Locale

Per sviluppare senza Docker:

```bash
# Setup Python environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure: venv\Scripts\activate  # Windows

# Installa dipendenze API
cd api
pip install -r requirements.txt

# Installa dipendenze MQTT handler
cd ../mqtt-handler
pip install -r requirements.txt

# Configura variabili d'ambiente
export DB_HOST=localhost
export MQTT_BROKER=localhost
# ... altre variabili

# Avvia API
cd ../api
uvicorn main:app --reload

# Avvia MQTT handler (in un altro terminale)
cd ../mqtt-handler
python mqtt_handler.py
```

## 🔒 Sicurezza

### Best Practices

1. **Cambia le password di default** nel file `.env`
2. **Genera una chiave JWT sicura**: `openssl rand -hex 32`
3. **Usa HTTPS** in produzione (nginx con SSL)
4. **Abilita autenticazione MQTT** modificando `mosquitto.conf`
5. **Limita accesso rete** con firewall
6. **Backup regolari** del database

### Autenticazione MQTT (Opzionale)

Per abilitare autenticazione MQTT:

```bash
# Crea file password
docker-compose exec mosquitto mosquitto_passwd -c /mosquitto/config/passwd username

# Modifica mosquitto.conf
# allow_anonymous false
# password_file /mosquitto/config/passwd
```

## 🐛 Troubleshooting

### Il database non si inizializza

```bash
# Rimuovi volumi e ricrea
docker-compose down -v
docker-compose up -d
```

### MQTT handler non riceve messaggi

```bash
# Verifica che Mosquitto sia attivo
docker-compose logs mosquitto

# Test con mosquitto_sub
docker-compose exec mosquitto mosquitto_sub -t "beehive/#" -v
```

### API non risponde

```bash
# Verifica log
docker-compose logs api

# Verifica connessione database
docker-compose exec api python -c "from database import init_db_pool; init_db_pool()"
```

### Errore "Out of memory" su Raspberry Pi

Riduci i worker di uvicorn e le connessioni DB:

```yaml
# In docker-compose.yml, servizio api
command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
```

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT.

## 👥 Contributi

Contributi, issues e feature requests sono benvenuti!

## 📞 Supporto

Per domande o problemi, apri una issue su GitHub.

---

**Fatto con ❤️ per gli apicoltori** 🐝
