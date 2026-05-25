-- ============================================
-- Schema Database per Sistema IoT Arnie
-- ============================================

-- Estensione per UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELLA UTENTI
-- ============================================
CREATE TABLE utenti (
    id_utente SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    ruolo VARCHAR(20) DEFAULT 'user' CHECK (ruolo IN ('user', 'admin')),
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_attivazione TIMESTAMP,
    data_disattivazione TIMESTAMP,
    ultimo_accesso TIMESTAMP,
    attivo BOOLEAN DEFAULT true,
    CONSTRAINT valid_dates CHECK (
        data_disattivazione IS NULL OR data_disattivazione >= data_attivazione
    )
);

CREATE INDEX idx_utenti_email ON utenti(email);
CREATE INDEX idx_utenti_attivo ON utenti(attivo);

-- ============================================
-- TABELLA NODI (dispositivi trasmettitori)
-- ============================================
CREATE TABLE nodi (
    id_nodo VARCHAR(50) PRIMARY KEY,
    nome_nodo VARCHAR(100),
    descrizione TEXT,
    posizione VARCHAR(255),
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_messaggio TIMESTAMP,
    attivo BOOLEAN DEFAULT true,
    configurazione JSONB -- configurazione specifica del nodo
);

CREATE INDEX idx_nodi_attivo ON nodi(attivo);
CREATE INDEX idx_nodi_ultimo_messaggio ON nodi(ultimo_messaggio);

-- ============================================
-- TABELLA SENSORI
-- ============================================
CREATE TABLE sensori (
    id_sensore SERIAL PRIMARY KEY,
    id_nodo VARCHAR(50) REFERENCES nodi(id_nodo) ON DELETE CASCADE,
    id_sensore_fisico VARCHAR(50) NOT NULL, -- ID del sensore sul nodo
    tipo_sensore VARCHAR(50) NOT NULL, -- temperatura, umidita, peso, etc.
    unita_misura VARCHAR(20),
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attivo BOOLEAN DEFAULT true,
    configurazione JSONB, -- soglie, calibrazione, etc.
    UNIQUE(id_nodo, id_sensore_fisico)
);

CREATE INDEX idx_sensori_nodo ON sensori(id_nodo);
CREATE INDEX idx_sensori_attivo ON sensori(attivo);

-- ============================================
-- TABELLA ARNIE
-- ============================================
CREATE TABLE arnie (
    id_arnia SERIAL PRIMARY KEY,
    id_nodo VARCHAR(50) REFERENCES nodi(id_nodo) ON DELETE CASCADE,
    id_sensore_fisico VARCHAR(50) NOT NULL,
    nome_arnia VARCHAR(100),
    descrizione TEXT,
    posizione VARCHAR(255),
    latitudine DECIMAL(9,6),   -- coordinate DD opzionali, es: 45.464200
    longitudine DECIMAL(9,6),  -- coordinate DD opzionali, es: 9.190000
    data_installazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_rimozione TIMESTAMP,
    attiva BOOLEAN DEFAULT true,
    metadati JSONB, -- info aggiuntive come razza api, regina, etc.
    UNIQUE(id_nodo, id_sensore_fisico),
    CONSTRAINT valid_latitudine CHECK (latitudine IS NULL OR (latitudine BETWEEN -90 AND 90)),
    CONSTRAINT valid_longitudine CHECK (longitudine IS NULL OR (longitudine BETWEEN -180 AND 180))
);

CREATE INDEX idx_arnie_nodo ON arnie(id_nodo);
CREATE INDEX idx_arnie_attiva ON arnie(attiva);

-- ============================================
-- TABELLA UTENTI_ARNIE (associazione many-to-many)
-- ============================================
CREATE TABLE utenti_arnie (
    id SERIAL PRIMARY KEY,
    id_utente INTEGER REFERENCES utenti(id_utente) ON DELETE CASCADE,
    id_arnia INTEGER REFERENCES arnie(id_arnia) ON DELETE CASCADE,
    data_associazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_disassociazione TIMESTAMP,
    permessi VARCHAR(20) DEFAULT 'read' CHECK (permessi IN ('read', 'write', 'admin')),
    attivo BOOLEAN DEFAULT true,
    UNIQUE(id_utente, id_arnia),
    CONSTRAINT valid_association_dates CHECK (
        data_disassociazione IS NULL OR data_disassociazione >= data_associazione
    )
);

CREATE INDEX idx_utenti_arnie_utente ON utenti_arnie(id_utente);
CREATE INDEX idx_utenti_arnie_arnia ON utenti_arnie(id_arnia);
CREATE INDEX idx_utenti_arnie_attivo ON utenti_arnie(attivo);

