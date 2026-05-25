-- Fix vista v_arnie_stato: DROP e ricrea con tutti i campi
-- (PostgreSQL non permette di riordinare colonne con CREATE OR REPLACE)

DROP VIEW IF EXISTS v_arnie_stato;

CREATE VIEW v_arnie_stato AS
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

-- Verifica colonne risultanti
SELECT column_name FROM information_schema.columns
WHERE table_name = 'v_arnie_stato'
ORDER BY ordinal_position;
