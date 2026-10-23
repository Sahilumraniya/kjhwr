"""
Self-contained database seeder for January 2026 Elexon data.
Uses only Python standard library (no pip packages required).
"""
import sqlite3
import urllib.request
import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)
DB_PATH = DATA_DIR / "energy_data.db"

FUELHH_STREAM_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"
WINDFOR_STREAM_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"

def init_db():
    conn = sqlite3.connect(str(DB_PATH))
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

def fetch_json(url: str, timeout: int = 40):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (SeedScript/1.0)"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Fetch error for {url}: {e}")
    return []

def seed_actuals():
    print("[1/2] Fetching actual wind generation for January 2026 (FUELHH)...")
    url = f"{FUELHH_STREAM_URL}?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-31"
    raw = fetch_json(url)
    wind_items = [
        (
            item.get("startTime"),
            item.get("settlementDate"),
            item.get("settlementPeriod"),
            item.get("fuelType"),
            float(item.get("generation", 0.0)),
            item.get("publishTime")
        )
        for item in raw if item.get("fuelType") == "WIND"
    ]
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO actuals (start_time, settlement_date, settlement_period, fuel_type, generation, publish_time)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(start_time, fuel_type) DO UPDATE SET
            generation = excluded.generation,
            publish_time = excluded.publish_time,
            settlement_date = excluded.settlement_date,
            settlement_period = excluded.settlement_period;
    """, wind_items)
    conn.commit()
    conn.close()
    print(f"  -> Successfully stored {len(wind_items)} actual wind records.")

def seed_forecasts():
    print("[2/2] Fetching wind forecasts for purchase decisions in Jan 2026 (WINDFOR)...")
    # Date window: publish times from Dec 31, 2025 (day-ahead for Jan 1) through Jan 31, 2026
    start_dt = datetime(2025, 12, 31)
    end_dt = datetime(2026, 2, 1)
    
    total_forecasts = 0
    curr = start_dt
    chunk_days = 5
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    while curr < end_dt:
        next_dt = min(curr + timedelta(days=chunk_days), end_dt)
        f_str = curr.strftime("%Y-%m-%dT00:00:00Z")
        t_str = next_dt.strftime("%Y-%m-%dT23:59:59Z")
        print(f"  Fetching batch: {f_str} to {t_str}...")
        
        url = f"{WINDFOR_STREAM_URL}?publishDateTimeFrom={f_str}&publishDateTimeTo={t_str}"
        raw = fetch_json(url)
        
        batch = [
            (
                item.get("startTime"),
                item.get("publishTime"),
                float(item.get("generation", 0.0))
            )
            for item in raw if "startTime" in item and "publishTime" in item and "generation" in item
        ]
        
        if batch:
            cursor.executemany("""
                INSERT INTO forecasts (start_time, publish_time, generation)
                VALUES (?, ?, ?)
                ON CONFLICT(start_time, publish_time) DO UPDATE SET
                    generation = excluded.generation;
            """, batch)
            conn.commit()
            total_forecasts += len(batch)
            print(f"    Saved {len(batch)} forecast points.")
            
        curr = next_dt + timedelta(seconds=1)
        time.sleep(0.3)
        
    conn.close()
    print(f"  -> Successfully stored {total_forecasts} total forecast records.")

if __name__ == "__main__":
    t0 = time.time()
    print("--- Starting VoltIQ Elexon Data Seeding ---")
    init_db()
    seed_actuals()
    seed_forecasts()
    print(f"--- Seeding completed in {time.time()-t0:.2f} seconds. DB is ready at {DB_PATH} ---")