-- ============================================
-- TABELLA LETTURE (dati dai sensori)
-- ============================================
CREATE TABLE letture (
    id_lettura BIGSERIAL PRIMARY KEY,
    id_arnia INTEGER REFERENCES arnie(id_arnia) ON DELETE CASCADE,
    id_nodo VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperatura DECIMAL(5,2),
    umidita DECIMAL(5,2),
    peso DECIMAL(10,3),
    dati_raw JSONB, -- per altri sensori o dati aggiuntivi
    CONSTRAINT valid_temperatura CHECK (temperatura IS NULL OR (temperatura >= -50 AND temperatura <= 100)),
    CONSTRAINT valid_umidita CHECK (umidita IS NULL OR (umidita >= 0 AND umidita <= 100)),
    CONSTRAINT valid_peso CHECK (peso IS NULL OR peso >= 0)
);

-- Indici per performance su query temporali
CREATE INDEX idx_letture_arnia ON letture(id_arnia);
CREATE INDEX idx_letture_timestamp ON letture(timestamp DESC);
CREATE INDEX idx_letture_arnia_timestamp ON letture(id_arnia, timestamp DESC);
CREATE INDEX idx_letture_nodo ON letture(id_nodo);

-- Partitioning per ottimizzare query su grandi volumi (opzionale, da abilitare in futuro)
-- CREATE INDEX idx_letture_timestamp_brin ON letture USING BRIN(timestamp);

-- ============================================
-- TABELLA LOG_ATTIVITA
-- ============================================
CREATE TABLE log_attivita (
    id_log BIGSERIAL PRIMARY KEY,
    id_utente INTEGER REFERENCES utenti(id_utente) ON DELETE SET NULL,
    id_arnia INTEGER REFERENCES arnie(id_arnia) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_attivita VARCHAR(50) NOT NULL, -- ispezione, trattamento, raccolta, etc.
    descrizione TEXT,
    dati JSONB, -- dati strutturati dell'attività
    CONSTRAINT valid_activity CHECK (tipo_attivita IN (
        'ispezione', 'trattamento', 'raccolta_miele', 'nutrizione', 
        'sostituzione_regina', 'controllo_salute', 'manutenzione', 'altro'
    ))
);

CREATE INDEX idx_log_utente ON log_attivita(id_utente);
CREATE INDEX idx_log_arnia ON log_attivita(id_arnia);
CREATE INDEX idx_log_timestamp ON log_attivita(timestamp DESC);
CREATE INDEX idx_log_tipo ON log_attivita(tipo_attivita);

