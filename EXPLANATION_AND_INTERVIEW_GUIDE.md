# VoltIQ — Complete Video Presentation Script & Interview Cheatsheet

This guide is designed for **you** to record your 10-minute demo video and ace any technical or client interview.

---

## ⏱️ Video Breakdown at a Glance (10 Minutes Total)

| Part | Audience | Target Duration | Main Focus |
| :--- | :--- | :--- | :--- |
| **Part 1** | **Client: UK Energy Utility Trading Desk** | 0:00 – 4:45 (< 5 min) | Business problem, live UI walkthrough, thermal procurement planner, and financial ROI (avoided imbalance penalties). |
| **Part 2** | **Internal Technical Lead Review** | 4:45 – 9:30 (< 5 min) | System architecture, SQLite WAL caching, point-in-time SQL window queries, clean code design, Docker, and scalability. |

---

# 🎬 Part 1: Client Pitch Script (< 5 Minutes)
**Persona**: Product Developer presenting the completed pilot project to the Head of Wholesale Power Trading at a UK Energy Utility.  
**Tone**: Confident, commercial, solution-focused, and polished.

---

### [0:00 – 0:45] Introduction & The Core Problem
> *"Hello everyone, thank you for joining today. I'm excited to present the pilot output of **VoltIQ**, our customized Day-Ahead Forecasting and Thermal Procurement platform developed specifically for your UK power trading desk.*  
>  
> *As a retail energy utility in Great Britain, your core challenge is procuring enough electricity in the day-ahead wholesale market to serve your customers' demand. Because renewable wind generation is weather-dependent and volatile, your procurement desk faces two huge financial risks:*  
> *1. If you **over-estimate wind**, you will under-buy thermal power and be left **Short** in the Balancing Mechanism—forced to pay punishing System Buy Price cash-out penalties that often spike to over £300 to £1,000 per Megawatt-hour.*  
> *2. If you **under-estimate wind**, you over-procure expensive thermal power and dump excess energy at low or even negative distress prices.*  
>  
> *VoltIQ solves this by giving your traders **point-in-time day-ahead forecast intelligence** and a **quant-driven risk hedging calculator** powered directly by official Elexon BMRS data."*

---

### [0:45 – 2:00] Screen Walkthrough 1: Day-Ahead Decision Desk
*(Action: Open the app at `http://localhost:3000` or `3003`. Click on the **Day-Ahead Decision Desk** tab. Toggle between Dark and Light mode to showcase the SaaS polish).*

> *"Let's look at the live platform. The UI is built with a modern SaaS aesthetic, supporting both light and dark modes for 24/7 trading desk environments.*  
>  
> *At the top, notice our **Day-Ahead Gate Closure Selector**. In the UK, the EPEX SPOT day-ahead auction gate closes at **11:00 UTC on Day D-1**. VoltIQ automatically filters through thousands of forecast vintages and locks onto the exact latest forecast available at 11:00 UTC before your bids were submitted.*  
>  
> *Looking at January 15th, 2026 on this interactive chart:*  
> * *The **blue shaded curve** represents actual wind generation from the Elexon `FUELHH` stream across all 48 half-hour settlement periods.*  
> * *The **amber dashed line** is the day-ahead forecast your trader had available when submitting bids.*  
>  
> *Below the chart, our granular settlement schedule flags exactly which half-hours pose a **Shortfall Risk** (where forecast exceeded actual by >150 MW), warning the trader where reserve flexibility is needed."*

---

### [2:00 – 3:15] Screen Walkthrough 2: Quantitative Accuracy Suite
*(Action: Click on the **Quant Accuracy Suite** tab).*

> *"Now, traders cannot manage what they cannot quantify. That's why VoltIQ provides a comprehensive Quantitative Accuracy Suite evaluating the entire month of January 2026 across 1,488 half-hours.*  
>  
> *Notice our 6 Core KPI cards:*  
> * *Our **MAE (Mean Absolute Error)** is 1,053 MW.*  
> * *Our **RMSE** is 1,846 MW—highlighting the tail risks of extreme forecast misses.*  
> * *Our **WAPE (Weighted Absolute Percentage Error)** is **9.1%**. In energy trading, WAPE is the gold standard because it avoids dividing by near-zero wind, which would otherwise explode standard MAPE.*  
> * *Most importantly, our **Forecast Bias is +920 MW**. This proves that the national forecast systematically over-predicted wind in January 2026. A trader without this tool would have consistently under-procured thermal power and bled cash in imbalance penalties!*  
>  
> *Under the **Diurnal Profile tab**, notice that forecast errors spike significantly during Settlement Periods 14 to 18 (07:00 to 09:00 morning ramp) and Periods 33 to 37 (evening peak). This gives your desk the exact hours where extra reserve margins must be applied."*

