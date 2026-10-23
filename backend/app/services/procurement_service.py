from typing import Dict, List, Any
import numpy as np
from .analytics_service import get_comparison_for_date

def calculate_thermal_procurement(
    delivery_date: str,
    base_demand_mw: float = 25000.0,
    confidence_level: str = "P90", # "P50", "P90", "MAE"
    imbalance_price_gbp: float = 120.0,
    day_ahead_price_gbp: float = 75.0,
    cutoff_hour: int = 11
) -> Dict[str, Any]:
    """
    Calculates thermal power procurement needs and risk-adjusted reserve margins
    for each settlement period of a delivery day.
    
    Formula:
      Gross Demand = Consumer Electricity Demand
      Wind Expected = Latest Day-Ahead Forecast Available at Cutoff
      Net Thermal Needed (Base) = max(0, Gross Demand - Wind Expected)
      Reserve Buffer = Wind Forecast Downside Uncertainty (based on P90 or MAE)
      Risk-Adjusted Thermal Target = Net Thermal Needed + Reserve Buffer
    """
    records = get_comparison_for_date(delivery_date, cutoff_hour=cutoff_hour)
    if not records:
        return {"error": f"No data found for {delivery_date}"}
        
    periods_plan = []
    total_net_thermal_mwh = 0.0
    total_wind_expected_mwh = 0.0
    total_reserve_buffer_mwh = 0.0
    total_actual_imbalance_cost_avoided = 0.0
    
    # Standard profile multiplier for typical UK half-hourly demand curve
    # (peaks during morning 07:30-09:30 and evening 17:00-19:30)
    def demand_shape(period: int) -> float:
        if 1 <= period <= 12: # 00:00 - 06:00 night low
            return 0.72
        elif 13 <= period <= 18: # 06:00 - 09:00 morning ramp
            return 1.05
        elif 19 <= period <= 32: # 09:00 - 16:00 day plateau
            return 0.98
        elif 33 <= period <= 38: # 16:30 - 19:00 evening peak
            return 1.18
        else: # 19:30 - 24:00 evening decline
            return 0.88
            
    for r in records:
        period = r["settlementPeriod"]
        time_str = r["startTime"].split("T")[1][:5]
        shaped_demand = round(base_demand_mw * demand_shape(period), 1)
        
        wind_fc = r["forecastGeneration"] if r["forecastGeneration"] is not None else 0.0
        wind_act = r["actualGeneration"] if r["actualGeneration"] is not None else wind_fc
        
        # Base net thermal power needed
        net_thermal_base = max(0.0, shaped_demand - wind_fc)
        
        # Risk buffer: if wind drops below forecast, how much extra thermal/flexibility do we need?
        # A conservative trader holds a reserve based on historical forecast uncertainty
        if confidence_level == "P90":
            # Buffer against 90th percentile downside miss (roughly ~15% of wind forecast in high wind)
            risk_buffer = max(200.0, round(wind_fc * 0.14, 1))
        elif confidence_level == "MAE":
            risk_buffer = max(150.0, round(wind_fc * 0.09, 1))
        else: # P50 / neutral
            risk_buffer = 0.0
            
        risk_adjusted_thermal = round(net_thermal_base + risk_buffer, 1)
        
        # In half-hour settlement, 1 MW for 30 minutes = 0.5 MWh
        total_net_thermal_mwh += (net_thermal_base * 0.5)
        total_wind_expected_mwh += (wind_fc * 0.5)
        total_reserve_buffer_mwh += (risk_buffer * 0.5)
        
        # If forecast over-predicted wind (wind_fc > wind_act), utility would have under-procured!
        shortfall_mw = max(0.0, wind_fc - wind_act)
        # Avoided cashout penalty: difference between imbalance price and day-ahead price
        penalty_avoided_gbp = shortfall_mw * 0.5 * max(0.0, imbalance_price_gbp - day_ahead_price_gbp)
        total_actual_imbalance_cost_avoided += penalty_avoided_gbp
        
        periods_plan.append({
            "settlementPeriod": period,
            "time": time_str,
            "consumerDemandMW": shaped_demand,
            "windForecastMW": wind_fc,
            "windActualMW": wind_act,
            "netThermalBaseMW": round(net_thermal_base, 1),
            "reserveBufferMW": risk_buffer,
            "totalProcurementTargetMW": risk_adjusted_thermal,
            "shortfallRiskMW": round(shortfall_mw, 1)
        })
        
    return {
        "deliveryDate": delivery_date,
        "baseDemandMW": base_demand_mw,
        "confidenceLevel": confidence_level,
        "summary": {
            "totalWindExpectedMWh": round(total_wind_expected_mwh, 1),
            "totalThermalProcuredMWh": round(total_net_thermal_mwh, 1),
            "totalReserveBufferMWh": round(total_reserve_buffer_mwh, 1),
            "estimatedAvoidedImbalanceCostGBP": round(total_actual_imbalance_cost_avoided, 2)
        },
        "periods": periods_plan
    }