-- ============================================
-- TABELLA TOKEN_SESSIONE (per JWT refresh)
-- ============================================
CREATE TABLE token_sessione (
    id_token SERIAL PRIMARY KEY,
    id_utente INTEGER REFERENCES utenti(id_utente) ON DELETE CASCADE,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_scadenza TIMESTAMP NOT NULL,
    revocato BOOLEAN DEFAULT false,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_token_utente ON token_sessione(id_utente);
CREATE INDEX idx_token_scadenza ON token_sessione(data_scadenza);
CREATE INDEX idx_token_revocato ON token_sessione(revocato);

-- ============================================
-- FUNZIONI E TRIGGER
-- ============================================

-- Funzione per aggiornare ultimo_messaggio nei nodi
CREATE OR REPLACE FUNCTION aggiorna_ultimo_messaggio_nodo()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE nodi 
    SET ultimo_messaggio = NEW.timestamp 
    WHERE id_nodo = NEW.id_nodo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_aggiorna_nodo
AFTER INSERT ON letture
FOR EACH ROW
EXECUTE FUNCTION aggiorna_ultimo_messaggio_nodo();

-- ============================================
-- DATI DI ESEMPIO (per testing)
-- ============================================

-- Gli utenti di default vengono creati da seed.py (script separato)
-- che usa passlib/bcrypt per generare hash validi al primo avvio.

-- Nodo esempio
INSERT INTO nodi (id_nodo, nome_nodo, descrizione, posizione, ultimo_messaggio, attivo)
VALUES (
    'NODE001',
    'Apiario Collina',
    'Nodo principale apiario collina sud',
    'Lat: 45.4642, Lon: 9.1900',
    CURRENT_TIMESTAMP,
    true
);

-- Arnie esempio
INSERT INTO arnie (id_nodo, id_sensore_fisico, nome_arnia, descrizione, posizione, latitudine, longitudine, attiva, metadati)
VALUES 
(
    'NODE001',
    'SENSOR01',
    'Arnia Alpha',
    'Arnia con regina ligustica',
    'Fila 1, Posizione 1',
    45.464200,
    9.190000,
    true,
    '{"razza": "Ligustica", "anno_regina": 2024, "colore_arnia": "giallo"}'::JSONB
),
(
    'NODE001',
    'SENSOR02',
    'Arnia Beta',
    'Arnia con regina carnica',
    'Fila 1, Posizione 2',
    45.464250,
    9.190050,
    true,
    '{"razza": "Carnica", "anno_regina": 2023, "colore_arnia": "verde"}'::JSONB
);

-- Associazione utente-arnie: creata da seed.py dopo la creazione degli utenti

-- Letture esempio
INSERT INTO letture (id_arnia, id_nodo, timestamp, temperatura, umidita, peso)
VALUES 
(1, 'NODE001', CURRENT_TIMESTAMP - INTERVAL '1 hour', 34.5, 65.0, 42.350),
(1, 'NODE001', CURRENT_TIMESTAMP - INTERVAL '2 hours', 33.8, 66.5, 42.320),
(2, 'NODE001', CURRENT_TIMESTAMP - INTERVAL '1 hour', 35.2, 63.0, 38.720),
(2, 'NODE001', CURRENT_TIMESTAMP - INTERVAL '2 hours', 34.9, 64.0, 38.710);

-- Log attività esempio: creato da seed.py

-- ============================================
-- VISTE UTILI
-- ============================================

-- Vista per letture recenti con info arnia
CREATE OR REPLACE VIEW v_letture_recenti AS
SELECT 
    l.id_lettura,
    l.timestamp,
    a.id_arnia,
    a.nome_arnia,
    a.id_nodo,
    n.nome_nodo,
    l.temperatura,
    l.umidita,
    l.peso,
    l.dati_raw
FROM letture l
JOIN arnie a ON l.id_arnia = a.id_arnia
JOIN nodi n ON a.id_nodo = n.id_nodo
WHERE l.timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY l.timestamp DESC;

-- Vista per arnie con ultime letture e coordinate
CREATE OR REPLACE VIEW v_arnie_stato AS
SELECT 
    a.id_arnia,
    a.id_nodo,
    a.id_sensore_fisico,
    a.nome_arnia,
    n.nome_nodo,
    a.posizione,
    a.latitudine,
    a.longitudine,
    a.data_installazione,
    a.data_rimozione,
    a.attiva,
    a.metadati,
    (SELECT temperatura FROM letture WHERE id_arnia = a.id_arnia ORDER BY timestamp DESC LIMIT 1) as ultima_temperatura,
    (SELECT umidita   FROM letture WHERE id_arnia = a.id_arnia ORDER BY timestamp DESC LIMIT 1) as ultima_umidita,
    (SELECT peso      FROM letture WHERE id_arnia = a.id_arnia ORDER BY timestamp DESC LIMIT 1) as ultimo_peso,
    (SELECT timestamp FROM letture WHERE id_arnia = a.id_arnia ORDER BY timestamp DESC LIMIT 1) as ultimo_aggiornamento
FROM arnie a
LEFT JOIN nodi n ON a.id_nodo = n.id_nodo;

-- Vista serie storica temperatura
CREATE OR REPLACE VIEW v_serie_temperatura AS
SELECT 
    l.timestamp,
    l.id_arnia,
    a.nome_arnia,
    l.temperatura
FROM letture l
JOIN arnie a ON l.id_arnia = a.id_arnia
WHERE l.temperatura IS NOT NULL
ORDER BY l.id_arnia, l.timestamp DESC;

-- Vista serie storica umidita
CREATE OR REPLACE VIEW v_serie_umidita AS
SELECT 
    l.timestamp,
    l.id_arnia,
    a.nome_arnia,
    l.umidita
FROM letture l
JOIN arnie a ON l.id_arnia = a.id_arnia
WHERE l.umidita IS NOT NULL
ORDER BY l.id_arnia, l.timestamp DESC;

-- Vista serie storica peso
CREATE OR REPLACE VIEW v_serie_peso AS
SELECT 
    l.timestamp,
    l.id_arnia,
    a.nome_arnia,
    l.peso
FROM letture l
JOIN arnie a ON l.id_arnia = a.id_arnia
WHERE l.peso IS NOT NULL
ORDER BY l.id_arnia, l.timestamp DESC;

-- ============================================
-- COMMENTI FINALI
-- ============================================
COMMENT ON TABLE utenti IS 'Utenti del sistema con autenticazione';
COMMENT ON TABLE nodi IS 'Dispositivi IoT che trasmettono dati';
COMMENT ON TABLE arnie IS 'Arnie monitorate con sensori';
COMMENT ON TABLE letture IS 'Dati telemetrici dalle arnie';
COMMENT ON TABLE log_attivita IS 'Registro attività degli apicoltori';
COMMENT ON TABLE log_attivita IS 'Registro interventi e attività degli apicoltori';
