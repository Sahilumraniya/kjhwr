import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)

DB_PATH = DATA_DIR / "energy_data.db"

# Elexon API Endpoints
ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FUELHH_STREAM_URL = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_STREAM_URL = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

# Default Day-Ahead decision cutoff time on Day D-1 (in UTC)
# In the UK Day-Ahead power auction (EPEX SPOT / N2EX), gate closure is at 11:00 or 12:00 UTC.
DEFAULT_CUTOFF_HOUR = 11
DEFAULT_CUTOFF_MINUTE = 0

# Target scope: January 2026
DEFAULT_START_DATE = "2026-01-01"
DEFAULT_END_DATE = "2026-01-31"
