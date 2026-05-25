# 💻 Guida VS Code - Beehive IoT

## 🚀 Setup Iniziale

### 1. Apri il Workspace

```bash
# Opzione A: Da terminale
code beehive-iot.code-workspace

# Opzione B: Da VS Code
# File > Open Workspace from File > seleziona beehive-iot.code-workspace
```

### 2. Installa Estensioni Raccomandate

Quando apri il workspace, VS Code ti chiederà di installare le estensioni raccomandate. Clicca **Install All**.

Estensioni incluse:
- **Python** - Sviluppo Python
- **Docker** - Gestione container
- **PostgreSQL** - Query database
- **Thunder Client** - Test API
- **YAML** - Editing docker-compose.yml

### 3. Configura Python Interpreter

1. Premi `Ctrl+Shift+P` (o `Cmd+Shift+P` su Mac)
2. Digita "Python: Select Interpreter"
3. Scegli l'ambiente virtuale `./venv/bin/python`

Se non hai ancora creato l'ambiente virtuale:
```bash
make dev-setup
```

## 🎯 Workflow Tipico in VS Code

### Scenario 1: Sviluppo con Docker (Consigliato)

```bash
# 1. Avvia tutti i servizi
make start

# 2. Monitora i log
make logs

# 3. Lavora sui file Python
# VS Code suggerirà automaticamente l'autocompletamento

# 4. Dopo modifiche, riavvia il servizio
make restart-api
```

### Scenario 2: Sviluppo Locale (senza Docker)

```bash
# 1. Avvia solo database e MQTT con Docker
docker-compose up -d postgres mosquitto

# 2. In un terminale VS Code, avvia API in modalità debug
# Vai al pannello Run & Debug (Ctrl+Shift+D)
# Seleziona "Python: FastAPI"
# Premi F5

# 3. In un altro terminale, avvia MQTT handler
# Seleziona "Python: MQTT Handler"
# Premi F5
```

## 🐛 Debug in VS Code

### Debug API FastAPI

1. Apri `api/main.py`
2. Imposta breakpoint cliccando a sinistra del numero di riga
3. Pannello Run & Debug → "Python: FastAPI"
4. Premi `F5`
5. Chiama l'API → il breakpoint si attiverà

### Debug MQTT Handler

1. Apri `mqtt-handler/mqtt_handler.py`
2. Imposta breakpoint
3. Seleziona "Python: MQTT Handler"
4. Premi `F5`
5. Pubblica messaggio MQTT → breakpoint si attiverà

## 📡 Test API in VS Code

### Opzione A: Thunder Client (Consigliato)

1. Installa l'estensione **Thunder Client**
2. Importa la collection da `api_tests.http`
3. Testa gli endpoint visualmente

### Opzione B: REST Client

1. Apri `api_tests.http`
2. Clicca su "Send Request" sopra ogni richiesta HTTP
3. I risultati appariranno in un nuovo pannello

### Opzione C: Terminale Integrato

```bash
# Test health
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "utente@test.local", "password": "YOUR_USER_PASSWORD"}'
```

## 🗄️ Database in VS Code

### Connetti a PostgreSQL

1. Installa l'estensione **PostgreSQL**
2. Clicca sull'icona PostgreSQL nella sidebar
3. Aggiungi nuova connessione:
   - Host: `localhost`
   - Port: `5432`
   - Database: `beehive_iot`
   - Username: `beehive_user`
   - Password: (quella in `.env`)

4. Ora puoi:
   - Esplorare tabelle visivamente
   - Eseguire query SQL
   - Vedere i dati in formato tabellare

### Query Rapide

```sql
-- Vedi tutte le arnie
SELECT * FROM v_arnie_stato;

-- Ultime 10 letture
SELECT * FROM letture ORDER BY timestamp DESC LIMIT 10;

-- Allarmi attivi
SELECT * FROM v_allarmi_attivi;
```

## ⌨️ Comandi Rapidi

### Task Predefiniti

Premi `Ctrl+Shift+P` → "Tasks: Run Task"

Disponibili:
- **Docker: Start All** - Avvia tutti i servizi
- **Docker: Stop All** - Ferma tutto
- **Docker: Restart API** - Riavvia solo API
- **Docker: View Logs** - Mostra log
- **Database: Backup** - Backup database

### Makefile Integration

Se hai installato l'estensione **Makefile Tools**:

