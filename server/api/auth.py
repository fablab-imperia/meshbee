"""
Autenticazione e gestione JWT
"""
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from config import settings
from database import get_db_cursor
from models import TokenData, UserResponse

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una password contro il suo hash bcrypt"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Errore verifica password: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Genera hash bcrypt di una password"""
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un JWT access token
    
    Args:
        data: Dati da includere nel token
        expires_delta: Durata del token (default: da config)
    
    Returns:
        Token JWT
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Crea un JWT refresh token
    
    Args:
        data: Dati da includere nel token
    
    Returns:
        Refresh token JWT
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict:
    """
    Decodifica un JWT token
    
    Args:
        token: Token JWT
    
    Returns:
        Payload del token
    
    Raises:
        JWTError: Se il token non è valido
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"Errore decodifica token: {e}")
        raise


def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """
    Autentica un utente
    
    Args:
        email: Email dell'utente
        password: Password in chiaro
    
    Returns:
        Dati utente se autenticazione riuscita, None altrimenti
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id_utente, email, password_hash, nome, cognome, ruolo, attivo
                FROM utenti
                WHERE email = %s
                """,
                (email,)
            )
            user = cursor.fetchone()
            
            if not user:
                return None
            
            if not user['attivo']:
                return None
            
            if not verify_password(password, user['password_hash']):
                return None
            
            # Aggiorna ultimo accesso
            cursor.execute(
                """
                UPDATE utenti 
                SET ultimo_accesso = CURRENT_TIMESTAMP 
                WHERE id_utente = %s
                """,
                (user['id_utente'],)
            )
            
            return user
    except Exception as e:
        logger.error(f"Errore autenticazione: {e}")
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """
    Dependency per ottenere l'utente corrente dal token JWT
    
    Args:
        credentials: Credenziali HTTP Bearer
    
    Returns:
        Dati dell'utente corrente
    
    Raises:
        HTTPException: Se il token non è valido o l'utente non esiste
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        
        # Verifica che sia un access token
        if payload.get("type") != "access":
            raise credentials_exception
        
        token_data = TokenData(email=email)
        
    except JWTError:
        raise credentials_exception
    
    # Recupera utente dal database
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id_utente, email, nome, cognome, ruolo, attivo,
                       data_creazione, data_attivazione, data_disattivazione, ultimo_accesso
                FROM utenti
                WHERE email = %s
                """,
                (token_data.email,)
            )
            user = cursor.fetchone()
            
            if user is None or not user['attivo']:
                raise credentials_exception
            
            return dict(user)
    except Exception as e:
        logger.error(f"Errore recupero utente: {e}")
        raise credentials_exception


async def get_current_active_user(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Dependency per verificare che l'utente sia attivo
    
    Args:
        current_user: Utente corrente
    
    Returns:
        Dati dell'utente se attivo
    
    Raises:
        HTTPException: Se l'utente non è attivo
    """
    if not current_user.get('attivo'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utente non attivo"
        )
    return current_user


async def get_current_admin_user(current_user: Dict = Depends(get_current_active_user)) -> Dict:
    """
    Dependency per verificare che l'utente sia admin
    
    Args:
        current_user: Utente corrente
    
    Returns:
        Dati dell'utente se admin
    
    Raises:
        HTTPException: Se l'utente non è admin
    """
    if current_user.get('ruolo') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti - richiesto ruolo admin"
        )
    return current_user


def check_user_arnia_access(id_utente: int, id_arnia: int, required_permission: str = "read") -> bool:
    """
    Verifica se un utente ha accesso a un'arnia
    
    Args:
        id_utente: ID dell'utente
        id_arnia: ID dell'arnia
        required_permission: Permesso richiesto (read, write, admin)
    
    Returns:
        True se l'utente ha accesso, False altrimenti
    """
    try:
        with get_db_cursor() as cursor:
            # Prima verifica se l'utente è admin
            cursor.execute(
                "SELECT ruolo FROM utenti WHERE id_utente = %s",
                (id_utente,)
            )
            user = cursor.fetchone()
            if user and user['ruolo'] == 'admin':
                return True
            
            # Altrimenti verifica l'associazione
            cursor.execute(
                """
                SELECT permessi FROM utenti_arnie
                WHERE id_utente = %s AND id_arnia = %s AND attivo = true
                """,
                (id_utente, id_arnia)
            )
            result = cursor.fetchone()
            
            if not result:
                return False
            
            # Mappa dei permessi (admin > write > read)
            permission_levels = {"read": 1, "write": 2, "admin": 3}
            user_level = permission_levels.get(result['permessi'], 0)
            required_level = permission_levels.get(required_permission, 0)
            
            return user_level >= required_level
    except Exception as e:
        logger.error(f"Errore verifica accesso arnia: {e}")
        return False
