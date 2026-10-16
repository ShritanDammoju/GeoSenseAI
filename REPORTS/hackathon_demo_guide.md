# GeoSense AI — Hackathon Live Demonstration & Judge Q&A Guide

**Project:** GeoSense AI — Environmental Hotspot Activity Forecast  
**Target Audience:** Hackathon Technical Judges, Climate / AI Evaluators  
**Demo Duration:** 3 to 5 Minutes  
**Local URLs:** Frontend: [http://localhost:5173/](http://localhost:5173/) | Backend: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  

---

## 1. The 3-Minute Elevator Pitch

> *"Every day, orbiting Earth-observation satellites capture tens of thousands of active thermal anomalies across the globe. But raw satellite telemetry is inherently reactive: environmental managers only see what was burning when the satellite flew overhead.*
>
> *GeoSense AI transforms raw NASA FIRMS satellite telemetry into next-day predictive intelligence. We ingested 33.72 million individual satellite detections from NOAA-20 VIIRS across 654 consecutive days, engineered leak-free lag and rolling features, and evaluated machine learning forecasting models against established baselines under strict chronological splits.*
>
> *We don't sell AI hype or fake precision: we honestly report that previous-day persistence is an extraordinarily strong anchor during steady fire regimes, while our Random Forest Regressor dampens explosive tail overshoot errors, achieving the lowest RMSE and outperforming the 7-day trend by 30.6%."*

---

## 2. Click-by-Click Live Demo Walkthrough

### Step 1: Landing & Backend Connection (30 Seconds)
* Open [http://localhost:5173/](http://localhost:5173/) in Google Chrome.
* Point to the top-right indicator pill: `● Backend Online (Port 8000)`.
* Show the active region card: **"Global Monitored Landmasses (NASA FIRMS)"** with the emerald badge `AUTHENTIC NASA FIRMS`.
* Call out the primary KPIs:
  * **Latest 24h Hotspot Count:** `59,476` satellite detections observed on `2026-10-15`.
  * **Next-Day AI Forecast:** `59,445` forecasted detections for tomorrow (`2026-10-16`).
  * **Weekly Baseline:** `55,101` detections/day.
* **Demonstrate Data Segregation:** Click the region dropdown and select *"Northern Boreal Forest"*. Point out how the badge instantly flips to an amber `REGIONAL DEMO PREVIEW` with an explicit notice, proving that demonstration biomes are never dishonestly presented as real global telemetry. Switch back to *"Global Monitored Landmasses"*.

### Step 2: Historical Trends & Data Continuity (45 Seconds)
* Click **Historical Trends** in the top navigation bar.
* Toggle between **"30d"**, **"60d"**, and **"All (654d)"**.
* Highlight that the chart renders an unbroken 654-day daily time-series from January 1, 2025 to October 16, 2026 with **0 missing days**.
* Hover over data points on the SVG chart: demonstrate dual tooltips showing daily active-fire counts and Fire Radiative Power (mean FRP in $MW$).
* Toggle the **7-Day Rolling Mean** checkbox to show trailing weekly trend smoothing.

### Step 3: Next-Day Forecast & Sensitivity Simulation (60 Seconds)
* Click **Next-Day Forecast** in the navbar.
* Explain the prediction hero card:
  * Reference date: `2026-10-15` (`59,476` observed detections).
  * Target date: `2026-10-16` (predicting the full 24h total).
  * Forecast: **`59,445`** satellite detections (Random Forest).
  * Confidence band: `[49,866 – 69,023]` detections (±1 MAE).
* Review **Learned Forecasting Drivers**: explain that the previous-day count (`lag_1`) carries ~85.8% feature importance, reflecting the physical reality of wildfire persistence.
* **Interactive Demo:** Drag the **Sensitivity Slider** left and right to show how tomorrow's prediction dynamically shifts under hypothetical scenario modeling. Click **Reset to Observed Count** (`59,476`).

### Step 4: Model Lab & Scientific Honesty (60 Seconds)
* Click **Model Lab** in the navbar.
* **Highlight scientific integrity over marketing claims:**
  * **Previous-Day Persistence:** MAE = `9,270.45` detections (**Lowest MAE**, marked with `BEST MAE` badge).
  * **Random Forest Regressor:** MAE = `9,578.47` | RMSE = `12,712.42` (**Lowest RMSE & Lowest MAPE: 12.84%**, marked with `BEST RMSE & MAPE` badge).
  * **7-Day Moving Average:** MAE = `13,795.80` | RMSE = `17,309.14`.
* Explain why: persistence is hard to beat on average absolute error during calm weather, but Random Forest prevents huge overshoot errors during sudden weather transitions (hence lower RMSE).
* Click **"Show Daily Test Traces (76 Days)"**: scroll through the day-by-day table showing real predictions vs. actuals during the peak northern wildfire season (`2026-08-01` to `2026-10-15`).

### Step 5: Data Quality & Sovereign Breakdown (30 Seconds)
* Click **Data Quality**: show the verified counters (33,723,945 records, 220 CSV files, 654 days, 0 missing days).
* Click **Hotspot Map**: explain the **Scientific Spatial Policy**—why we display genuine 2025 sovereign summaries across 217 nations (DR Congo: 1.95M, Angola: 1.26M, Australia: 1.25M, Canada: 925k) rather than faking individual pixel scatter dots.

---

## 3. Anticipated Judge Questions & Rigorous Technical Answers

### Q1: "Why does the Previous-Day Baseline have a lower MAE than your Random Forest model?"
> **Answer:** *"In high-frequency daily time-series, tomorrow's fire count is heavily anchored to today's burning perimeter. Because wildfire weather is often continuous for several consecutive days, predicting $y_{t-1}$ produces very small errors during steady periods. However, when a sudden rain event extinguishes fires, persistence suffers from catastrophic overshoot. Random Forest dampens these tail errors, which is why Random Forest achieves a **lower RMSE (12,712 vs. 12,803)** and **lower MAPE (12.84% vs. 12.95%)**. We report both metrics honestly rather than hiding the persistence baseline."*

### Q2: "Did you randomly shuffle your data before training the Random Forest?"
> **Answer:** *"Absolutely not. Randomly shuffling time-series data is a critical methodological flaw that causes lookahead data leakage. We split the data strictly chronologically: 509 warmup and training days through May 31, 2026, 61 validation days in June and July 2026, and 76 strictly held-out test days covering the peak wildfire season from August 1 to October 15, 2026. All lag features use `shift(1)` so day $t$ never sees day $t$'s label."*

### Q3: "Why is the target forecast date 2026-10-16 when today is October 16?"
> **Answer:** *"Because low Earth orbit satellites operate on sun-synchronous passes (~1:30 PM and 1:30 AM local time). On October 16, telemetry is actively downlinking and contains only 16,952 detections—a partial day. Using a partial day as an observation anchor would severely down-bias tomorrow's forecast. We therefore anchor our forecast to the latest complete observation day—October 15, 2026 (59,476 detections)—to predict the full 24-hour total for October 16."*

### Q4: "Can this system predict the exact GPS coordinates of a new wildfire ignition?"
> **Answer:** *"No, and any system claiming to do so from daily thermal telemetry alone is scientifically misleading. GeoSense AI forecasts macro-scale aggregate active-fire detection volume across biomes and regions. Predicting individual pixel ignition requires micro-scale lightning sensors, human activity telemetry, and high-resolution wind vectors. We clearly state our macro-scale operational scope in the methodology and UI disclaimers."*

### Q5: "How did you process 33.72 million rows without running out of RAM?"
> **Answer:** *"We designed a streaming accumulator in `backend/app/pipeline/aggregator.py` using Pandas chunking (150,000 to 250,000 rows per chunk). As each chunk is read, it aggregates daily counts and sums radiant power into a lightweight dictionary before discarding the chunk. Peak memory usage remained under 450 MB throughout the entire 220-file ingestion."*

---

## 4. Demo Numbers Cheat-Sheet

| Key Metric | Exact Value | Source / Verification |
| :--- | :--- | :--- |
| **Total Ingested Records** | `33,723,945` raw satellite detections | 220 raw NASA CSV files (~2.62 GB) |
| **Calendar Span** | `2025-01-01` to `2026-10-16` (654 days) | `DATA/processed/daily_global_hotspots.csv` |
| **Missing Calendar Days** | `0` missing dates | 100% calendar completeness |
| **Latest Complete Day** | `2026-10-15` (`59,476` detections) | `GET /api/time-series/summary` |
| **Partial Observation Day**| `2026-10-16` (`16,952` detections) | Labeled `partial_or_near_real_time` |
| **Forecast Target Date** | `2026-10-16` | Predicting full 24h count |
| **Random Forest Forecast** | `59,445` detections | `GET /api/forecast/next-day` |
| **Confidence Interval** | `[49,866 – 69,023]` detections | ±1 Test MAE band (9,578.5) |
| **Persistence Forecast** | `59,476` detections | Equal to count on `2026-10-15` |
| **7-Day MA Forecast** | `55,101` detections | Trailing weekly average |
| **Test Set Window** | `2026-08-01` to `2026-10-15` (76 days) | Held-out peak fire season |
| **Persistence Test MAE** | `9,270.45` detections | Lowest MAE benchmark |
| **Random Forest Test MAE** | `9,578.47` detections | Lowest RMSE (`12,712.42`), lowest MAPE (`12.84%`) |
| **7-Day MA Test MAE** | `13,795.80` detections | Trailing statistical trend |