---

### [3:15 – 4:45] Screen Walkthrough 3: Thermal Procurement & Hedging Simulator
*(Action: Click on the **Thermal Procurement Planner** tab. Drag the Consumer Demand slider and change the risk policy from P50 to P90).*

> *"Finally, here is the operational crown jewel: the **Thermal Procurement Planner**.*  
>  
> *Your trading team can input expected consumer demand—say 25,000 MW—and select a **Downside Wind Risk Policy**, such as **P90 (Conservative)**.*  
>  
> *Look at the procurement stack:*  
> * *The **green area** shows expected wind generation.*  
> * *The **amber area** shows the net thermal power to procure from the day-ahead wholesale auction.*  
> * *The **red area** is the P90 Risk Buffer—a calculated reserve margin protecting the desk against wind shortfalls.*  
>  
> *In the bottom KPI summary, VoltIQ calculates that on this single day alone, by hedging with our P90 buffer rather than naively trusting the wind forecast, your utility saves an estimated **£40,000 to £100,000 in avoided imbalance cash-out penalties**.*  
>  
> *In summary, VoltIQ transforms raw weather data into profitable, risk-hedged trading decisions."*

---

# 🛠️ Part 2: Tech Lead Review Script (< 5 Minutes)
**Persona**: Software Engineer walking an internal Technical Lead through the architecture, code structure, database, and engineering decisions.  
**Tone**: Technical, clear, architectural, and data-driven.

---

### [4:45 – 5:45] Architecture & Technology Stack
> *"Now, let's switch gears and review the software design, implementation, and code base for our technical review.*  
>  
> *Our stack is built strictly with the required technologies:*  
> * **Backend**: Python 3.11 with **FastAPI**, **Pandas**, **NumPy**, and **Pydantic** for typed contracts.  
> * **Database**: Embedded **SQLite with WAL (Write-Ahead Logging)** mode and composite indexing.  
> * **Frontend**: **React 18** built on **Vite**, styled with **Tailwind CSS** and rendered with **Recharts** for responsive high-performance visual analytics.  
> * **Deployment & Containerization**: Fully containerized using **Docker** and **Docker Compose**, with Nginx serving static assets and proxying API traffic, ready for deployment on Vercel or Heroku."*

---

### [5:45 – 7:15] Data Pipeline, Ingestion & SQLite Window Queries
*(Action: Briefly open or reference `backend/app/services/analytics_service.py` and `backend/seed_data.py`).*

> *"Let's talk about the data architecture and why we chose an embedded persistent cache.*  
>  
> *Elexon BMRS provides two streams:*  
> * 1. `FUELHH` stream for actual generation (filtering for `fuelType == 'WIND'`).  
> * 2. `WINDFOR` stream for multi-horizon forecast vintages.  
>  
> *Because January 2026 represents 1,488 half-hours of actuals and over 22,700 forecast points, querying Elexon's public HTTP stream on every frontend user click would take 5 to 15 seconds and risk rate-limiting or network timeouts.*  
>  
> *To solve this, we implemented an automated ETL service in `backend/seed_data.py` that ingests the data, creates composite indexes on `(settlement_date, fuel_type)` and `(start_time, publish_time)`, and persists it in SQLite.*  
>  
> *To solve the core Day-Ahead cutoff challenge, we wrote an optimized SQL Window Function query in `analytics_service.py`:*  
> ```sql
> WITH latest_forecasts AS (
>     SELECT start_time, generation,
>            ROW_NUMBER() OVER (PARTITION BY start_time ORDER BY publish_time DESC) as rn
>     FROM forecasts
>     WHERE publish_time <= ? AND start_time >= ? AND start_time <= ?
> )
> SELECT a.*, lf.generation as forecast_generation
> FROM actuals a
> LEFT JOIN latest_forecasts lf ON a.start_time = lf.start_time AND lf.rn = 1;
> ```
> *This guarantees point-in-time correctness: for any delivery date $D$, we select the latest forecast vintage published before $D-1$ at 11:00 UTC. Because of our indexing, this analytical query executes in **less than 5 milliseconds**."*

---

### [7:15 – 8:30] Code Organization & Mathematical Rigor
*(Action: Highlight `backend/app/api/routes.py` and frontend component modularity).*

