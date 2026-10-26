from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    gemini_api_key: str = ""
    admin_refresh_token: str = ""
    llm_model: str = "gemini-3.5-flash-lite"
    embedding_model: str = "gemini-embedding-2"
    embedding_dimensions: int = 768
    top_k: int = 6
    min_similarity: float = 0.34
    knowledge_path: Path = ROOT / "data" / "knowledge.json"
    index_path: Path = ROOT / "storage" / "knowledge.faiss"
    metadata_path: Path = ROOT / "storage" / "knowledge-index.json"


settings = Settings()
