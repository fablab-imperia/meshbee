"""
Beehive IoT API - Applicazione principale
"""
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import json

from config import settings
from database import init_db_pool, close_db_pool, get_db_cursor
from auth import (
    authenticate_user, create_access_token, create_refresh_token,
    get_current_active_user, get_current_admin_user, get_password_hash,
    check_user_arnia_access
)
from models import (
    UserLogin, Token, UserCreate, UserResponse, UserUpdate,
    NodoCreate, NodoResponse, ArniaCreate, ArniaResponse, ArniaUpdate, ArniaConStato,
    LetturaCreate, LetturaResponse, AttivitaCreate, AttivitaUpdate, AttivitaResponse,
    SerieTemperaturaResponse, SerieUmiditaResponse, SeriePesoResponse,
    UtenteArniaCreate, PasswordChange, MessageResponse, ErrorResponse
)

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestione startup e shutdown dell'applicazione"""
    # Startup
    logger.info("Avvio applicazione...")
    init_db_pool()
    yield
    # Shutdown
    logger.info("Chiusura applicazione...")
    close_db_pool()


# Creazione app FastAPI
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    lifespan=lifespan
)

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# ENDPOINT AUTENTICAZIONE
# ============================================

@app.post("/api/auth/login", response_model=Token, tags=["Autenticazione"])
async def login(user_login: UserLogin):
    """
    Login utente e generazione token JWT
    
    Returns:
        Access token e refresh token
    """
    user = authenticate_user(user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corretti",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crea token
    access_token = create_access_token(data={"sub": user['email']})
    refresh_token = create_refresh_token(data={"sub": user['email']})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@app.get("/api/auth/me", response_model=UserResponse, tags=["Autenticazione"])
async def get_me(current_user: dict = Depends(get_current_active_user)):
    """
    Ottieni informazioni sull'utente corrente
    
    Returns:
        Dati dell'utente autenticato
    """
    return current_user


# ============================================
# ENDPOINT UTENTE (User APIs)
# ============================================

@app.get("/api/user/arnie", response_model=List[ArniaConStato], tags=["Utente"])
async def get_user_arnie(current_user: dict = Depends(get_current_active_user)):
    """
    Ottieni lista delle arnie associate all'utente con lo stato attuale
    
    Returns:
        Lista di arnie con ultime letture
    """
    try:
        with get_db_cursor() as cursor:
            if current_user['ruolo'] == 'admin':
                # Admin vede tutte le arnie
                cursor.execute(
                    """
                    SELECT * FROM v_arnie_stato
                    WHERE attiva = true
                    ORDER BY nome_arnia
                    """
                )
            else:
                # Utente normale vede solo le sue arnie
                cursor.execute(
                    """
                    SELECT vs.* 
                    FROM v_arnie_stato vs
                    JOIN utenti_arnie ua ON vs.id_arnia = ua.id_arnia
                    WHERE ua.id_utente = %s AND ua.attivo = true AND vs.attiva = true
                    ORDER BY vs.nome_arnia
                    """,
                    (current_user['id_utente'],)
                )
            
            arnie = cursor.fetchall()
            return [dict(arnia) for arnia in arnie]
    except Exception as e:
        logger.error(f"Errore recupero arnie utente: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/user/arnie/{id_arnia}/letture", response_model=List[LetturaResponse], tags=["Utente"])
async def get_user_letture(
    id_arnia: int,
    data_inizio: Optional[datetime] = Query(None, description="Data inizio (default: 1 anno fa)"),
    data_fine: Optional[datetime] = Query(None, description="Data fine (default: ora)"),
    limit: int = Query(1000, ge=1, le=10000, description="Numero massimo di letture"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Ottieni letture di un'arnia
    
    Args:
        id_arnia: ID dell'arnia
        data_inizio: Data inizio periodo (opzionale)
        data_fine: Data fine periodo (opzionale)
        limit: Numero massimo di risultati
    
    Returns:
        Lista di letture ordinate per timestamp (più recente prima)
    """
    # Verifica accesso all'arnia
    if not check_user_arnia_access(current_user['id_utente'], id_arnia, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai accesso a questa arnia"
        )
    
    try:
        # Default: ultimo anno
        if not data_inizio:
            data_inizio = datetime.now() - timedelta(days=365)
        if not data_fine:
            data_fine = datetime.now()
        
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id_lettura, id_arnia, id_nodo, timestamp, 
                       temperatura, umidita, peso, dati_raw
                FROM letture
                WHERE id_arnia = %s 
                  AND timestamp >= %s 
                  AND timestamp <= %s
                ORDER BY timestamp DESC
                LIMIT %s
                """,
                (id_arnia, data_inizio, data_fine, limit)
            )
            
            letture = cursor.fetchall()
            return [dict(lettura) for lettura in letture]
    except Exception as e:
        logger.error(f"Errore recupero letture: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/user/arnie/{id_arnia}/attivita", response_model=List[AttivitaResponse], tags=["Utente"])
async def get_user_attivita(
    id_arnia: int,
    data_inizio: Optional[datetime] = Query(None, description="Data inizio (default: 1 anno fa)"),
    data_fine: Optional[datetime] = Query(None, description="Data fine (default: ora)"),
    tipo_attivita: Optional[str] = Query(None, description="Filtra per tipo attività"),
    limit: int = Query(100, ge=1, le=1000, description="Numero massimo di attività"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Ottieni log attività di un'arnia
    
    Args:
        id_arnia: ID dell'arnia
        data_inizio: Data inizio periodo (opzionale)
        data_fine: Data fine periodo (opzionale)
        tipo_attivita: Tipo di attività (opzionale)
        limit: Numero massimo di risultati
    
    Returns:
        Lista di attività ordinate per timestamp (più recente prima)
    """
    # Verifica accesso all'arnia
    if not check_user_arnia_access(current_user['id_utente'], id_arnia, "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai accesso a questa arnia"
        )
    
    try:
        # Default: ultimo anno
        if not data_inizio:
            data_inizio = datetime.now() - timedelta(days=365)
        if not data_fine:
            data_fine = datetime.now()
        
        with get_db_cursor() as cursor:
            query = """
                SELECT id_log, id_utente, id_arnia, timestamp, 
                       tipo_attivita, descrizione, dati
                FROM log_attivita
                WHERE id_arnia = %s 
                  AND timestamp >= %s 
                  AND timestamp <= %s
            """
            params = [id_arnia, data_inizio, data_fine]
            
            if tipo_attivita:
                query += " AND tipo_attivita = %s"
                params.append(tipo_attivita)
            
            query += " ORDER BY timestamp DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            
            attivita = cursor.fetchall()
            return [dict(att) for att in attivita]
    except Exception as e:
        logger.error(f"Errore recupero attività: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.post("/api/user/arnie/{id_arnia}/attivita", response_model=AttivitaResponse, tags=["Utente"])
async def create_attivita(
    id_arnia: int,
    attivita: AttivitaCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Registra una nuova attività per un'arnia
    
    Args:
        id_arnia: ID dell'arnia
        attivita: Dati dell'attività
    
    Returns:
        Attività creata
    """
    # Verifica accesso all'arnia (richiede write)
    if not check_user_arnia_access(current_user['id_utente'], id_arnia, "write"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai permessi di scrittura su questa arnia"
        )
    
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO log_attivita 
                (id_utente, id_arnia, timestamp, tipo_attivita, descrizione, dati)
                VALUES (%s, %s, COALESCE(%s, CURRENT_TIMESTAMP), %s, %s, %s)
                RETURNING id_log, id_utente, id_arnia, timestamp, tipo_attivita, descrizione, dati
                """,
                (
                    current_user['id_utente'],
                    id_arnia,
                    attivita.timestamp,
                    attivita.tipo_attivita,
                    attivita.descrizione,
                    json.dumps(attivita.dati) if attivita.dati else None
                )
            )
            
            nuova_attivita = cursor.fetchone()
            return dict(nuova_attivita)
    except Exception as e:
        logger.error(f"Errore creazione attività: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.patch("/api/user/arnie/{id_arnia}/attivita/{id_log}", response_model=AttivitaResponse, tags=["Utente"])
async def update_user_attivita(
    id_arnia: int,
    id_log: int,
    attivita_update: AttivitaUpdate,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Aggiorna un'attività di un'arnia (solo se appartiene all'utente)
    """
    # Verifica accesso arnia
    if not check_user_arnia_access(current_user['id_utente'], id_arnia):
        raise HTTPException(status_code=403, detail="Accesso non consentito a questa arnia")

    try:
        with get_db_cursor() as cursor:
            # Verifica che il log appartenga all'arnia e all'utente
            cursor.execute(
                "SELECT id_log FROM log_attivita WHERE id_log = %s AND id_arnia = %s AND id_utente = %s",
                (id_log, id_arnia, current_user['id_utente'])
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Attività non trovata")

            # Costruisci query dinamica per aggiornamento
            try:
                update_data = attivita_update.model_dump(exclude_unset=True)
            except AttributeError:
                update_data = attivita_update.dict(exclude_unset=True)
                
            if not update_data:
                # Se non ci sono dati da aggiornare, recupera l'attività corrente
                cursor.execute("SELECT * FROM log_attivita WHERE id_log = %s", (id_log,))
                return dict(cursor.fetchone())

            set_clause = []
            params = []
            for field, value in update_data.items():
                if field == 'dati' and value is not None:
                    set_clause.append(f"{field} = %s")
                    params.append(json.dumps(value))
                else:
                    set_clause.append(f"{field} = %s")
                    params.append(value)
            
            params.append(id_log)
            query = f"UPDATE log_attivita SET {', '.join(set_clause)} WHERE id_log = %s RETURNING *"
            
            cursor.execute(query, tuple(params))
            updated_log = cursor.fetchone()
            return dict(updated_log)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore aggiornamento attività: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.delete("/api/user/arnie/{id_arnia}/attivita/{id_log}", response_model=MessageResponse, tags=["Utente"])
async def delete_user_attivita(
    id_arnia: int,
    id_log: int,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Elimina un'attività di un'arnia (solo se appartiene all'utente)
    """
    # Verifica accesso arnia
    if not check_user_arnia_access(current_user['id_utente'], id_arnia):
        raise HTTPException(status_code=403, detail="Accesso non consentito a questa arnia")

    try:
        with get_db_cursor() as cursor:
            # Verifica che il log appartenga all'arnia e all'utente
            cursor.execute(
                "DELETE FROM log_attivita WHERE id_log = %s AND id_arnia = %s AND id_utente = %s RETURNING id_log",
                (id_log, id_arnia, current_user['id_utente'])
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Attività non trovata o non appartenente all'utente")
            
            return {"message": "Attività eliminata con successo"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore eliminazione attività: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/user/arnie/{id_arnia}/letture/temperatura", response_model=List[SerieTemperaturaResponse], tags=["Utente"])
async def get_serie_temperatura(
    id_arnia: int,
    data_inizio: Optional[datetime] = Query(None, description="Data inizio (default: 1 anno fa)"),
    data_fine: Optional[datetime] = Query(None, description="Data fine (default: ora)"),
    limit: int = Query(1000, ge=1, le=10000, description="Numero massimo di letture"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Serie storica temperatura per un'arnia.
    Restituisce solo timestamp e temperatura, ottimizzato per grafici.
    """
    if not check_user_arnia_access(current_user['id_utente'], id_arnia, "read"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non hai accesso a questa arnia")
    try:
        if not data_inizio:
            data_inizio = datetime.now() - timedelta(days=365)
        if not data_fine:
            data_fine = datetime.now()
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT timestamp, temperatura
                FROM letture
                WHERE id_arnia = %s
                  AND timestamp BETWEEN %s AND %s
                  AND temperatura IS NOT NULL
                ORDER BY timestamp DESC
                LIMIT %s
                """,
                (id_arnia, data_inizio, data_fine, limit)
            )
            return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Errore serie temperatura: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/user/arnie/{id_arnia}/letture/umidita", response_model=List[SerieUmiditaResponse], tags=["Utente"])
async def get_serie_umidita(
    id_arnia: int,
    data_inizio: Optional[datetime] = Query(None, description="Data inizio (default: 1 anno fa)"),
    data_fine: Optional[datetime] = Query(None, description="Data fine (default: ora)"),
    limit: int = Query(1000, ge=1, le=10000, description="Numero massimo di letture"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Serie storica umidità per un'arnia.
    Restituisce solo timestamp e umidita, ottimizzato per grafici.
    """
    if not check_user_arnia_access(current_user['id_utente'], id_arnia, "read"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non hai accesso a questa arnia")
    try:
        if not data_inizio:
            data_inizio = datetime.now() - timedelta(days=365)
        if not data_fine:
            data_fine = datetime.now()
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT timestamp, umidita
                FROM letture
                WHERE id_arnia = %s
                  AND timestamp BETWEEN %s AND %s
                  AND umidita IS NOT NULL
                ORDER BY timestamp DESC
                LIMIT %s
                """,
                (id_arnia, data_inizio, data_fine, limit)
            )
            return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Errore serie umidita: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/user/arnie/{id_arnia}/letture/peso", response_model=List[SeriePesoResponse], tags=["Utente"])
async def get_serie_peso(
    id_arnia: int,
    data_inizio: Optional[datetime] = Query(None, description="Data inizio (default: 1 anno fa)"),
    data_fine: Optional[datetime] = Query(None, description="Data fine (default: ora)"),
    limit: int = Query(1000, ge=1, le=10000, description="Numero massimo di letture"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Serie storica peso per un'arnia.
    Restituisce solo timestamp e peso, ottimizzato per grafici.
    """
    if not check_user_arnia_access(current_user['id_utente'], id_arnia, "read"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Non hai accesso a questa arnia")
    try:
        if not data_inizio:
            data_inizio = datetime.now() - timedelta(days=365)
        if not data_fine:
            data_fine = datetime.now()
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT timestamp, peso
                FROM letture
                WHERE id_arnia = %s
                  AND timestamp BETWEEN %s AND %s
                  AND peso IS NOT NULL
                ORDER BY timestamp DESC
                LIMIT %s
                """,
                (id_arnia, data_inizio, data_fine, limit)
            )
            return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Errore serie peso: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")



# ============================================
# ENDPOINT ADMIN
# ============================================

@app.get("/api/admin/utenti", response_model=List[UserResponse], tags=["Admin"])
async def get_all_users(current_user: dict = Depends(get_current_admin_user)):
    """
    Ottieni lista di tutti gli utenti (solo admin)
    
    Returns:
        Lista di tutti gli utenti
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id_utente, email, nome, cognome, ruolo,
                       data_creazione, data_attivazione, data_disattivazione,
                       ultimo_accesso, attivo
                FROM utenti
                ORDER BY id_utente
                """
            )
            users = cursor.fetchall()
            return [dict(user) for user in users]
    except Exception as e:
        logger.error(f"Errore recupero utenti: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.post("/api/admin/utenti", response_model=UserResponse, tags=["Admin"])
async def create_user(
    user: UserCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Crea un nuovo utente (solo admin)
    
    Args:
        user: Dati del nuovo utente
    
    Returns:
        Utente creato
    """
    try:
        with get_db_cursor() as cursor:
            # Verifica se email già esiste
            cursor.execute("SELECT id_utente FROM utenti WHERE email = %s", (user.email,))
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email già registrata"
                )
            
            # Hash password
            password_hash = get_password_hash(user.password)
            
            # Inserisci utente
            cursor.execute(
                """
                INSERT INTO utenti (email, password_hash, nome, cognome, ruolo, data_attivazione, attivo)
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP, true)
                RETURNING id_utente, email, nome, cognome, ruolo,
                          data_creazione, data_attivazione, data_disattivazione,
                          ultimo_accesso, attivo
                """,
                (user.email, password_hash, user.nome, user.cognome, user.ruolo)
            )
            
            new_user = cursor.fetchone()
            return dict(new_user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore creazione utente: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.put("/api/admin/utenti/{id_utente}", response_model=UserResponse, tags=["Admin"])
async def update_user(
    id_utente: int,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Aggiorna un utente (solo admin)
    
    Args:
        id_utente: ID dell'utente da aggiornare
        user_update: Dati da aggiornare
    
    Returns:
        Utente aggiornato
    """
    try:
        with get_db_cursor() as cursor:
            # Costruisci query dinamicamente
            updates = []
            params = []
            
            if user_update.email is not None:
                updates.append("email = %s")
                params.append(user_update.email)
            if user_update.nome is not None:
                updates.append("nome = %s")
                params.append(user_update.nome)
            if user_update.cognome is not None:
                updates.append("cognome = %s")
                params.append(user_update.cognome)
            if user_update.ruolo is not None:
                updates.append("ruolo = %s")
                params.append(user_update.ruolo)
            if user_update.attivo is not None:
                updates.append("attivo = %s")
                params.append(user_update.attivo)
                if not user_update.attivo:
                    updates.append("data_disattivazione = CURRENT_TIMESTAMP")
            
            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nessun campo da aggiornare"
                )
            
            params.append(id_utente)
            
            query = f"""
                UPDATE utenti 
                SET {', '.join(updates)}
                WHERE id_utente = %s
                RETURNING id_utente, email, nome, cognome, ruolo,
                          data_creazione, data_attivazione, data_disattivazione,
                          ultimo_accesso, attivo
            """
            
            cursor.execute(query, params)
            updated_user = cursor.fetchone()
            
            if not updated_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Utente non trovato"
                )
            
            return dict(updated_user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore aggiornamento utente: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/admin/nodi", response_model=List[NodoResponse], tags=["Admin"])
async def get_all_nodi(current_user: dict = Depends(get_current_admin_user)):
    """
    Ottieni lista di tutti i nodi (solo admin)
    
    Returns:
        Lista di tutti i nodi trasmettitori
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id_nodo, nome_nodo, descrizione, posizione,
                       data_registrazione, ultimo_messaggio, attivo, configurazione
                FROM nodi
                ORDER BY id_nodo
                """
            )
            nodi = cursor.fetchall()
            return [dict(nodo) for nodo in nodi]
    except Exception as e:
        logger.error(f"Errore recupero nodi: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/admin/arnie", response_model=List[ArniaConStato], tags=["Admin"])
async def get_all_arnie(current_user: dict = Depends(get_current_admin_user)):
    """
    Ottieni lista di tutte le arnie con stato (solo admin)
    
    Returns:
        Lista di tutte le arnie
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM v_arnie_stato ORDER BY id_arnia")
            arnie = cursor.fetchall()
            return [dict(arnia) for arnia in arnie]
    except Exception as e:
        logger.error(f"Errore recupero arnie: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.post("/api/admin/arnie", response_model=ArniaResponse, tags=["Admin"])
async def create_arnia(
    arnia: ArniaCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Crea una nuova arnia (solo admin)
    
    Args:
        arnia: Dati della nuova arnia
    
    Returns:
        Arnia creata
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO arnie 
                (id_nodo, id_sensore_fisico, nome_arnia, descrizione, posizione, latitudine, longitudine, attiva, metadati)
                VALUES (%s, %s, %s, %s, %s, %s, %s, true, %s)
                RETURNING id_arnia, id_nodo, id_sensore_fisico, nome_arnia, descrizione,
                          posizione, latitudine, longitudine, data_installazione, data_rimozione, attiva, metadati
                """,
                (
                    arnia.id_nodo,
                    arnia.id_sensore_fisico,
                    arnia.nome_arnia or f"Arnia {arnia.id_nodo}-{arnia.id_sensore_fisico}",
                    arnia.descrizione,
                    arnia.posizione,
                    arnia.latitudine,
                    arnia.longitudine,
                    json.dumps(arnia.metadati) if arnia.metadati else None
                )
            )
            
            new_arnia = cursor.fetchone()
            return dict(new_arnia)
    except Exception as e:
        logger.error(f"Errore creazione arnia: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.post("/api/admin/utenti-arnie", response_model=MessageResponse, tags=["Admin"])
async def associate_user_arnia(
    associazione: UtenteArniaCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Associa un utente a un'arnia (solo admin)
    
    Args:
        associazione: Dati dell'associazione
    
    Returns:
        Messaggio di conferma
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO utenti_arnie (id_utente, id_arnia, permessi, attivo)
                VALUES (%s, %s, %s, true)
                ON CONFLICT (id_utente, id_arnia) 
                DO UPDATE SET 
                    permessi = EXCLUDED.permessi,
                    attivo = true,
                    data_disassociazione = NULL
                """,
                (associazione.id_utente, associazione.id_arnia, associazione.permessi)
            )
            
            return {"message": "Associazione creata con successo"}
    except Exception as e:
        logger.error(f"Errore associazione utente-arnia: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/admin/letture", response_model=List[LetturaResponse], tags=["Admin"])
async def get_all_letture(
    limit: int = Query(1000, ge=1, le=10000),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Ottieni tutte le letture (solo admin)
    
    Args:
        limit: Numero massimo di letture da restituire
    
    Returns:
        Lista di letture
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id_lettura, id_arnia, id_nodo, timestamp,
                       temperatura, umidita, peso, dati_raw
                FROM letture
                ORDER BY timestamp DESC
                LIMIT %s
                """,
                (limit,)
            )
            
            letture = cursor.fetchall()
            return [dict(lettura) for lettura in letture]
    except Exception as e:
        logger.error(f"Errore recupero letture: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/admin/attivita", response_model=List[AttivitaResponse], tags=["Admin"])
async def get_all_attivita(
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Ottieni tutte le attività (solo admin)
    
    Args:
        limit: Numero massimo di attività da restituire
    
    Returns:
        Lista di attività
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id_log, id_utente, id_arnia, timestamp,
                       tipo_attivita, descrizione, dati
                FROM log_attivita
                ORDER BY timestamp DESC
                LIMIT %s
                """,
                (limit,)
            )
            
            attivita = cursor.fetchall()
            return [dict(att) for att in attivita]
    except Exception as e:
        logger.error(f"Errore recupero attività: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")



# ============================================
# ENDPOINT ADMIN - NODI
# ============================================

@app.post("/api/admin/nodi", response_model=NodoResponse, tags=["Admin - Nodi"])
async def create_nodo(
    nodo: NodoCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Registra un nuovo nodo trasmettitore (solo admin).
    """
    try:
        import json
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id_nodo FROM nodi WHERE id_nodo = %s", (nodo.id_nodo,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail=f"Nodo '{nodo.id_nodo}' già esistente")

            cursor.execute(
                """
                INSERT INTO nodi (id_nodo, nome_nodo, descrizione, posizione, attivo, configurazione)
                VALUES (%s, %s, %s, %s, true, %s)
                RETURNING id_nodo, nome_nodo, descrizione, posizione,
                          data_registrazione, ultimo_messaggio, attivo, configurazione
                """,
                (
                    nodo.id_nodo, nodo.nome_nodo, nodo.descrizione,
                    nodo.posizione,
                    json.dumps(nodo.configurazione) if nodo.configurazione else None
                )
            )
            return dict(cursor.fetchone())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore creazione nodo: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.get("/api/admin/nodi/{id_nodo}", response_model=NodoResponse, tags=["Admin - Nodi"])
async def get_nodo(
    id_nodo: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Dettagli di un singolo nodo (solo admin).
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id_nodo, nome_nodo, descrizione, posizione,
                       data_registrazione, ultimo_messaggio, attivo, configurazione
                FROM nodi WHERE id_nodo = %s
                """,
                (id_nodo,)
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Nodo '{id_nodo}' non trovato")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore recupero nodo: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.put("/api/admin/nodi/{id_nodo}", response_model=NodoResponse, tags=["Admin - Nodi"])
async def update_nodo(
    id_nodo: str,
    nodo: NodoCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Aggiorna un nodo esistente (solo admin).
    """
    try:
        import json
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                UPDATE nodi
                SET nome_nodo    = COALESCE(%s, nome_nodo),
                    descrizione  = COALESCE(%s, descrizione),
                    posizione    = COALESCE(%s, posizione),
                    configurazione = COALESCE(%s, configurazione)
                WHERE id_nodo = %s
                RETURNING id_nodo, nome_nodo, descrizione, posizione,
                          data_registrazione, ultimo_messaggio, attivo, configurazione
                """,
                (
                    nodo.nome_nodo, nodo.descrizione, nodo.posizione,
                    json.dumps(nodo.configurazione) if nodo.configurazione else None,
                    id_nodo
                )
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Nodo '{id_nodo}' non trovato")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore aggiornamento nodo: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.delete("/api/admin/nodi/{id_nodo}", response_model=MessageResponse, tags=["Admin - Nodi"])
async def delete_nodo(
    id_nodo: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Disattiva un nodo (soft delete, solo admin).
    Le arnie e le letture associate vengono mantenute.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "UPDATE nodi SET attivo = false WHERE id_nodo = %s RETURNING id_nodo",
                (id_nodo,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Nodo '{id_nodo}' non trovato")
            return {"message": f"Nodo '{id_nodo}' disattivato con successo"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore disattivazione nodo: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


# ============================================
# ENDPOINT ADMIN - ARNIE (crud completo)
# ============================================

@app.get("/api/admin/arnie/{id_arnia}", response_model=ArniaConStato, tags=["Admin - Arnie"])
async def get_arnia_admin(
    id_arnia: int,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Dettagli di una singola arnia con ultimo stato (solo admin).
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM v_arnie_stato WHERE id_arnia = %s", (id_arnia,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Arnia non trovata")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore recupero arnia: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.put("/api/admin/arnie/{id_arnia}", response_model=ArniaResponse, tags=["Admin - Arnie"])
async def update_arnia_admin(
    id_arnia: int,
    arnia: ArniaUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Aggiorna una arnia (solo admin).
    """
    try:
        import json
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                UPDATE arnie
                SET nome_arnia  = COALESCE(%s, nome_arnia),
                    descrizione = COALESCE(%s, descrizione),
                    posizione   = COALESCE(%s, posizione),
                    latitudine  = COALESCE(%s, latitudine),
                    longitudine = COALESCE(%s, longitudine),
                    attiva      = COALESCE(%s, attiva),
                    metadati    = COALESCE(%s, metadati)
                WHERE id_arnia = %s
                RETURNING id_arnia, id_nodo, id_sensore_fisico, nome_arnia, descrizione,
                          posizione, latitudine, longitudine, data_installazione, data_rimozione,
                          attiva, metadati
                """,
                (
                    arnia.nome_arnia, arnia.descrizione, arnia.posizione,
                    arnia.latitudine, arnia.longitudine, arnia.attiva,
                    json.dumps(arnia.metadati) if arnia.metadati else None,
                    id_arnia
                )
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Arnia non trovata")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore aggiornamento arnia: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.delete("/api/admin/arnie/{id_arnia}", response_model=MessageResponse, tags=["Admin - Arnie"])
async def delete_arnia(
    id_arnia: int,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Disattiva un'arnia (soft delete, solo admin).
    Le letture storiche vengono mantenute.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                UPDATE arnie
                SET attiva = false, data_rimozione = CURRENT_TIMESTAMP
                WHERE id_arnia = %s
                RETURNING id_arnia
                """,
                (id_arnia,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Arnia non trovata")
            return {"message": f"Arnia {id_arnia} disattivata con successo"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore disattivazione arnia: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.delete("/api/admin/utenti-arnie", response_model=MessageResponse, tags=["Admin - Utenti"])
async def remove_user_arnia(
    id_utente: int,
    id_arnia: int,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Rimuove l'associazione tra un utente e un'arnia (solo admin).
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                UPDATE utenti_arnie
                SET attivo = false, data_disassociazione = CURRENT_TIMESTAMP
                WHERE id_utente = %s AND id_arnia = %s AND attivo = true
                RETURNING id
                """,
                (id_utente, id_arnia)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Associazione non trovata o già rimossa")
            return {"message": f"Associazione utente {id_utente} - arnia {id_arnia} rimossa"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore rimozione associazione: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.delete("/api/admin/utenti/{id_utente}", response_model=MessageResponse, tags=["Admin - Utenti"])
async def delete_user(
    id_utente: int,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Disattiva un utente (soft delete, solo admin).
    Non è possibile disattivare se stessi.
    """
    try:
        if id_utente == current_user["id_utente"]:
            raise HTTPException(status_code=400, detail="Non puoi disattivare te stesso")
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                UPDATE utenti
                SET attivo = false, data_disattivazione = CURRENT_TIMESTAMP
                WHERE id_utente = %s
                RETURNING id_utente
                """,
                (id_utente,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Utente non trovato")
            return {"message": f"Utente {id_utente} disattivato con successo"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore disattivazione utente: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.put("/api/admin/utenti/{id_utente}/password", response_model=MessageResponse, tags=["Admin - Utenti"])
async def reset_user_password(
    id_utente: int,
    body: PasswordChange,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Reset password di un utente (solo admin).
    """
    try:
        import bcrypt
        hashed = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
        with get_db_cursor() as cursor:
            cursor.execute(
                "UPDATE utenti SET password_hash = %s WHERE id_utente = %s RETURNING id_utente",
                (hashed, id_utente)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Utente non trovato")
        return {"message": "Password aggiornata con successo"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore reset password: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


# ============================================
# ENDPOINT USER - ARNIE (update permesso write)
# ============================================

@app.get("/api/user/arnie/{id_arnia}", response_model=ArniaConStato, tags=["Utente"])
async def get_arnia_user(
    id_arnia: int,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Dettagli di una singola arnia con ultimo stato.
    """
    if not check_user_arnia_access(current_user["id_utente"], id_arnia, "read"):
        raise HTTPException(status_code=403, detail="Non hai accesso a questa arnia")
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM v_arnie_stato WHERE id_arnia = %s", (id_arnia,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Arnia non trovata")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore recupero arnia: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.put("/api/user/arnie/{id_arnia}", response_model=ArniaResponse, tags=["Utente"])
async def update_arnia_user(
    id_arnia: int,
    arnia: ArniaUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Aggiorna un'arnia (richiede permesso write o admin sull'arnia).
    Campi modificabili: nome, descrizione, posizione, coordinate, metadati.
    Non è possibile modificare attiva (usa admin per quello).
    """
    if not check_user_arnia_access(current_user["id_utente"], id_arnia, "write"):
        raise HTTPException(status_code=403, detail="Permessi insufficienti su questa arnia")
    try:
        import json
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                UPDATE arnie
                SET nome_arnia  = COALESCE(%s, nome_arnia),
                    descrizione = COALESCE(%s, descrizione),
                    posizione   = COALESCE(%s, posizione),
                    latitudine  = COALESCE(%s, latitudine),
                    longitudine = COALESCE(%s, longitudine),
                    metadati    = COALESCE(%s, metadati)
                WHERE id_arnia = %s
                RETURNING id_arnia, id_nodo, id_sensore_fisico, nome_arnia, descrizione,
                          posizione, latitudine, longitudine, data_installazione, data_rimozione,
                          attiva, metadati
                """,
                (
                    arnia.nome_arnia, arnia.descrizione, arnia.posizione,
                    arnia.latitudine, arnia.longitudine,
                    json.dumps(arnia.metadati) if arnia.metadati else None,
                    id_arnia
                )
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Arnia non trovata")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore aggiornamento arnia: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.put("/api/user/password", response_model=MessageResponse, tags=["Utente"])
async def change_own_password(
    body: PasswordChange,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Cambia la propria password.
    """
    try:
        import bcrypt
        # Verifica password corrente
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Inserire la password attuale")
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT password_hash FROM utenti WHERE id_utente = %s",
                (current_user["id_utente"],)
            )
            row = cursor.fetchone()
            if not bcrypt.checkpw(body.current_password.encode(), row["password_hash"].encode()):
                raise HTTPException(status_code=400, detail="Password attuale non corretta")

            hashed = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
            cursor.execute(
                "UPDATE utenti SET password_hash = %s WHERE id_utente = %s",
                (hashed, current_user["id_utente"])
            )
        return {"message": "Password aggiornata con successo"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore cambio password: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")


@app.post("/api/admin/letture", response_model=LetturaResponse, tags=["Admin - Nodi"])
async def create_lettura_manuale(
    lettura: LetturaCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Inserisce una lettura manualmente (solo admin, utile per test e backfill).
    """
    try:
        import json
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO letture
                    (id_arnia, id_nodo, timestamp, temperatura, umidita, peso, dati_raw)
                VALUES (%s, %s, COALESCE(%s, CURRENT_TIMESTAMP), %s, %s, %s, %s)
                RETURNING id_lettura, id_arnia, id_nodo, timestamp,
                          temperatura, umidita, peso, dati_raw
                """,
                (
                    lettura.id_arnia, lettura.id_nodo, lettura.timestamp,
                    lettura.temperatura, lettura.umidita, lettura.peso,
                    json.dumps(lettura.dati_raw) if lettura.dati_raw else None
                )
            )
            return dict(cursor.fetchone())
    except Exception as e:
        logger.error(f"Errore inserimento lettura: {e}")
        raise HTTPException(status_code=500, detail="Errore interno del server")

# ============================================
# ENDPOINT INFO E HEALTH
# ============================================

@app.get("/", tags=["Info"])
async def root():
    """Endpoint root con informazioni API"""
    return {
        "name": settings.API_TITLE,
        "version": settings.API_VERSION,
        "description": settings.API_DESCRIPTION,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }


@app.get("/health", tags=["Info"])
async def health_check():
    """Health check endpoint"""
    try:
        # Verifica connessione database
        with get_db_cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
