-- ============================================
-- MIGRAZIONE: Aggiunta coordinate + rimozione allarmi
-- Esegui questo script se hai già il database attivo
-- e non vuoi perdere i dati esistenti
-- ============================================

BEGIN;

-- 1. Aggiungi colonne coordinate alla tabella arnie
ALTER TABLE arnie 
    ADD COLUMN IF NOT EXISTS latitudine DECIMAL(9,6),
    ADD COLUMN IF NOT EXISTS longitudine DECIMAL(9,6);

-- 2. Aggiungi constraint di validità coordinate
ALTER TABLE arnie
    DROP CONSTRAINT IF EXISTS valid_latitudine,
    DROP CONSTRAINT IF EXISTS valid_longitudine;

ALTER TABLE arnie
    ADD CONSTRAINT valid_latitudine 
        CHECK (latitudine IS NULL OR (latitudine BETWEEN -90 AND 90)),
    ADD CONSTRAINT valid_longitudine 
        CHECK (longitudine IS NULL OR (longitudine BETWEEN -180 AND 180));

-- 3. Rimuovi tabella allarmi (e trigger correlati)
DROP TRIGGER IF EXISTS trigger_controlla_allarmi ON letture;
DROP FUNCTION IF EXISTS controlla_soglie_allarmi();
DROP TABLE IF EXISTS allarmi CASCADE;

-- 4. Aggiorna vista v_arnie_stato con coordinate
DROP VIEW IF EXISTS v_arnie_stato;
CREATE OR REPLACE VIEW v_arnie_stato AS
SELECT 
    a.id_arnia,
    a.nome_arnia,
    a.id_nodo,
    n.nome_nodo,
    a.posizione,
    a.latitudine,
    a.longitudine,
    a.attiva,
    a.metadati,
    (SELECT temperatura FROM letture WHERE id_arnia = a.id_arnia ORDER BY timestamp DESC LIMIT 1) as ultima_temperatura,
    (SELECT umidita FROM letture WHERE id_arnia = a.id_arnia ORDER BY timestamp DESC LIMIT 1) as ultima_umidita,
    (SELECT peso FROM letture WHERE id_arnia = a.id_arnia ORDER BY timestamp DESC LIMIT 1) as ultimo_peso,
    (SELECT timestamp FROM letture WHERE id_arnia = a.id_arnia ORDER BY timestamp DESC LIMIT 1) as ultimo_aggiornamento
FROM arnie a
LEFT JOIN nodi n ON a.id_nodo = n.id_nodo;

-- 5. Rimuovi vista allarmi se esiste
DROP VIEW IF EXISTS v_allarmi_attivi;

-- 6. Crea viste serie storiche
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

COMMIT;

-- Verifica migrazione
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'arnie' 
  AND column_name IN ('latitudine', 'longitudine');
