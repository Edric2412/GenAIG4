from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    CHROMA_DB_PATH: str = "./chroma_db"
    UPLOADS_DIR: str = "./uploads"
    DATABASE_URL: str = "sqlite:///./atlas_tutor.db"
    SECRET_KEY: str = "demo_secret_key_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    
    model_config = SettingsConfigDict(env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

settings = Settings()
