"""
Modelli Pydantic per validazione e serializzazione
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


# ============================================
# Modelli Autenticazione
# ============================================

class UserLogin(BaseModel):
    """Dati per login utente"""
    email: str
    password: str


class Token(BaseModel):
    """Token di accesso"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Dati contenuti nel token"""
    email: Optional[str] = None
    id_utente: Optional[int] = None
    ruolo: Optional[str] = None


# ============================================
# Modelli Utente
# ============================================

class UserBase(BaseModel):
    """Base utente"""
    email: str  # str invece di EmailStr per supportare domini .local e interni
    nome: str
    cognome: str

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v):
        """Validazione email minimale: deve contenere @ e un dominio"""
        v = v.strip().lower()
        if '@' not in v:
            raise ValueError('Email non valida: manca @')
        local, _, domain = v.partition('@')
        if not local or not domain or '.' not in domain:
            raise ValueError('Email non valida: formato scorretto')
        return v


class UserCreate(UserBase):
    """Creazione utente"""
    password: str
    ruolo: str = "user"


class UserUpdate(BaseModel):
    """Aggiornamento utente"""
    email: Optional[str] = None
    nome: Optional[str] = None
    cognome: Optional[str] = None
    ruolo: Optional[str] = None
    attivo: Optional[bool] = None


class UserResponse(UserBase):
    """Risposta con dati utente"""
    id_utente: int
    ruolo: str
    data_creazione: datetime
    data_attivazione: Optional[datetime] = None
    data_disattivazione: Optional[datetime] = None
    ultimo_accesso: Optional[datetime] = None
    attivo: bool
    
    class Config:
        from_attributes = True


# ============================================
# Modelli Nodo
# ============================================

class NodoBase(BaseModel):
    """Base nodo"""
    id_nodo: str
    nome_nodo: Optional[str] = None
    descrizione: Optional[str] = None
    posizione: Optional[str] = None


class NodoCreate(NodoBase):
    """Creazione nodo"""
    configurazione: Optional[Dict[str, Any]] = None


class NodoResponse(NodoBase):
    """Risposta con dati nodo"""
    data_registrazione: datetime
    ultimo_messaggio: Optional[datetime] = None
    attivo: bool
    configurazione: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


# ============================================
# Modelli Arnia
# ============================================

class ArniaBase(BaseModel):
    """Base arnia"""
    id_nodo: str
    id_sensore_fisico: str
    nome_arnia: Optional[str] = None
    descrizione: Optional[str] = None
    posizione: Optional[str] = None
    latitudine: Optional[Decimal] = Field(None, ge=-90, le=90, description="Latitudine in formato DD, es: 45.464200")
    longitudine: Optional[Decimal] = Field(None, ge=-180, le=180, description="Longitudine in formato DD, es: 9.190000")


class ArniaCreate(ArniaBase):
    """Creazione arnia"""
    metadati: Optional[Dict[str, Any]] = None


class ArniaUpdate(BaseModel):
    """Aggiornamento arnia"""
    nome_arnia: Optional[str] = None
    descrizione: Optional[str] = None
    posizione: Optional[str] = None
    latitudine: Optional[Decimal] = Field(None, ge=-90, le=90, description="Latitudine in formato DD")
    longitudine: Optional[Decimal] = Field(None, ge=-180, le=180, description="Longitudine in formato DD")
    attiva: Optional[bool] = None
    metadati: Optional[Dict[str, Any]] = None


class ArniaResponse(ArniaBase):
    """Risposta con dati arnia"""
    id_arnia: int
    data_installazione: datetime
    data_rimozione: Optional[datetime] = None
    attiva: bool
    metadati: Optional[Dict[str, Any]] = None
    latitudine: Optional[Decimal] = None
    longitudine: Optional[Decimal] = None

    class Config:
        from_attributes = True


class ArniaConStato(ArniaResponse):
    """Arnia con ultime letture e coordinate"""
    ultima_temperatura: Optional[Decimal] = None
    ultima_umidita: Optional[Decimal] = None
    ultimo_peso: Optional[Decimal] = None
    ultimo_aggiornamento: Optional[datetime] = None
    latitudine: Optional[Decimal] = None
    longitudine: Optional[Decimal] = None


