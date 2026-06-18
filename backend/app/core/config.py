"""
GA Parameter Explorer — Application Configuration
Uses pydantic-settings for environment-based config with sane defaults.
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PORT: int = 8765
    DB_PATH: str = './trading.db'
    MAX_UPLOAD_SIZE_MB: int = 500
    DATA_DIR: str = './data'

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

# Ensure the data directory exists at import time
os.makedirs(settings.DATA_DIR, exist_ok=True)
