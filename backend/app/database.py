import os
import shutil
import sqlite3
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from .config import DB_PATH, ORIGINAL_DB_PATH, IS_VERCEL

logger = logging.getLogger(__name__)

def ensure_db_ready():
    """Ensure database exists in writable /tmp directory if in serverless environment"""
    if IS_VERCEL:
        if not DB_PATH.exists() and ORIGINAL_DB_PATH.exists():
            try:
                shutil.copyfile(ORIGINAL_DB_PATH, DB_PATH)
                logger.info(f"Copied pre-seeded DB from {ORIGINAL_DB_PATH} to {DB_PATH}")
            except Exception as e:
                logger.error(f"Error copying DB to /tmp: {e}")

def get_connection() -> sqlite3.Connection:
    ensure_db_ready()
    
    # If DB still doesn't exist at DB_PATH, try fallback to ORIGINAL_DB_PATH in read-only mode
    target_path = DB_PATH
    if not target_path.exists() and ORIGINAL_DB_PATH.exists():
        target_path = ORIGINAL_DB_PATH

    conn = sqlite3.connect(str(target_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
    except Exception as e:
        # WAL mode is not allowed on read-only environments; safely ignore
        pass
    return conn

def init_db():
    ensure_db_ready()
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actuals (
                start_time TEXT NOT NULL,
                settlement_date TEXT NOT NULL,
                settlement_period INTEGER NOT NULL,
                fuel_type TEXT NOT NULL,
                generation REAL NOT NULL,
                publish_time TEXT,
                PRIMARY KEY (start_time, fuel_type)
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS forecasts (
                start_time TEXT NOT NULL,
                publish_time TEXT NOT NULL,
                generation REAL NOT NULL,
                PRIMARY KEY (start_time, publish_time)
            );
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_actuals_date ON actuals(settlement_date, fuel_type);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_actuals_start ON actuals(start_time);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_start ON forecasts(start_time);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_publish ON forecasts(publish_time);")

        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"init_db skipped or read-only: {e}")

def upsert_actuals(records: List[Dict[str, Any]]) -> int:
    if not records:
        return 0
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.executemany("""
            INSERT INTO actuals (start_time, settlement_date, settlement_period, fuel_type, generation, publish_time)
            VALUES (:start_time, :settlement_date, :settlement_period, :fuel_type, :generation, :publish_time)
            ON CONFLICT(start_time, fuel_type) DO UPDATE SET
                generation = excluded.generation,
                publish_time = excluded.publish_time,
                settlement_date = excluded.settlement_date,
                settlement_period = excluded.settlement_period;
        """, records)
        conn.commit()
        count = cursor.rowcount
        conn.close()
        return count
    except Exception as e:
        logger.error(f"Failed to upsert actuals: {e}")
        return 0

def upsert_forecasts(records: List[Dict[str, Any]]) -> int:
    if not records:
        return 0
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.executemany("""
            INSERT INTO forecasts (start_time, publish_time, generation)
            VALUES (:start_time, :publish_time, :generation)
            ON CONFLICT(start_time, publish_time) DO UPDATE SET
                generation = excluded.generation;
        """, records)
        conn.commit()
        count = cursor.rowcount
        conn.close()
        return count
    except Exception as e:
        logger.error(f"Failed to upsert forecasts: {e}")
        return 0

def get_actual_count() -> int:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM actuals WHERE fuel_type = 'WIND';")
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        logger.error(f"Error querying actual count: {e}")
        return 0

def get_forecast_count() -> int:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM forecasts;")
        count = cursor.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        logger.error(f"Error querying forecast count: {e}")
        return 0