# ============================================
# Modelli Lettura
# ============================================

class LetturaBase(BaseModel):
    """Base lettura"""
    temperatura: Optional[Decimal] = None
    umidita: Optional[Decimal] = None
    peso: Optional[Decimal] = None
    
    @field_validator('temperatura')
    @classmethod
    def validate_temperatura(cls, v):
        if v is not None and (v < -50 or v > 100):
            raise ValueError('Temperatura deve essere tra -50 e 100°C')
        return v
    
    @field_validator('umidita')
    @classmethod
    def validate_umidita(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Umidità deve essere tra 0 e 100%')
        return v
    
    @field_validator('peso')
    @classmethod
    def validate_peso(cls, v):
        if v is not None and v < 0:
            raise ValueError('Peso deve essere positivo')
        return v


class LetturaCreate(LetturaBase):
    """Creazione lettura"""
    id_arnia: int
    id_nodo: str
    timestamp: Optional[datetime] = None
    dati_raw: Optional[Dict[str, Any]] = None


class LetturaResponse(LetturaBase):
    """Risposta con dati lettura"""
    id_lettura: int
    id_arnia: int
    id_nodo: str
    timestamp: datetime
    dati_raw: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class SerieTemperaturaResponse(BaseModel):
    """Risposta serie storica temperatura"""
    timestamp: datetime
    temperatura: Decimal

    class Config:
        from_attributes = True


class SerieUmiditaResponse(BaseModel):
    """Risposta serie storica umidita"""
    timestamp: datetime
    umidita: Decimal

    class Config:
        from_attributes = True


class SeriePesoResponse(BaseModel):
    """Risposta serie storica peso"""
    timestamp: datetime
    peso: Decimal

    class Config:
        from_attributes = True


# ============================================
# Modelli Attività
# ============================================

class AttivitaBase(BaseModel):
    """Base attività"""
    tipo_attivita: str
    descrizione: Optional[str] = None
    dati: Optional[Dict[str, Any]] = None


class AttivitaCreate(AttivitaBase):
    """Creazione attività"""
    id_arnia: int
    timestamp: Optional[datetime] = None


class AttivitaUpdate(BaseModel):
    """Aggiornamento attività"""
    tipo_attivita: Optional[str] = None
    descrizione: Optional[str] = None
    timestamp: Optional[datetime] = None
    dati: Optional[Dict[str, Any]] = None


class AttivitaResponse(AttivitaBase):
    """Risposta con dati attività"""
    id_log: int
    id_utente: Optional[int] = None
    id_arnia: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Modelli Associazione Utente-Arnia
# ============================================

class UtenteArniaCreate(BaseModel):
    """Associazione utente-arnia"""
    id_utente: int
    id_arnia: int
    permessi: str = "read"


class UtenteArniaResponse(BaseModel):
    """Risposta associazione"""
    id: int
    id_utente: int
    id_arnia: int
    data_associazione: datetime
    data_disassociazione: Optional[datetime] = None
    permessi: str
    attivo: bool
    
    class Config:
        from_attributes = True


# ============================================
# Modelli Response Generici
# ============================================

class MessageResponse(BaseModel):
    """Messaggio generico"""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Risposta errore"""
    error: str
    detail: Optional[str] = None
    code: Optional[int] = None



# ============================================
# Modelli Password
# ============================================

class PasswordChange(BaseModel):
    """Cambio password"""
    new_password: str = Field(min_length=8, description="Nuova password (minimo 8 caratteri)")
    current_password: Optional[str] = None  # Richiesta solo per cambio proprio


# ============================================
# Query Parameters
# ============================================

class LettureQueryParams(BaseModel):
    """Parametri per query letture"""
    data_inizio: Optional[datetime] = None
    data_fine: Optional[datetime] = None
    limit: int = Field(default=1000, ge=1, le=10000)
    offset: int = Field(default=0, ge=0)


class AttivitaQueryParams(BaseModel):
    """Parametri per query attività"""
    data_inizio: Optional[datetime] = None
    data_fine: Optional[datetime] = None
    tipo_attivita: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)
