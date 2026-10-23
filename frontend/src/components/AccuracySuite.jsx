import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Activity,
  BarChart3,
  Percent,
  Compass,
  ShieldAlert,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function AccuracySuite({ metricsSummary, diurnalData, errorDistribution, darkMode }) {
  const [activeTab, setActiveTab] = useState('DIURNAL'); // DIURNAL, DISTRIBUTION, DAILY

  const kpis = metricsSummary?.kpis || {};

  return (
    <div className="space-y-6">
      {/* 6 Core KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* MAE */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">MAE</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.mae?.toLocaleString() || '--'} <span className="text-xs font-normal text-slate-500">MW</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Mean Absolute Error
          </p>
        </div>

        {/* RMSE */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">RMSE</span>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis.rmse?.toLocaleString() || '--'} <span className="text-xs font-normal text-slate-500">MW</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Penalizes tail misses
          </p>
        </div>

        {/* WAPE */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">WAPE</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {kpis.wape || '--'}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Weighted Error %
          </p>
        </div>

        {/* Bias */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Bias (MFE)</span>
            <Compass className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-black ${Number(kpis.bias) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {Number(kpis.bias) > 0 ? `+${kpis.bias}` : kpis.bias || '--'} <span className="text-xs font-normal text-slate-500">MW</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {Number(kpis.bias) > 0 ? 'Overpredicts wind' : 'Underpredicts wind'}
          </p>
        </div>

        {/* P90 Downside Risk */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">P90 Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500">
            {kpis.p90Error?.toLocaleString() || '--'} <span className="text-xs font-normal text-slate-500">MW</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            90% safety boundary
          </p>
        </div>

        {/* Correlation */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">R² Match</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {kpis.correlation ? (kpis.correlation ** 2).toFixed(3) : '--'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Forecast correlation
          </p>
        </div>
      </div>

      {/* Visual Analysis Container */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Quantitative Accuracy Diagnostics (January 2026)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated across 1,488 UK half-hourly settlement periods at 11:00 UTC day-ahead cutoff.
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('DIURNAL')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'DIURNAL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Diurnal Profile (SP 1–48)
            </button>
            <button
              onClick={() => setActiveTab('DISTRIBUTION')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'DISTRIBUTION'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Error Distribution
            </button>
            <button
              onClick={() => setActiveTab('DAILY')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'DAILY'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Daily MAE Trend
            </button>
          </div>
        </div>

        {/* Tab 1: Diurnal Profile */}
        {activeTab === 'DIURNAL' && (
          <div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={diurnalData?.data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  />
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
                              <span className="text-sky-400">Avg Actual Wind:</span>
                              <span className="font-bold">{d.avgActualMW?.toLocaleString()} MW</span>
                            </div>
                            <div className="flex justify-between gap-4 text-xs">
                              <span className="text-amber-400">Avg Forecast:</span>
                              <span className="font-bold">{d.avgForecastMW?.toLocaleString()} MW</span>
                            </div>
                            <div className="flex justify-between gap-4 text-xs pt-1 border-t border-slate-700 mt-1">
                              <span className="text-rose-400">Mean Absolute Error (MAE):</span>
                              <span className="font-bold">{d.maeMW?.toLocaleString()} MW</span>
                            </div>
                            <div className="flex justify-between gap-4 text-xs">
                              <span className="text-indigo-400">Bias:</span>
                              <span className="font-bold">{d.biasMW > 0 ? `+${d.biasMW}` : d.biasMW} MW</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="maeMW" name="MAE (MW)" fill="#f43f5e" opacity={0.7} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="avgActualMW" name="Avg Actual Wind" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="avgForecastMW" name="Avg Forecast" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="3 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              💡 <strong>Trading Insight</strong>: Morning ramp (SP 14–18, 07:00–09:00 UTC) and evening peak demand periods (SP 33–37, 16:30–18:30 UTC) exhibit higher MAE volatility due to atmospheric boundary layer transitions. Procurement teams should allocate wider reserve margins during these specific hours.
            </div>
          </div>
        )}

        {/* Tab 2: Error Distribution */}
        {activeTab === 'DISTRIBUTION' && (
          <div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorDistribution?.histogram || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#e2e8f0'} />
                  <XAxis
                    dataKey="binMidpoint"
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    tickLine={false}
                    unit=" MW"
                  />
                  <YAxis
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    tickLine={false}
                    unit=" pts"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="custom-chart-tooltip">
                            <div className="font-semibold text-xs border-b border-slate-700 pb-1 mb-1">
                              Bin: {d.binRange}
                            </div>
                            <div className="flex justify-between gap-4 text-xs">
                              <span className="text-sky-400">Occurrences:</span>
                              <span className="font-bold">{d.count} ({d.percentage}%)</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" name="Count of Half-Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Mean Error: <strong className="text-slate-800 dark:text-slate-200">{errorDistribution?.meanError} MW</strong></span>
              <span>Standard Deviation: <strong className="text-slate-800 dark:text-slate-200">{errorDistribution?.stdDev} MW</strong></span>
              <span>Sample Size: <strong className="text-slate-800 dark:text-slate-200">{errorDistribution?.totalSamples} periods</strong></span>
            </div>
          </div>
        )}

        {/* Tab 3: Daily MAE Trend */}
        {activeTab === 'DAILY' && (
          <div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={metricsSummary?.dailyBreakdown || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#e2e8f0'} />
                  <XAxis
                    dataKey="date"
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={10}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    tickLine={false}
                    unit=" MW"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="custom-chart-tooltip">
                            <div className="font-semibold text-xs border-b border-slate-700 pb-1 mb-1">
                              Date: {d.date}
                            </div>
                            <div className="flex justify-between gap-4 text-xs">
                              <span className="text-rose-400">Daily MAE:</span>
                              <span className="font-bold">{d.mae} MW</span>
                            </div>
                            <div className="flex justify-between gap-4 text-xs">
                              <span className="text-indigo-400">Daily RMSE:</span>
                              <span className="font-bold">{d.rmse} MW</span>
                            </div>
                            <div className="flex justify-between gap-4 text-xs">
                              <span className="text-emerald-400">Daily WAPE:</span>
                              <span className="font-bold">{d.wape}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="mae" name="Daily MAE (MW)" fill="#0ea5e9" opacity={0.8} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="rmse" name="Daily RMSE (MW)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Observes day-by-day forecast quality. Large spikes correlate with high-wind storm fronts or low-pressure troughs across Great Britain.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
