from fastapi import APIRouter, Query, BackgroundTasks, HTTPException
from typing import Optional
from pydantic import BaseModel
from ..services.analytics_service import (
    get_comparison_for_date,
    compute_metrics_for_range,
    compute_diurnal_profile,
    compute_error_distribution
)
from ..services.procurement_service import calculate_thermal_procurement
from ..services.elexon_client import sync_actual_generation, sync_forecast_generation
from ..database import get_actual_count, get_forecast_count

router = APIRouter(prefix="/api")

class ProcurementRequest(BaseModel):
    deliveryDate: str = "2026-01-15"
    baseDemandMW: float = 25000.0
    confidenceLevel: str = "P90"
    imbalancePriceGBP: float = 120.0
    dayAheadPriceGBP: float = 75.0
    cutoffHour: int = 11

@router.get("/health")
def health_check():
    act_count = get_actual_count()
    fc_count = get_forecast_count()
    return {
        "status": "healthy",
        "service": "VoltIQ - UK Day-Ahead Wind Forecasting & Procurement Suite",
        "database": {
            "actualWindRecords": act_count,
            "forecastVintages": fc_count,
            "isReady": act_count > 1000 and fc_count > 3000
        }
    }

@router.get("/forecast/comparison")
def get_daily_comparison(
    delivery_date: str = Query("2026-01-15", regex=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59)
):
    try:
        data = get_comparison_for_date(delivery_date, cutoff_hour, cutoff_minute)
        return {
            "deliveryDate": delivery_date,
            "cutoffHour": cutoff_hour,
            "cutoffMinute": cutoff_minute,
            "periodsCount": len(data),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/summary")
def get_metrics_summary(
    start_date: str = Query("2026-01-01", regex=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query("2026-01-31", regex=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_hour: int = Query(11, ge=0, le=23)
):
    try:
        metrics = compute_metrics_for_range(start_date, end_date, cutoff_hour)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/diurnal")
def get_diurnal(
    start_date: str = Query("2026-01-01", regex=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query("2026-01-31", regex=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_hour: int = Query(11, ge=0, le=23)
):
    try:
        diurnal = compute_diurnal_profile(start_date, end_date, cutoff_hour)
        return {"data": diurnal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/distribution")
def get_distribution(
    start_date: str = Query("2026-01-01", regex=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query("2026-01-31", regex=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_hour: int = Query(11, ge=0, le=23)
):
    try:
        dist = compute_error_distribution(start_date, end_date, cutoff_hour)
        return dist
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/procurement/plan")
def plan_procurement(payload: ProcurementRequest):
    try:
        plan = calculate_thermal_procurement(
            delivery_date=payload.deliveryDate,
            base_demand_mw=payload.baseDemandMW,
            confidence_level=payload.confidenceLevel,
            imbalance_price_gbp=payload.imbalancePriceGBP,
            day_ahead_price_gbp=payload.dayAheadPriceGBP,
            cutoff_hour=payload.cutoffHour
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    def run_sync():
        sync_actual_generation("2026-01-01", "2026-01-31")
        sync_forecast_generation("2025-12-31", "2026-02-01", chunk_days=5)
        
    background_tasks.add_task(run_sync)
    return {"message": "Data synchronization started in background"}
