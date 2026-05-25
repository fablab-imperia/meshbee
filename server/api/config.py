"""
Configurazione dell'applicazione
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Impostazioni dell'applicazione"""
    
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "beehive_iot"
    DB_USER: str = "beehive_user"
    DB_PASSWORD: str = ""          # REQUIRED — imposta via variabile d'ambiente DB_PASSWORD

    # JWT
    JWT_SECRET_KEY: str = ""       # REQUIRED — genera con: openssl rand -hex 32
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # API
    API_TITLE: str = "Beehive IoT API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "API per gestione sistema IoT arnie"
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    
    @property
    def database_url(self) -> str:
        """Costruisce la URL del database"""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
