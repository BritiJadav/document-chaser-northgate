import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Northgate Bank Document Chaser Copilot"
    VERSION: str = "2.4.0-enterprise"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # GCP Lab Constraints & Configuration
    GCP_PROJECT_ID: str = os.getenv("GOOGLE_CLOUD_PROJECT", os.getenv("GCP_PROJECT_ID", ""))
    GCP_REGION: str = os.getenv("GCP_REGION", "asia-south1")  # Lab restriction: asia-south1
    USE_VERTEX_AI: bool = os.getenv("USE_VERTEX_AI", "false").lower() in ("true", "1", "yes")

    # Official Gemini SDK Configuration
    # Lab Approved Model: Gemini 3 Flash Preview (gemini-3-flash-preview)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    
    # CORS Origins (allow all in dev/demo or configured origins)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # SQLite Database File Path (stored in /tmp on Cloud Run for writable ephemeral storage)
    DB_PATH: str = os.getenv("DB_PATH", "document_chaser.db")
    
    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()
