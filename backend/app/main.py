import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.models.db_models import init_db
from backend.app.api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database
    init_db()
    # Check if sample docs exist; if not, invoke generator
    if not os.path.exists(os.path.join(settings.SAMPLE_DOCS_DIR, "valid_company_pan.png")):
        try:
            from backend.scripts.generate_samples import main as gen_samples
            gen_samples()
        except Exception as e:
            print(f"Warning: could not auto-generate sample documents: {e}")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Autonomous Merchant KYC & Document Verification Copilot for Indian Fintech Onboarding (PAN + GST + Cheque)",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend (localhost:3000) and any local network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(api_router)

# Mount static directories for direct access to samples and uploaded documents
if os.path.exists(settings.SAMPLE_DOCS_DIR):
    app.mount("/static/sample_docs", StaticFiles(directory=settings.SAMPLE_DOCS_DIR), name="sample_docs")

if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "mock_mode": not bool(settings.GEMINI_API_KEY),
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "kyc-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
