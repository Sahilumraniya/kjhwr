import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .services.elexon_client import ensure_data_seeded
from .api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("energy_app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema...")
    init_db()
    
    # In Vercel serverless, the DB is already pre-seeded in the git bundle
    # Avoid blocking cold starts with network requests
    if not os.environ.get("VERCEL"):
        try:
            ensure_data_seeded()
        except Exception as e:
            logger.warning(f"Background seed check encountered an issue: {e}")
    yield
    logger.info("Application shutting down...")

app = FastAPI(
    title="VoltIQ - UK Day-Ahead Wind Forecasting & Procurement Suite",
    description="Custom energy utility procurement platform for UK Day-Ahead electricity trading using Elexon BMRS FUELHH actuals & WINDFOR forecasts.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "message": "VoltIQ UK Day-Ahead Wind Forecasting API is online.",
        "documentation": "/docs",
        "health": "/api/health"
    }
