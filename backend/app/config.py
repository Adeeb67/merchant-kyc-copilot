import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env from root or backend directory
root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
if os.path.exists(root_env):
    load_dotenv(root_env)
load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "Autonomous Merchant KYC Copilot"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # AI / LLM Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./kyc_audit.db")
    
    # Deterministic Stage 1 Thresholds
    BLUR_THRESHOLD: float = 100.0
    GLARE_RATIO_THRESHOLD: float = 0.15  # 15% of pixels exceeding brightness threshold
    GLARE_BRIGHTNESS_MIN: int = 248     # HSV Value
    GLARE_SATURATION_MAX: int = 25      # HSV Saturation
    BORDER_MARGIN_RATIO: float = 0.02   # 2% framing boundary
    
    # Stage 3 Rules Engine Thresholds
    FUZZY_NAME_SIMILARITY_THRESHOLD: float = 80.0 # 80% similarity threshold
    
    # Paths
    SAMPLE_DOCS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_docs")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.SAMPLE_DOCS_DIR, exist_ok=True)