> *"Our backend is organized into clean, modular layers:*  
> * `app/api/routes.py`: Defines REST endpoints with typed Pydantic request/response models.  
> * `app/services/analytics_service.py`: Contains the vectorized NumPy calculation of MAE, RMSE, WAPE, Bias, Diurnal averages, and histogram distributions.  
> * `app/services/procurement_service.py`: Encapsulates the UK wholesale dispatch curve, shaped consumer demand, and cash-out penalty formulas.  
> * `app/database.py`: Handles connection pooling, thread-safe WAL mode, and idempotency via `ON CONFLICT DO UPDATE`.  
>  
> *On the frontend, all components are fully decoupled:*  
> * `Navbar.jsx` manages global state (selected date, cutoff hour, dark/light theme).  
> * `DecisionDesk.jsx`, `AccuracySuite.jsx`, and `ThermalProcurement.jsx` consume structured JSON from the API.  
> * We also built an in-app `FormulaKnowledgeBase.jsx` allowing any stakeholder to inspect the formulas and concrete numerical examples directly in the UI."*

---

### [8:30 – 9:30] Docker, Resilience & Production Scalability
> *"For production deployment, we provide a unified `docker-compose.yml`.  
> * The frontend container uses a multi-stage Docker build with Node 20 and Alpine Nginx.  
> * The backend container uses lightweight Python 3.11-slim, running Uvicorn with worker concurrency.  
>  
> *If we scale this to enterprise UK production with hundreds of solar, hydro, and interconnection assets:*  
> * SQLite can be seamlessly swapped for **TimescaleDB** or **ClickHouse** with zero changes to the service layer.  
> * Real-time websocket feeds from Elexon BMRS can stream into an Apache Kafka or Redis queue.  
>  
> *In conclusion, the codebase is modular, fully tested, documented, and delivers immediate commercial value. Thank you!"*

---

# 📚 Quant Formulas Explained Simply (With Concrete Numbers)

Use these simple examples if the interviewer asks you to explain any metric:

### 1. MAE (Mean Absolute Error)
* **Formula**: $\text{MAE} = \frac{1}{N} \sum |Forecast_i - Actual_i|$
* **Simple Example**:
  * Period 1: Forecast = 1,000 MW, Actual = 900 MW $\rightarrow$ Error = $|1000 - 900| = 100\text{ MW}$
  * Period 2: Forecast = 800 MW, Actual = 850 MW $\rightarrow$ Error = $|800 - 850| = 50\text{ MW}$
  * **$\text{MAE} = \frac{100 + 50}{2} = 75\text{ MW}$**
* **In the Interview**: *"On average, our day-ahead forecast deviates from actual wind generation by 75 MW, treating over-predictions and under-predictions equally."*

---

### 2. RMSE (Root Mean Square Error)
* **Formula**: $\text{RMSE} = \sqrt{\frac{1}{N} \sum (Forecast_i - Actual_i)^2}$
* **Simple Example**:
  * Period 1: Error = $100\text{ MW} \rightarrow 100^2 = 10,000$
  * Period 2: Error = $50\text{ MW} \rightarrow 50^2 = 2,500$
  * Average of squares = $\frac{10,000 + 2,500}{2} = 6,250$
  * **$\text{RMSE} = \sqrt{6,250} \approx 79.1\text{ MW}$**
* **In the Interview**: *"Notice that RMSE (79.1 MW) is higher than MAE (75 MW). That is because RMSE squares the errors, heavily penalizing large forecast misses. In energy grids, a single 2,000 MW forecast miss causes blackout risk and huge penalties, while ten 200 MW misses are easy to manage. RMSE highlights that tail risk."*

---

### 3. WAPE (Weighted Absolute Percentage Error)
* **Formula**: $\text{WAPE} = \frac{\sum |Forecast_i - Actual_i|}{\sum Actual_i} \times 100\%$
* **Simple Example**:
  * Total Absolute Errors = $100 + 50 = 150\text{ MW}$
  * Total Actual Wind = $900 + 850 = 1,750\text{ MW}$
  * **$\text{WAPE} = \frac{150}{1,750} \times 100\% = 8.57\%$**
* **In the Interview**: *"Why WAPE instead of standard MAPE? Because during calm nights, actual wind might drop to 5 MW. If the forecast was 50 MW, standard MAPE is $(45/5) \times 100 = 900\%$! That single calm hour distorts the entire monthly average. WAPE weights errors by volume, making it the industry standard in power trading."*

---

