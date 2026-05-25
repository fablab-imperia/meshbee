# 🚀 Guida Rapida - Beehive IoT

## Setup Iniziale (5 minuti)

### 1. Prerequisiti

```bash
# Verifica Docker installato
docker --version
docker-compose --version

# Se non hai Docker, installalo:
# Su Ubuntu/Debian:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Riavvia la sessione o esegui: newgrp docker
```

### 2. Deploy

```bash
# Clona/scarica il progetto
cd beehive-iot

# Crea configurazione
cp .env.example .env

# IMPORTANTE: Edita .env e cambia le password!
nano .env  # o usa il tuo editor preferito

# Avvia tutto
docker-compose up -d

# Verifica
docker-compose ps
```

### 3. Primo Test

```bash
# Test health check
curl http://localhost:8000/health

# Dovresti vedere:
# {"status":"healthy","database":"connected","timestamp":"..."}
```

## 🎯 Quick Reference - API

### Login e Autenticazione

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "utente@test.local",
    "password": "YOUR_USER_PASSWORD"
  }'

# Salva il token ricevuto
export TOKEN="eyJ0eXAiOiJKV1Qi..."

# Test token
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Operazioni Base

```bash
# Lista arnie
curl http://localhost:8000/api/user/arnie \
  -H "Authorization: Bearer $TOKEN"

# Letture arnia (sostituisci {id_arnia})
curl "http://localhost:8000/api/user/arnie/1/letture?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Aggiungi attività
curl -X POST http://localhost:8000/api/user/arnie/1/attivita \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_arnia": 1,
    "tipo_attivita": "ispezione",
    "descrizione": "Controllo settimanale"
  }'
```

## 📡 Quick Reference - MQTT

### Pubblicare Dati da Dispositivo IoT

#### Usando Python

```python
import paho.mqtt.client as mqtt
import json
from datetime import datetime

# Connetti
client = mqtt.Client()
client.connect("192.168.1.100", 1883, 60)  # Sostituisci con IP del server

# Pubblica dati
data = {
    "id_nodo": "NODE001",
    "id_sensore": "SENSOR01",
    "timestamp": datetime.now().isoformat(),
    "temperatura": 34.5,
    "umidita": 65.0,
    "peso": 42.5
}

client.publish("beehive/NODE001/data", json.dumps(data))
client.disconnect()
```

#### Usando mosquitto_pub

```bash
mosquitto_pub -h 192.168.1.100 -t "beehive/NODE001/data" -m '{
  "id_nodo": "NODE001",
  "id_sensore": "SENSOR01",
  "temperatura": 34.5,
  "umidita": 65.0,
  "peso": 42.5
}'
```

#### Da ESP32/Arduino

```cpp
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  client.setServer("192.168.1.100", 1883);
}

void loop() {
  if (client.connect("ESP32_Beehive")) {
    String payload = "{\"id_nodo\":\"NODE001\",";
    payload += "\"id_sensore\":\"SENSOR01\",";
    payload += "\"temperatura\":34.5,";
    payload += "\"umidita\":65.0,";
    payload += "\"peso\":42.5}";
    
    client.publish("beehive/NODE001/data", payload.c_str());
  }
  delay(60000); // Ogni minuto
}
```

## 🔧 Comandi Comuni

### Gestione Servizi

```bash
# Stato servizi
docker-compose ps

# Log in tempo reale
docker-compose logs -f

# Log di un servizio specifico
docker-compose logs -f api
docker-compose logs -f mqtt-handler

# Riavvia tutto
docker-compose restart

# Riavvia un servizio
docker-compose restart api

# Ferma tutto
docker-compose stop

# Riavvia tutto
docker-compose start
```

### Database

```bash
# Accedi al database
docker-compose exec postgres psql -U beehive_user -d beehive_iot

# Query utili in psql:
# \dt                  -- Lista tabelle
# \d+ arnie           -- Descrizione tabella arnie
# SELECT * FROM utenti;
# SELECT * FROM v_arnie_stato;

# Backup
docker-compose exec postgres pg_dump -U beehive_user beehive_iot > backup_$(date +%Y%m%d).sql

# Ripristino
cat backup.sql | docker-compose exec -T postgres psql -U beehive_user beehive_iot
```

### Monitoraggio

```bash
# Statistiche container
docker stats

# Spazio usato
docker-compose exec postgres du -sh /var/lib/postgresql/data

# Ultime letture ricevute
docker-compose exec postgres psql -U beehive_user -d beehive_iot -c \
  "SELECT * FROM letture ORDER BY timestamp DESC LIMIT 10;"
```

## 🎨 Esempi Avanzati

### Creare Nuovo Utente (Admin)

```bash
# Login come admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@beehive.local", "password": "YOUR_ADMIN_PASSWORD"}'

# Usa il token admin
export ADMIN_TOKEN="..."

# Crea utente
curl -X POST http://localhost:8000/api/admin/utenti \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marco@apicoltore.it",
    "password": "password123",
    "nome": "Marco",
    "cognome": "Rossi",
    "ruolo": "user"
  }'
```

