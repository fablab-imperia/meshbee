#!/usr/bin/env python3
"""
MQTT Handler per Sistema IoT Arnie
Riceve messaggi MQTT dai nodi e li salva nel database PostgreSQL
"""

import os
import json
import logging
import signal
import sys
from datetime import datetime
from typing import Dict, Any, Optional

import paho.mqtt.client as mqtt
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configurazione da variabili d'ambiente
MQTT_BROKER    = os.getenv('MQTT_BROKER', 'localhost')
MQTT_PORT      = int(os.getenv('MQTT_PORT', 1883))
MQTT_TOPIC     = os.getenv('MQTT_TOPIC', 'beehive/+/data')
MQTT_CLIENT_ID = os.getenv('MQTT_CLIENT_ID', 'beehive-mqtt-handler')
MQTT_USER      = os.getenv('MQTT_USER')      # None se non impostato
MQTT_PASSWORD  = os.getenv('MQTT_PASSWORD')  # None se non impostato

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 5432))
DB_NAME = os.getenv('DB_NAME', 'beehive_iot')
DB_USER = os.getenv('DB_USER', 'beehive_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')  # REQUIRED — imposta via variabile d'ambiente

# Pool di connessioni al database
db_pool: Optional[SimpleConnectionPool] = None


class BeehiveMQTTHandler:
    """Handler per messaggi MQTT dal sistema arnie"""
    
    def __init__(self):
        self.client = mqtt.Client(client_id=MQTT_CLIENT_ID)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        self.running = True
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback quando connesso al broker MQTT"""
        if rc == 0:
            logger.info(f"Connesso al broker MQTT {MQTT_BROKER}:{MQTT_PORT}")
            client.subscribe(MQTT_TOPIC)
            logger.info(f"Sottoscritto al topic: {MQTT_TOPIC}")
        else:
            logger.error(f"Connessione fallita con codice: {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback quando disconnesso dal broker"""
        if rc != 0:
            logger.warning(f"Disconnessione inaspettata. Codice: {rc}")
    
    def on_message(self, client, userdata, msg):
        """
        Callback quando arriva un messaggio MQTT
        
        Formato atteso del messaggio JSON:
        {
            "id_nodo": "NODE001",
            "id_sensore": "SENSOR01",
            "timestamp": "2024-02-01T12:00:00",  # opzionale
            "temperatura": 34.5,
            "umidita": 65.0,
            "peso": 42.350,
            "dati_raw": {...}  # opzionale, altri dati
        }
        """
        try:
            # Decodifica il payload
            payload = msg.payload.decode('utf-8')
            logger.debug(f"Ricevuto messaggio su {msg.topic}: {payload}")
            
            # Parse JSON
            data = json.loads(payload)
            
            # Estrai topic parts (es: beehive/NODE001/data)
            topic_parts = msg.topic.split('/')
            if len(topic_parts) >= 2:
                id_nodo_from_topic = topic_parts[1]
            else:
                id_nodo_from_topic = None
            
            # Usa id_nodo dal messaggio o dal topic
            id_nodo = data.get('id_nodo', id_nodo_from_topic)
            id_sensore = data.get('id_sensore')
            
            if not id_nodo:
                logger.error(f"Messaggio senza id_nodo: {payload}")
                return
            
            # Prepara i dati per il database
            db_data = {
                'id_nodo': id_nodo,
                'id_sensore': id_sensore,
                'timestamp': data.get('timestamp'),
                'temperatura': data.get('temperatura'),
                'umidita': data.get('umidita'),
                'peso': data.get('peso'),
                'dati_raw': data.get('dati_raw')
            }
            
            # Salva nel database
            self.save_to_database(db_data)
            
        except json.JSONDecodeError as e:
            logger.error(f"Errore parsing JSON: {e} - Payload: {msg.payload}")
        except Exception as e:
            logger.error(f"Errore processing messaggio: {e}", exc_info=True)
    
    def save_to_database(self, data: Dict[str, Any]):
        """Salva i dati nel database PostgreSQL"""
        conn = None
        try:
            conn = db_pool.getconn()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Prima verifica/crea il nodo se non esiste
            cursor.execute(
                """
                INSERT INTO nodi (id_nodo, nome_nodo, ultimo_messaggio, attivo)
                VALUES (%s, %s, CURRENT_TIMESTAMP, true)
                ON CONFLICT (id_nodo) DO UPDATE
                SET ultimo_messaggio = CURRENT_TIMESTAMP
                """,
                (data['id_nodo'], f"Nodo {data['id_nodo']}")
            )
            
            # Trova o crea l'arnia basata su id_nodo e id_sensore
            id_arnia = None
            if data.get('id_sensore'):
                cursor.execute(
                    """
                    SELECT id_arnia FROM arnie 
                    WHERE id_nodo = %s AND id_sensore_fisico = %s
                    """,
                    (data['id_nodo'], data['id_sensore'])
                )
                result = cursor.fetchone()
                
                if result:
                    id_arnia = result['id_arnia']
                else:
                    # Crea nuova arnia
                    cursor.execute(
                        """
                        INSERT INTO arnie (id_nodo, id_sensore_fisico, nome_arnia, attiva)
                        VALUES (%s, %s, %s, true)
                        RETURNING id_arnia
                        """,
                        (
                            data['id_nodo'], 
                            data['id_sensore'],
                            f"Arnia {data['id_nodo']}-{data['id_sensore']}"
                        )
                    )
                    id_arnia = cursor.fetchone()['id_arnia']
                    logger.info(f"Creata nuova arnia: {id_arnia}")
            else:
                # Se non c'è id_sensore, cerca la prima arnia del nodo
                cursor.execute(
                    """
                    SELECT id_arnia FROM arnie 
                    WHERE id_nodo = %s 
                    ORDER BY id_arnia 
                    LIMIT 1
                    """,
                    (data['id_nodo'],)
                )
                result = cursor.fetchone()
                if result:
                    id_arnia = result['id_arnia']
            
            if not id_arnia:
                logger.warning(f"Impossibile determinare id_arnia per nodo {data['id_nodo']}")
                conn.rollback()
                return
            
            # Prepara timestamp
            timestamp = data.get('timestamp')
            if timestamp:
                try:
                    # Converte stringa timestamp in datetime se necessario
                    if isinstance(timestamp, str):
                        timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                except Exception as e:
                    logger.warning(f"Errore parsing timestamp: {e}, uso timestamp corrente")
                    timestamp = None
            
            # Converti dati_raw in JSON se presente
            dati_raw_json = None
            if data.get('dati_raw'):
                dati_raw_json = json.dumps(data['dati_raw'])
            
            # Inserisci la lettura
            cursor.execute(
                """
                INSERT INTO letture 
                (id_arnia, id_nodo, timestamp, temperatura, umidita, peso, dati_raw)
                VALUES (%s, %s, COALESCE(%s, CURRENT_TIMESTAMP), %s, %s, %s, %s)
                """,
                (
                    id_arnia,
                    data['id_nodo'],
                    timestamp,
                    data.get('temperatura'),
                    data.get('umidita'),
                    data.get('peso'),
                    dati_raw_json
                )
            )
            
            conn.commit()
            logger.info(
                f"Salvata lettura per arnia {id_arnia} "
                f"(nodo: {data['id_nodo']}, "
                f"T: {data.get('temperatura')}°C, "
                f"H: {data.get('umidita')}%, "
                f"W: {data.get('peso')}kg)"
            )
            
        except psycopg2.Error as e:
            logger.error(f"Errore database: {e}", exc_info=True)
            if conn:
                conn.rollback()
        except Exception as e:
            logger.error(f"Errore salvataggio dati: {e}", exc_info=True)
            if conn:
                conn.rollback()
        finally:
            if conn:
                db_pool.putconn(conn)
    
    def run(self):
        """Avvia il client MQTT"""
        try:
            logger.info(f"Connessione a {MQTT_BROKER}:{MQTT_PORT}...")
            if MQTT_USER and MQTT_PASSWORD:
                self.client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
                logger.info(f"Autenticazione MQTT con utente: {MQTT_USER}")
            self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.client.loop_start()
            
            # Mantieni il processo in esecuzione
            while self.running:
                import time
                time.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("Interruzione da tastiera ricevuta")
        except Exception as e:
            logger.error(f"Errore durante esecuzione: {e}", exc_info=True)
        finally:
            self.stop()
    
    def stop(self):
        """Ferma il client MQTT"""
        logger.info("Fermando MQTT handler...")
        self.running = False
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("MQTT handler fermato")


def init_db_pool():
    """Inizializza il pool di connessioni al database"""
    global db_pool
    try:
        logger.info(f"Connessione al database {DB_HOST}:{DB_PORT}/{DB_NAME}...")
        db_pool = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        logger.info("Pool di connessioni database inizializzato")
        return True
    except Exception as e:
        logger.error(f"Errore connessione database: {e}", exc_info=True)
        return False


def close_db_pool():
    """Chiude il pool di connessioni al database"""
    global db_pool
    if db_pool:
        db_pool.closeall()
        logger.info("Pool di connessioni database chiuso")


def signal_handler(signum, frame):
    """Handler per segnali di terminazione"""
    logger.info(f"Ricevuto segnale {signum}")
    sys.exit(0)


def main():
    """Funzione principale"""
    # Registra handler per segnali
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Inizializza database
    if not init_db_pool():
        logger.error("Impossibile inizializzare database. Uscita.")
        sys.exit(1)
    
    try:
        # Avvia handler MQTT
        handler = BeehiveMQTTHandler()
        handler.run()
    finally:
        close_db_pool()


if __name__ == '__main__':
    main()
