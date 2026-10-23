import React from 'react';
import { Zap, Wind, Moon, Sun, Clock, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Navbar({
  selectedDate,
  setSelectedDate,
  cutoffHour,
  setCutoffHour,
  darkMode,
  setDarkMode,
  dbStatus,
  onSync,
  isSyncing
}) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  VoltIQ
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300/40 dark:border-sky-800">
                  GB Wholesale Day-Ahead
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Elexon BMRS Forecast Evaluation & Thermal Procurement
              </p>
            </div>
          </div>

          {/* Controls: Cutoff, Date, Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* Live Data Status Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Elexon BMRS Synced (Jan 2026)</span>
            </div>

            {/* Day-Ahead Cutoff Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium text-slate-600 dark:text-slate-300 hidden md:inline">Cutoff D-1:</span>
              <select
                value={cutoffHour}
                onChange={(e) => setCutoffHour(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                title="Select Day-Ahead Auction Cutoff Time"
              >
                <option value={9} className="dark:bg-slate-900">09:00 UTC (Early)</option>
                <option value={11} className="dark:bg-slate-900">11:00 UTC (EPEX Auction)</option>
                <option value={12} className="dark:bg-slate-900">12:00 UTC (N2EX Auction)</option>
                <option value={14} className="dark:bg-slate-900">14:00 UTC (Midday)</option>
                <option value={17} className="dark:bg-slate-900">17:00 UTC (Late D-1)</option>
              </select>
            </div>

            {/* Delivery Date Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium text-slate-600 dark:text-slate-300 hidden md:inline">Delivery Day:</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
