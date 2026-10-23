# VoltIQ — UK Day-Ahead Renewable Forecast & Procurement Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React: 18](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://docker.com)

A customized, production-grade energy analytics and procurement decision-support application built for **UK Energy Utilities** trading on the **Day-Ahead Wholesale Electricity Market (EPEX SPOT / N2EX)**.

Powered exclusively by national-level generation data from **Elexon BMRS**:
* **Actual Wind Generation**: [`FUELHH` Stream API](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
* **Forecasted Wind Generation**: [`WINDFOR` Stream API](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)
* **Scope**: January 2026 purchase decisions and delivery periods across all 48 half-hour settlement periods.

---

## 🌟 Executive Summary & Problem Setting

In the UK wholesale power market, utilities must procure electricity on **Day D-1** to fulfill consumer demand on **Delivery Day D**. Because wind generation is weather-dependent, power purchase decisions rely heavily on forecasts.

If wind generation is **over-estimated**, the utility under-procures thermal power and is left **short** in the balancing mechanism, incurring severe **Cash-Out Penalties (System Buy Price)** that can surge to £300–£1,500/MWh. Conversely, if wind is **under-estimated**, the utility over-buys expensive thermal power.

### VoltIQ solves this with two core capabilities:
1. **Point-in-Time Day-Ahead Forecast Intelligence**: Identifies the latest available forecast vintage before auction gate closure (e.g. 11:00 UTC on Day D-1) across all 48 settlement periods.
2. **Quantitative Accuracy & Hedging Suite**: Quantifies forecast error (MAE, RMSE, WAPE, Bias, P90 downside risk) and calculates risk-adjusted thermal procurement plans and avoided imbalance penalties.

---

## 🏗️ System Architecture & Design Decisions

```
                           ┌─────────────────────────────────────────┐
                           │      Elexon BMRS Insights API           │
                           │  - FUELHH (Actual Wind Generation)      │
                           │  - WINDFOR (Multi-Vintage Forecasts)    │
                           └────────────────────┬────────────────────┘
                                                │ REST / Stream
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FASTAPI BACKEND                                      │
│                                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────┐   ┌───────────────────────┐  │
│  │   Ingestion Service   │──▶│ Embedded Analytical DB   │◀──│ Analytics & Quant     │  │
│  │   (Batching & Retry)  │   │ SQLite WAL Mode (Indexed)│   │ Engine (NumPy/Pandas) │  │
│  └───────────────────────┘   └──────────────────────────┘   └───────────────────────┘  │
│                                                                         │              │
│                                                                         ▼              │
│                                                             ┌───────────────────────┐  │
│                                                             │ Thermal Procurement   │  │
│                                                             │ & Risk Hedging Service│  │
│                                                             └───────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ JSON API (FastAPI Router)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MODERN REACT (VITE) FRONTEND                              │
│                                                                                        │
│  ┌─────────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────┐  │
│  │ Day-Ahead Decision Desk │   │ Quant Accuracy Suite     │   │ Thermal Procurement │  │
│  │ (Cutoff Simulator)      │   │ (Diurnal / Distribution) │   │ Hedging Simulator   │  │
│  └─────────────────────────┘   └──────────────────────────┘   └─────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Formulas & Energy Trading Interview Knowledge Base (Interactive Cheatsheet)     │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  🎨 Light & Dark Mode SaaS UI  •  Recharts Visualizations  •  Tailwind CSS Engine     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Why an Embedded Analytical Database (SQLite WAL + Indexes)?
* **Performance**: 1,488 half-hours (actuals) and 22,776 forecast points take 5–15 seconds to fetch over public HTTP. Storing and indexing them in SQLite allows complex SQL window queries (`ROW_NUMBER() OVER (PARTITION BY start_time ORDER BY publish_time DESC)`) to execute in **< 5 milliseconds**.
* **Zero-Dependency Resilience**: Guarantees zero downtime or rate-limit failures during client presentations and interviews.
* **Point-in-Time Auditing**: Storing all forecast vintages with `publishTime` allows retro-testing different gate closure hours (09:00, 11:00, 12:00, 14:00, 17:00 UTC).

---

## 📐 Mathematical Formulation & Metrics

| Metric | Mathematical Formula | Power Market Significance |
| :--- | :--- | :--- |
| **MAE** | $\frac{1}{N} \sum \|Forecast_t - Actual_t\|$ | Average absolute MW deviation expected in day-ahead scheduling. |
| **RMSE** | $\sqrt{\frac{1}{N} \sum (Forecast_t - Actual_t)^2}$ | Heavily penalizes extreme forecast misses. In power grids, a single 2,000 MW shock cannot be ramped fast enough, whereas ten 200 MW misses are easily absorbed. |
| **WAPE** | $\frac{\sum \|Forecast_t - Actual_t\|}{\sum Actual_t} \times 100\%$ | **Energy Trading Gold Standard**. Avoids standard MAPE division-by-zero explosions during calm wind hours ($Actual \approx 0$). |
| **Bias (MFE)** | $\frac{1}{N} \sum (Forecast_t - Actual_t)$ | Systematic error direction. Positive bias = over-forecast (short imbalance cashout risk); Negative bias = under-forecast (surplus spill risk). |
| **P90 Risk** | $10\text{th percentile of } (Actual - Forecast)$ | Downside reserve threshold. 90% of actual generation falls at or above this floor, protecting the utility from short balancing cashout spikes. |

---

## 📁 Repository Directory Structure

```
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py            # FastAPI endpoints (comparison, metrics, diurnal, procurement)
│   │   ├── services/
│   │   │   ├── analytics_service.py # Core quant engine: MAE, RMSE, WAPE, Bias, Diurnal, P10/P90
│   │   │   ├── procurement_service.py# Thermal procurement planner & cashout penalty calculator
│   │   │   └── elexon_client.py     # Elexon BMRS ingestion stream client
│   │   ├── config.py                # App configuration, cutoffs, URLs
│   │   ├── database.py              # SQLite schema, WAL mode, upsert queries
│   │   └── main.py                  # FastAPI entry point, lifespan, CORS
│   ├── data/
│   │   └── energy_data.db           # Pre-seeded January 2026 Elexon database
│   ├── seed_data.py                 # Standalone seeder (zero-dependency standard library)
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Python container image
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Cutoff selector, date picker, light/dark mode toggle
│   │   │   ├── DecisionDesk.jsx     # Actual vs Forecast chart, half-hourly table, risk flags
│   │   │   ├── AccuracySuite.jsx    # 6 KPI cards, diurnal profile, error distribution histogram
│   │   │   ├── ThermalProcurement.jsx# Stacked area chart, demand sliders, cashout savings
│   │   │   └── FormulaKnowledgeBase.jsx# Math formulas, concrete examples & interview Q&A
│   │   ├── App.jsx                  # Main tabbed SaaS application
│   │   ├── index.css                # Tailwind directives & glassmorphism styles
│   │   └── main.jsx                 # React root DOM mount
│   ├── index.html                   # HTML5 shell with Google Font Inter
│   ├── package.json                 # React, Vite, Recharts, Lucide icons, Tailwind
│   ├── vite.config.js               # Dev server with backend proxy
│   ├── tailwind.config.js           # Dark mode configuration & palette
│   ├── nginx.conf                   # Reverse proxy for Docker deployment
│   └── Dockerfile                   # Multi-stage Node/Nginx container image
├── docker-compose.yml               # Unified multi-container orchestration
├── Procfile                         # Heroku deployment configuration
├── vercel.json                      # Vercel deployment configuration
├── EXPLANATION_AND_INTERVIEW_GUIDE.md# Video recording script, tech lead review, formula walkthrough
└── README.md                        # Project documentation (this file)
```

---

## 🚀 How to Run the Application

### Option A: Using Docker & Docker Compose (Recommended)

Make sure Docker is installed on your machine, then run:

```bash
docker-compose up --build
```

* **Frontend Dashboard**: Open [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: Open [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Running Locally (Native)

#### 1. Backend Setup
```bash
# Navigate to project root
cd "/path/to/project"

# (Optional) Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# (Optional) Re-seed or verify database
python3 backend/seed_data.py

# Launch FastAPI backend server
uvicorn app.main:app --app-dir backend --port 8000 --reload
```
The backend will be live at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

#### 2. Frontend Setup
```bash
# In a new terminal window
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```
Open the URL shown in the terminal (typically `http://localhost:3000` or `http://localhost:3003`).

---

## 🌐 Deployment Links

* **Vercel / Heroku Deployment**: [Deploy to Vercel Guide included in repo]
* **Swagger API Documentation**: `http://localhost:8000/docs`

---

## 🤖 AI Tools Disclosure

In accordance with the assignment guidelines, AI coding assistants (Google Antigravity AI) were used to assist with:
* Accelerating boilerplate UI scaffolding (Tailwind CSS styling and Recharts wiring)
* Structuring clean architectural separation between ingestion, persistence, and analytics services
* Drafting comprehensive documentation

All domain modeling, mathematical formulation (WAPE, RMSE, MAE, Bias, P90), Elexon API data filtering (`FUELHH` WIND and `WINDFOR`), and energy trading decision logic were carefully verified and tested for accuracy.
