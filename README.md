# GeoSense AI — Environmental Hotspot Activity Forecast

[![Stage 8: Hackathon Demo Ready](https://img.shields.io/badge/Status-Hackathon%20Demo%20Ready-success)](#)
[![Data: NASA FIRMS VIIRS](https://img.shields.io/badge/Telemetry-NASA%20FIRMS%20VIIRS%20(NOAA--20)-emerald)](#)
[![ML: Random Forest](https://img.shields.io/badge/Model-Random%20Forest%20Regressor-blue)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TypeScript-blue)](#)
[![Backend](https://img.shields.io/badge/Backend-Python%20%2B%20FastAPI-green)](#)

GeoSense AI is an environmental data platform designed to forecast next-day satellite-observed active-fire detection counts using historical NASA FIRMS (Fire Information for Resource Management System) data.

The system ingests 33.72 million raw observations from NOAA-20 VIIRS (375m spatial resolution), aggregates them into continuous daily global time series, trains machine learning models under strict chronological splits without temporal leakage, and presents transparent forecasts alongside empirical baseline benchmarks.

---

## 📂 Project Directory Structure

```text
GeoSenseAI/
├── DATA/
│   ├── raw/                              # Original NASA FIRMS telemetry (220 CSV files, ~2.62 GB)
│   │   ├── DL_FIRE_J1V-C2_42816/         # 2026 Archive & NRT global CSVs (15.35M detections)
│   │   └── viirs-jpss1_2025_all_countries/ # 2025 Sovereign country CSVs (18.38M detections)
│   └── processed/                        # Processed time-series datasets
│       ├── daily_global_hotspots.csv     # 654 consecutive days (2025-01-01 to 2026-10-16)
│       └── annual_country_summaries_2025.csv # 217 sovereign territories annual summaries
│
├── backend/                              # Python + FastAPI Service
│   ├── app/
│   │   ├── main.py                       # FastAPI application & secure API endpoints
│   │   ├── pipeline/                     # Stage 4 chunked streaming aggregation pipeline
│   │   │   └── aggregator.py             # Memory-efficient streaming accumulator
│   │   ├── ml/                           # Stage 5 machine learning forecasting pipeline
│   │   │   ├── train.py                  # Chronological training & evaluation script
│   │   │   ├── features.py               # Leak-free lag & rolling feature engineering
│   │   │   └── predict.py                # Next-day inference engine
│   │   └── models/                       # Model binaries & evaluation artifacts
│   │       ├── random_forest_forecaster.joblib # Trained Random Forest model (150 trees)
│   │       └── model_evaluation_results.json   # Verified empirical test metrics
│   ├── tests/                            # Automated test suite (Pytest)
│   │   ├── test_pipeline.py              # Chunking & accumulator unit tests
│   │   └── test_ml_pipeline.py           # Feature engineering, splits & API tests
│   ├── venv/                             # Python virtual environment
│   └── requirements.txt                  # Python dependencies
│
├── frontend/                             # React + Vite + TypeScript Web Interface
│   ├── src/
│   │   ├── components/                   # Modular UI components & controls
│   │   │   ├── sections/                 # 7 main dashboard views
│   │   │   │   ├── DashboardOverview.tsx # KPI summary, active monitored region, forecast
│   │   │   │   ├── HistoricalTrends.tsx  # 654-day interactive line chart & FRP metrics
│   │   │   │   ├── ForecastSection.tsx   # Next-day forecast hero & driver sensitivity
│   │   │   │   ├── ModelLabSection.tsx   # Empirical model benchmark comparison & test traces
│   │   │   │   ├── HotspotMapSection.tsx # Sovereign hotspot matrix & spatial boundaries
│   │   │   │   ├── DataQualitySection.tsx# Telemetry audit counters & sensor limitations
│   │   │   │   └── MethodologySection.tsx# Educational guide & 5-step data roadmap
│   │   │   ├── Navbar.tsx                # Navigation bar with live backend health monitor
│   │   │   └── ControlsBar.tsx           # Region selector & date window buttons
│   │   ├── data/demoData.ts              # Segregated demonstration subsets
│   │   ├── types/dashboard.ts            # TypeScript interface definitions
│   │   ├── App.tsx                       # Main application shell
│   │   ├── App.css                       # Layout styling
│   │   └── index.css                     # Dark forest-green environmental design tokens
│   └── package.json                      # Frontend dependencies & scripts
│
├── reports/                              # Milestone audit documentation
│   ├── dataset_inspection.md             # Stage 3 raw data inspection report
│   ├── data_processing_report.md         # Stage 4 aggregation pipeline report
│   ├── model_evaluation_report.md        # Stage 5 training & baseline comparison report
│   ├── model_validation_report.md        # Stage 6 independent validation report
│   ├── dashboard_integration_report.md   # Stage 7 API integration report
│   ├── stage_1_to_7_completion_audit.md  # Comprehensive Stages 1–7 audit
│   └── stage_8_final_audit.md            # Final Stage 8 security & demo audit
│
├── .gitignore                            # Environment files & build artifacts ignore
├── .env.example                          # Safe environment configuration template
└── README.md                             # Project guide & hackathon demo instructions
```

---

## 🛰️ Acquiring Raw NASA FIRMS Telemetry

> [!NOTE]
> The preprocessed daily time series (`DATA/processed/daily_global_hotspots.csv`), annual summaries (`DATA/processed/annual_country_summaries_2025.csv`), and trained model binaries are **already bundled** in this repository. You can run the backend, frontend, and test suite immediately upon cloning without re-downloading gigabytes of raw data.

If you wish to re-run the Stage 4 aggregation pipeline from scratch on the original raw NASA FIRMS telemetry (~2.62 GB, 33.72M records across 220 CSVs):

1. **2025 Country-Level Archive CSVs (18.38M records):**
   - **Source:** NASA FIRMS Country Archive for VIIRS NOAA-20 / JPSS-1 (375m spatial resolution, 2025 calendar year).
   - **Destination:** Extract the 217 sovereign territory CSV files into:
     ```text
     DATA/raw/viirs-jpss1_2025_all_countries/
     ```
2. **2026 Global Telemetry & NRT CSVs (15.35M records):**
   - **Source:** NASA FIRMS Custom Download request (Product: `J1V-C2`, Satellite: NOAA-20 VIIRS 375m).
   - **Files:**
     - `fire_archive_J1V-C2_42816.csv` (2026-01-01 to 2026-08-31 archive)
     - `fire_nrt_J1V-C2_42816.csv` (2026-09-01 to 2026-10-15 near-real-time)
     - `fire_nrt_J1V-C2_42816_recent.csv` (2026-10-16 partial day)
   - **Destination:** Place these 3 files into:
     ```text
     DATA/raw/DL_FIRE_J1V-C2_42816/
     ```
3. **Execute the Chunked Aggregation Pipeline:**
   ```powershell
   cd backend
   .\venv\Scripts\python.exe -m app.pipeline.aggregator
   ```

---

## 🛠️ Prerequisites & Installed Tools

Before running GeoSense AI, verify that the following tools are installed:

| Tool | Version on this System | Recommended |
| :--- | :--- | :--- |
| **Node.js & npm** | Node `v22.21.1` / npm `11.6.2` | Node v18+ / npm v9+ |
| **Python** | Python `3.14.0` with `pip 25.2` | Python 3.10+ |

---

## 🚀 Step-by-Step Running Instructions (Windows)

GeoSense AI consists of two components: the **FastAPI backend** (port `8000`) and the **React frontend** (port `5173`).

### Terminal 1: Start the Backend (FastAPI)

1. Open PowerShell or Command Prompt.
2. Navigate to the backend directory:
   ```powershell
   cd c:\Users\Admin\Desktop\GeoSenseAI\backend
   ```
3. Start the Uvicorn server using the virtual environment:
   ```powershell
   .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
4. **Backend Local URLs:**
   - Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
   - Interactive Swagger API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Summary KPIs: [http://127.0.0.1:8000/api/time-series/summary](http://127.0.0.1:8000/api/time-series/summary)
   - Next-Day Forecast: [http://127.0.0.1:8000/api/forecast/next-day](http://127.0.0.1:8000/api/forecast/next-day)

### Terminal 2: Start the Frontend (React + Vite)

1. Open a **second** PowerShell or Command Prompt window.
2. Navigate to the frontend directory:
   ```powershell
   cd c:\Users\Admin\Desktop\GeoSenseAI\frontend
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. **Frontend Local URL:**
   - Dashboard: [http://localhost:5173/](http://localhost:5173/)

### How to Stop the Servers
To stop either server, select the respective terminal window and press:
```text
Ctrl + C
```

---

## 🧪 Automated Testing & Production Builds

### Backend Automated Unit Tests (Pytest)
Run the 9 backend automated tests covering chunk processing, leak-free feature engineering, chronological splits, and endpoint responses:
```powershell
cd c:\Users\Admin\Desktop\GeoSenseAI\backend
.\venv\Scripts\python.exe -m pytest tests/ -v
# Output: 9 passed in ~5 seconds (100% pass rate)
```

### Frontend Production Build
Validate TypeScript types and compile the optimized production bundle:
```powershell
cd c:\Users\Admin\Desktop\GeoSenseAI\frontend
npm run build
# Output: tsc -b && vite build completed with 0 errors
```

---

## 🎬 Hackathon Demo Walkthrough Guide

Follow this guided walkthrough during a hackathon evaluation or live demonstration:

### Step 1: Open the Application
* Open [http://localhost:5173/](http://localhost:5173/) in Google Chrome.
* Point out the live connection pill in the top-right navbar: `● Backend Online (Stage 5)`.

### Step 2: Dashboard Overview
* Show the active region: **Global Monitored Landmasses (NASA FIRMS)** with the emerald badge `AUTHENTIC NASA FIRMS`.
* Explain the primary KPI cards:
  * **Latest 24h Hotspot Count:** `59,476` observed on complete day `2026-10-15`.
  * **Next-Day AI Forecast:** `59,445` satellite detections for target date `2026-10-16` (bounds: `[49,866 – 69,023]`).
  * **7-Day Trailing Baseline:** `55,101` detections/day.
* Switch the region selector in the control bar to *"Northern Boreal Forest"* to demonstrate **transparent data segregation**: an amber `REGIONAL DEMO` badge appears with an explicit disclaimer. Switch back to *"Global Monitored Landmasses"*.

### Step 3: Historical Trends
* Click **Historical Trends** in the top navbar.
* Toggle the date window buttons: **"30d"**, **"60d"**, and **"All"** (plots all 654 consecutive days).
* Hover over any data point on the SVG chart: explain the dual-axis tooltips displaying daily detection counts and mean Fire Radiative Power ($MW$).

### Step 4: Next-Day Forecast View
* Click **Next-Day Forecast** in the navbar.
* Show the main prediction hero:
  * Reference date: `2026-10-15` (`59,476` detections)
  * Target date: `2026-10-16`
  * Model prediction: **`59,445`** detections (Random Forest Regressor)
  * Confidence band: `[49,866 – 69,023]` detections (±1 MAE)
* Review **Learned Forecasting Drivers**: show that the previous-day lag (`lag_1`) carries ~85.8% feature importance, reflecting natural wildfire persistence.
* Interact with the **Sensitivity Slider** to test how tomorrow's forecast dynamically shifts if today's count changes, then click **"Reset to Actual"**.

### Step 5: Model Lab (Scientific Honesty)
* Click **Model Lab** in the navbar.
* Highlight our commitment to scientific honesty over hype:
  * **Previous-Day Persistence:** MAE = `9,270.45` detections (**Lowest MAE**, marked with `BEST MAE` badge).
  * **Random Forest Regressor:** MAE = `9,578.47` | RMSE = `12,712.42` (**Lowest RMSE & MAPE: 12.84%**, marked with `BEST RMSE & MAPE` badge).
  * **7-Day Moving Average:** MAE = `13,795.80` | RMSE = `17,309.14`.
* Explain that persistence holds a 3.32% MAE edge during smooth continuous regimes, while Random Forest outperforms the 7-day average by 30.6% and dampens large overshoot errors (yielding the lowest RMSE).
* Click **"Show Daily Test Traces (76 Days)"** to view the day-by-day actual vs. predicted values for all dates in the held-out test window (`2026-08-01` to `2026-10-15`).

### Step 6: Data Quality & Sensor Transparency
* Click **Data Quality** in the navbar.
* Review the telemetry counters: `33,723,945` raw detections, `220` CSV files, `654` consecutive calendar days, **0 missing days**, `653` complete days, and `1` partial NRT day (`2026-10-16`).
* Review documented sensor boundaries: low Earth orbit overpass cadence (~1:30 PM/AM local solar time), cloud/smoke attenuation, and near-real-time downlink latency.

### Step 7: Sovereign Hotspot Footprint
* Click **Hotspot Map** in the navbar.
* Explain the **Scientific Spatial Policy**: rather than faking individual pixel coordinates that crash browser memory, genuine sovereign totals from the 2025 VIIRS archive are displayed (DR Congo: 1.95M detections, Angola: 1.26M, Australia: 1.25M, Canada: 925k).

---

## ⚠️ Important Scientific Disclaimers & Operational Scope

1. **Satellite-Observed Active-Fire Detections:** All numbers represent thermal anomaly pixel detections observed by the VIIRS instrument on NOAA-20, **not** confirmed fires, perimeter polygons, or burned hectares.
2. **Macro-Scale Time-Series Forecasting:** The model forecasts global daily aggregate detection counts. It does **not** predict individual fire ignitions, tactical spreading vectors, or micro-scale pixel coordinates.
3. **No Emergency Alerting:** This platform is an educational and analytical research demonstration for environmental hotspot trends. It is **not** an operational emergency response system or life-safety warning service.
4. **Observation Latency:** Telemetry for `2026-10-16` contains partial orbital passes (16,952 detections) and is properly labeled as `partial_or_near_real_time` to avoid downward forecast skewing.

---

## 📄 License & Provenance
* **Satellite Telemetry:** NASA FIRMS (Fire Information for Resource Management System) / LANCE / EOSDIS.
* **Sensor:** VIIRS 375m active fire product on NOAA-20 (JPSS-1).
* **Project:** Developed for the GeoSense AI Hackathon Demonstration.
