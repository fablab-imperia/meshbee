# Makefile per Beehive IoT
# Comandi rapidi per sviluppo

.PHONY: help start stop restart logs build clean test backup

# Variabili
COMPOSE = docker-compose
PYTHON = python3

help: ## Mostra questo messaggio di aiuto
	@echo "Beehive IoT - Comandi Disponibili:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Docker Commands
start: ## Avvia tutti i servizi
	$(COMPOSE) up -d
	@echo "✓ Servizi avviati!"
	@echo "API: http://localhost:8000"
	@echo "Docs: http://localhost:8000/docs"

stop: ## Ferma tutti i servizi
	$(COMPOSE) stop
	@echo "✓ Servizi fermati"

restart: ## Riavvia tutti i servizi
	$(COMPOSE) restart
	@echo "✓ Servizi riavviati"

restart-api: ## Riavvia solo l'API
	$(COMPOSE) restart api
	@echo "✓ API riavviata"

restart-mqtt: ## Riavvia solo MQTT handler
	$(COMPOSE) restart mqtt-handler
	@echo "✓ MQTT handler riavviato"

logs: ## Visualizza log in tempo reale
	$(COMPOSE) logs -f

logs-api: ## Log solo API
	$(COMPOSE) logs -f api

logs-mqtt: ## Log solo MQTT handler
	$(COMPOSE) logs -f mqtt-handler

status: ## Stato servizi
	$(COMPOSE) ps

build: ## Build immagini Docker
	$(COMPOSE) build

clean: ## Ferma e rimuove container (MANTIENE i dati)
	$(COMPOSE) down
	@echo "✓ Container rimossi (dati preservati)"

clean-all: ## Ferma e rimuove tutto (CANCELLA ANCHE I DATI!)
	@echo "⚠️  ATTENZIONE: Questo comando cancellerà tutti i dati!"
	@read -p "Sei sicuro? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(COMPOSE) down -v; \
		echo "✓ Tutto rimosso"; \
	else \
		echo "Operazione annullata"; \
	fi

# Database Commands
db-shell: ## Accedi alla shell PostgreSQL
	$(COMPOSE) exec postgres psql -U beehive_user -d beehive_iot

db-backup: ## Backup database
	@mkdir -p backups
	$(COMPOSE) exec postgres pg_dump -U beehive_user beehive_iot > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✓ Backup creato in backups/"

db-restore: ## Ripristina database (richiede FILE=path/to/backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Errore: specifica FILE=path/to/backup.sql"; \
		exit 1; \
	fi
	cat $(FILE) | $(COMPOSE) exec -T postgres psql -U beehive_user beehive_iot
	@echo "✓ Database ripristinato da $(FILE)"

# Development Commands
dev-setup: ## Setup ambiente di sviluppo locale
	$(PYTHON) -m venv venv
	./venv/bin/pip install --upgrade pip
	./venv/bin/pip install -r api/requirements.txt
	./venv/bin/pip install -r mqtt-handler/requirements.txt
	@echo "✓ Virtual environment creato in venv/"
	@echo "Attiva con: source venv/bin/activate"

dev-api: ## Avvia API in modalità sviluppo (senza Docker)
	cd api && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-mqtt: ## Avvia MQTT handler in modalità sviluppo (senza Docker)
	cd mqtt-handler && $(PYTHON) mqtt_handler.py

# Test Commands
test-mqtt: ## Test publisher MQTT
	$(PYTHON) test_mqtt_publisher.py

test-api: ## Test API client
	$(PYTHON) example_api_client.py

test-health: ## Test health endpoint
	@curl -s http://localhost:8000/health | python -m json.tool

# Setup Commands
mqtt-passwd: ## Genera il file password per il broker Mosquitto (richiede .env)
	@if [ ! -f .env ]; then \
		echo "❌ File .env non trovato. Esegui prima 'make setup'"; \
		exit 1; \
	fi
	@set -a; . ./.env; set +a; \
	mkdir -p mosquitto/config; \
	docker run --rm \
		-v "$$(pwd)/mosquitto/config:/mosquitto/config" \
		eclipse-mosquitto:2.0 \
		mosquitto_passwd -b -c /mosquitto/config/passwd "$$MQTT_USER" "$$MQTT_PASSWORD"; \
	echo "✓ File password Mosquitto generato in mosquitto/config/passwd"

setup: ## Setup iniziale completo
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ File .env creato da .env.example"; \
		echo ""; \
		echo "⚠️  IMPORTANTE: Apri .env e imposta password sicure prima di continuare!"; \
		echo "   Poi riesegui: make setup"; \
		exit 0; \
	fi
	$(MAKE) mqtt-passwd
	$(MAKE) start
	@echo ""
	@echo "✓ Setup completato!"
	@echo "API disponibile su: http://localhost:8000"
	@echo "Documentazione: http://localhost:8000/docs"

install: setup ## Alias per setup

# Info Commands
info: ## Informazioni sul sistema
	@echo "=== Beehive IoT - System Info ==="
	@echo ""
	@echo "Docker:"
	@docker --version
	@echo ""
	@echo "Docker Compose:"
	@docker-compose --version
	@echo ""
	@echo "Python:"
	@$(PYTHON) --version
	@echo ""
	@echo "Servizi:"
	@$(COMPOSE) ps
	@echo ""
	@echo "Volumi Docker:"
	@docker volume ls | grep beehive || echo "Nessun volume trovato"

endpoints: ## Mostra endpoints disponibili
	@echo "=== Beehive IoT - Endpoints ==="
	@echo ""
	@echo "Web:"
	@echo "  http://localhost:8000          - API Root"
	@echo "  http://localhost:8000/docs     - Swagger UI"
	@echo "  http://localhost:8000/redoc    - ReDoc"
	@echo "  http://localhost:8000/health   - Health Check"
	@echo ""
	@echo "MQTT:"
	@echo "  mqtt://localhost:1883          - MQTT Broker"
	@echo "  ws://localhost:9001            - MQTT WebSocket"
	@echo ""
	@echo "Database:"
	@echo "  postgresql://localhost:5432    - PostgreSQL"

# Default target
.DEFAULT_GOAL := help
