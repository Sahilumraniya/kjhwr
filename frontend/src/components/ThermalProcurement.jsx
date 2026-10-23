import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Flame,
  Wind,
  ShieldCheck,
  Coins,
  Sliders,
  DollarSign,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

export default function ThermalProcurement({ selectedDate, cutoffHour, darkMode }) {
  const [baseDemand, setBaseDemand] = useState(25000);
  const [confidenceLevel, setConfidenceLevel] = useState('P90');
  const [dayAheadPrice, setDayAheadPrice] = useState(75);
  const [cashoutPrice, setCashoutPrice] = useState(130);
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [selectedDate, cutoffHour, baseDemand, confidenceLevel, dayAheadPrice, cashoutPrice]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/procurement/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryDate: selectedDate,
          baseDemandMW: Number(baseDemand),
          confidenceLevel,
          imbalancePriceGBP: Number(cashoutPrice),
          dayAheadPriceGBP: Number(dayAheadPrice),
          cutoffHour: Number(cutoffHour)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPlanData(data);
      }
    } catch (e) {
      console.error('Failed to calculate procurement plan:', e);
    } finally {
      setLoading(false);
    }
  };

  const summary = planData?.summary || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-200 dark:border-amber-900/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Procurement Decision Support
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Delivery: <strong className="text-slate-800 dark:text-slate-200">{selectedDate}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Thermal Power Day-Ahead Procurement & Risk Hedging Planner
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Calculates how much thermal generation to procure beyond renewable wind, incorporating quantified forecast downside risk ({confidenceLevel}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Thermal Needed</span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {summary.totalThermalProcuredMWh ? (summary.totalThermalProcuredMWh / 1000).toFixed(1) : '--'} GWh
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Estimated Savings</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                £{summary.estimatedAvoidedImbalanceCostGBP ? (summary.estimatedAvoidedImbalanceCostGBP / 1000).toFixed(0) : '0'}k
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Consumer Demand Slider */}
        <div className="glass-card p-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Consumer Demand (MW)</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">{baseDemand.toLocaleString()} MW</span>
          </label>
          <input
            type="range"
            min="10000"
            max="40000"
            step="1000"
            value={baseDemand}
            onChange={(e) => setBaseDemand(Number(e.target.value))}
            className="w-full mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">UK average winter peak ~35GW</span>
        </div>

        {/* Risk Buffer Selector */}
        <div className="glass-card p-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Downside Wind Risk Policy
          </label>
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold p-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="P90">P90 Safety Envelope (Conservative)</option>
            <option value="MAE">MAE Buffer (Moderate)</option>
            <option value="P50">P50 Neutral (Aggressive, No Buffer)</option>
          </select>
          <span className="text-[10px] text-slate-400 mt-1 block">Protects against wind drops</span>
        </div>

        {/* Day-Ahead Power Price */}
        <div className="glass-card p-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Day-Ahead Price (£/MWh)</span>
            <span className="font-bold">£{dayAheadPrice}</span>
          </label>
          <input
            type="range"
            min="40"
            max="180"
            step="5"
            value={dayAheadPrice}
            onChange={(e) => setDayAheadPrice(Number(e.target.value))}
            className="w-full mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Wholesale auction clearing price</span>
        </div>

        {/* Cash-out Imbalance Price */}
        <div className="glass-card p-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Cash-Out Penalty (£/MWh)</span>
            <span className="font-bold text-rose-500">£{cashoutPrice}</span>
          </label>
          <input
            type="range"
            min="80"
            max="350"
            step="10"
            value={cashoutPrice}
            onChange={(e) => setCashoutPrice(Number(e.target.value))}
            className="w-full mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">System Buy Price (Elexon Cashout)</span>
        </div>
      </div>

      {/* Main Procurement Stack Chart */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Day-Ahead Power Procurement Stack (48 Settlement Periods)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualizes consumer demand covered by Wind, Base Thermal, and {confidenceLevel} Risk Reserve Buffer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Expected Wind
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Net Thermal Needed
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Risk Buffer ({confidenceLevel})
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={planData?.periods || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#e2e8f0'} />
              <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} unit=" MW" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="custom-chart-tooltip">
                        <div className="font-semibold text-xs border-b border-slate-700 pb-1 mb-1">
                          Period {d.settlementPeriod} ({d.time} UTC)
                        </div>
                        <div className="flex justify-between gap-4 text-xs">
                          <span className="text-slate-300">Consumer Demand:</span>
                          <span className="font-bold">{d.consumerDemandMW?.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs">
                          <span className="text-emerald-400">Wind Forecast:</span>
                          <span className="font-bold">{d.windForecastMW?.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs">
                          <span className="text-amber-400">Base Thermal Needed:</span>
                          <span className="font-bold">{d.netThermalBaseMW?.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs">
                          <span className="text-rose-400">Risk Buffer ({confidenceLevel}):</span>
                          <span className="font-bold">+{d.reserveBufferMW?.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs pt-1 border-t border-slate-700 mt-1 font-bold">
                          <span className="text-sky-300">Total Purchase Target:</span>
                          <span>{d.totalProcurementTargetMW?.toLocaleString()} MW</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="windForecastMW" stackId="1" name="Wind Generation" fill="#10b981" stroke="#059669" opacity={0.8} />
              <Area type="monotone" dataKey="netThermalBaseMW" stackId="1" name="Net Thermal Power" fill="#f59e0b" stroke="#d97706" opacity={0.8} />
              <Area type="monotone" dataKey="reserveBufferMW" stackId="1" name="Reserve Buffer" fill="#f43f5e" stroke="#e11d48" opacity={0.7} />
              <Line type="monotone" dataKey="consumerDemandMW" name="Consumer Demand" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="3 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision-Maker ROI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Wholesale Thermal Spend</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            £{summary.totalThermalProcuredMWh ? ((summary.totalThermalProcuredMWh * dayAheadPrice) / 1000000).toFixed(2) : '--'}M
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Procured at day-ahead rate (£{dayAheadPrice}/MWh)</p>
        </div>

        <div className="glass-card p-4 border-l-4 border-l-rose-500">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Downside Risk Exposure</div>
          <div className="text-xl font-bold text-rose-500 mt-1">
            {summary.totalReserveBufferMWh ? (summary.totalReserveBufferMWh / 1000).toFixed(1) : '--'} GWh
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Hedged reserve volume to prevent imbalance</p>
        </div>

        <div className="glass-card p-4 border-l-4 border-l-indigo-500">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Imbalance Savings via VoltIQ</div>
          <div className="text-xl font-bold text-emerald-500 mt-1">
            £{summary.estimatedAvoidedImbalanceCostGBP ? (summary.estimatedAvoidedImbalanceCostGBP / 1000).toFixed(1) : '--'}k
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Penalties avoided vs unhedged naive procurement</p>
        </div>
      </div>
    </div>
  );
}
