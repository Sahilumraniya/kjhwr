import sqlite3
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from ..database import get_connection

def compute_day_ahead_cutoff(delivery_date_str: str, cutoff_hour: int = 11, cutoff_minute: int = 0) -> str:
    """
    Given a delivery date 'YYYY-MM-DD', returns the cutoff timestamp string in UTC
    for Day D-1 at cutoff_hour:cutoff_minute.
    Example: delivery_date='2026-01-05', cutoff=11:00 -> '2026-01-04T11:00:00Z'
    """
    delivery_date = datetime.strptime(delivery_date_str, "%Y-%m-%d")
    decision_date = delivery_date - timedelta(days=1)
    cutoff_dt = decision_date.replace(hour=cutoff_hour, minute=cutoff_minute, second=0, microsecond=0)
    return cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def get_comparison_for_date(delivery_date: str, cutoff_hour: int = 11, cutoff_minute: int = 0) -> List[Dict[str, Any]]:
    """
    Returns actual vs latest available forecast for all settlement periods of the given delivery date.
    """
    cutoff_time_str = compute_day_ahead_cutoff(delivery_date, cutoff_hour, cutoff_minute)
    conn = get_connection()
    
    # SQLite query using window function to get the latest forecast before cutoff_time
    query = """
    WITH latest_forecasts AS (
        SELECT 
            start_time,
            publish_time,
            generation AS forecast_generation,
            ROW_NUMBER() OVER (PARTITION BY start_time ORDER BY publish_time DESC) as rn
        FROM forecasts
        WHERE publish_time <= ?
          AND start_time >= ? || 'T00:00:00Z'
          AND start_time <= ? || 'T23:59:59Z'
    )
    SELECT 
        a.settlement_date,
        a.settlement_period,
        a.start_time,
        a.generation AS actual_generation,
        lf.forecast_generation,
        lf.publish_time AS forecast_publish_time
    FROM actuals a
    LEFT JOIN latest_forecasts lf 
        ON a.start_time = lf.start_time AND lf.rn = 1
    WHERE a.settlement_date = ?
      AND a.fuel_type = 'WIND'
    ORDER BY a.settlement_period ASC;
    """
    
    cursor = conn.cursor()
    cursor.execute(query, (cutoff_time_str, delivery_date, delivery_date, delivery_date))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        act = r["actual_generation"]
        fc = r["forecast_generation"] if r["forecast_generation"] is not None else act
        delta = (fc - act) if (fc is not None and act is not None) else 0.0
        pct_err = abs(delta) / act * 100.0 if (act and act > 1.0) else 0.0
        
        results.append({
            "settlementDate": r["settlement_date"],
            "settlementPeriod": r["settlement_period"],
            "startTime": r["start_time"],
            "actualGeneration": round(float(act), 1) if act is not None else None,
            "forecastGeneration": round(float(fc), 1) if fc is not None else None,
            "forecastPublishTime": r["forecast_publish_time"],
            "errorMW": round(float(delta), 1),
            "absErrorMW": round(abs(float(delta)), 1),
            "percentageError": round(pct_err, 2),
            "isOverforecast": delta > 0,
            "cutoffTimeUsed": cutoff_time_str
        })
    return results

def compute_metrics_for_range(
    start_date: str = "2026-01-01", 
    end_date: str = "2026-01-31", 
    cutoff_hour: int = 11, 
    cutoff_minute: int = 0
) -> Dict[str, Any]:
    """
    Computes comprehensive quant accuracy metrics across a date range:
    MAE, RMSE, WAPE, MAPE, Bias, Max Error, Correlation, P10/P50/P90.
    """
    conn = get_connection()
    
    # We query all dates in the range, getting each day's latest forecast at that day's cutoff
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    
    all_actuals = []
    all_forecasts = []
    all_deltas = []
    daily_stats = []
    
    curr = start_dt
    while curr <= end_dt:
        d_str = curr.strftime("%Y-%m-%d")
        day_records = get_comparison_for_date(d_str, cutoff_hour, cutoff_minute)
        
        day_act = []
        day_fc = []
        for rec in day_records:
            if rec["actualGeneration"] is not None and rec["forecastGeneration"] is not None:
                a = rec["actualGeneration"]
                f = rec["forecastGeneration"]
                all_actuals.append(a)
                all_forecasts.append(f)
                all_deltas.append(f - a)
                day_act.append(a)
                day_fc.append(f)
                
        if day_act:
            arr_act = np.array(day_act)
            arr_fc = np.array(day_fc)
            arr_err = arr_fc - arr_act
            d_mae = float(np.mean(np.abs(arr_err)))
            d_rmse = float(np.sqrt(np.mean(arr_err ** 2)))
            d_sum_act = float(np.sum(arr_act))
            d_wape = float(np.sum(np.abs(arr_err)) / d_sum_act * 100.0) if d_sum_act > 0 else 0.0
            daily_stats.append({
                "date": d_str,
                "mae": round(d_mae, 1),
                "rmse": round(d_rmse, 1),
                "wape": round(d_wape, 2),
                "bias": round(float(np.mean(arr_err)), 1),
                "avgActual": round(float(np.mean(arr_act)), 1),
                "avgForecast": round(float(np.mean(arr_fc)), 1)
            })
        curr += timedelta(days=1)
        
    conn.close()
    
    if not all_actuals:
        return {"error": "No matching data found for selected period."}
        
    arr_a = np.array(all_actuals)
    arr_f = np.array(all_forecasts)
    arr_err = arr_f - arr_a
    abs_err = np.abs(arr_err)
    
    mae = float(np.mean(abs_err))
    rmse = float(np.sqrt(np.mean(arr_err ** 2)))
    sum_actual = float(np.sum(arr_a))
    wape = float(np.sum(abs_err) / sum_actual * 100.0) if sum_actual > 0 else 0.0
    
    # Filter out near zero actuals for MAPE to avoid division explosion
    mask_nz = arr_a > 10.0
    mape = float(np.mean(abs_err[mask_nz] / arr_a[mask_nz]) * 100.0) if np.any(mask_nz) else 0.0
    
    bias = float(np.mean(arr_err))
    corr = float(np.corrcoef(arr_a, arr_f)[0, 1]) if len(arr_a) > 1 else 1.0
    
    p10 = float(np.percentile(arr_err, 10))
    p50 = float(np.percentile(arr_err, 50))
    p90 = float(np.percentile(arr_err, 90))
    
    max_over = float(np.max(arr_err))
    max_under = float(np.min(arr_err))
    
    return {
        "period": {"startDate": start_date, "endDate": end_date},
        "sampleSize": len(all_actuals),
        "cutoffHour": cutoff_hour,
        "kpis": {
            "mae": round(mae, 1),
            "rmse": round(rmse, 1),
            "wape": round(wape, 2),
            "mape": round(mape, 2),
            "bias": round(bias, 1),
            "correlation": round(corr, 4),
            "p10Error": round(p10, 1),
            "p50Error": round(p50, 1),
            "p90Error": round(p90, 1),
            "maxOverforecastMW": round(max_over, 1),
            "maxUnderforecastMW": round(max_under, 1),
            "avgActualMW": round(float(np.mean(arr_a)), 1),
            "avgForecastMW": round(float(np.mean(arr_f)), 1)
        },
        "dailyBreakdown": daily_stats
    }

