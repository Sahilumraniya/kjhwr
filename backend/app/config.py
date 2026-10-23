import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# Check if running in Vercel Serverless environment (read-only filesystem)
IS_VERCEL = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

ORIGINAL_DB_PATH = DATA_DIR / "energy_data.db"

if IS_VERCEL:
    # On Vercel / AWS Lambda, only /tmp is writable
    TMP_DIR = Path("/tmp")
    DB_PATH = TMP_DIR / "energy_data.db"
    # Copy pre-seeded database to /tmp if not already present
    if not DB_PATH.exists() and ORIGINAL_DB_PATH.exists():
        try:
            shutil.copyfile(ORIGINAL_DB_PATH, DB_PATH)
        except Exception as e:
            print(f"Warning: Failed to copy database to /tmp: {e}")
else:
    DATA_DIR.mkdir(exist_ok=True, parents=True)
    DB_PATH = ORIGINAL_DB_PATH

# Elexon API Endpoints
ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FUELHH_STREAM_URL = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_STREAM_URL = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

DEFAULT_CUTOFF_HOUR = 11
DEFAULT_CUTOFF_MINUTE = 0
DEFAULT_START_DATE = "2026-01-01"
DEFAULT_END_DATE = "2026-01-31"