### 4. Forecast Bias (Mean Forecast Error / MFE)
* **Formula**: $\text{Bias} = \frac{1}{N} \sum (Forecast_i - Actual_i)$
* **Simple Example**:
  * Period 1: $1,000 - 900 = +100\text{ MW}$ (Over-forecast)
  * Period 2: $800 - 850 = -50\text{ MW}$ (Under-forecast)
  * **$\text{Bias} = \frac{+100 - 50}{2} = +25\text{ MW}$**
* **In the Interview**: *"A positive bias (+MW) means the model consistently over-promises wind generation. For an energy utility, a positive bias is dangerous because it leads to under-buying thermal power on the day-ahead market, leaving the desk short and exposed to emergency balancing penalties."*

---

### 5. P90 Downside Risk Envelope
* **Meaning**: The 10th percentile of $(Actual - Forecast)$ across historical observations.
* **Simple Example**: Across 100 historical delivery days, on 90 of those days, actual wind was either higher than forecast or missed by no more than 350 MW.
* **In the Interview**: *"Traders use P90 to size their safety reserve margin. Holding a P90 buffer guarantees that 90% of the time, the utility will not be caught short in the balancing mechanism."*

---

# 🎯 Top 6 Interview Questions & Winning Answers

### Q1: Why do Day-Ahead auction cutoff times matter in power markets?
> **Answer**:  
> In Great Britain, wholesale power is cleared through day-ahead auctions (EPEX SPOT at 11:00 UTC and N2EX at 12:00 UTC). Once bids are submitted, power contracts are legally and financially committed for all 48 half-hour settlement periods of Delivery Day D. A trader cannot use a forecast published after 11:00 UTC on Day D-1 because the auction has already closed. That is why VoltIQ strictly enforces point-in-time filtering based on gate closure timestamps.

---

### Q2: Why did you store multiple forecast vintages rather than just the latest single forecast?
> **Answer**:  
> Because weather models update continuously (National Grid ESO publishes new `WINDFOR` vintages every few hours). If you only store the latest forecast, you lose the ability to analyze what the trader actually knew at the 11:00 UTC decision cutoff. Storing vintages with `publishTime` allows retroactive back-testing of different auction deadlines (e.g. comparing an 09:00 UTC bid against an 11:00 UTC bid).

---

### Q3: What is the financial consequence of being "Short" vs "Long" in the UK Balancing Mechanism?
> **Answer**:  
> If an energy utility generates or buys less power than their customers consume, they are **Short**. Elexon settles this imbalance at the **System Buy Price (Cashout price)**, which during winter peak hours can exceed £500 to £1,500/MWh. If the utility has excess power, they are **Long** and receive the System Sell Price, which can drop close to zero or even negative. Being Short is typically far more punitive, which is why utilities hold a P90 reserve buffer.

---

### Q4: Why did you pick SQLite with pre-synced caching over querying the live Elexon API on every request?
> **Answer**:  
> Three primary reasons:
> 1. **Performance**: Querying 1,488 half-hours and 22,700 forecast points over public HTTP takes 5 to 15 seconds. SQLite with indexed columns executes window queries in under 5 milliseconds.
> 2. **Reliability**: Eliminates third-party API rate-limiting or network failure during critical trading decisions and demos.
> 3. **Production Alignment**: In enterprise trading firms, external market streams are always captured via an ETL ingest pipeline into an internal analytical store before being queried by trading apps.

---

### Q5: Why do forecast errors spike during morning ramps and evening peaks (diurnal profile)?
> **Answer**:  
> Meteorologically, sunrise and sunset trigger thermal boundary layer transitions in the atmosphere, creating localized wind speed volatility. Operationally, these coincide with steep consumer demand ramps (SP 14–18 in the morning and SP 33–38 in the evening). Identifying this diurnal spike allows traders to dynamically widen reserve margins specifically during peak hours rather than holding a flat, expensive buffer all day.

---

### Q6: If you had more time or were moving this to enterprise production, what would you add?
> **Answer**:  
> 1. **Asset Expansion**: Ingest solar PV (`SOLARFOR`) and interconnector flows (`INTxxx`) for full portfolio net-demand optimization.  
> 2. **Database Scale**: Migrate from SQLite to TimescaleDB or ClickHouse with Kafka ingestion for sub-second real-time streaming.  
> 3. **Machine Learning Bias-Correction**: Train an XGBoost or LightGBM model on top of Elexon's raw WINDFOR forecast to eliminate the +920 MW systematic over-prediction bias we discovered in January 2026.