def compute_diurnal_profile(start_date: str = "2026-01-01", end_date: str = "2026-01-31", cutoff_hour: int = 11) -> List[Dict[str, Any]]:
    """
    Computes average actual, forecast, MAE, and Bias by Settlement Period (1 to 48)
    across all days in January 2026.
    """
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    
    period_dict = {p: {"actuals": [], "forecasts": [], "errors": []} for p in range(1, 49)}
    
    curr = start_dt
    while curr <= end_dt:
        d_str = curr.strftime("%Y-%m-%d")
        day_records = get_comparison_for_date(d_str, cutoff_hour=cutoff_hour)
        for r in day_records:
            p = r["settlementPeriod"]
            if p in period_dict and r["actualGeneration"] is not None and r["forecastGeneration"] is not None:
                period_dict[p]["actuals"].append(r["actualGeneration"])
                period_dict[p]["forecasts"].append(r["forecastGeneration"])
                period_dict[p]["errors"].append(r["forecastGeneration"] - r["actualGeneration"])
        curr += timedelta(days=1)
        
    diurnal_list = []
    for p in range(1, 49):
        acts = period_dict[p]["actuals"]
        fcs = period_dict[p]["forecasts"]
        errs = period_dict[p]["errors"]
        
        if acts:
            avg_act = float(np.mean(acts))
            avg_fc = float(np.mean(fcs))
            mae = float(np.mean(np.abs(errs)))
            bias = float(np.mean(errs))
            rmse = float(np.sqrt(np.mean(np.array(errs) ** 2)))
            # Hour of day string
            hour = (p - 1) // 2
            minute = 30 if (p % 2 == 0) else 0
            time_str = f"{hour:02d}:{minute:02d}"
            
            diurnal_list.append({
                "settlementPeriod": p,
                "time": time_str,
                "avgActualMW": round(avg_act, 1),
                "avgForecastMW": round(avg_fc, 1),
                "maeMW": round(mae, 1),
                "rmseMW": round(rmse, 1),
                "biasMW": round(bias, 1)
            })
    return diurnal_list

def compute_error_distribution(start_date: str = "2026-01-01", end_date: str = "2026-01-31", cutoff_hour: int = 11, bins_count: int = 20) -> Dict[str, Any]:
    """
    Computes a histogram of forecast errors (Forecast - Actual in MW) to visualize skewness and normality.
    """
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    
    all_errors = []
    curr = start_dt
    while curr <= end_dt:
        d_str = curr.strftime("%Y-%m-%d")
        recs = get_comparison_for_date(d_str, cutoff_hour=cutoff_hour)
        for r in recs:
            if r["actualGeneration"] is not None and r["forecastGeneration"] is not None:
                all_errors.append(r["forecastGeneration"] - r["actualGeneration"])
        curr += timedelta(days=1)
        
    if not all_errors:
        return {"bins": []}
        
    arr = np.array(all_errors)
    counts, bin_edges = np.histogram(arr, bins=bins_count)
    
    distribution = []
    for i in range(len(counts)):
        mid = (bin_edges[i] + bin_edges[i+1]) / 2.0
        distribution.append({
            "binRange": f"{int(bin_edges[i])} to {int(bin_edges[i+1])} MW",
            "binMidpoint": round(float(mid), 0),
            "count": int(counts[i]),
            "percentage": round(float(counts[i] / len(arr) * 100.0), 1)
        })
        
    return {
        "totalSamples": len(all_errors),
        "meanError": round(float(np.mean(arr)), 1),
        "stdDev": round(float(np.std(arr)), 1),
        "histogram": distribution
    }
