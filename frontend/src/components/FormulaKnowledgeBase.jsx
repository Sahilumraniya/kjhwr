import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  MessageSquareQuote,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap
} from 'lucide-react';

export default function FormulaKnowledgeBase() {
  const [openFaq, setOpenFaq] = useState(0);

  const formulas = [
    {
      id: 'mae',
      name: 'MAE (Mean Absolute Error)',
      unit: 'Megawatts (MW)',
      math: 'MAE = (1 / N) * Σ |Forecast - Actual|',
      simpleExample: 'Period 1: Forecast 1,000 MW, Actual 900 MW -> Miss = 100 MW\nPeriod 2: Forecast 800 MW, Actual 850 MW -> Miss = 50 MW\nMAE = (100 + 50) / 2 = 75 MW',
      interviewExplanation: 'On average, our day-ahead forecast deviates from actual wind generation by 75 MW, treating over-predictions and under-predictions equally.',
      tradingImpact: 'Provides the baseline expected MW deviation for day-to-day wholesale hedging.'
    },
    {
      id: 'rmse',
      name: 'RMSE (Root Mean Square Error)',
      unit: 'Megawatts (MW)',
      math: 'RMSE = √ [ (1 / N) * Σ (Forecast - Actual)² ]',
      simpleExample: 'Period 1: Error = 100 MW (100² = 10,000)\nPeriod 2: Error = 50 MW (50² = 2,500)\nMean = 12,500 / 2 = 6,250 -> RMSE = √6,250 ≈ 79.1 MW',
      interviewExplanation: 'Because errors are squared before averaging, RMSE heavily penalizes large forecast misses. RMSE will always be greater than or equal to MAE; the larger the gap between RMSE and MAE, the more outlier forecast errors exist.',
      tradingImpact: 'Crucial for power systems! A single 2,000 MW surprise cannot be ramped by peaking plants in time, whereas ten 200 MW misses can easily be absorbed.'
    },
    {
      id: 'wape',
      name: 'WAPE (Weighted Absolute Percentage Error)',
      unit: 'Percentage (%)',
      math: 'WAPE = ( Σ |Forecast - Actual| / Σ Actual ) * 100%',
      simpleExample: 'Total Forecast Errors across 2 periods = 150 MW\nTotal Actual Wind generated = 1,750 MW\nWAPE = (150 / 1,750) * 100% = 8.57%',
      interviewExplanation: 'Why not standard MAPE? When wind drops to near zero (e.g. 5 MW) and forecast is 50 MW, standard MAPE is 900%, which destroys the average! WAPE weights the errors by volume, making it the industry gold standard for energy trading.',
      tradingImpact: 'Allows executives to evaluate forecast accuracy as a fair portfolio percentage without dividing by zero.'
    },
    {
      id: 'bias',
      name: 'Forecast Bias (Mean Forecast Error / MFE)',
      unit: 'Megawatts (MW)',
      math: 'Bias = (1 / N) * Σ (Forecast - Actual)',
      simpleExample: 'Period 1: +100 MW (Overforecast)\nPeriod 2: -50 MW (Underforecast)\nBias = (+100 - 50) / 2 = +25 MW',
      interviewExplanation: 'A positive bias (+MW) means the model systematically over-estimates wind output. A negative bias (-MW) means the model systematically under-estimates wind.',
      tradingImpact: 'If bias is positive, the trading desk will under-procure thermal power and be forced into the Balancing Mechanism to pay painful System Buy Price cashout penalties!'
    },
    {
      id: 'p90',
      name: 'P90 Downside Risk Envelope',
      unit: 'Megawatts (MW)',
      math: 'P90 = 10th percentile of (Actual - Forecast) distribution',
      simpleExample: 'Across 100 days of history, on 90 days the wind forecast was either exceeded or only missed by at most 350 MW.',
      interviewExplanation: '90% of the time, actual wind generation will exceed this conservative threshold. It represents the 1-in-10 downside stress scenario.',
      tradingImpact: 'Traders use P90 to size standby flexibility options, ensuring the utility stays 90% immune to severe imbalance spikes.'
    }
  ];

  const interviewQuestions = [
    {
      q: 'Why do Day-Ahead auction cutoff times matter in power markets?',
      a: 'In Great Britain, wholesale power is auctioned in day-ahead auctions (EPEX SPOT at 11:00 UTC and N2EX at 12:00 UTC). Once bids are submitted, power contracts are locked for delivery on Day D. Therefore, the trader cannot use future forecasts; they must make decisions using the latest forecast vintage published before the gate closure on Day D-1.'
    },
    {
      q: 'Why did you store multiple forecast vintages rather than just one?',
      a: 'Because weather forecasts update constantly throughout the day (Elexon publishes WINDFOR updates every few hours). To evaluate the actual decision a trader made, we need point-in-time accuracy: what was known at 11:00 UTC on Day D-1. Storing vintages with publishTime allows retro-testing different auction cutoffs.'
    },
    {
      q: 'What is the financial penalty of being "Short" vs "Long" in the UK electricity market?',
      a: 'If a utility under-procures thermal power (because wind generated less than forecasted), they are "Short". Elexon settles this imbalance at the System Buy Price (Cashout price), which can reach £300 to £1,500/MWh during peak winter stress. If "Long", excess power is dumped at the System Sell Price, which can even turn negative.'
    },
    {
      q: 'Why did you choose SQLite with pre-synced caching over querying Elexon live on every click?',
      a: 'Three key reasons: 1) Performance: 1,488 half-hours and 22,000+ forecast records take 5–10 seconds to fetch over public HTTP; SQLite serves complex analytical window queries in under 5ms. 2) Reliability: Eliminates runtime failure if Elexon API rate-limits or has downtime during client demos. 3) Offline readiness: Pre-seeded January 2026 data makes the app 100% self-contained.'
    },
    {
      q: 'Why do forecast errors spike during morning ramps and evening peaks (diurnal profile)?',
      a: 'Atmospheric boundary layer turbulence changes rapidly at sunrise and sunset. In addition, electricity demand ramps steepen thermal plant ramp-rate constraints. Quantifying this diurnal profile allows traders to dynamically widen reserve margins specifically during periods 14–18 and 33–38.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="glass-panel p-5 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border-purple-200 dark:border-purple-900/50">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            Interview & Technical Knowledge Base
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-500" />
          Quant Formulas & Energy Trading Interview Cheatsheet
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Clear, intuitive explanations of every mathematical metric with concrete numbers and top energy trading interview questions.
        </p>
      </div>

      {/* Formula Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formulas.map((item) => (
          <div key={item.id} className="glass-card p-5 border-t-4 border-t-sky-500">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Unit: {item.unit}
              </span>
            </div>

            <div className="mt-2 p-2 rounded bg-slate-900 text-sky-300 font-mono text-xs">
              {item.math}
            </div>

            <div className="mt-3 text-xs space-y-2">
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Simple Example:</strong>
                <pre className="mt-1 p-2 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] whitespace-pre-wrap font-sans">
                  {item.simpleExample}
                </pre>
              </div>

              <div>
                <strong className="text-slate-700 dark:text-slate-300">How to explain in interview:</strong>
                <p className="text-slate-600 dark:text-slate-400 text-xs italic mt-0.5">
                  "{item.interviewExplanation}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Trading Desk Impact: </span>
                <span className="text-slate-600 dark:text-slate-400">{item.tradingImpact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Predicted Interview Questions Accordion */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <MessageSquareQuote className="w-5 h-5 text-indigo-500" />
          Top 5 Interview Questions & Winning Answers
        </h3>

        <div className="space-y-3">
          {interviewQuestions.map((item, idx) => (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full text-left p-3.5 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px]">
                    Q{idx + 1}
                  </span>
                  {item.q}
                </span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openFaq === idx && (
                <div className="p-4 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100 block mb-1">Recommended Response:</strong>
                      {item.a}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
