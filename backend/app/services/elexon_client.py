import json
import logging
import urllib.request
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ..config import FUELHH_STREAM_URL, WINDFOR_STREAM_URL
from ..database import upsert_actuals, upsert_forecasts, get_actual_count, get_forecast_count

logger = logging.getLogger(__name__)

def fetch_json(url: str, timeout: int = 30) -> List[Dict[str, Any]]:
    req = urllib.request.Request(url, headers={"User-Agent": "EnergyUtilityTradingApp/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                content = response.read().decode("utf-8")
                return json.loads(content)
            else:
                logger.error(f"HTTP error {response.status} from {url}")
                return []
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {e}")
        return []

def sync_actual_generation(start_date: str = "2026-01-01", end_date: str = "2026-01-31") -> int:
    """
    Fetches FUELHH actuals from Elexon BMRS API and filters for WIND.
    """
    url = f"{FUELHH_STREAM_URL}?settlementDateFrom={start_date}&settlementDateTo={end_date}"
    logger.info(f"Syncing actual generation from {url}...")
    raw_data = fetch_json(url, timeout=45)
    
    wind_records = []
    for item in raw_data:
        if item.get("fuelType") == "WIND":
            wind_records.append({
                "start_time": item.get("startTime"),
                "settlement_date": item.get("settlementDate"),
                "settlement_period": item.get("settlementPeriod"),
                "fuel_type": item.get("fuelType"),
                "generation": float(item.get("generation", 0.0)),
                "publish_time": item.get("publishTime")
            })
            
    if wind_records:
        upsert_actuals(wind_records)
        logger.info(f"Successfully upserted {len(wind_records)} actual wind records.")
    return len(wind_records)

def sync_forecast_generation(start_date: str = "2025-12-31", end_date: str = "2026-02-01", chunk_days: int = 7) -> int:
    """
    Fetches WINDFOR forecast streams in multi-day chunks to avoid query timeouts.
    """
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    
    current_dt = start_dt
    total_records = 0
    
    while current_dt < end_dt:
        next_dt = min(current_dt + timedelta(days=chunk_days), end_dt)
        from_str = current_dt.strftime("%Y-%m-%dT00:00:00Z")
        to_str = next_dt.strftime("%Y-%m-%dT23:59:59Z")
        
        url = f"{WINDFOR_STREAM_URL}?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
        logger.info(f"Fetching forecast batch from {from_str} to {to_str}...")
        
        raw_data = fetch_json(url, timeout=45)
        batch_records = []
        for item in raw_data:
            if "startTime" in item and "publishTime" in item and "generation" in item:
                batch_records.append({
                    "start_time": item.get("startTime"),
                    "publish_time": item.get("publishTime"),
                    "generation": float(item.get("generation", 0.0))
                })
                
        if batch_records:
            upsert_forecasts(batch_records)
            total_records += len(batch_records)
            logger.info(f"Saved batch of {len(batch_records)} forecasts.")
            
        current_dt = next_dt + timedelta(seconds=1)
        
    return total_records

def ensure_data_seeded():
    """
    Checks if database has records; if not or if incomplete, runs the sync.
    """
    actual_count = get_actual_count()
    forecast_count = get_forecast_count()
    logger.info(f"Initial DB check - Actuals: {actual_count}, Forecasts: {forecast_count}")
    
    if actual_count < 1400:
        logger.info("Actuals dataset missing or incomplete. Syncing January 2026 actuals...")
        sync_actual_generation("2026-01-01", "2026-01-31")
        
    if forecast_count < 5000:
        logger.info("Forecast dataset missing or incomplete. Syncing January 2026 forecasts...")
        sync_forecast_generation("2025-12-31", "2026-02-01", chunk_days=5)
