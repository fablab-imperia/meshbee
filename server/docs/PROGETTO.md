# 📦 Contenuto del Progetto Beehive

## 📁 Struttura File

```
beehive-iot/
│
├── 📄 README.md                    # Documentazione completa del progetto
├── 📄 QUICKSTART.md                # Guida rapida per iniziare
├── 📄 docker-compose.yml           # Orchestrazione container Docker
├── 📄 .env.example                 # Template variabili d'ambiente
├── 📄 .gitignore                   # File da ignorare in Git
├── 📄 test_mqtt_publisher.py       # Script test per MQTT (eseguibile)
├── 📄 example_api_client.py        # Client Python esempio per API (eseguibile)
│
├── 📁 database/
│   └── init.sql                    # Schema database PostgreSQL completo
│
├── 📁 api/                         # Servizio API FastAPI
│   ├── main.py                     # Applicazione principale
│   ├── auth.py                     # Autenticazione JWT
│   ├── models.py                   # Modelli Pydantic
│   ├── database.py                 # Gestione connessione DB
│   ├── config.py                   # Configurazione
│   ├── requirements.txt            # Dipendenze Python
│   └── Dockerfile                  # Immagine Docker
│
├── 📁 mqtt-handler/                # Servizio gestione MQTT
│   ├── mqtt_handler.py             # Handler messaggi MQTT
│   ├── requirements.txt            # Dipendenze Python
│   └── Dockerfile                  # Immagine Docker
│
└── 📁 mosquitto/                   # Broker MQTT
    └── config/
        └── mosquitto.conf          # Configurazione Mosquitto
```

## 🎯 Componenti Principali

### 1. Database PostgreSQL
- **File**: `database/init.sql`
- **Cosa fa**: Schema completo con tabelle, indici, trigger e viste
- **Tabelle principali**:
  - `utenti` - Gestione utenti e autenticazione
  - `nodi` - Dispositivi IoT trasmettitori
  - `arnie` - Arnie monitorate
  - `letture` - Dati telemetrici (temperatura, umidità, peso)
  - `log_attivita` - Registro attività apicoltore
  - `allarmi` - Sistema notifiche automatiche

### 2. API RESTful (FastAPI)
- **Directory**: `api/`
- **Port**: 8000
- **Documentazione**: http://localhost:8000/docs
- **Funzionalità**:
  - Autenticazione JWT
  - Endpoint utente (letture, attività, allarmi)
  - Endpoint admin (gestione utenti, nodi, arnie)
  - CORS configurabile

### 3. MQTT Handler
- **Directory**: `mqtt-handler/`
- **Cosa fa**: Riceve dati MQTT e li salva nel database
- **Topic pattern**: `beehive/{ID_NODO}/data`
- **Features**:
  - Creazione automatica nodi/arnie
  - Validazione dati
  - Gestione errori

### 4. Broker MQTT (Mosquitto)
- **Directory**: `mosquitto/`
- **Ports**: 1883 (MQTT), 9001 (WebSocket)
- **Configurazione**: Personalizzabile in `mosquitto.conf`

## 🚀 Come Iniziare

### Opzione A: Deploy Rapido

```bash
# 1. Entra nella directory
cd beehive-iot

# 2. Copia configurazione
cp .env.example .env

# 3. IMPORTANTE: Edita .env e cambia le password!
nano .env

# 4. Avvia
docker-compose up -d

# 5. Verifica
curl http://localhost:8000/health
```

### Opzione B: Con Documentazione

Leggi prima:
1. `README.md` - Documentazione completa
2. `QUICKSTART.md` - Guida rapida e comandi utili

## 📊 Dati di Test Inclusi

Il database viene inizializzato con:
- ✅ Utente admin: `admin@beehive.local` / `YOUR_ADMIN_PASSWORD`
- ✅ Utente test: `utente@test.local` / `YOUR_USER_PASSWORD`
- ✅ 1 nodo esempio: `NODE001`
- ✅ 2 arnie esempio con letture
- ✅ Associazioni utente-arnie

## 🧪 Script di Test

### test_mqtt_publisher.py
```bash
# Invia dati MQTT di test
python test_mqtt_publisher.py
```

### example_api_client.py
```bash
# Esempio uso API
python example_api_client.py
```

## 🔌 Endpoints API Principali

### Utente
- `GET /api/user/arnie` - Lista arnie
- `GET /api/user/arnie/{id}/letture` - Letture arnia
- `GET /api/user/arnie/{id}/attivita` - Attività arnia
- `POST /api/user/arnie/{id}/attivita` - Aggiungi attività

### Admin
- `GET/POST /api/admin/utenti` - Gestione utenti
- `GET/POST /api/admin/arnie` - Gestione arnie
- `POST /api/admin/utenti-arnie` - Associa utente-arnia

## 📡 Formato Messaggio MQTT

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

**Topic**: `beehive/{ID_NODO}/data`

## ⚙️ Configurazione Importante

### Variabili in .env da Modificare

```bash
# OBBLIGATORIO cambiare:
POSTGRES_PASSWORD=tua-password-sicura
JWT_SECRET_KEY=genera-con-openssl-rand-hex-32

# Opzionale modificare:
ACCESS_TOKEN_EXPIRE_MINUTES=30
MQTT_PORT=1883
```

### Generare Chiave JWT Sicura

```bash
openssl rand -hex 32
```

## 📚 Documentazione

- **README.md** - Guida completa con architettura, installazione, API, troubleshooting
- **QUICKSTART.md** - Comandi rapidi, esempi d'uso, query database utili
- **API Docs** - http://localhost:8000/docs (dopo avvio)

## 🔒 Sicurezza

⚠️ **IMPORTANTE Prima del Deploy in Produzione**:

1. ✅ Cambia password database in `.env`
2. ✅ Genera chiave JWT sicura
3. ✅ Cambia password utenti default
4. ✅ Configura HTTPS (nginx)
5. ✅ Abilita autenticazione MQTT
6. ✅ Configura firewall

## 🐛 Troubleshooting Rapido

```bash
# Verifica servizi
docker-compose ps

# Log
docker-compose logs -f

# Riavvia
docker-compose restart

# Reset completo (ATTENZIONE: cancella dati!)
docker-compose down -v
docker-compose up -d
```

## 💡 Tips

- **Performance**: Su Raspberry Pi riduci i worker uvicorn a 1
- **Storage**: Letture vecchie occupano spazio, pianifica pulizia periodica
- **Backup**: Usa `pg_dump` per backup regolari del database
- **Monitoraggio**: Controlla log con `docker-compose logs -f`

## 📞 Supporto

Per domande o problemi:
1. Consulta README.md
2. Controlla log: `docker-compose logs`
3. Verifica configurazione .env
4. Testa connettività: `curl http://localhost:8000/health`

---

**Sviluppato con ❤️ per gli apicoltori** 🐝

Versione: 1.0.0  
Data: Febbraio 2026  
Stack: PostgreSQL + FastAPI + Mosquitto + Docker
