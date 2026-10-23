import os
import sys
from pathlib import Path

# Add project root and backend to sys.path so modules can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from backend.app.main import app

# Vercel Serverless ASGI entry point
app = app