### Associare Utente ad Arnia

```bash
curl -X POST http://localhost:8000/api/admin/utenti-arnie \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_utente": 3,
    "id_arnia": 1,
    "permessi": "admin"
  }'
```

### Creare Nuova Arnia

```bash
curl -X POST http://localhost:8000/api/admin/arnie \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_nodo": "NODE002",
    "id_sensore_fisico": "SENSOR01",
    "nome_arnia": "Arnia Primavera",
    "descrizione": "Arnia con regina carnica 2024",
    "posizione": "Apiario Nord, Fila 2",
    "metadati": {
      "razza": "Carnica",
      "anno_regina": 2024,
      "colore": "verde"
    }
  }'
```

## 📊 Query Utili Database

```sql
-- Statistiche per arnia
SELECT 
    nome_arnia,
    COUNT(*) as num_letture,
    AVG(temperatura) as temp_media,
    AVG(umidita) as umidita_media,
    AVG(peso) as peso_medio,
    MAX(timestamp) as ultima_lettura
FROM letture l
JOIN arnie a ON l.id_arnia = a.id_arnia
WHERE l.timestamp > NOW() - INTERVAL '7 days'
GROUP BY a.id_arnia, nome_arnia;

-- Allarmi per utente
SELECT 
    u.nome, u.cognome,
    a.nome_arnia,
    al.tipo_allarme,
    al.livello,
    al.timestamp
FROM allarmi al
JOIN arnie a ON al.id_arnia = a.id_arnia
JOIN utenti_arnie ua ON a.id_arnia = ua.id_arnia
JOIN utenti u ON ua.id_utente = u.id_utente
WHERE al.risolto = false
ORDER BY al.timestamp DESC;

-- Attività per periodo
SELECT 
    a.nome_arnia,
    l.tipo_attivita,
    COUNT(*) as num_attivita
FROM log_attivita l
JOIN arnie a ON l.id_arnia = a.id_arnia
WHERE l.timestamp > NOW() - INTERVAL '30 days'
GROUP BY a.nome_arnia, l.tipo_attivita
ORDER BY num_attivita DESC;
```

## 🐛 Troubleshooting Rapido

### Problema: API non risponde

```bash
# Verifica log
docker-compose logs api --tail=50

# Riavvia
docker-compose restart api

# Verifica connessione DB
docker-compose exec api python -c "from database import init_db_pool; init_db_pool(); print('OK')"
```

### Problema: MQTT non riceve dati

```bash
# Verifica log
docker-compose logs mqtt-handler --tail=50
docker-compose logs mosquitto --tail=50

# Test manuale
docker-compose exec mosquitto mosquitto_sub -t "beehive/#" -v

# In un altro terminale, pubblica test
docker-compose exec mosquitto mosquitto_pub -t "beehive/TEST/data" \
  -m '{"id_nodo":"TEST","temperatura":25.0}'
```

### Problema: Database pieno

```bash
# Pulisci letture vecchie (>1 anno)
docker-compose exec postgres psql -U beehive_user -d beehive_iot -c \
  "DELETE FROM letture WHERE timestamp < NOW() - INTERVAL '1 year';"

# Vacuum database
docker-compose exec postgres psql -U beehive_user -d beehive_iot -c "VACUUM FULL;"
```

## 📱 Integrazione App Mobile

### Headers Richiesti

Tutte le richieste autenticate devono includere:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Gestione Token

1. **Login** → Salva `access_token` e `refresh_token`
2. **Ogni richiesta** → Usa `access_token` nell'header Authorization
3. **Token scaduto** → Usa `refresh_token` per ottenere nuovo `access_token`
4. **Refresh scaduto** → Richiedi nuovo login

### Flow Tipico App

```
1. Login utente
   POST /api/auth/login
   
2. Carica lista arnie
   GET /api/user/arnie
   
3. Per ogni arnia, mostra:
   - Dati in tempo reale (ultima lettura)
   - Grafico storico (ultime letture)
   - Allarmi attivi
   
4. Permetti all'utente di:
   - Aggiungere attività
   - Vedere storico
   - Configurare soglie (se admin)
```

## 🔐 Sicurezza in Produzione

### Checklist

- [ ] Cambiato password database
- [ ] Generata chiave JWT sicura
- [ ] Configurato HTTPS (nginx)
- [ ] Abilitata autenticazione MQTT
- [ ] Firewall configurato
- [ ] Backup automatici attivi
- [ ] Monitoring configurato

### Configurazione HTTPS (Nginx)

Esempio configurazione nginx (opzionale):

```nginx
server {
    listen 443 ssl;
    server_name beehive.tuodominio.it;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📚 Risorse Aggiuntive

- **Documentazione API**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **MQTT Info**: https://mosquitto.org/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

**Buona apicoltura! 🐝**
