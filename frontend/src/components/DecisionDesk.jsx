import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';

export default function DecisionDesk({ comparisonData, selectedDate, cutoffHour, darkMode }) {
  const [filterType, setFilterType] = useState('ALL'); // ALL, SHORTFALL, SURPLUS

  const chartData = useMemo(() => {
    if (!comparisonData?.data) return [];
    return comparisonData.data.map((item) => {
      const timeStr = item.startTime ? item.startTime.split('T')[1].substring(0, 5) : `SP ${item.settlementPeriod}`;
      return {
        ...item,
        time: timeStr,
        delta: item.errorMW,
        actual: item.actualGeneration,
        forecast: item.forecastGeneration
      };
    });
  }, [comparisonData]);

  const summaryStats = useMemo(() => {
    if (!chartData.length) return null;
    let totalAct = 0;
    let totalFc = 0;
    let maxError = 0;
    let shortfallPeriods = 0;

    chartData.forEach((d) => {
      totalAct += d.actual || 0;
      totalFc += d.forecast || 0;
      const absErr = Math.abs(d.errorMW || 0);
      if (absErr > maxError) maxError = absErr;
      if (d.errorMW > 100) shortfallPeriods++; // Forecast was higher than actual -> utility is short!
    });

    const dayBias = (totalFc - totalAct) / chartData.length;
    const avgMAE = chartData.reduce((acc, curr) => acc + (curr.absErrorMW || 0), 0) / chartData.length;

    return {
      totalActualGWh: (totalAct * 0.5 / 1000).toFixed(1),
      totalForecastGWh: (totalFc * 0.5 / 1000).toFixed(1),
      dayBiasMW: dayBias.toFixed(1),
      dayMAEMW: avgMAE.toFixed(1),
      maxErrorMW: maxError.toFixed(0),
      shortfallPeriods,
      cutoffTime: comparisonData?.data[0]?.cutoffTimeUsed || ''
    };
  }, [chartData, comparisonData]);

  const filteredTableData = useMemo(() => {
    if (!chartData.length) return [];
    if (filterType === 'SHORTFALL') {
      return chartData.filter((d) => d.errorMW > 0).sort((a, b) => b.errorMW - a.errorMW);
    }
    if (filterType === 'SURPLUS') {
      return chartData.filter((d) => d.errorMW < 0).sort((a, b) => a.errorMW - b.errorMW);
    }
    return chartData;
  }, [chartData, filterType]);

  if (!comparisonData || !chartData.length) {
    return (
      <div className="flex items-center justify-center p-12 glass-panel">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-slate-500">Loading Day-Ahead market forecasts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Context Card */}
      <div className="glass-panel p-5 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border-sky-200 dark:border-sky-900/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                Decision Vintage
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Delivery Date: <strong className="text-slate-800 dark:text-slate-200">{selectedDate}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Latest Renewable Generation Forecast at Day-Ahead Gate Closure
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Reflects the most recent WINDFOR stream published prior to <strong>{cutoffHour}:00 UTC on Day D-1</strong> for EPEX/N2EX auction bidding.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Actual Wind Vol</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{summaryStats?.totalActualGWh} GWh</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Day Bias</span>
              <span className={`text-lg font-bold flex items-center ${Number(summaryStats?.dayBiasMW) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {Number(summaryStats?.dayBiasMW) > 0 ? '+' : ''}{summaryStats?.dayBiasMW} MW
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-500" />
              Actual Generation vs Latest Day-Ahead Forecast (48 Settlement Periods)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Half-hourly comparison (00:00 to 24:00 UTC). Shaded divergence highlights power over/under forecast.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Actual Wind (FUELHH)
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Day-Ahead Forecast (WINDFOR)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#e2e8f0'} />
              <XAxis
                dataKey="time"
                stroke={darkMode ? '#94a3b8' : '#64748b'}
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke={darkMode ? '#94a3b8' : '#64748b'}
                fontSize={11}
                tickLine={false}
                unit=" MW"
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="custom-chart-tooltip">
                        <div className="font-semibold text-xs border-b border-slate-700 pb-1 mb-1">
                          Period {data.settlementPeriod} ({data.time} UTC)
                        </div>
                        <div className="flex justify-between gap-4 text-xs">
                          <span className="text-sky-400">Actual Generation:</span>
                          <span className="font-bold">{data.actualGeneration?.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs">
                          <span className="text-amber-400">Day-Ahead Forecast:</span>
                          <span className="font-bold">{data.forecastGeneration?.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs pt-1 border-t border-slate-700 mt-1">
                          <span className="text-slate-300">Forecast Error (Δ):</span>
                          <span className={`font-bold ${data.errorMW > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {data.errorMW > 0 ? '+' : ''}{data.errorMW?.toLocaleString()} MW ({data.percentageError}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 italic">
                          {data.isOverforecast ? '⚠️ Overforecast: Shortfall risk in balancing' : '✅ Underforecast: Surplus wind'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Shaded Area for actual */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Wind"
                fill="url(#colorActual)"
                stroke="#0ea5e9"
                strokeWidth={2.5}
              />
              {/* Line for day-ahead forecast */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecasted Wind"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Granular Settlement Period Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Half-Hourly Settlement Schedule ({comparisonData.deliveryDate})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed breakdown of all 48 UK settlement periods and procurement implications.
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All (48)
            </button>
            <button
              onClick={() => setFilterType('SHORTFALL')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                filterType === 'SHORTFALL'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Over-Forecasted (Short Risk)
            </button>
            <button
              onClick={() => setFilterType('SURPLUS')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                filterType === 'SURPLUS'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              Under-Forecasted (Surplus)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-850/80 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4">Time (UTC)</th>
                <th className="py-2.5 px-4 text-right">Actual (MW)</th>
                <th className="py-2.5 px-4 text-right">Forecast (MW)</th>
                <th className="py-2.5 px-4 text-right">Error (Δ MW)</th>
                <th className="py-2.5 px-4 text-right">Error (%)</th>
                <th className="py-2.5 px-4">Trading Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {filteredTableData.map((row) => (
                <tr
                  key={row.settlementPeriod}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-2 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    SP {row.settlementPeriod}
                  </td>
                  <td className="py-2 px-4 text-slate-500 dark:text-slate-400">{row.time}</td>
                  <td className="py-2 px-4 text-right font-medium text-sky-600 dark:text-sky-400">
                    {row.actualGeneration?.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                    {row.forecastGeneration?.toLocaleString()}
                  </td>
                  <td className={`py-2 px-4 text-right font-bold ${row.errorMW > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {row.errorMW > 0 ? `+${row.errorMW}` : row.errorMW}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-500">{row.percentageError}%</td>
                  <td className="py-2 px-4 font-sans">
                    {row.errorMW > 150 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <ArrowUpRight className="w-3 h-3" /> Shortfall Risk (Cashout penalty)
                      </span>
                    ) : row.errorMW < -150 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <ArrowDownRight className="w-3 h-3" /> Surplus Wind (Spill / low sell)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Balanced (±150 MW)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
