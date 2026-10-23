import sqlite3
from typing import Optional, List, Dict, Any
from .config import DB_PATH

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    # Enable Write-Ahead Logging (WAL) for better concurrent read/write performance
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Actuals table for half-hourly generation
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

    # Forecasts table (multiple vintages per target start_time)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS forecasts (
            start_time TEXT NOT NULL,
            publish_time TEXT NOT NULL,
            generation REAL NOT NULL,
            PRIMARY KEY (start_time, publish_time)
        );
    """)

    # Indexes for fast lookup
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_actuals_date ON actuals(settlement_date, fuel_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_actuals_start ON actuals(start_time);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_start ON forecasts(start_time);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_publish ON forecasts(publish_time);")

    conn.commit()
    conn.close()

def upsert_actuals(records: List[Dict[str, Any]]) -> int:
    if not records:
        return 0
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

def upsert_forecasts(records: List[Dict[str, Any]]) -> int:
    if not records:
        return 0
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

def get_actual_count() -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM actuals WHERE fuel_type = 'WIND';")
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_forecast_count() -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM forecasts;")
    count = cursor.fetchone()[0]
    conn.close()
    return count
