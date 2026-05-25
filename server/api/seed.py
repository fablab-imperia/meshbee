#!/usr/bin/env python3
"""
Seed iniziale del database.
Usa bcrypt direttamente (senza passlib) per evitare problemi di compatibilità.
"""
import sys
import os
import logging
import bcrypt

sys.path.insert(0, '/app')

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Genera hash bcrypt reale e verificato"""
    pwd_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt(rounds=12))
    # Verifica immediata prima di restituire
    assert bcrypt.checkpw(pwd_bytes, hashed), "Verifica hash fallita!"
    return hashed.decode('utf-8')


def seed():
    from database import init_db_pool, get_db_cursor

    default_users = [
        {
            "email": "admin@beehive.local",
            "password": os.getenv("ADMIN_PASSWORD", ""),
            "nome": "Admin",
            "cognome": "Sistema",
            "ruolo": "admin",
        },
        {
            "email": "utente@test.local",
            "password": os.getenv("USER_PASSWORD", ""),
            "nome": "Mario",
            "cognome": "Rossi",
            "ruolo": "user",
        },
    ]

    init_db_pool()
    user_ids = {}

    # 1. Crea utenti
    logger.info("=== Creazione utenti ===")
    for u in default_users:
        try:
            with get_db_cursor() as cursor:
                cursor.execute(
                    "SELECT id_utente FROM utenti WHERE email = %s", (u["email"],)
                )
                row = cursor.fetchone()
                if row:
                    user_ids[u["email"]] = row["id_utente"]
                    logger.info(f"  Utente già esistente, skip: {u['email']}")
                    continue

                password_hash = hash_password(u["password"])

                cursor.execute(
                    """
                    INSERT INTO utenti
                        (email, password_hash, nome, cognome, ruolo, data_attivazione, attivo)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP, true)
                    RETURNING id_utente
                    """,
                    (u["email"], password_hash, u["nome"], u["cognome"], u["ruolo"])
                )
                uid = cursor.fetchone()["id_utente"]
                user_ids[u["email"]] = uid
                logger.info(f"  ✓ Creato: {u['email']} (id={uid}, ruolo={u['ruolo']})")

        except Exception as e:
            logger.error(f"  ✗ Errore per {u['email']}: {e}")
            sys.exit(1)

    # 2. Associa utente test alle arnie
    logger.info("\n=== Associazione utente-arnie ===")
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id_arnia FROM arnie ORDER BY id_arnia")
            arnie = [r["id_arnia"] for r in cursor.fetchall()]

        if not arnie:
            logger.info("  Nessuna arnia trovata, skip")
        else:
            user_id = user_ids.get("utente@test.local")
            if user_id:
                for id_arnia in arnie:
                    with get_db_cursor() as cursor:
                        cursor.execute(
                            """
                            INSERT INTO utenti_arnie (id_utente, id_arnia, permessi, attivo)
                            VALUES (%s, %s, 'admin', true)
                            ON CONFLICT (id_utente, id_arnia) DO NOTHING
                            """,
                            (user_id, id_arnia)
                        )
                logger.info(f"  ✓ Utente {user_id} associato a {len(arnie)} arnie")
    except Exception as e:
        logger.error(f"  ✗ Errore associazioni: {e}")

    # 3. Log attività di esempio
    logger.info("\n=== Log attività di esempio ===")
    try:
        user_id = user_ids.get("utente@test.local")
        if user_id and arnie:
            with get_db_cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(*) as n FROM log_attivita WHERE id_arnia = %s", (arnie[0],)
                )
                if cursor.fetchone()["n"] == 0:
                    cursor.execute(
                        """
                        INSERT INTO log_attivita
                            (id_utente, id_arnia, timestamp, tipo_attivita, descrizione, dati)
                        VALUES (%s, %s, CURRENT_TIMESTAMP - INTERVAL '7 days',
                                'ispezione', 'Controllo regolare - tutto ok',
                                '{"telaini_miele": 8, "covata_presente": true}')
                        """,
                        (user_id, arnie[0])
                    )
                    logger.info("  ✓ Log attività di esempio inserito")
                else:
                    logger.info("  Log già esistente, skip")
    except Exception as e:
        logger.error(f"  ✗ Errore log attività: {e}")

    logger.info("\n=== Seed completato ===")
    logger.info("Utenti creati: " + ", ".join(u["email"] for u in default_users))
    logger.info("⚠️  Assicurati di usare password sicure impostando ADMIN_PASSWORD e USER_PASSWORD nel file .env")


if __name__ == "__main__":
    seed()
