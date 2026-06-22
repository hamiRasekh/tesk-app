from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://void:void@localhost:5432/void_spirit"
    secret_key: str = "aveno-dev-secret-change-in-production"
    # 1 year — users stay signed in until logout or token expiry
    access_token_expire_minutes: int = 60 * 24 * 365
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"


settings = Settings()