```bash
# Da terminale integrato (Ctrl+`)
make start      # Avvia servizi
make logs       # Mostra log
make test-api   # Test API
make help       # Lista comandi
```

## 📁 Struttura Progetto in VS Code

```
beehive-iot/
├── 📄 beehive-iot.code-workspace  ← Apri questo!
├── 📄 Makefile                     ← Comandi rapidi
├── 📄 api_tests.http               ← Test API
│
├── 📁 api/
│   ├── main.py          ← Entry point API
│   ├── auth.py          ← Autenticazione
│   ├── models.py        ← Modelli dati
│   └── ...
│
├── 📁 mqtt-handler/
│   └── mqtt_handler.py  ← Gestore MQTT
│
└── 📁 database/
    └── init.sql         ← Schema DB
```

## 🎨 Personalizzazione

### Temi Consigliati

Per un'esperienza ottimale:
- **Dark**: "One Dark Pro", "Dracula Official"
- **Light**: "GitHub Theme", "Quiet Light"

### Settings Personalizzati

Il workspace include già:
- ✅ Format on save
- ✅ Auto import organization
- ✅ Python linting
- ✅ Tab size corretto per ogni linguaggio

## 🔍 Navigazione Rapida

### Scorciatoie Utili

| Comando | Scorciatoia | Descrizione |
|---------|-------------|-------------|
| Command Palette | `Ctrl+Shift+P` | Accesso a tutti i comandi |
| Quick Open | `Ctrl+P` | Apri file velocemente |
| Terminale | `Ctrl+` ` | Toggle terminale |
| Debug | `F5` | Avvia debug |
| Breakpoint | `F9` | Imposta breakpoint |
| Vai a definizione | `F12` | Vai alla definizione |
| Trova riferimenti | `Shift+F12` | Trova dove è usato |
| Rename Symbol | `F2` | Rinomina variabile/funzione |

### Ricerca nel Progetto

- **Cerca testo**: `Ctrl+Shift+F`
- **Cerca file**: `Ctrl+P` → digita nome file
- **Cerca simbolo**: `Ctrl+T` → cerca funzioni/classi

## 📊 Monitoraggio

### Docker Extension

Con l'estensione Docker installata:
1. Pannello Docker nella sidebar
2. Vedi container in esecuzione
3. Click destro su container:
   - View Logs
   - Attach Shell
   - Stop/Start/Restart

### Output Panel

Visualizza output di:
- Python
- Docker
- Tasks
- Terminal

Accedi con: `Ctrl+Shift+U`

## 🧪 Testing

### Esegui Script di Test

1. Apri `test_mqtt_publisher.py`
2. Click destro → "Run Python File in Terminal"

Oppure dal debug panel:
- Seleziona "Python: Test MQTT Publisher"
- Premi F5

### Test Unitari (Futuri)

Per aggiungere test unitari:

```bash
# Installa pytest
pip install pytest pytest-cov

# Crea test/
mkdir -p tests
```

Poi aggiungi configurazione launch per pytest.

## 💡 Tips & Tricks

### 1. Multi-Cursor Editing

`Alt+Click` per aggiungere cursori multipli
Utile per modificare più righe simili

### 2. Integrazione Git

- Sidebar Source Control (`Ctrl+Shift+G`)
- Commit, push, pull direttamente da VS Code
- Diff visuale integrato

### 3. Snippets

Crea snippets personalizzati per codice ripetitivo:
File > Preferences > User Snippets

### 4. Live Share

Collabora in real-time con altri sviluppatori:
Installa "Live Share" extension

### 5. Remote Development

Sviluppa direttamente sul Raspberry Pi:
1. Installa "Remote - SSH"
2. SSH nel Pi
3. Apri il progetto remoto

## 🆘 Troubleshooting VS Code

### Python Interpreter Non Trovato

```bash
# Crea virtual environment
python3 -m venv venv

# Attiva
source venv/bin/activate  # Linux/Mac
# oppure
venv\Scripts\activate  # Windows

# Installa dipendenze
pip install -r api/requirements.txt
```

### Docker Extension Non Funziona

Verifica che Docker daemon sia in esecuzione:
```bash
docker ps
```

### Linting Errors

```bash
# Installa linter
pip install flake8 black
```

## 📚 Risorse

- **VS Code Python**: https://code.visualstudio.com/docs/python/python-tutorial
- **Docker Extension**: https://code.visualstudio.com/docs/containers/overview
- **FastAPI**: https://fastapi.tiangolo.com/

---

**Buon coding! 🚀**
