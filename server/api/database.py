"""
Gestione connessione database
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
from typing import Generator
import logging

from config import settings

logger = logging.getLogger(__name__)

# Pool di connessioni
db_pool: SimpleConnectionPool = None


def init_db_pool():
    """Inizializza il pool di connessioni al database"""
    global db_pool
    try:
        db_pool = SimpleConnectionPool(
            minconn=1,
            maxconn=20,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            database=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD
        )
        logger.info("Pool di connessioni database inizializzato")
    except Exception as e:
        logger.error(f"Errore inizializzazione database pool: {e}")
        raise


def close_db_pool():
    """Chiude il pool di connessioni"""
    global db_pool
    if db_pool:
        db_pool.closeall()
        logger.info("Pool di connessioni database chiuso")


@contextmanager
def get_db_connection():
    """
    Context manager per ottenere una connessione dal pool
    
    Yields:
        connessione database con cursor RealDictCursor
    """
    conn = None
    try:
        conn = db_pool.getconn()
        yield conn
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Errore database: {e}")
        raise
    finally:
        if conn:
            db_pool.putconn(conn)


@contextmanager
def get_db_cursor():
    """
    Context manager per ottenere un cursor dal pool
    
    Yields:
        cursor RealDictCursor
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
        finally:
            cursor.close()
