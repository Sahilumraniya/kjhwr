import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DecisionDesk from './components/DecisionDesk';
import AccuracySuite from './components/AccuracySuite';
import ThermalProcurement from './components/ThermalProcurement';
import FormulaKnowledgeBase from './components/FormulaKnowledgeBase';
import {
  Compass,
  LineChart,
  Flame,
  BookOpen,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [cutoffHour, setCutoffHour] = useState(11);
  const [activeTab, setActiveTab] = useState('DECISION_DESK'); // DECISION_DESK, ACCURACY, PROCUREMENT, KNOWLEDGE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('voltiq_theme') === 'dark' || true;
  });

  const [comparisonData, setComparisonData] = useState(null);
  const [metricsSummary, setMetricsSummary] = useState(null);
  const [diurnalData, setDiurnalData] = useState(null);
  const [errorDistribution, setErrorDistribution] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync dark mode class on documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('voltiq_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('voltiq_theme', 'light');
    }
  }, [darkMode]);

  // Fetch API data when selectedDate or cutoffHour changes
  useEffect(() => {
    loadAllData();
  }, [selectedDate, cutoffHour]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [compRes, summaryRes, diurnalRes, distRes, healthRes] = await Promise.all([
        fetch(`/api/forecast/comparison?delivery_date=${selectedDate}&cutoff_hour=${cutoffHour}`),
        fetch(`/api/metrics/summary?start_date=2026-01-01&end_date=2026-01-31&cutoff_hour=${cutoffHour}`),
        fetch(`/api/metrics/diurnal?start_date=2026-01-01&end_date=2026-01-31&cutoff_hour=${cutoffHour}`),
        fetch(`/api/metrics/distribution?start_date=2026-01-01&end_date=2026-01-31&cutoff_hour=${cutoffHour}`),
        fetch('/api/health')
      ]);

      if (compRes.ok) setComparisonData(await compRes.json());
      if (summaryRes.ok) setMetricsSummary(await summaryRes.json());
      if (diurnalRes.ok) setDiurnalData(await diurnalRes.json());
      if (distRes.ok) setErrorDistribution(await distRes.json());
      if (healthRes.ok) setDbStatus(await healthRes.json());
    } catch (err) {
      console.error('Failed to load API data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      setTimeout(() => {
        loadAllData();
        setIsSyncing(false);
      }, 3000);
    } catch (e) {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        cutoffHour={cutoffHour}
        setCutoffHour={setCutoffHour}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        dbStatus={dbStatus}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      {/* Primary Sub-Header Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('DECISION_DESK')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 transition-all ${
                activeTab === 'DECISION_DESK'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Day-Ahead Decision Desk</span>
            </button>

            <button
              onClick={() => setActiveTab('ACCURACY')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 transition-all ${
                activeTab === 'ACCURACY'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Quant Accuracy Suite</span>
            </button>

            <button
              onClick={() => setActiveTab('PROCUREMENT')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 transition-all ${
                activeTab === 'PROCUREMENT'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Thermal Procurement Planner</span>
            </button>

            <button
              onClick={() => setActiveTab('KNOWLEDGE')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 transition-all ${
                activeTab === 'KNOWLEDGE'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Formulas & Interview Q&A</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'DECISION_DESK' && (
          <DecisionDesk
            comparisonData={comparisonData}
            selectedDate={selectedDate}
            cutoffHour={cutoffHour}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'ACCURACY' && (
          <AccuracySuite
            metricsSummary={metricsSummary}
            diurnalData={diurnalData}
            errorDistribution={errorDistribution}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'PROCUREMENT' && (
          <ThermalProcurement
            selectedDate={selectedDate}
            cutoffHour={cutoffHour}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'KNOWLEDGE' && (
          <FormulaKnowledgeBase />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VoltIQ — Custom Day-Ahead Power Procurement Platform for UK Utilities</span>
          <span>Data Sources: Elexon BMRS FUELHH (Wind Actuals) & WINDFOR (Forecasts)</span>
        </div>
      </footer>
    </div>
  );
}
